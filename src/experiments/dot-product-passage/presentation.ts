import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { cloneElementWithComputedStyles, makeKpMaterialOwnerInert, stripKpMaterialCloneAuthority } from "../../rendering/computed-style-clone.ts";
import { valueOf, sample, DotPassageGap, type DotPassage } from "./model.ts";
import type { KpScalarValue } from "../../math/typed-semantic-math.ts";
import { prepareFusion } from "./fusion.ts";

const number = (entry: KpScalarValue) => String(valueOf(entry));
const signedToken = (entry: KpScalarValue) => valueOf(entry) < 0
  ? `\\htmlClass{dot-negative-sign}{\\mathord{-}}${Math.abs(valueOf(entry))}` : number(entry);
const tag = (key: string, entry: KpScalarValue) => `\\htmlData{kp-dot-key=${key}}{${signedToken(entry)}}`;
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
    <div class="dot-plane dot-plane-source"></div>
    <div class="dot-plane dot-plane-working"></div>
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
  const workingPlane = stage.querySelector<HTMLElement>(".dot-plane-working")!;
  const pairs = stage.querySelector<HTMLElement>(".dot-pairs")!;
  const products = stage.querySelector<HTMLElement>(".dot-products")!;
  const sum = stage.querySelector<HTMLElement>(".dot-sum")!;
  const vectors = { left: stage.querySelector<HTMLElement>('[data-dot-vector="left"]')!, right: stage.querySelector<HTMLElement>('[data-dot-vector="right"]')! };
  const native = new Map([...stage.querySelectorAll<HTMLElement>("[data-kp-dot-key]")].map(node => [node.dataset["kpDotKey"]!, node]));
  const points = new Map<string, Point>();
  const owners: { node: HTMLElement; shadow: HTMLElement; from: string; to: string }[] = [];
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
      node.style.opacity = "1"; node.style.transform = ""; node.style.clipPath = ""; node.style.color = "";
      node.removeAttribute("data-dot-focused");
    }
  };
  const prepare = () => {
    if (disposed) return;
    // Measure in plane-local coordinates; perspective belongs only to display.
    stage.style.transform = "none";
    const sourceProperties = ["--dot-back-scale", "--dot-back-opacity"];
    const sourceStyles = sourceProperties.map(key => [key, stage.style.getPropertyValue(key)] as const);
    for (const key of sourceProperties) stage.style.setProperty(key, "1");
    const work = stage.querySelector<HTMLElement>(".dot-work")!;
    work.style.transform = "none";
    reset(); layer.replaceChildren(); owners.length = 0;
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
      // A decorative projection lives on the receiving surface, separately from
      // the crisp glyph above it; it never receives mathematical authority.
      const shadow = document.createElement("span"); shadow.className = "dot-shadow";
      shadow.append(clone.cloneNode(true)); makeKpMaterialOwnerInert(shadow);
      for (const part of shadow.querySelectorAll("[data-source-id]")) part.removeAttribute("data-source-id");
      shadow.dataset["shadowFor"] = to;
      layer.append(shadow, node); owners.push({ node, shadow, from, to });
    }
    stage.style.transform = ""; work.style.transform = "";
    for (const [key, value] of sourceStyles) stage.style.setProperty(key, value);
  };
  const ease = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * t * (t * (t * 6 - 15) + 10); };
  const render = (progress: number, dimUnfocused = .6, glowStrength = 0) => {
    if (!Number.isFinite(dimUnfocused) || dimUnfocused < 0 || dimUnfocused > 1) throw new DotPassageGap("Unfocused dimming must be between zero and one.");
    if (!Number.isFinite(glowStrength) || glowStrength < 0 || glowStrength > 1) throw new DotPassageGap("Glow strength must be between zero and one.");
    const frame = sample(progress);
    if (disposed) return frame;
    reset();
    stage.dataset["progress"] = String(frame.progress);
    // A glyph-shaped light halo is separate from the dark receiving-plane shadow.
    // It inherits through signed tokens without changing their metrics or ink.
    const haloInk = `rgba(220, 38, 38, ${glowStrength})`;
    const halo = glowStrength === 0 ? "" : ["-1px 0 1px", "1px 0 1px", "0 -1px 1px", "0 1px 1px", "0 0 4px", "0 0 4px"].map(offset => `${offset} ${haloInk}`).join(", ");
    stage.style.setProperty("--dot-moving-glow", halo || "none");
    stage.style.setProperty("--dot-focused-shadow", `${halo ? `${halo}, ` : ""}0 .8px .5px rgba(0, 0, 0, .35)`);
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
    // The surface shares the entries' depth, without owning their semantic paint.
    const planeLift = frame.index === 0 ? 0 : frame.index === 1 ? ease(frame.local / .2) : 1;
    stage.style.setProperty("--dot-back-scale", "1");
    stage.style.setProperty("--dot-back-opacity", String(1 - dimUnfocused * planeLift));
    workingPlane.style.transform = `translate3d(0, 0, ${70 * planeLift - 1}px)`;
    // Surface translucency preserves the source context; elevation changes the
    // cast shadow independently, without fading the foreground mathematical ink.
    workingPlane.style.opacity = planeLift > 0 ? "1" : "0";
    // Dimming is the only context wash; the receiving plane adds no overlay.
    workingPlane.style.setProperty("--dot-front-fill", "0%");
    workingPlane.style.boxShadow = planeLift > 0
      ? `0 1px 2px rgba(0, 0, 0, ${.16 * planeLift}), ${10 * planeLift}px ${1 + 13 * planeLift}px ${2 + 20 * planeLift}px rgba(0, 0, 0, ${.22 * planeLift})` : "none";
    pairs.style.opacity = frame.index === 1 || (frame.index === 2 && frame.local < 1) ? "1" : "0";
    products.style.opacity = frame.index >= 2 && !(frame.index === 4 && frame.local === 1) ? "1" : "0";
    sum.style.opacity = frame.index === 4 ? "1" : "0";
    for (const plus of pairs.querySelectorAll<HTMLElement>(".dot-plus")) plus.style.opacity = "0";
    for (const plus of products.querySelectorAll<HTMLElement>(".dot-plus")) plus.style.opacity = frame.index >= 3 ? "1" : "0";
    const matching = frame.index === 0 ? 0 : frame.index === 1 ? smooth(frame.local) : 1;
    const shadowLift = frame.index === 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches
      ? ease(frame.local / .2) * (1 - ease((frame.local - .55) / .45)) : 0;
    for (const side of ["left", "right"] as const) {
      vectors[side].style.opacity = "1";
      if (frame.index > 0) {
        for (const pair of passage.dot.pairs) {
          const original = requireNative(`${side}-${pair.index}`);
          original.style.opacity = "0";
        }
      }
    }
    for (const { node, shadow, from, to } of owners) {
      const side = from.startsWith("left-") ? "left" : "right";
      const source = points.get(from)!, b = points.get(to)!;
      // Both operands approach their shared reading line from opposite sides.
      // A shallow separation replaces the former full-column sweeping pivot.
      const separation = 24 * Math.sin(Math.PI * matching);
      // Open the native pair slots before closing the column's vertical spacing.
      const spread = smooth(frame.local / .7);
      const x = source.x + (b.x - source.x) * spread;
      const y = source.y + (b.y - source.y) * matching + (side === "left" ? separation : -separation);
      // All entries move out of the shared plane; the destination expression
      // lives at the same depth, avoiding a jump on the native handoff.
      const surfaceZ = 70 * ease(frame.local / .2);
      const height = 20 * shadowLift;
      const z = surfaceZ + height;
      node.style.transform = `translate3d(${x}px, ${y}px, ${z}px) translate(-50%, -50%)`;
      shadow.style.transform = `translate3d(${x + .65 * height}px, ${y + .8 + height}px, ${surfaceZ - .5}px) translate(-50%, -50%)`;
      shadow.style.filter = `blur(${.5 + 3.5 * shadowLift}px)`;
      // At landing this matches the native expression's tight contact shadow.
      shadow.style.opacity = frame.index === 1 && frame.local > 0 && frame.local < 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches
        ? String(.35 + .2 * shadowLift) : "0";
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
