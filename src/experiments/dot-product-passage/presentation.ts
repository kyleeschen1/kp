import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { cloneElementWithComputedStyles, makeKpMaterialOwnerInert, stripKpMaterialCloneAuthority } from "../../rendering/computed-style-clone.ts";
import { valueOf, sample, DotPassageGap, type DotPassage } from "./model.ts";
import type { KpScalarValue } from "../../math/typed-semantic-math.ts";
import { prepareFusion } from "./fusion.ts";
import { defaultDotDepth, sampleDotDepth, sampleDotDeparture, sampleDotElevation, type DotDepthSettings } from './depth.ts';

const number = (entry: KpScalarValue) => String(valueOf(entry));
const signedToken = (entry: KpScalarValue) => valueOf(entry) < 0
  ? `\\htmlClass{dot-negative-sign}{\\mathord{-}}${Math.abs(valueOf(entry))}` : number(entry);
// Keep inter-operator spacing outside the semantic token's measured paint owner.
const tag = (key: string, entry: KpScalarValue) => `\\mathord{\\htmlData{kp-dot-key=${key}}{${signedToken(entry)}}}`;
const math = (latex: string) => renderLatexToHtml(latex, { trust: true });
const plus = `<span class="dot-plus">${math("+")}</span>`;

export function calculationLatex(passage: DotPassage, styled = false) {
  const token = styled ? signedToken : number;
  return passage.dot.pairs.map(pair => `(${token(pair.left)}\\cdot ${token(pair.right)})`).join("+") + "=" +
    passage.dot.pairs.map(pair => token(pair.product)).join("+") + "=" + token(passage.dot.result);
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
export function mountPresentation(root: HTMLElement, passage: DotPassage, depthSettings: () => DotDepthSettings = () => defaultDotDepth) {
  const stage = root.querySelector<HTMLElement>(".dot-stage")!;
  const layer = stage.querySelector<HTMLElement>(".dot-material")!;
  const inputs = stage.querySelector<HTMLElement>('.dot-inputs')!;
  const work = stage.querySelector<HTMLElement>('.dot-work')!;
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
    // Measurement uses the normal plane; group scaling is applied only after
    // projecting the frame, avoiding double-scaled endpoints during resize.
    for (const group of [inputs, work, layer]) group.style.scale = '1';
    inputs.style.opacity = '1';
    for (const node of [pairs, products, sum, ...Object.values(vectors), ...stage.querySelectorAll<HTMLElement>(".dot-term, [data-kp-dot-key], .dot-plus, .dot-inputs .mopen, .dot-inputs .mclose")]) {
      node.style.opacity = "1"; node.style.transform = ""; node.style.clipPath = ""; node.style.color = "";
      node.removeAttribute("data-dot-focused");
    }
  };
  const prepare = () => {
    if (disposed) return;
    reset(); layer.replaceChildren(); owners.length = 0;
    // Native arrays use different horizontal and vertical spacing. Project the
    // column onto the row's measured center spacing, without scaling glyphs.
    // Keep this layout translation separate from frame-owned motion transforms.
    const rowEntries = passage.dot.pairs.map(pair => requireNative(`left-${pair.index}`).getBoundingClientRect());
    const columnEntries = passage.dot.pairs.map(pair => requireNative(`right-${pair.index}`));
    columnEntries.forEach(node => { node.style.translate = ''; });
    const columnBounds = columnEntries.map(node => node.getBoundingClientRect());
    const rowCenters = rowEntries.map(r => r.x + r.width / 2);
    const columnCenters = columnBounds.map(r => r.y + r.height / 2);
    const rowMiddle = (rowCenters[0]! + rowCenters.at(-1)!) / 2;
    const columnMiddle = (columnCenters[0]! + columnCenters.at(-1)!) / 2;
    columnEntries.forEach((node, i) => {
      node.style.translate = `0px ${columnMiddle + rowCenters[i]! - rowMiddle - columnCenters[i]!}px`;
    });
    // Bracket paint encloses measured entries, not the font's outer line box.
    // Retain the native enclosure's roomy horizontal padding while centering
    // its paint on the entries rather than inheriting asymmetric font bearings.
    for (const vector of Object.values(vectors)) {
      const outer = vector.getBoundingClientRect();
      const entries = [...vector.querySelectorAll<HTMLElement>("[data-kp-dot-key]")].map(node => node.getBoundingClientRect());
      const padding = parseFloat(getComputedStyle(vector).fontSize) * .4;
      const left = Math.min(...entries.map(r => r.left)), right = Math.max(...entries.map(r => r.right));
      const horizontalPadding = (outer.width - (right - left)) / 2 - parseFloat(getComputedStyle(vector).fontSize) * .12;
      vector.style.setProperty("--dot-bracket-top", `${Math.min(...entries.map(r => r.top)) - outer.top - padding}px`);
      vector.style.setProperty("--dot-bracket-bottom", `${outer.bottom - Math.max(...entries.map(r => r.bottom)) - padding}px`);
      vector.style.setProperty("--dot-bracket-left", `${left - outer.left - horizontalPadding}px`);
      vector.style.setProperty("--dot-bracket-right", `${outer.right - right - horizontalPadding}px`);
    }
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
      // Source, moving material and destination use identical token typography.
      const clone = cloneElementWithComputedStyles(requireNative(to));
      stripKpMaterialCloneAuthority(clone);
      const node = document.createElement("span"); node.className = "dot-paint";
      for (const part of [clone, ...clone.querySelectorAll<HTMLElement>("*")]) {
        part.style.textShadow = "inherit"; part.style.color = "inherit"; part.style.setProperty("-webkit-text-fill-color", "currentColor");
        part.style.setProperty("-webkit-text-stroke-color", "currentColor");
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
    // Focus follows the beat's mathematical contributors and result, so native
    // and moving occurrences agree through seeks, reprepare and ownership handoff.
    const focusedIds = new Set<string>();
    for (const pair of passage.dot.pairs) {
      if (frame.index === 1 || frame.index === 2) {
        focusedIds.add(pair.left.id); focusedIds.add(pair.right.id);
      }
      if (frame.index >= 2) focusedIds.add(pair.product.id);
    }
    if (frame.index === 4) focusedIds.add(passage.dot.result.id);
    for (const node of [...native.values(), ...owners.map(owner => owner.node)]) {
      node.toggleAttribute("data-dot-focused", focusedIds.has(node.dataset["sourceId"] ?? ""));
    }
    pairs.style.opacity = frame.index === 1 || (frame.index === 2 && frame.local < 1) ? "1" : "0";
    products.style.opacity = frame.index >= 2 && !(frame.index === 4 && frame.local === 1) ? "1" : "0";
    sum.style.opacity = frame.index === 4 ? "1" : "0";
    for (const plus of pairs.querySelectorAll<HTMLElement>(".dot-plus")) plus.style.opacity = "0";
    for (const plus of products.querySelectorAll<HTMLElement>(".dot-plus")) plus.style.opacity = frame.index >= 3 ? "1" : "0";
    // Restore the original lift-and-pivot phrase: the column rises before
    // turning as one axis, while the row opens into the native factor slots.
    const departure = sampleDotDeparture(frame.local);
    const tilt = smooth(departure.travel);
    const opening = smooth(departure.travel / .7);
    const settings = depthSettings();
    const elevation = sampleDotElevation(frame.progress, settings);
    for (const side of ["left", "right"] as const) {
      // Retain the recessed source through pairing so depth can be read before
      // withdrawal. Fade during operator introduction, before multiplication.
      vectors[side].style.opacity = String(frame.index <= 1 ? 1 : frame.index === 2 ? 1 - smooth(frame.local / .35) : 0);
      if (frame.index > 0) {
        for (const pair of passage.dot.pairs) {
          const original = requireNative(`${side}-${pair.index}`);
          original.style.opacity = "0";
        }
      }
    }
    for (const { node, from, to } of owners) {
      const side = from.startsWith("left-") ? "left" : "right";
      const source = points.get(from)!, b = points.get(to)!;
      let x = source.x + (b.x - source.x) * opening;
      let y = source.y + (b.y - source.y) * opening;
      if (side === "right") {
        // All column entries share one pivot and angle; glyphs remain upright.
        // Measured radii interpolate to the native slots, including wider tokens.
        const last = passage.dot.pairs.length - 1;
        const base = points.get(`right-${last}`)!, end = points.get(`pair-right-${last}`)!;
        const radius = (base.y - source.y) * (1 - tilt) + (end.x - b.x) * tilt;
        const angle = -Math.PI / 2 - Math.PI / 2 * tilt;
        const lift = (base.y - points.get("right-0")!.y) * Math.sin(Math.PI * smooth(departure.travel));
        x = base.x + (end.x - base.x) * tilt + radius * Math.cos(angle);
        y = base.y + (end.y - base.y) * tilt - lift + radius * Math.sin(angle);
      }
      node.style.transform = `translate(${x}px, ${y - elevation}px) translate(-50%, -50%)`;
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
    const depth = sampleDotDepth(frame.progress, settings);
    inputs.style.opacity = String(depth.backgroundOpacity);
    inputs.style.scale = String(depth.backgroundScale);
    work.style.scale = layer.style.scale = String(depth.foregroundScale);
    return frame;
  };
  prepare();
  return { prepare, render, dispose() { disposed = true; layer.replaceChildren(); } };
}
