import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { cloneElementWithComputedStyles, makeKpMaterialOwnerInert, stripKpMaterialCloneAuthority } from "../../rendering/computed-style-clone.ts";
import { renderKpFocusDeckAnnotation } from "../../tutorial/focus-deck-annotation.ts";
import { MatrixColumnGap, sampleStory, type MatrixEnvironment, type MatrixCell, type matrixColumnStory } from "./score.ts";

const tag = (key: string, value: number) => `\\htmlData{kp-matrix-key=${key}}{${value}}`;
const math = (latex: string) => renderLatexToHtml(latex, { displayMode: false, trust: true });
function cell(env: MatrixEnvironment, row: number, col: number): MatrixCell {
  const found = env.cells.find(c => c.row === row && c.col === col);
  if (!found) throw new MatrixColumnGap(`Missing cell ${row},${col}.`);
  return found;
}
function matrix(env: MatrixEnvironment, kind: "a" | "b" | "c") {
  const rows = [0, 1].map(r => [0, 1].map(c => {
    const value = kind === "a" ? cell(env, r, 0).left[c]! : kind === "b" ? cell(env, 0, c).right[r]! : cell(env, r, c).result;
    return tag(`${kind}-${r}-${c}`, value);
  }).join(" & "));
  return math(`\\begin{bmatrix}${rows.join("\\\\")}\\end{bmatrix}`);
}
function workspace(env: MatrixEnvironment, col: number) {
  return `<div class="matrix-work" data-work="${col}">${[0, 1].map(row => {
    const c = cell(env, row, col);
    const key = (part: string) => `w-${col}-${row}-${part}`;
    return `<div class="matrix-dot" data-dot="${col}-${row}"><div class="matrix-dot-label">${renderKpFocusDeckAnnotation({
      entityId: c.intermediateId, text: `Row ${row + 1} · column ${col + 1}`, role: "support"
    })}</div><div class="matrix-dot-math">${math(`${tag(key("l0"), c.left[0]!)}\\,\\times\\,${tag(key("r0"), c.right[0]!)} + ${tag(key("l1"), c.left[1]!)}\\,\\times\\,${tag(key("r1"), c.right[1]!)} = ${tag(key("result"), c.result)}`)}</div></div>`;
  }).join("")}</div>`;
}

export function matrixStageHtml(env: MatrixEnvironment) {
  // All trusted LaTeX here is generated from validated finite numeric evidence.
  return `<div class="matrix-stage" data-matrix-stage aria-hidden="true">
    <div class="matrix-equation"><div data-matrix="a">${matrix(env, "a")}</div><span>${math("\\times")}</span><div data-matrix="b">${matrix(env, "b")}</div><span>${math("=")}</span><div data-matrix="c">${matrix(env, "c")}</div></div>
    ${workspace(env, 0)}${workspace(env, 1)}
    <div class="matrix-material" data-material></div>
  </div>`;
}

interface Point { readonly x: number; readonly y: number }
interface Paint { readonly owner: HTMLElement; readonly key: string }
const ease = (t: number) => { const p = Math.max(0, Math.min(1, t)); return p * p * (3 - 2 * p); };
const mix = (a: Point, b: Point, p: number): Point => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p });

/** Candidate adapter for the registered matrix-column score. One material owner
 * per visual occurrence, measured native endpoints, and no renderer arithmetic. */
export function mountMatrixColumnPresentation(root: HTMLElement, story: ReturnType<typeof matrixColumnStory>) {
  const stage = root.querySelector<HTMLElement>("[data-matrix-stage]")!;
  const layer = stage.querySelector<HTMLElement>("[data-material]")!;
  const native = new Map([...stage.querySelectorAll<HTMLElement>("[data-kp-matrix-key]")]
    .map(node => [node.dataset["kpMatrixKey"]!, node]));
  const points = new Map<string, Point>();
  const paints = new Map<string, Paint>();
  let disposed = false;
  const point = (key: string) => {
    const p = points.get(key); if (!p) throw new MatrixColumnGap(`Unmeasured ${key}.`); return p;
  };
  const addPaint = (id: string, key: string, sourceId: string, occurrence: string) => {
    const original = native.get(key);
    if (!original) throw new MatrixColumnGap(`Missing native endpoint ${key}.`);
    const owner = document.createElement("span"); owner.className = "matrix-paint";
    const clone = cloneElementWithComputedStyles(original); stripKpMaterialCloneAuthority(clone);
    // Computed cloning preserves native metrics; foreground stays theme-owned.
    for (const node of [clone, ...clone.querySelectorAll<HTMLElement>("*")]) {
      node.style.color = "inherit"; node.style.setProperty("-webkit-text-fill-color", "currentColor");
    }
    owner.style.color = id.startsWith("right-") ? "var(--kp-st-focus)" : "var(--kp-st-ink)";
    owner.append(clone); makeKpMaterialOwnerInert(owner);
    owner.dataset["sourceId"] = sourceId; owner.dataset["occurrence"] = occurrence;
    layer.append(owner); paints.set(id, { owner, key });
  };
  const prepare = () => {
    if (disposed) return;
    // Untransformed native slots are the only geometry authority; never measure
    // a previous sampled pose, including after resizing or direct reversal.
    const bounds = stage.getBoundingClientRect();
    for (const [key, node] of native) {
      node.style.opacity = "1"; node.style.visibility = "visible";
      node.classList.remove("matrix-active");
      const r = node.getBoundingClientRect();
      points.set(key, { x: r.x - bounds.x + r.width / 2, y: r.y - bounds.y + r.height / 2 });
    }
    layer.replaceChildren(); paints.clear();
    for (const c of story.state.env.cells) {
      for (const k of [0, 1]) {
        addPaint(`right-${c.col}-${c.row}-${k}`, `b-${k}-${c.col}`, c.rightIds[k]!, `column.${c.col}.copy.${c.row}.entry.${k}`);
        addPaint(`left-${c.col}-${c.row}-${k}`, `a-${c.row}-${k}`, c.leftIds[k]!, `row.${c.row}.for.column.${c.col}.entry.${k}`);
      }
      addPaint(`result-${c.col}-${c.row}`, `c-${c.row}-${c.col}`, c.resultId, `result.${c.row}.${c.col}`);
    }
  };
  const draw = (id: string, p: Point, opacity = 1) => {
    const paint = paints.get(id)!;
    paint.owner.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
    paint.owner.style.opacity = String(opacity);
  };
  const render = (progress: number) => {
    if (disposed) return;
    const frame = sampleStory(story, progress);
    const { column, action, ordinal } = frame.step.scene;
    const actionIndex = ordinal === 0 ? 0 : (ordinal - 1) % 6 + 1;
    const t = ease(frame.local);
    stage.dataset["phase"] = action;
    stage.dataset["column"] = String(column);
    stage.dataset["progress"] = String(progress);
    for (const c of story.state.env.cells) stage.dataset[`cell${c.row}${c.col}`] = "pending";
    // Hidden occurrences also have a deterministic pose. Otherwise visiting the
    // other column leaves stale transforms behind on seek/reversal.
    for (const { owner } of paints.values()) { owner.style.opacity = "0"; owner.style.transform = ""; }
    // Target native entries take ownership only after their material settles.
    for (const c of story.state.env.cells) {
      const settled = c.col < column || (c.col === column && action === "place" && frame.local === 1);
      native.get(`c-${c.row}-${c.col}`)!.style.opacity = settled ? "1" : "0";
    }
    for (const node of stage.querySelectorAll<HTMLElement>("[data-work]")) {
      const active = Number(node.dataset["work"]) === column && actionIndex >= 4;
      // The expression's syntax enters only after its operands have arrived.
      node.style.opacity = active ? String(actionIndex === 4 ? ease((frame.local - .72) / .28) : actionIndex === 5 ? 1 : 1 - ease(frame.local / .3)) : "0";
    }
    for (const [key, node] of native) {
      if (key.startsWith("w-")) node.style.visibility = "hidden";
      if (key.startsWith("b-")) node.classList.toggle("matrix-active", actionIndex > 0 && key.endsWith(`-${column}`));
      if (key.startsWith("a-")) node.classList.toggle("matrix-active", actionIndex >= 4 && actionIndex <= 5);
    }
    if (ordinal === 0) return frame;
    const top = [point(`b-0-${column}`), point(`b-1-${column}`)];
    const midpoint = (top[0]!.x + top[1]!.x) / 2;
    // Lift above B while retaining the actual column's measured vertical spacing.
    const lifted = top.map(p => ({ x: midpoint, y: p.y - 80 }));
    for (const row of [0, 1]) {
      const c = cell(story.state.env, row, column);
      const resultKey = `w-${column}-${row}-result`;
      for (const k of [0, 1]) {
        const upper = point(`w-${column}-0-r${k}`);
        const destination = point(`w-${column}-${row}-r${k}`);
        let position = destination;
        let visible = 1;
        if (actionIndex === 1) { position = mix(top[k]!, lifted[k]!, t); visible = row === 0 && frame.local > 0 ? 1 : 0; }
        if (actionIndex === 2) { position = mix(lifted[k]!, upper, t); visible = row === 0 ? 1 : 0; }
        if (actionIndex === 3) { position = row === 0 ? upper : mix(upper, destination, t); visible = row === 0 || frame.local > 0 ? 1 : 0; }
        // Evaluation introduces the checked result without destroying the readable
        // calculation. Its temporary contributors withdraw only after settlement starts.
        if (actionIndex === 6) visible = 1 - ease(frame.local / .3);
        draw(`right-${column}-${row}-${k}`, position, visible);
        if (actionIndex >= 4) {
          const dest = point(`w-${column}-${row}-l${k}`);
          const from = point(`a-${row}-${k}`);
          draw(`left-${column}-${row}-${k}`, actionIndex === 4 ? mix(from, dest, ease(frame.local / .72)) : dest,
            actionIndex === 4 ? (frame.local === 0 ? 0 : 1) : actionIndex === 5 ? 1 : 1 - ease(frame.local / .3));
        }
      }
      if (actionIndex >= 5) {
        const dest = point(`c-${row}-${column}`);
        draw(`result-${column}-${row}`, actionIndex === 6 ? mix(point(resultKey), dest, t) : point(resultKey),
          actionIndex === 5 ? t : frame.local === 1 ? 0 : 1);
      }
      stage.dataset[`cell${c.row}${c.col}`] = actionIndex >= 5 ? String(c.result) : "pending";
    }
    return frame;
  };
  prepare();
  return { prepare, render, dispose() { disposed = true; layer.replaceChildren(); paints.clear(); points.clear(); } };
}
