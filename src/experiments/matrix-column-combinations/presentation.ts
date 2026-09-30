import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { cloneElementWithComputedStyles, makeKpMaterialOwnerInert, stripKpMaterialCloneAuthority } from "../../rendering/computed-style-clone.ts";
import { renderKpFocusDeckAnnotation } from "../../tutorial/focus-deck-annotation.ts";
import type { KpScalarValue } from "../../math/typed-semantic-math.ts";
import { env, combination, numberOf, sample } from "./model.ts";

const math = (latex: string) => renderLatexToHtml(latex, { trust: true });
const tag = (key: string, entry: KpScalarValue) => `\\htmlData{kp-comb-key=${key}}{${numberOf(entry)}}`;
const vector = (entries: readonly KpScalarValue[], key: string) => math(`\\begin{bmatrix}${entries.map((entry, i) => tag(`${key}-${i}`, entry)).join("\\\\")}\\end{bmatrix}`);
const matrix = (rows: readonly (readonly KpScalarValue[])[], key: string) => math(`\\begin{bmatrix}${rows.map((row, i) => row.map((entry, j) => tag(`${key}-${i}-${j}`, entry)).join(" & ")).join("\\\\")}\\end{bmatrix}`);
const label = (id: string, text: string) => renderKpFocusDeckAnnotation({ entityId: id, text, role: "support" });

export function calculationLatex() {
  const column = (entries: readonly KpScalarValue[]) => `\\begin{bmatrix}${entries.map(numberOf).join("\\\\")}\\end{bmatrix}`;
  return combination.terms.map(term => `${numberOf(term.coefficient)}${column(term.vector.entries)}`).join("+") +
    "=" + combination.terms.map(term => `\\begin{bmatrix}${term.pairs.map(pair => `${numberOf(pair.right)}\\times ${numberOf(pair.left)}`).join("\\\\")}\\end{bmatrix}`).join("+") +
    "=" + combination.terms.map(term => column(term.entries)).join("+") + "=" + column(combination.result.entries);
}

export function stageHtml() {
  return `<div class="comb-stage" aria-hidden="true">
    <div class="comb-equation">
      <div>${matrix(env.A.rows, "a")}<div>${label(env.A.id, "A")}</div></div>
      <span>${math("\\times")}</span>
      <div>${matrix(env.B.rows, "b")}<div>${label(env.B.id, "B")}</div></div>
      <span>${math("=")}</span>
      <div>${matrix(env.product.result.rows, "c")}<div>${label(env.product.result.id, "AB")}</div></div>
    </div>
    <div class="comb-weighted">${combination.terms.map(term => `<div class="comb-term">
      <span data-reveal="2">${math(tag(`weight-${term.index}`, term.coefficient))}</span>
      <span data-reveal="1">${vector(term.vector.entries, `column-${term.index}`)}</span>
      </div>`).join(`<span data-reveal="2">${math("+")}</span>`)}</div>
    <div class="comb-expanded"><span data-reveal="3">${math("=")}</span>
      ${combination.terms.map(term => `<span data-reveal="3">${math(`\\begin{bmatrix}${term.pairs.map((pair, i) =>
        `${tag(`factor-${term.index}-${i}`, pair.right)}\\times ${tag(`entry-${term.index}-${i}`, pair.left)}`
      ).join("\\\\")}\\end{bmatrix}`)}</span>`).join(`<span data-reveal="3">${math("+")}</span>`)}
    </div>
    <div class="comb-evaluated"><span data-reveal="4">${math("=")}</span>
      ${combination.terms.map(term => `<span data-reveal="4">${vector(term.entries, `scaled-${term.index}`)}</span>`).join(`<span data-reveal="4">${math("+")}</span>`)}
      <span data-reveal="5">${math("=")}</span><span data-reveal="5">${vector(combination.result.entries, "sum")}</span>
    </div><div class="comb-material"></div></div>`;
}

interface Position { x: number; y: number }
export function mountPresentation(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>(".comb-stage")!;
  const layer = root.querySelector<HTMLElement>(".comb-material")!;
  const native = new Map([...stage.querySelectorAll<HTMLElement>("[data-kp-comb-key]")].map(node => [node.dataset["kpCombKey"]!, node]));
  const points = new Map<string, Position>();
  const owners: { owner: HTMLElement; from: string; to: string; phase: number; delay: number }[] = [];
  let disposed = false;
  const prepare = () => {
    if (disposed) return;
    for (const node of stage.querySelectorAll<HTMLElement>("[data-reveal]")) node.style.opacity = "1";
    for (const node of native.values()) { node.style.opacity = "1"; node.classList.remove("comb-focus"); }
    layer.replaceChildren(); owners.length = 0;
    const bounds = stage.getBoundingClientRect();
    for (const [key, node] of native) {
      const box = node.getBoundingClientRect(); points.set(key, { x: box.x - bounds.x + box.width / 2, y: box.y - bounds.y + box.height / 2 });
    }
    const copy = (from: string, to: string, source: KpScalarValue, phase: number, delay = 0) => {
      const original = native.get(from);
      if (!original || !native.has(to)) throw new Error(`Missing native endpoint ${from} or ${to}.`);
      const owner = document.createElement("span"); owner.className = "comb-paint";
      const clone = cloneElementWithComputedStyles(original); stripKpMaterialCloneAuthority(clone);
      for (const node of [clone, ...clone.querySelectorAll<HTMLElement>("*")]) {
        node.style.color = "inherit"; node.style.setProperty("-webkit-text-fill-color", "currentColor");
      }
      owner.append(clone); makeKpMaterialOwnerInert(owner);
      owner.dataset["sourceId"] = source.id; owner.dataset["occurrence"] = to;
      layer.append(owner); owners.push({ owner, from, to, phase, delay });
    };
    for (const term of combination.terms) {
      term.vector.entries.forEach((entry, i) => copy(`a-${i}-${term.index}`, `column-${term.index}-${i}`, entry, 1));
      copy(`b-${term.index}-0`, `weight-${term.index}`, term.coefficient, 2);
      // Both interpretations share these exact operands and derived products.
      // Fan-out makes new occurrences of the coefficient, not new scalar values.
      term.pairs.forEach((pair, i) => {
        // Lower copies depart first: an upper copy must not be overtaken on the
        // same downward route. Delay belongs to this local discovery treatment.
        const delay = .18 * (term.pairs.length - 1 - i) / Math.max(1, term.pairs.length - 1);
        copy(`weight-${term.index}`, `factor-${term.index}-${i}`, pair.right, 3, delay);
        copy(`column-${term.index}-${i}`, `entry-${term.index}-${i}`, pair.left, 3);
      });
    }
    combination.result.entries.forEach((entry, i) => copy(`sum-${i}`, `c-${i}-0`, entry, 6));
  };
  const render = (progress: number) => {
    const frame = sample(progress);
    if (disposed) return frame;
    const settled = frame.local === 1 ? frame.index : frame.index - 1;
    stage.dataset["progress"] = String(frame.progress);
    // Numerical evaluation introduces derived entries at a readable checkpoint;
    // it does not pretend that a new value is the same scalar as its inputs.
    for (const node of stage.querySelectorAll<HTMLElement>("[data-reveal]")) node.style.opacity = Number(node.dataset["reveal"]) <= settled ? "1" : "0";
    for (const [key, node] of native) {
      node.style.opacity = key.startsWith("c-") ? (settled === 6 && key.endsWith("-0") ? "1" : "0") : "1";
      node.classList.toggle("comb-focus", (frame.index === 1 && key.startsWith("a-")) ||
        (frame.index === 2 && /^b-\d-0$/.test(key)) || (frame.index === 3 && (key.startsWith("weight-") || key.startsWith("factor-"))));
    }
    for (const { owner, from, to, phase, delay } of owners) {
      const local = Math.max(0, Math.min(1, (frame.local - delay) / (phase === 3 && to.startsWith("factor-") ? .82 : 1)));
      const t = local * local * (3 - 2 * local);
      const a = points.get(from)!, b = points.get(to)!;
      owner.style.transform = `translate(${a.x + (b.x - a.x) * t}px, ${a.y + (b.y - a.y) * t}px) translate(-50%, -50%)`;
      owner.style.opacity = frame.index === phase && local > 0 && frame.local < 1 ? "1" : "0";
    }
    return frame;
  };
  prepare();
  return { prepare, render, dispose() { disposed = true; layer.replaceChildren(); } };
}
