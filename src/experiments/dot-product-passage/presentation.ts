import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { cloneElementWithComputedStyles, makeKpMaterialOwnerInert, stripKpMaterialCloneAuthority } from "../../rendering/computed-style-clone.ts";
import { valueOf, sample, DotPassageGap, type DotPassage } from "./model.ts";
import type { KpScalarValue } from "../../math/typed-semantic-math.ts";

const number = (entry: KpScalarValue) => { const n = valueOf(entry); return n < 0 ? `(${n})` : String(n); };
const tag = (key: string, entry: KpScalarValue) => `\\htmlData{kp-dot-key=${key}}{${number(entry)}}`;
const math = (latex: string) => renderLatexToHtml(latex, { trust: true });
const plus = `<span class="dot-plus">${math("+")}</span>`;

export function calculationLatex(passage: DotPassage) {
  return passage.dot.pairs.map(pair => `${number(pair.left)}\\times ${number(pair.right)}`).join("+") + "=" +
    passage.dot.pairs.map(pair => number(pair.product)).join("+") + "=" + valueOf(passage.dot.result);
}

export function stageHtml(passage: DotPassage) {
  const { dot } = passage;
  const vector = (side: "left" | "right") => math(`\\begin{bmatrix}${dot.pairs.map((pair, i) => tag(`${side}-${i}`, pair[side])).join(" & ")}\\end{bmatrix}`);
  return `<div class="dot-stage" aria-hidden="true">
    <div class="dot-inputs">${vector("left")}<span>${math("\\cdot")}</span>${vector("right")}</div>
    <div class="dot-work">
      <div class="dot-pairs">${dot.pairs.map((pair, i) => `<span class="dot-term" data-pair="${i}">${math(`${tag(`pair-left-${i}`, pair.left)}\\htmlData{kp-dot-key=times-${i}}{\\times}${tag(`pair-right-${i}`, pair.right)}`)}</span>`).join(plus)}</div>
      <div class="dot-products">${dot.pairs.map((pair, i) => `<span class="dot-term" data-product="${i}">${math(tag(`product-${i}`, pair.product))}</span>`).join(plus)}</div>
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
  const native = new Map([...stage.querySelectorAll<HTMLElement>("[data-kp-dot-key]")].map(node => [node.dataset["kpDotKey"]!, node]));
  const points = new Map<string, Point>();
  const owners: { node: HTMLElement; from: string; to: string }[] = [];
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
    for (const node of [pairs, products, sum, ...stage.querySelectorAll<HTMLElement>(".dot-term, [data-kp-dot-key], .dot-plus")]) {
      node.style.opacity = "1"; node.style.transform = "";
    }
  };
  const prepare = () => {
    if (disposed) return;
    reset(); layer.replaceChildren(); owners.length = 0;
    const bounds = stage.getBoundingClientRect();
    for (const [key, node] of native) {
      const r = node.getBoundingClientRect();
      points.set(key, { x: r.x - bounds.x + r.width / 2, y: r.y - bounds.y + r.height / 2 });
    }
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
  const render = (progress: number) => {
    const frame = sample(progress);
    if (disposed) return frame;
    reset();
    stage.dataset["progress"] = String(frame.progress);
    pairs.style.opacity = frame.index === 1 || (frame.index === 2 && frame.local < 1) ? "1" : "0";
    products.style.opacity = frame.index >= 2 && !(frame.index === 3 && frame.local === 1) ? "1" : "0";
    sum.style.opacity = frame.index === 3 ? "1" : "0";
    const shrink = 1 - ease(frame.local / .45), grow = ease((frame.local - .45) / .55);
    for (const { node, from, to } of owners) {
      // Separate arrivals avoid crossing unrelated operands from the two vectors.
      const arrival = (frame.local - (from.startsWith("left-") ? 0 : .4)) / .4;
      const a = points.get(from)!, b = points.get(to)!, t = ease(arrival);
      node.style.transform = `translate(${a.x + (b.x - a.x) * t}px, ${a.y + (b.y - a.y) * t}px) translate(-50%, -50%)`;
      node.style.opacity = frame.index === 1 && arrival > 0 && frame.local < 1 ? "1" : "0";
    }
    if (frame.index === 1 && frame.local < 1) {
      for (const pair of passage.dot.pairs) {
        requireNative(`pair-left-${pair.index}`).style.opacity = "0";
        requireNative(`pair-right-${pair.index}`).style.opacity = "0";
        requireNative(`times-${pair.index}`).style.transform = `scale(${ease((frame.local - .8) / .2)})`;
      }
      for (const plus of pairs.querySelectorAll<HTMLElement>(".dot-plus")) plus.style.transform = `scale(${ease((frame.local - .8) / .2)})`;
    }
    // Evaluation replaces operand expressions with derived values. Their distinct
    // semantic IDs remain intact even though they occupy the same presentation slot.
    if (frame.index === 2) {
      for (const node of pairs.querySelectorAll<HTMLElement>(".dot-term")) node.style.transform = `scale(${shrink})`;
      for (const node of products.querySelectorAll<HTMLElement>(".dot-term")) node.style.transform = `scale(${grow})`;
      for (const plus of products.querySelectorAll<HTMLElement>(".dot-plus")) plus.style.opacity = frame.local === 1 ? "1" : "0";
    }
    if (frame.index === 3) {
      products.style.transform = `scale(${shrink})`;
      sum.style.transform = `scale(${grow})`;
    }
    return frame;
  };
  prepare();
  return { prepare, render, dispose() { disposed = true; layer.replaceChildren(); } };
}
