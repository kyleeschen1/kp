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
  return passage.dot.pairs.map(pair => `(${number(pair.left)}\\cdot ${number(pair.right)})`).join("+") + "=" +
    signedSum(passage.dot.pairs.map(pair => pair.product)) + "=" + valueOf(passage.dot.result);
}

export function stageHtml(passage: DotPassage) {
  const { dot } = passage;
  const vector = (side: "left" | "right") => math(`\\left[\\;\\begin{matrix}${dot.pairs.map((pair, i) => tag(`${side}-${i}`, pair[side])).join(side === "left" ? " & " : "\\\\")}\\end{matrix}\\;\\right]`);
  return `<div class="dot-stage" aria-hidden="true">
    <div class="dot-inputs"><span data-dot-vector="left">${vector("left")}</span><span data-dot-vector="right">${vector("right")}</span></div>
    <div class="dot-work">
      <div class="dot-pairs">${dot.pairs.map((pair, i) => `<span class="dot-term" data-pair="${i}">${math(`\\htmlData{kp-dot-key=syntax-open-${i}}{(}${tag(`pair-left-${i}`, pair.left)}\\htmlData{kp-dot-key=syntax-multiply-${i}}{\\cdot}${tag(`pair-right-${i}`, pair.right)}\\htmlData{kp-dot-key=syntax-close-${i}}{)}`)}</span>`).join(plus)}</div>
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
    for (const node of [pairs, products, sum, ...Object.values(vectors), ...stage.querySelectorAll<HTMLElement>(".dot-term, [data-kp-dot-key], .dot-plus, .dot-inputs .mopen, .dot-inputs .mclose")]) {
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
      [requireNative(`syntax-multiply-${pair.index}`)], requireNative(`product-${pair.index}`),
      [requireNative(`syntax-open-${pair.index}`), requireNative(`syntax-close-${pair.index}`)]));
    add = prepareFusion(stage, passage.dot.pairs.map(pair => requireNative(`product-${pair.index}`)),
      [...products.querySelectorAll<HTMLElement>(".dot-plus")], requireNative("sum"));
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
    products.style.opacity = frame.index >= 2 && !(frame.index === 4 && frame.local === 1) ? "1" : "0";
    sum.style.opacity = frame.index === 4 ? "1" : "0";
    for (const plus of pairs.querySelectorAll<HTMLElement>(".dot-plus")) plus.style.opacity = "0";
    for (const plus of products.querySelectorAll<HTMLElement>(".dot-plus")) plus.style.opacity = frame.index >= 3 ? "1" : "0";
    const tilt = smooth((frame.local - .15) / .85);
    const opening = smooth(frame.local / .7);
    const retreat = ease((frame.local - .12) / .48);
    const depth = frame.index === 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches
      ? ease(frame.local / .2) * (1 - ease((frame.local - .55) / .45)) : 0;
    for (const side of ["left", "right"] as const) {
      vectors[side].style.opacity = frame.index === 0 ? "1" : frame.index === 1 ? String(1 - retreat) : "0";
      if (frame.index === 1) for (const bracket of vectors[side].querySelectorAll<HTMLElement>(".mopen, .mclose")) {
        bracket.style.transform = `scale(${1 - retreat}, ${1 - .12 * retreat})`;
      }
      if (frame.index === 1 && frame.local > 0) {
        for (const pair of passage.dot.pairs) requireNative(`${side}-${pair.index}`).style.opacity = "0";
      }
      if (frame.index === 0) vectors[side].style.transform = "";
    }
    for (const { node, from, to } of owners) {
      const side = from.startsWith("left-") ? "left" : "right";
      const source = points.get(from)!, b = points.get(to)!;
      const a = source;
      let x = a.x + (b.x - a.x) * opening, y = a.y + (b.y - a.y) * opening;
      if (side === "right") {
        // All column entries share one pivot and angle. Spacing opens along
        // that axis to fit the native factor slots, while glyphs stay upright.
        // Quintic easing gives the turn zero velocity and acceleration at rest.
        const last = passage.dot.pairs.length - 1;
        const base = points.get(`right-${last}`)!, end = points.get(`pair-right-${last}`)!;
        const pivot = base;
        const radius = (base.y - source.y) * (1 - tilt) + (end.x - b.x) * tilt;
        const angle = -Math.PI / 2 - Math.PI / 2 * tilt;
        x = pivot.x + (end.x - pivot.x) * tilt + radius * Math.cos(angle);
        // One continuous lift-and-turn starts at the original entries, with no
        // docked intermediate state. The lift follows the measured column span.
        const lift = (base.y - points.get("right-0")!.y) * Math.sin(Math.PI * smooth(frame.local));
        y = pivot.y + (end.y - pivot.y) * tilt - lift + radius * Math.sin(angle);
      }
      // Depth is presentation-only: retain one paint owner and the same semantic
      // trajectory. The column settles to native size and loses its shadow.
      const elevation = side === "right" ? depth : 0;
      node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${1 + .035 * elevation})`;
      node.style.filter = elevation > 0 ? `drop-shadow(0 ${5 * elevation}px ${3 * elevation}px rgba(20, 25, 30, ${.28 * elevation}))` : "none";
      node.style.opacity = frame.index === 1 && frame.local > 0 && frame.local < 1 ? "1" : "0";
    }
    if (frame.index === 1 && frame.local < 1) {
      for (const pair of passage.dot.pairs) {
        requireNative(`pair-left-${pair.index}`).style.opacity = "0";
        requireNative(`pair-right-${pair.index}`).style.opacity = "0";

      }
    }
    if (frame.index <= 1) for (const [key, node] of native) if (key.startsWith("syntax-")) node.style.opacity = "0";
    // Evaluation replaces operand expressions with derived values. Their distinct
    // semantic IDs remain intact even though they occupy the same presentation slot.
    if (frame.index === 2) {
      // Introduce the operator, hold the readable products, then evaluate.
      const evaluation = Math.max(0, (frame.local - .35) / .65);
      multiply.forEach(apply => apply(evaluation));
      if (frame.local < .35) for (const [key, node] of native) if (key.startsWith("syntax-")) node.style.transform = `scale(${ease(frame.local / .18)})`;
    }
    if (frame.index === 3) {
      for (const plus of products.querySelectorAll<HTMLElement>(".dot-plus")) plus.style.transform = `scale(${ease(frame.local / .4)})`;
    }
    if (frame.index === 4) add(frame.local);
    return frame;
  };
  prepare();
  return { prepare, render, dispose() { disposed = true; layer.replaceChildren(); } };
}
