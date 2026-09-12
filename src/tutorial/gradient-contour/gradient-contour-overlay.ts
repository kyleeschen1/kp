import { projectKpSurfaceContourPoint, type KpSurfaceContourStageAuthority } from "../kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";
import { gradientLocalHeight, type GradientContourModel } from "./gradient-contour-model.ts";
import { gradientComparisonAnnotations } from "./gradient-contour-attention.ts";
import { renderKpFocusDeckAnnotation } from "../focus-deck-annotation.ts";
import { gradientContourModel, type sampleGradientContour } from "./gradient-contour-sequence.ts";

type Point = { readonly x: number; readonly y: number };
const path = (points: readonly Point[]) => points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
const arrow = (from: Point, to: Point) => {
  const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy);
  if (length < .01) return "";
  const x = dx / length, y = dy / length;
  return path([from, to]) + " " + path([{ x: to.x - x * 8 - y * 4, y: to.y - y * 8 + x * 4 }, to, { x: to.x - x * 8 + y * 4, y: to.y - y * 8 - x * 4 }]);
};

/** Question-specific SVG projection over the canonical stage. The local plane
 * comes from the checked field's differential, not screen-space slope guesses.
 * Magnification is bounded display geometry; it never alters directional rates. */
export function mountGradientContourOverlay(plot: HTMLElement, authority: KpSurfaceContourStageAuthority, model: GradientContourModel = gradientContourModel) {
  if (authority.field.a !== model.source.a || authority.field.b !== model.source.b)
    throw new TypeError("The gradient overlay must describe the stage's field.");
  const context = document.createElement("div"); context.className = "gradient-stage-context";
  context.append(...plot.childNodes); plot.append(context);
  plot.insertAdjacentHTML("beforeend", `<svg class="gradient-overlay" viewBox="0 0 520 300" aria-hidden="true">
    <g data-gradient-ramp data-kp-semantic-entity="gradient.local-linearization"><path class="gradient-ramp-plane"/><path class="gradient-ramp-levels"/></g>
    <g data-gradient-candidates data-kp-semantic-entity="gradient.candidate-directions"><path/></g>
    <g data-gradient-tangent data-kp-semantic-entity="gradient.tangent"><path class="gradient-tangent"/><path class="gradient-right-angle"/></g>
    <g data-gradient-direction data-kp-semantic-entity="gradient.unit-direction"><path class="gradient-direction"/></g>
    <g data-gradient-components><path class="gradient-equal-reach" data-kp-semantic-entity="gradient.equal-horizontal-reach"/><path class="gradient-across" data-kp-semantic-entity="gradient.across-component"/><path class="gradient-along" data-kp-semantic-entity="gradient.along-component"/></g>
    <g data-gradient-rise data-kp-semantic-entity="gradient.local-rise"><path class="gradient-height-baseline"/><path class="gradient-height-rise"/><path class="gradient-annotation-leader" data-gradient-rise-leader/></g>
    <circle class="gradient-origin" r="5" data-kp-semantic-entity="gradient.origin"/>
    <circle class="gradient-point" r="4.5" data-kp-semantic-entity="gradient.traveler"/>
    <g data-gradient-annotation-leaders visibility="hidden">
      <path class="gradient-annotation-leader" data-gradient-leader-for="gradient.across-component"/>
      <path class="gradient-annotation-leader" data-gradient-leader-for="gradient.along-component"/>
    </g>
  </svg>
  ${renderKpFocusDeckAnnotation({ entityId: "gradient.local-linearization", role: "support", text: "Magnified local flat approximation" })}
  ${renderKpFocusDeckAnnotation({ entityId: "gradient.local-rise", text: "Rise", detail: "above start" })}
  <div class="gradient-annotations" data-gradient-annotations hidden>
    ${Object.entries(gradientComparisonAnnotations).map(([entityId, { label, detail }]) => renderKpFocusDeckAnnotation({ entityId, text: label, detail })).join("")}
    ${renderKpFocusDeckAnnotation({ entityId: "gradient.equal-horizontal-reach", role: "support", text: "Same horizontal length" })}
  </div>`);
  const get = <T extends Element>(selector: string) => plot.querySelector<T>(selector)!;
  const ramp = get<SVGGElement>("[data-gradient-ramp]"), plane = get<SVGPathElement>(".gradient-ramp-plane"), levels = get<SVGPathElement>(".gradient-ramp-levels");
  const candidates = get<SVGGElement>("[data-gradient-candidates]"), candidatePath = candidates.querySelector("path")!;
  const tangentGroup = get<SVGGElement>("[data-gradient-tangent]"), tangentPath = get<SVGPathElement>(".gradient-tangent"), rightAngle = get<SVGPathElement>(".gradient-right-angle");
  const directionGroup = get<SVGGElement>("[data-gradient-direction]"), directionPath = get<SVGPathElement>(".gradient-direction");
  const componentGroup = get<SVGGElement>("[data-gradient-components]"), acrossPath = get<SVGPathElement>(".gradient-across"), alongPath = get<SVGPathElement>(".gradient-along");
  const reachPath = get<SVGPathElement>(".gradient-equal-reach"), caption = get<HTMLElement>('[data-kp-focus-deck-annotation="gradient.local-linearization"]');
  const rise = get<SVGGElement>("[data-gradient-rise]"), baseline = get<SVGPathElement>(".gradient-height-baseline"), riser = get<SVGPathElement>(".gradient-height-rise");
  const riseLabel = get<HTMLElement>('[data-kp-focus-deck-annotation="gradient.local-rise"]');
  const riseLeader = get<SVGPathElement>("[data-gradient-rise-leader]");
  const originCircle = get<SVGCircleElement>(".gradient-origin"), travelerCircle = get<SVGCircleElement>(".gradient-point");
  const annotations = get<HTMLElement>("[data-gradient-annotations]");
  const leaders = get<SVGGElement>("[data-gradient-annotation-leaders]");
  const annotationBindings = Object.keys(gradientComparisonAnnotations).map(id => ({
    id, owner: get<SVGElement>(`[data-kp-semantic-entity="${id}"]`),
    annotation: get<HTMLElement>(`[data-kp-focus-deck-annotation="${id}"]`),
    leader: get<SVGPathElement>(`[data-gradient-leader-for="${id}"]`)
  }));
  const acrossLeader = get<SVGPathElement>('[data-gradient-leader-for="gradient.across-component"]');
  const alongLeader = get<SVGPathElement>('[data-gradient-leader-for="gradient.along-component"]');
  const p = model.source.point, at = model.atPoint;
  if (at.kind !== "regular") throw new Error("The primary overlay requires a regular point.");
  const n = at.uphill, t = at.tangent;
  const onPlane = (across: number, along: number) => ({ x: p.x + n.x * across + t.x * along, y: p.y + n.y * across + t.y * along });
  // A named height override cannot accidentally accept Array.map's index as z.
  const projectLocal = (point: Point, height?: { readonly z: number }) => projectKpSurfaceContourPoint(authority, 0, { ...point, z: height?.z ?? gradientLocalHeight(model, point) });
  const corners = [onPlane(-.18, -.7), onPlane(1.12, -.7), onPlane(1.12, 1.1), onPlane(-.18, 1.1)];
  const projected = corners.map(point => projectLocal(point)), xs = projected.map(v => v.x), ys = projected.map(v => v.y);
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
  const scale = Math.min(350 / (right - left), 215 / (bottom - top));
  const magnified = (point: Point, height?: { readonly z: number }): Point => { const q = projectLocal(point, height); return { x: 260 + (q.x - (left + right) / 2) * scale, y: 166 + (q.y - (top + bottom) / 2) * scale }; };
  // Use the same camera's top-down endpoint, with one isotropic magnification.
  // A Euclidean unit circle must remain a circle, not a perspective ellipse.
  const topOrigin = projectKpSurfaceContourPoint(authority, 1, { ...p, z: 0 });
  const topUnit = projectKpSurfaceContourPoint(authority, 1, { x: p.x + 1, y: p.y, z: 0 });
  const topScale = 96 / Math.hypot(topUnit.x - topOrigin.x, topUnit.y - topOrigin.y);
  const topDown = (point: Point): Point => {
    const q = projectKpSurfaceContourPoint(authority, 1, { ...point, z: 0 });
    return { x: 260 + (q.x - topOrigin.x) * topScale, y: 158 + (q.y - topOrigin.y) * topScale };
  };
  const place = (circle: SVGCircleElement, point: Point) => { circle.setAttribute("cx", String(point.x)); circle.setAttribute("cy", String(point.y)); };
  return (state: ReturnType<typeof sampleGradientContour>) => {
    const strength = state.rampPresence;
    const screen = (point: Point, height?: { readonly z: number }): Point => {
      const base = projectKpSurfaceContourPoint(authority, state.stage.viewProgress, { ...point, z: model.level * (1 - state.stage.viewProgress) });
      const rampPoint = magnified(point, height), mapPoint = topDown(point);
      const local = { x: rampPoint.x + (mapPoint.x - rampPoint.x) * state.localViewProgress, y: rampPoint.y + (mapPoint.y - rampPoint.y) * state.localViewProgress };
      return { x: base.x + (local.x - base.x) * strength, y: base.y + (local.y - base.y) * strength };
    };
    context.style.opacity = String(1 - strength); context.setAttribute("aria-hidden", String(strength === 1));
    ramp.setAttribute("opacity", String(strength));
    plane.setAttribute("d", path(corners.map(point => screen(point))) + " Z");
    levels.setAttribute("d", [-.1, .2, .5, .8, 1.1].map(a => path([screen(onPlane(a, -.7)), screen(onPlane(a, 1.1))])).join(" "));
    // The overhead plot uses this space; withdraw the ramp caption before the
    // view changes instead of letting a label overlap the incoming geometry.
    caption.hidden = Boolean(state.attention) || strength === 0 || state.localViewProgress > 0;
    caption.style.opacity = String(strength);
    const origin = screen(p), d = state.direction, unitLength = 1;
    const offset = (v: Point) => ({ x: p.x + v.x * unitLength, y: p.y + v.y * unitLength });
    const tip = screen(offset(d)), across = screen(offset(state.components.acrossVector));
    const risePresence = strength * (1 - state.localViewProgress);
    rise.setAttribute("opacity", String(risePresence));
    riseLabel.hidden = risePresence < .99 || state.slope === 0;
    const floorTip = screen(offset(d), { z: model.level });
    baseline.setAttribute("d", path([origin, floorTip]));
    const riseTip = tip;
    riser.setAttribute("d", path([floorTip, riseTip]));
    riseLeader.setAttribute("d", path([{ x: 140, y: 170 }, { x: (floorTip.x + riseTip.x) / 2, y: (floorTip.y + riseTip.y) / 2 }]));
    // Fixed labels establish where to look before motion. Only their connectors
    // follow the actual projected components; no independent annotation clock.
    // The projection is introduced before the guided turn; its labels must
    // already be available while the reader learns how to read the diagram.
    const showComponents = state.componentPresence >= .99;
    annotations.hidden = !showComponents;
    leaders.setAttribute("visibility", showComponents ? "visible" : "hidden");
    for (const binding of annotationBindings) {
      const salience = !state.attention ? "normal" : state.attention.focusRefs.includes(binding.id) ? "focus" : "context";
      binding.owner.setAttribute("data-gradient-salience", salience);
      binding.annotation.setAttribute("data-gradient-salience", salience);
      binding.leader.setAttribute("data-gradient-salience", salience);
    }
    acrossLeader.setAttribute("d", path([{ x: 376, y: 209 }, { x: (origin.x + across.x) / 2, y: (origin.y + across.y) / 2 }]));
    alongLeader.setAttribute("d", path([{ x: 122, y: 113 }, { x: (across.x + tip.x) / 2, y: (across.y + tip.y) / 2 }]));
    // A zero-length component has no line to point at. Keep its definition,
    // but do not attach an apparent label to the coincident direction tip.
    alongLeader.setAttribute("visibility", state.components.along === 0 ? "hidden" : "inherit");
    place(originCircle, origin); place(travelerCircle, screen(state.point));
    candidatePath.setAttribute("d", [{ x: 1, y: 0 }, { x: 0, y: 1 }, n].map(v => arrow(origin, screen(offset(v)))).join(" "));
    candidates.setAttribute("opacity", String(state.candidatePresence));
    tangentPath.setAttribute("d", path([screen(onPlane(0, -.65)), screen(onPlane(0, .9))]));
    tangentGroup.setAttribute("opacity", String(state.tangentPresence));
    directionPath.setAttribute("d", arrow(origin, tip)); directionGroup.setAttribute("opacity", String(state.directionPresence));
    directionPath.style.stroke = state.componentPresence > .5 ? "var(--kp-sc-ink)" : "var(--kp-sc-accent)";
    acrossPath.setAttribute("d", path([origin, across])); alongPath.setAttribute("d", path([across, tip]));
    reachPath.setAttribute("d", path(Array.from({ length: 33 }, (_, i) => {
      const angle = i / 32 * Math.PI * 2; return screen(onPlane(Math.cos(angle), Math.sin(angle)));
    })));
    componentGroup.setAttribute("opacity", String(state.componentPresence));
    rightAngle.setAttribute("d", path([screen(onPlane(0, .14)), screen(onPlane(.14, .14)), screen(onPlane(.14, 0))]));
    rightAngle.setAttribute("opacity", String(state.rightAnglePresence));
  };
}
