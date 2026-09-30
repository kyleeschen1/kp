import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { cloneElementWithComputedStyles, makeKpMaterialOwnerInert, stripKpMaterialCloneAuthority } from "../../rendering/computed-style-clone.ts";
import { valueOf, sample, DotPassageGap, type DotPassage } from "./model.ts";
import type { KpScalarValue } from "../../math/typed-semantic-math.ts";
import { prepareFusion } from "./fusion.ts";

const number = (entry: KpScalarValue) => String(valueOf(entry));
const signedSum = (entries: readonly KpScalarValue[]) => entries.map(number).join("+");
const tag = (key: string, entry: KpScalarValue) => `\\htmlData{kp-dot-key=${key}}{${number(entry)}}`;
const math = (latex: string) => renderLatexToHtml(latex, { trust: true });
const plus = `<span class="dot-plus">${math("+")}</span>`;

export function calculationLatex(passage: DotPassage) {
  return passage.dot.pairs.map(pair => `${number(pair.left)}\\times ${number(pair.right)}`).join("+") + "=" +
    signedSum(passage.dot.pairs.map(pair => pair.product)) + "=" + valueOf(passage.dot.result);
}

export function stageHtml(passage: DotPassage) {
  const { dot } = passage;
  const vector = (side: "left" | "right") => math(`\\begin{bmatrix}${dot.pairs.map((pair, i) => tag(`${side}-${i}`, pair[side])).join(side === "left" ? " & " : "\\\\")}\\end{bmatrix}`);
  return `<div class="dot-stage" aria-hidden="true">
    <div class="dot-inputs"><span data-dot-vector="left">${vector("left")}</span><span data-dot-vector="right">${vector("right")}</span></div>
    <div class="dot-work">
      <div class="dot-pairs">${dot.pairs.map((pair, i) => `<span class="dot-term" data-pair="${i}">${math(`${tag(`pair-left-${i}`, pair.left)}\\htmlData{kp-dot-key=syntax-times-${i}}{\\times}${tag(`pair-right-${i}`, pair.right)}`)}</span>`).join(plus)}</div>
      <div class="dot-products">${dot.pairs.map((pair, i) => `${i > 0 ? plus : ""}<span class="dot-term" data-product="${i}">${math(tag(`product-${i}`, pair.product))}</span>`).join("")}</div>
      <div class="dot-sum">${math(tag("sum", dot.result))}</div>
    </div><div class="dot-material"></div>
  </div>`;
}

interface Point { x: number; y: number }
export function mountPresentation(root: HTMLElement, passage: DotPassage) {
  const stage = root.querySelector<HTMLElement>(".dot-stage")!;
  const layer = stage.querySelector<HTMLElement>(".dot-material")!;
  const pairs = stage.querySelector<HTMLElement>(".dot-pairs")!;
  const products = stage.querySelector<HTMLElement>(".dot-products")!;
  const sum = stage.querySelector<HTMLElement>(".dot-sum")!;
  const vectors = { left: stage.querySelector<HTMLElement>('[data-dot-vector="left"]')!, right: stage.querySelector<HTMLElement>('[data-dot-vector="right"]')! };
  let dock = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
  const native = new Map([...stage.querySelectorAll<HTMLElement>("[data-kp-dot-key]")].map(node => [node.dataset["kpDotKey"]!, node]));
  const points = new Map<string, Point>();
  const owners: { node: HTMLElement; from: string; to: string }[] = [];
  let multiply: readonly ((progress: number) => void)[] = [];
  let add: (progress: number) => void = () => {};
  let disposed = false;
  const requireNative = (key: string) => {
    const node = native.get(key);
    if (!node) throw new DotPassageGap(`Missing declared native occurrence ${key}.`);
    return node;
  };
  for (const pair of passage.dot.pairs) {
    for (const side of ["left", "right"] as const) {
      for (const key of [`${side}-${pair.index}`, `pair-${side}-${pair.index}`]) requireNative(key).dataset["sourceId"] = pair[side].id;
    }
    requireNative(`product-${pair.index}`).dataset["sourceId"] = pair.product.id;
  }
  requireNative("sum").dataset["sourceId"] = passage.dot.result.id;
  const reset = () => {
    for (const node of [pairs, products, sum, ...Object.values(vectors), ...stage.querySelectorAll<HTMLElement>(".dot-term, [data-kp-dot-key], .dot-plus")]) {
      node.style.opacity = "1"; node.style.transform = ""; node.style.clipPath = "";
    }
  };
  const prepare = () => {
    if (disposed) return;
    reset(); layer.replaceChildren(); owners.length = 0;
    // Keep addition in place while only the multiplication terms evaluate.
    for (const pair of passage.dot.pairs) {
      const term = pairs.querySelector<HTMLElement>(`[data-pair="${pair.index}"]`)!;
      products.querySelector<HTMLElement>(`[data-product="${pair.index}"]`)!.style.width = `${term.getBoundingClientRect().width}px`;
    }
    const bounds = stage.getBoundingClientRect();
    for (const [key, node] of native) {
      const r = node.getBoundingClientRect();
      points.set(key, { x: r.x - bounds.x + r.width / 2, y: r.y - bounds.y + r.height / 2 });
    }
    multiply = passage.dot.pairs.map(pair => prepareFusion(stage,
      [requireNative(`pair-left-${pair.index}`), requireNative(`pair-right-${pair.index}`)],
      [requireNative(`syntax-times-${pair.index}`)], requireNative(`product-${pair.index}`)));
    add = prepareFusion(stage, passage.dot.pairs.map(pair => requireNative(`product-${pair.index}`)),
      [...products.querySelectorAll<HTMLElement>(".dot-plus")], requireNative("sum"));
    const row = vectors.left.querySelector(".katex-html > .base")!.getBoundingClientRect();
    const column = vectors.right.querySelector(".katex-html > .base")!.getBoundingClientRect();
    const first = points.get("left-0")!, target = points.get("pair-left-0")!;
    const left = { x: target.x - first.x, y: target.y - first.y };
    // Dock the actual bracket corners, independent of font metrics and layout.
    dock = { left, right: { x: row.right + left.x - column.left, y: row.top + left.y - column.bottom } };
    for (const pair of passage.dot.pairs) for (const side of ["left", "right"] as const) {
      const from = `${side}-${pair.index}`, to = `pair-${side}-${pair.index}`;
      const clone = cloneElementWithComputedStyles(requireNative(from));
      stripKpMaterialCloneAuthority(clone);
      const node = document.createElement("span"); node.className = "dot-paint";
      for (const part of [clone, ...clone.querySelectorAll<HTMLElement>("*")]) {
        part.style.color = "inherit"; part.style.setProperty("-webkit-text-fill-color", "currentColor");
      }
      node.append(clone); makeKpMaterialOwnerInert(node);
      node.dataset["sourceId"] = pair[side].id; node.dataset["occurrence"] = to;
      layer.append(node); owners.push({ node, from, to });
    }
  };
  const ease = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * t * (t * (t * 6 - 15) + 10); };
  const render = (progress: number) => {
    const frame = sample(progress);
    if (disposed) return frame;
    reset();
    stage.dataset["progress"] = String(frame.progress);
    pairs.style.opacity = frame.index === 1 || (frame.index === 2 && frame.local < 1) ? "1" : "0";
    products.style.opacity = frame.index >= 2 && !(frame.index === 3 && frame.local === 1) ? "1" : "0";
    sum.style.opacity = frame.index === 3 ? "1" : "0";
    const docking = ease(frame.local / .3), tilt = smooth((frame.local - .4) / .45);
    const opening = smooth((frame.local - .4) / .26);
    for (const side of ["left", "right"] as const) {
      vectors[side].style.transform = `translate(${dock[side].x * docking}px, ${dock[side].y * docking}px)`;
      vectors[side].style.opacity = frame.index === 0 || (frame.index === 1 && frame.local < .4) ? "1" : "0";
      if (frame.index === 0) vectors[side].style.transform = "";
    }
    for (const { node, from, to } of owners) {
      const side = from.startsWith("left-") ? "left" : "right";
      const source = points.get(from)!, b = points.get(to)!;
      const a = { x: source.x + dock[side].x, y: source.y + dock[side].y };
      let x = a.x + (b.x - a.x) * opening, y = a.y + (b.y - a.y) * opening;
      if (side === "right") {
        // All column entries share one pivot and angle. Spacing opens along
        // that axis to fit the native factor slots, while glyphs stay upright.
        // Quintic easing gives the turn zero velocity and acceleration at rest.
        const last = passage.dot.pairs.length - 1;
        const base = points.get(`right-${last}`)!, end = points.get(`pair-right-${last}`)!;
        const pivot = { x: base.x + dock.right.x, y: base.y + dock.right.y };
        const radius = (base.y - source.y) * (1 - tilt) + (end.x - b.x) * tilt;
        const angle = -Math.PI / 2 - Math.PI / 2 * tilt;
        x = pivot.x + (end.x - pivot.x) * tilt + radius * Math.cos(angle);
        // Hold the unit above the opening row until its horizontal travel clears it.
        y = pivot.y + (end.y - pivot.y) * tilt * tilt + radius * Math.sin(angle);
      }
      node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      node.style.opacity = frame.index === 1 && frame.local >= .4 && frame.local < 1 ? "1" : "0";
    }
    if (frame.index === 1 && frame.local < 1) {
      for (const pair of passage.dot.pairs) {
        requireNative(`pair-left-${pair.index}`).style.opacity = "0";
        requireNative(`pair-right-${pair.index}`).style.opacity = "0";

      }
      for (const [key, node] of native) if (key.startsWith("syntax-")) node.style.transform = `scale(${ease((frame.local - .85) / .15)})`;
      for (const plus of pairs.querySelectorAll<HTMLElement>(".dot-plus")) plus.style.transform = `scale(${ease((frame.local - .85) / .15)})`;
    }
    // Evaluation replaces operand expressions with derived values. Their distinct
    // semantic IDs remain intact even though they occupy the same presentation slot.
    if (frame.index === 2) {
      multiply.forEach(apply => apply(frame.local));
      // Addition is a separate operation: retain its signs while factors shrink
      // and products grow, then hand them to the identical product slots.
      for (const plus of products.querySelectorAll<HTMLElement>(".dot-plus")) plus.style.opacity = frame.local === 1 ? "1" : "0";
    }
    if (frame.index === 3) {
      add(frame.local);
    }
    return frame;
  };
  prepare();
  return { prepare, render, dispose() { disposed = true; layer.replaceChildren(); } };
}
