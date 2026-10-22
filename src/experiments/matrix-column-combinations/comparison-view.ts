import type { InputComparison } from "../../math/matrix-input-comparison.ts";
import { compileExpression } from "../../math/expression.ts";
import type { KpScalarValue } from "../../math/typed-semantic-math.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { cloneElementWithComputedStyles, makeKpMaterialOwnerInert, stripKpMaterialCloneAuthority } from "../../rendering/computed-style-clone.ts";
import { kpCanonicalFunctionWrapMotionProfile as wrap } from "../../animation/function-wrap-motif.ts";
import { prepareFusion } from "../dot-product-passage/fusion.ts";

const math = (latex: string) => renderLatexToHtml(latex, { trust: true, output: "htmlAndMathml" });
const value = (entry: KpScalarValue) => compileExpression(entry.expression)({});
const tag = (key: string, entry: KpScalarValue) => `\\htmlData{occ=${key}}{${value(entry)}}`;
const vector = (key: string, entries: readonly KpScalarValue[]) => `<span data-vector="${key}">${math(`\\begin{bmatrix}${entries.map((entry, row) => tag(`${key}-${row}`, entry)).join("\\\\")}\\end{bmatrix}`)}</span>`;
const syntax = (key: string, latex: string) => `<span data-occ="${key}">${math(latex)}</span>`;

export function comparisonHtml(relation: InputComparison) {
  const { inputs, outputs, product, inputDifference, combination } = relation;
  const matrix = math(`A=\\begin{bmatrix}${product.left.rows.map((row, i) => row.map((entry, j) => tag(`a-${i}-${j}`, entry)).join("&")).join("\\\\")}\\end{bmatrix}`);
  return `<div class="comparison-stage" aria-hidden="true">
    <div class="comparison-context">
      <div class="comparison-map">${matrix}</div>
      <div class="comparison-mappings">
        <div>${math("u=")}${vector("u", inputs.before.entries)}${math("\\xmapsto{A}")}${vector("au", outputs.before.entries)}</div>
        <div>${math("v=")}${vector("v", inputs.after.entries)}${math("\\xmapsto{A}")}${vector("av", outputs.after.entries)}</div>
      </div>
    </div>
    <div class="comparison-work">
      <div class="comparison-line" data-line="subtract">${syntax("sub-prefix", "v-u=")}${vector("sub-v", inputs.after.entries)}${syntax("minus", "-")}${vector("sub-u", inputs.before.entries)}</div>
      <div class="comparison-line" data-line="difference">${syntax("delta-prefix", "v-u=")}${vector("delta", inputDifference.rows.map(row => row[0]!))}</div>
      <div class="comparison-line comparison-contribution" data-line="weighted">${syntax("weighted-prefix", "A(v-u)=")}
      ${combination.terms.map((term, i) => `<span class="comparison-term" data-term="${i}">${i === 1 ? syntax("coef-open", "(") : ""}${math(tag(`weight-${i}`, term.coefficient))}${i === 1 ? syntax("coef-close", ")") : ""}${vector(`column-${i}`, term.vector.entries)}</span>`).join(syntax("weighted-plus", "+"))}</div>
      <div class="comparison-line comparison-contribution" data-line="evaluated">${syntax("evaluated-prefix", "A(v-u)=")}${combination.terms.map((term, i) => vector(`term-${i}`, term.entries)).join(syntax("evaluated-plus", "+"))}</div>
      <div class="comparison-line comparison-contribution" data-line="zero">${syntax("zero-prefix", "A(v-u)=")}${vector("zero", combination.result.entries)}</div>
    </div><div class="comparison-material"></div>
  </div>`;
}

export function comparisonStatic(relation: InputComparison) {
  const v = (entries: readonly KpScalarValue[]) => `\\begin{bmatrix}${entries.map(value).join("\\\\")}\\end{bmatrix}`;
  const delta = relation.inputDifference.rows.map(row => row[0]!);
  return [
    `Au=A${v(relation.inputs.before.entries)}=${v(relation.outputs.before.entries)}`,
    `Av=A${v(relation.inputs.after.entries)}=${v(relation.outputs.after.entries)}`,
    `v-u=${v(relation.inputs.after.entries)}-${v(relation.inputs.before.entries)}=${v(delta)}`,
    `A(v-u)=${relation.combination.terms.map(term => `(${value(term.coefficient)})${v(term.vector.entries)}`).join("+")}`,
    `=${relation.combination.terms.map(term => v(term.entries)).join("+")}=${v(relation.combination.result.entries)}`,
    `Av-Au=A(v-u)=${v(relation.combination.result.entries)}`
  ].map(latex => `<div>${math(latex)}</div>`).join("");
}

/** One local adapter binds semantic relationships to accepted optical samplers.
 * Retained context is never replaced by a moving copy. No numeric text matching
 * or fabricated second input column supplies the correspondence. */
export function mountComparisonView(root: HTMLElement, relation: InputComparison) {
  const stage = root.querySelector<HTMLElement>(".comparison-stage")!;
  const material = stage.querySelector<HTMLElement>(".comparison-material")!;
  const native = new Map([...stage.querySelectorAll<HTMLElement>("[data-occ]")].map(node => [node.dataset["occ"]!, node]));
  const get = (key: string) => { const node = native.get(key); if (!node) throw new Error(`Missing comparison occurrence ${key}.`); return node; };
  const vec = (key: string) => stage.querySelector<HTMLElement>(`[data-vector="${key}"]`)!;
  const line = (key: string) => stage.querySelector<HTMLElement>(`[data-line="${key}"]`)!;
  const ids = new Map<string, string>();
  const bind = (key: string, entries: readonly KpScalarValue[]) => entries.forEach((entry, row) => ids.set(`${key}-${row}`, entry.id));
  bind("u", relation.inputs.before.entries); bind("sub-u", relation.inputs.before.entries);
  bind("v", relation.inputs.after.entries); bind("sub-v", relation.inputs.after.entries);
  bind("au", relation.outputs.before.entries); bind("av", relation.outputs.after.entries);
  bind("delta", relation.inputDifference.rows.map(row => row[0]!)); bind("zero", relation.combination.result.entries);
  relation.product.left.rows.forEach((row, i) => row.forEach((entry, j) => ids.set(`a-${i}-${j}`, entry.id)));
  relation.combination.terms.forEach((term, i) => { ids.set(`weight-${i}`, term.coefficient.id); bind(`column-${i}`, term.vector.entries); bind(`term-${i}`, term.entries); });
  for (const [key, id] of ids) get(key).dataset["entityId"] = id;
  const groups = new Map<string, readonly string[]>();
  for (const vector of [relation.inputs.before, relation.inputs.after, relation.outputs.before, relation.outputs.after, ...relation.combination.terms.map(term => term.vector)])
    groups.set(vector.id, vector.entries.map(entry => entry.id));
  groups.set(relation.inputDifference.id, relation.inputDifference.rows.flat().map(entry => entry.id));
  groups.set(relation.image.result.id, relation.combination.result.entries.map(entry => entry.id));
  const enclosures = (key: string) => [...vec(key).querySelectorAll<HTMLElement>(".katex-html .mopen, .katex-html .mclose")];
  const smooth = (n: number) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t); };
  const window = (t: number, start: number, end: number) => smooth((t - start) / (end - start));
  let disposed = false;
  let moves: { phase: number; from: HTMLElement; to: HTMLElement; copy: boolean; nativeAt: number; paint: (t: number) => void }[] = [];
  let fusions: { phase: number; paint: (t: number) => void }[] = [];
  let shells: { phase: number; node: HTMLElement; side: number; height: number }[] = [];
  let departing: { node: HTMLElement; side: number; height: number }[] = [];
  const reset = () => {
    for (const node of stage.querySelectorAll<HTMLElement>("[data-occ], [data-vector], .mopen, .mclose")) {
      node.style.transform = ""; node.style.opacity = "1"; node.style.clipPath = "";
    }
  };
  const prepare = () => {
    if (disposed) return;
    reset(); material.replaceChildren(); moves = []; fusions = []; shells = [];
    const bounds = stage.getBoundingClientRect();
    const center = (node: HTMLElement) => {
      const range = document.createRange(); range.selectNodeContents(node); const rect = range.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    };
    const move = (fromKey: string, toKey: string, phase: number, copy = true) => {
      const semantic = ids.has(fromKey);
      if ((copy || semantic) && (!semantic || ids.get(fromKey) !== ids.get(toKey))) throw new Error(`Material must retain identity: ${fromKey} → ${toKey}.`);
      const from = get(fromKey), to = get(toKey), owner = document.createElement("span");
      owner.className = "comparison-copy"; owner.dataset["from"] = fromKey; owner.dataset["to"] = toKey;
      if (semantic) owner.dataset["entityId"] = ids.get(fromKey)!;
      const clone = cloneElementWithComputedStyles(from); stripKpMaterialCloneAuthority(clone);
      for (const node of [clone, ...clone.querySelectorAll<HTMLElement>("*")]) {
        node.removeAttribute("data-occ"); node.removeAttribute("data-entity-id");
        node.style.color = "inherit"; node.style.setProperty("-webkit-text-fill-color", "currentColor");
      }
      owner.append(clone); makeKpMaterialOwnerInert(owner); material.append(owner);
      const a = center(from), b = center(to), c = center(clone), box = owner.getBoundingClientRect();
      const anchor = { x: c.x - box.x, y: c.y - box.y };
      moves.push({ phase, from, to, copy, nativeAt: semantic ? wrap.materialTransit.end : 1, paint(t) {
        const travel = smooth(semantic ? t / wrap.materialTransit.end : t);
        owner.style.transform = `translate(${a.x + (b.x - a.x) * travel - bounds.x - anchor.x}px, ${a.y + (b.y - a.y) * travel - bounds.y - anchor.y}px)`;
        owner.style.opacity = t > 0 && travel < 1 ? "1" : "0";
      } });
    };
    const fusion = (phase: number, operands: HTMLElement[], operators: HTMLElement[], target: string, brackets: HTMLElement[]) => {
      for (const node of [...operands, ...operators, ...brackets, vec(target)]) { node.style.display = "inline-block"; node.style.transformOrigin = "center"; }
      fusions.push({ phase, paint: prepareFusion(stage, operands, operators, vec(target), brackets) });
    };
    fusion(2, [get("sub-v-0"), get("sub-v-1"), get("sub-u-0"), get("sub-u-1")], [get("minus")], "delta", [...enclosures("sub-v"), ...enclosures("sub-u")]);
    relation.combination.terms.forEach((_, i) => fusion(4, [get(`weight-${i}`), get(`column-${i}-0`), get(`column-${i}-1`)], [], `term-${i}`,
      [...enclosures(`column-${i}`), ...(i === 1 ? [get("coef-open"), get("coef-close")] : [])]));
    fusion(5, [get("term-0-0"), get("term-0-1"), get("term-1-0"), get("term-1-1")], [get("evaluated-plus")], "zero", [...enclosures("term-0"), ...enclosures("term-1")]);
    for (const [key, phase] of [["sub-v", 1], ["sub-u", 1], ["column-0", 3], ["column-1", 3]] as const)
      enclosures(key).forEach((node, index) => shells.push({ phase, node, side: index === 0 ? -1 : 1, height: node.getBoundingClientRect().height }));
    departing = enclosures("delta").map((node, index) => ({ node, side: index === 0 ? -1 : 1, height: node.getBoundingClientRect().height }));
    // Evaluation preparation establishes native box participation. Measure copy
    // endpoints only after those layout writes, including operator boxes.
    for (const row of [0, 1]) {
      move(`v-${row}`, `sub-v-${row}`, 1); move(`u-${row}`, `sub-u-${row}`, 1);
      move(`delta-${row}`, `weight-${row}`, 3, false);
      for (const col of [0, 1]) move(`a-${row}-${col}`, `column-${col}-${row}`, 3);
    }
    move("sub-prefix", "delta-prefix", 2, false);
    move("weighted-prefix", "evaluated-prefix", 4, false); move("weighted-plus", "evaluated-plus", 4, false);
    move("evaluated-prefix", "zero-prefix", 5, false);
  };
  const render = (progress: number, targets: readonly string[] = []) => {
    if (disposed) return;
    if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new Error("Comparison progress must be finite and normalized.");
    const position = progress * 5, phase = Math.ceil(position), local = phase === 0 ? 1 : position - phase + 1;
    reset();
    line("subtract").style.opacity = phase === 1 || phase === 2 ? "1" : "0";
    line("difference").style.opacity = phase === 2 || phase === 3 ? "1" : "0";
    line("weighted").style.opacity = phase === 3 || phase === 4 ? "1" : "0";
    line("evaluated").style.opacity = phase === 4 || phase === 5 ? "1" : "0";
    line("zero").style.opacity = phase === 5 ? "1" : "0";
    // Earlier evaluations have already relinquished their source ink. Future
    // evaluations must not paint over an earlier copy/reception phase.
    for (const fusion of fusions) if (phase >= fusion.phase) fusion.paint(phase === fusion.phase ? local : 1);
    for (const move of moves) {
      const t = phase < move.phase ? 0 : phase === move.phase ? local : 1;
      move.paint(t);
      if (phase === move.phase) {
        move.to.style.opacity = t >= move.nativeAt ? "1" : "0";
        if (!move.copy) move.from.style.opacity = t === 0 ? "1" : "0";
      } else if (phase > move.phase && !move.copy) move.from.style.opacity = "0";
    }
    for (const shell of shells) if (phase === shell.phase) {
      const t = window(local, wrap.enclosureReception.start, wrap.enclosureReception.end);
      shell.node.style.opacity = String(t); shell.node.style.transform = `translateX(${shell.side * shell.height * .42 * (1 - t)}px) scale(${1 + (wrap.enclosureReception.initialScale - 1) * (1 - t)})`;
    }
    if (phase === 3) {
      // Unpack the difference into weights in the same work area. Its old
      // notation withdraws as those continuants leave; it is not another result
      // that the reader must track while the columns arrive.
      const t = 1 - window(local, wrap.materialTransit.start, wrap.materialTransit.end);
      get("delta-prefix").style.opacity = String(t);
      departing.forEach(({ node, side, height }) => {
        node.style.opacity = String(t);
        node.style.transform = `translateX(${side * height * .42 * (1 - t)}px) scale(${1 + (wrap.enclosureReception.initialScale - 1) * (1 - t)})`;
      });
    }
    const receiving = phase === 1 ? ["sub-prefix", "minus"] : phase === 3 ? ["weighted-prefix", "weighted-plus", "coef-open", "coef-close"] : [];
    for (const key of receiving) get(key).style.opacity = String(window(local, wrap.syntaxResolution.start, wrap.syntaxResolution.end));
    const focused = new Set(targets.flatMap(id => {
      const group = groups.get(id);
      if (group) return [...group];
      if ([...ids.values()].includes(id)) return [id];
      throw new Error(`Unknown semantic comparison target ${id}.`);
    }));
    for (const node of stage.querySelectorAll<HTMLElement>("[data-entity-id]")) node.classList.toggle("comb-focus", focused.has(node.dataset["entityId"]!));
    stage.dataset["progress"] = String(progress);
  };
  const dispose = () => { if (disposed) return; disposed = true; material.replaceChildren(); };
  try { prepare(); render(0); } catch (error) { dispose(); throw error; }
  return { prepare, render, dispose };
}
