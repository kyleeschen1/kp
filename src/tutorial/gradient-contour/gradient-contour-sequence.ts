import { createGradientContourModel, gradientContourPoint, gradientUnitDirection } from "./gradient-contour-model.ts";
import { createKpSurfaceContourModel, createKpSurfaceContourScore, projectKpSurfaceContourBeat,
  interpolateKpSurfaceContourProjection, withKpSurfaceContourLevel } from "../kinetic-figure-surface-contour/kinetic-figure-surface-contour-model.ts";

// Discovery is deliberately one primary. Source-only visual variants are gated
// on its review; the fixed reference stage must not silently render other fields.
export const gradientContourModel = createGradientContourModel();
export const gradientContourReference = createKpSurfaceContourModel();
const referenceScore = createKpSurfaceContourScore(gradientContourReference);
const surface = withKpSurfaceContourLevel(projectKpSurfaceContourBeat(referenceScore, 2), gradientContourModel.level);
const map = withKpSurfaceContourLevel(projectKpSurfaceContourBeat(referenceScore, 5), gradientContourModel.level);
export const gradientContourBeats = Object.freeze([
  { slug: "height", title: "A point has a height", html: "<p>Here is a point on a landscape. Its height is <strong>1.50</strong>. Which way could you move to climb fastest?</p>" },
  { slug: "contour", title: "One contour, one height", html: "<p>Look straight down. The highlighted contour connects positions with the <strong>same height</strong>. The point stays on that same contour as the view turns.</p>" },
  { slug: "follow", title: "Travel without climbing", html: "<p>Follow the contour around and return to the point. Your position changes, but your <strong>height stays at 1.50</strong>. The curve bends to keep you level.</p>" },
  { slug: "tangent", title: "Flat to first order", html: "<p>The tangent points along the contour at this point. Its <strong>instantaneous rise is zero</strong>. A straight step of length 0.20 still rises by 0.06: tangent is not the same as staying on the curved contour.</p>" },
  { slug: "downhill", title: "Compare equal directions", html: "<p>Turn a <strong>unit direction</strong> at the same point. The meter shows instantaneous rise per unit distance. A negative rate means downhill; arrow length stays fixed so the comparison is fair.</p>" },
  { slug: "uphill", title: "The gradient crosses the contour", html: "<p>The greatest rate is <strong>2.83</strong>, in the direction of the gradient, ∇f = (2, 2). It is perpendicular to the tangent: along the contour gives zero first-order change; directly across it gives the greatest increase.</p>" }
]);
export const gradientContourCheckpoints = Object.freeze(gradientContourBeats.map((_, index) => index / (gradientContourBeats.length - 1)));
const unit = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const t = unit(x); return t * t * (3 - 2 * t); };

/** Every fact and paint position is sampled from one semantic playhead. No
 * accumulated orbit, direction state or completion callback survives a seek. */
export function sampleGradientContour(progress: number) {
  if (!Number.isFinite(progress)) throw new RangeError("Gradient playhead must be finite.");
  const position = unit(progress) * (gradientContourBeats.length - 1);
  const visible = Math.round(position);
  const stage = interpolateKpSurfaceContourProjection({ from: surface, to: map, progress: unit(position) });
  const startAngle = Math.atan2(gradientContourModel.source.point.y * Math.sqrt(2), gradientContourModel.source.point.x);
  const point = gradientContourPoint(gradientContourModel, startAngle + Math.PI * 2 * ease(position - 1));
  const angle = Math.PI * .75 + Math.PI * .5 * ease(position - 3) + Math.PI * ease(position - 4);
  const direction = gradientUnitDirection(Math.cos(angle), Math.sin(angle));
  const slope = gradientContourModel.derivative(direction);
  return Object.freeze({ position, visible, stage, point, direction, slope: Math.abs(slope) < 1e-12 ? 0 : slope,
    height: gradientContourModel.height(point), tangentPresence: ease(position - 2), directionPresence: ease(position - 3),
    fraction: `${visible + 1} / ${gradientContourBeats.length}`,
    accessiblePosition: `Step ${visible + 1} of ${gradientContourBeats.length}: ${gradientContourBeats[visible]!.title}` });
}
