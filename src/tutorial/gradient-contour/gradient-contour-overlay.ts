import { projectKpSurfaceContourPoint, type KpSurfaceContourStageAuthority } from "../kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";
import { gradientLocalHeight } from "./gradient-contour-model.ts";
import { gradientContourModel as model, type sampleGradientContour } from "./gradient-contour-sequence.ts";

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
export function mountGradientContourOverlay(plot: HTMLElement, authority: KpSurfaceContourStageAuthority) {
  const context = document.createElement("div"); context.className = "gradient-stage-context";
  context.append(...plot.childNodes); plot.append(context);
  plot.insertAdjacentHTML("beforeend", `<svg class="gradient-overlay" viewBox="0 0 520 300" aria-hidden="true">
    <g data-gradient-ramp data-kp-semantic-entity="gradient.local-linearization"><path class="gradient-ramp-plane"/><path class="gradient-ramp-levels"/>
      <text x="260" y="23" text-anchor="middle" class="gradient-ramp-caption">Magnified local flat approximation</text></g>
    <g data-gradient-candidates data-kp-semantic-entity="gradient.candidate-directions"><path/></g>
    <g data-gradient-tangent data-kp-semantic-entity="gradient.tangent"><path class="gradient-tangent"/><path class="gradient-right-angle"/></g>
    <g data-gradient-direction data-kp-semantic-entity="gradient.unit-direction"><path class="gradient-direction"/></g>
    <g data-gradient-components><path class="gradient-equal-reach" data-kp-semantic-entity="gradient.equal-horizontal-reach"/><path class="gradient-across" data-kp-semantic-entity="gradient.across-component"/><path class="gradient-along" data-kp-semantic-entity="gradient.along-component"/></g>
    <circle class="gradient-origin" r="5" data-kp-semantic-entity="gradient.origin"/>
    <circle class="gradient-point" r="4.5" data-kp-semantic-entity="gradient.traveler"/>
  </svg>`);
  const get = <T extends Element>(selector: string) => plot.querySelector<T>(selector)!;
  const ramp = get<SVGGElement>("[data-gradient-ramp]"), plane = get<SVGPathElement>(".gradient-ramp-plane"), levels = get<SVGPathElement>(".gradient-ramp-levels");
  const candidates = get<SVGGElement>("[data-gradient-candidates]"), candidatePath = candidates.querySelector("path")!;
  const tangentGroup = get<SVGGElement>("[data-gradient-tangent]"), tangentPath = get<SVGPathElement>(".gradient-tangent"), rightAngle = get<SVGPathElement>(".gradient-right-angle");
  const directionGroup = get<SVGGElement>("[data-gradient-direction]"), directionPath = get<SVGPathElement>(".gradient-direction");
  const componentGroup = get<SVGGElement>("[data-gradient-components]"), acrossPath = get<SVGPathElement>(".gradient-across"), alongPath = get<SVGPathElement>(".gradient-along");
  const reachPath = get<SVGPathElement>(".gradient-equal-reach"), caption = get<SVGTextElement>(".gradient-ramp-caption");
  const originCircle = get<SVGCircleElement>(".gradient-origin"), travelerCircle = get<SVGCircleElement>(".gradient-point");
  const p = model.source.point, at = model.atPoint;
  if (at.kind !== "regular") throw new Error("The primary overlay requires a regular point.");
  const n = at.uphill, t = at.tangent;
  const onPlane = (across: number, along: number) => ({ x: p.x + n.x * across + t.x * along, y: p.y + n.y * across + t.y * along });
  const projectLocal = (point: Point) => projectKpSurfaceContourPoint(authority, 0, { ...point, z: gradientLocalHeight(model, point) });
  const corners = [onPlane(-.18, -.7), onPlane(1.12, -.7), onPlane(1.12, 1.1), onPlane(-.18, 1.1)];
  const projected = corners.map(projectLocal), xs = projected.map(v => v.x), ys = projected.map(v => v.y);
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
  const scale = Math.min(350 / (right - left), 215 / (bottom - top));
  const magnified = (point: Point): Point => { const q = projectLocal(point); return { x: 260 + (q.x - (left + right) / 2) * scale, y: 166 + (q.y - (top + bottom) / 2) * scale }; };
  plane.setAttribute("d", path(corners.map(magnified)) + " Z");
  levels.setAttribute("d", [-.1, .2, .5, .8, 1.1].map(a => path([magnified(onPlane(a, -.7)), magnified(onPlane(a, 1.1))])).join(" "));
  const place = (circle: SVGCircleElement, point: Point) => { circle.setAttribute("cx", String(point.x)); circle.setAttribute("cy", String(point.y)); };
  return (state: ReturnType<typeof sampleGradientContour>) => {
    const strength = state.rampPresence;
    const screen = (point: Point): Point => {
      const base = projectKpSurfaceContourPoint(authority, state.stage.viewProgress, { ...point, z: model.level * (1 - state.stage.viewProgress) });
      const local = magnified(point);
      return { x: base.x + (local.x - base.x) * strength, y: base.y + (local.y - base.y) * strength };
    };
    context.style.opacity = String(1 - strength); context.setAttribute("aria-hidden", String(strength === 1));
    ramp.setAttribute("opacity", String(strength));
    caption.textContent = state.componentPresence > .5 ? "Arc: equal horizontal distance" : "Magnified local flat approximation";
    const origin = screen(p), d = state.direction, unitLength = 1;
    const offset = (v: Point) => ({ x: p.x + v.x * unitLength, y: p.y + v.y * unitLength });
    const tip = screen(offset(d)), across = screen(offset(state.components.acrossVector));
    place(originCircle, origin); place(travelerCircle, screen(state.point));
    candidatePath.setAttribute("d", [{ x: 1, y: 0 }, { x: 0, y: 1 }, n].map(v => arrow(origin, screen(offset(v)))).join(" "));
    candidates.setAttribute("opacity", String(state.candidatePresence));
    tangentPath.setAttribute("d", path([screen(onPlane(0, -.65)), screen(onPlane(0, .9))]));
    tangentGroup.setAttribute("opacity", String(state.tangentPresence));
    directionPath.setAttribute("d", arrow(origin, tip)); directionGroup.setAttribute("opacity", String(state.directionPresence));
    directionPath.style.stroke = state.componentPresence > .5 ? "var(--kp-sc-ink)" : "var(--kp-sc-accent)";
    acrossPath.setAttribute("d", path([origin, across])); alongPath.setAttribute("d", path([across, tip]));
    reachPath.setAttribute("d", path(Array.from({ length: 33 }, (_, i) => {
      const angle = i / 32 * Math.PI / 2; return screen(onPlane(Math.cos(angle), Math.sin(angle)));
    })));
    componentGroup.setAttribute("opacity", String(state.componentPresence));
    rightAngle.setAttribute("d", path([screen(onPlane(0, .14)), screen(onPlane(.14, .14)), screen(onPlane(.14, 0))]));
    rightAngle.setAttribute("opacity", String(state.rightAnglePresence));
  };
}
