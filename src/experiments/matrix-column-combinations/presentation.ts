import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { cloneElementWithComputedStyles, makeKpMaterialOwnerInert, stripKpMaterialCloneAuthority } from "../../rendering/computed-style-clone.ts";
import { renderKpFocusDeckAnnotation } from "../../tutorial/focus-deck-annotation.ts";
import type { KpScalarValue } from "../../math/typed-semantic-math.ts";
import { example, type ColumnExample, numberOf, sample } from "./model.ts";
import type { prepareContinuity } from "./continuity.ts";

const math = (latex: string) => renderLatexToHtml(latex, { trust: true });
const tag = (key: string, entry: KpScalarValue) => `\\htmlData{kp-comb-key=${key}}{${numberOf(entry)}}`;
const vector = (entries: readonly KpScalarValue[], key: string) => math(`\\begin{bmatrix}${entries.map((entry, i) => tag(`${key}-${i}`, entry)).join("\\\\")}\\end{bmatrix}`);
const matrix = (rows: readonly (readonly KpScalarValue[])[], key: string) => math(`\\begin{bmatrix}${rows.map((row, i) => row.map((entry, j) => tag(`${key}-${i}-${j}`, entry)).join(" & ")).join("\\\\")}\\end{bmatrix}`);
const label = (id: string, text: string) => renderKpFocusDeckAnnotation({ entityId: id, text, role: "support" });

export function calculationLatex(scene: ColumnExample = example()) {
  const { combination } = scene;
  const column = (entries: readonly KpScalarValue[]) => `\\begin{bmatrix}${entries.map(numberOf).join("\\\\")}\\end{bmatrix}`;
  return combination.terms.map(term => `${numberOf(term.coefficient)}${column(term.vector.entries)}`).join("+") +
    "=" + combination.terms.map(term => `\\begin{bmatrix}${term.pairs.map(pair => `${numberOf(pair.right)}\\times ${numberOf(pair.left)}`).join("\\\\")}\\end{bmatrix}`).join("+") +
    "=" + combination.terms.map(term => column(term.entries)).join("+") + "=" + column(combination.result.entries);
}

export function stageHtml(scene: ColumnExample = example()) {
  const { env, combination, labels } = scene;
  return `<div class="comb-stage" aria-hidden="true">
    <div class="comb-equation">
      <div>${matrix(env.A.rows, "a")}<div>${label(env.A.id, labels[0]!)}</div></div>
      <span>${math("\\times")}</span>
      <div>${matrix(env.B.rows, "b")}<div>${label(env.B.id, labels[1]!)}</div></div>
      <span>${math("=")}</span>
      <div>${matrix(env.product.result.rows, "c")}<div>${label(env.product.result.id, labels[2]!)}</div></div>
    </div>
    <div class="comb-weighted">${combination.terms.map(term => `<div class="comb-term">
      <span data-reveal="2">${math(tag(`weight-${term.index}`, term.coefficient))}</span>
      <span data-column-shell="${term.index}" data-reveal="1">${vector(term.vector.entries, `column-${term.index}`)}</span>
      </div>`).join(`<span data-reveal="2">${math("+")}</span>`)}</div>
    <div class="comb-expanded">
      ${combination.terms.map(term => `<span class="comb-term" data-expanded-shell="${term.index}" data-reveal="3">${math(`\\begin{bmatrix}${term.pairs.map((pair, i) =>
        `${tag(`factor-${term.index}-${i}`, pair.right)}\\htmlData{kp-comb-key=times-${term.index}-${i}}{\\times} ${tag(`entry-${term.index}-${i}`, pair.left)}`
      ).join("\\\\")}\\end{bmatrix}`)}</span>`).join(`<span data-reveal="3">${math("+")}</span>`)}
    </div>
    <div class="comb-evaluated"><span data-reveal="4">${math("=")}</span>
      ${combination.terms.map(term => `<span data-reveal="4">${vector(term.entries, `scaled-${term.index}`)}</span>`).join(`<span data-sum-operator data-reveal="4">${math("+")}</span>`)}
      <span data-reveal="5">${math("=")}</span><span data-reveal="5">${vector(combination.result.entries, "sum")}</span>
    </div><div class="comb-material"></div></div>`;
}

interface Position { x: number; y: number }
export function mountPresentation(root: HTMLElement, scene: ColumnExample = example(), continuity?: typeof prepareContinuity) {
  const { combination } = scene;
  const stage = root.querySelector<HTMLElement>(".comb-stage")!;
  const layer = root.querySelector<HTMLElement>(".comb-material")!;
  const native = new Map([...stage.querySelectorAll<HTMLElement>("[data-kp-comb-key]")].map(node => [node.dataset["kpCombKey"]!, node]));
  // Native delimiter endpoints belong to this local KaTeX presentation only.
  for (const term of combination.terms) for (const [side, selector] of [["open", ".mopen"], ["close", ".mclose"]] as const) {
    for (const [kind, shell] of [["source", "column"], ["target", "expanded"]] as const) {
      const node = stage.querySelector<HTMLElement>(`[data-${shell}-shell="${term.index}"] .katex-html ${selector}`);
      if (!node) throw new Error(`Missing ${kind} vector delimiter.`);
      native.set(`${kind}-${side}-${term.index}`, node);
    }
  }
  const weighted = stage.querySelector<HTMLElement>(".comb-weighted")!;
  const points = new Map<string, Position>();
  const owners: { owner: HTMLElement; from: string; to: string; phase: number; grow: boolean }[] = [];
  let disposed = false;
  let continuous: ReturnType<typeof prepareContinuity> | undefined;
  const prepare = () => {
    if (disposed) return;
    continuous?.dispose();
    for (const node of stage.querySelectorAll<HTMLElement>("[data-reveal]")) node.style.opacity = "1";
    for (const node of native.values()) { node.style.opacity = "1"; node.style.transform = ""; node.classList.remove("comb-focus"); }
    layer.replaceChildren(); owners.length = 0;
    const bounds = stage.getBoundingClientRect();
    for (const [key, node] of native) {
      const box = node.getBoundingClientRect(); points.set(key, { x: box.x - bounds.x + box.width / 2, y: box.y - bounds.y + box.height / 2 });
    }
    const copy = (from: string, to: string, source: KpScalarValue, phase: number, grow = false) => {
      const original = native.get(from);
      if (!original || !native.has(to)) throw new Error(`Missing native endpoint ${from} or ${to}.`);
      const owner = document.createElement("span"); owner.className = "comb-paint";
      const clone = cloneElementWithComputedStyles(original); stripKpMaterialCloneAuthority(clone);
      for (const node of [clone, ...clone.querySelectorAll<HTMLElement>("*")]) {
        node.style.color = "inherit"; node.style.setProperty("-webkit-text-fill-color", "currentColor");
      }
      owner.append(clone); makeKpMaterialOwnerInert(owner);
      owner.dataset["sourceId"] = source.id; owner.dataset["occurrence"] = to;
      layer.append(owner); owners.push({ owner, from, to, phase, grow });
    };
    for (const term of combination.terms) {
      term.vector.entries.forEach((entry, i) => copy(`a-${i}-${term.index}`, `column-${term.index}-${i}`, entry, 1));
      copy(`b-${term.index}-${scene.column}`, `weight-${term.index}`, term.coefficient, 2);
      // Both interpretations share these exact operands and derived products.
      // Fan-out makes new occurrences of the coefficient, not new scalar values.
      term.pairs.forEach((pair, i) => {
        copy(`weight-${term.index}`, `factor-${term.index}-${i}`, pair.right, 3, true);
      });
    }
    combination.result.entries.forEach((entry, i) => copy(`sum-${i}`, `c-${i}-${scene.column}`, entry, 6));
    continuous = continuity?.(stage, layer, native, scene);
  };
  const ease = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  const render = (progress: number) => {
    const frame = sample(progress, scene.beats);
    if (disposed) return frame;
    const settled = frame.local === 1 ? frame.index : frame.index - 1;
    stage.dataset["progress"] = String(frame.progress);
    // Numerical evaluation introduces derived entries at a readable checkpoint;
    // it does not pretend that a new value is the same scalar as its inputs.
    for (const node of stage.querySelectorAll<HTMLElement>("[data-reveal]")) node.style.opacity = Number(node.dataset["reveal"]) <= settled ? "1" : "0";
    for (const [key, node] of native) {
      node.style.transform = "";
      node.style.opacity = key.startsWith("c-") ? (settled === 6 && key.endsWith(`-${scene.column}`) ? "1" : "0") : "1";
      node.classList.toggle("comb-focus", (frame.index === 1 && key.startsWith("a-")) ||
        (frame.index === 2 && key.startsWith("b-") && key.endsWith(`-${scene.column}`)) || (frame.index === 3 && (key.startsWith("weight-") || key.startsWith("factor-"))));
    }
    weighted.style.opacity = settled >= 3 ? "0" : "1";
    const distributing = frame.index === 3 && frame.local < 1;
    const growth = ease((frame.local - .4) / .6);
    if (distributing) {
      for (const node of stage.querySelectorAll<HTMLElement>("[data-expanded-shell]")) node.style.opacity = "1";
      for (const term of combination.terms) {
        const weight = native.get(`weight-${term.index}`)!;
        weight.style.transform = `scale(${1 - ease(frame.local / .4)})`;
        // Preserve the entry rows while the left bracket makes room for products.
        const reflow = (from: string, to: string) => {
          const a = points.get(from)!, b = points.get(to)!;
          native.get(from)!.style.transform = `translate(${(b.x - a.x) * ease(frame.local)}px, ${(b.y - a.y) * ease(frame.local)}px)`;
          native.get(to)!.style.opacity = "0";
        };
        for (const side of ["open", "close"]) reflow(`source-${side}-${term.index}`, `target-${side}-${term.index}`);
        term.pairs.forEach((_, i) => {
          reflow(`column-${term.index}-${i}`, `entry-${term.index}-${i}`);
          native.get(`factor-${term.index}-${i}`)!.style.opacity = "0";
          native.get(`times-${term.index}-${i}`)!.style.transform = `scale(${growth})`;
        });
      }
    }
    for (const { owner, from, to, phase, grow } of owners) {
      const transit = continuous && phase === 1 ? Math.min(1, frame.local / continuous.materialTransitEnd) : frame.local;
      const t = ease(transit);
      const a = points.get(from)!, b = points.get(to)!;
      const x = grow ? b.x : a.x + (b.x - a.x) * t;
      const y = grow ? b.y : a.y + (b.y - a.y) * t;
      owner.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${grow ? growth : 1})`;
      owner.style.opacity = frame.index === phase && frame.local > 0 && transit < 1 && (!grow || growth > 0) ? "1" : "0";
    }
    continuous?.render(frame.index, frame.local);
    return frame;
  };
  prepare();
  return { prepare, render, dispose() { disposed = true; continuous?.dispose(); layer.replaceChildren(); } };
}
