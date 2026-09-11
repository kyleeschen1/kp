import { createGradientContourModel, gradientContourPoint, gradientUnitDirection, gradientDirectionComponents } from "./gradient-contour-model.ts";
import { projectGradientComparison } from "./gradient-contour-attention.ts";
import { gradientContourBeats, type GradientEvidence } from "./gradient-contour-story.ts";
import { createKpSurfaceContourModel, createKpSurfaceContourScore, projectKpSurfaceContourBeat,
  interpolateKpSurfaceContourProjection, withKpSurfaceContourLevel } from "../kinetic-figure-surface-contour/kinetic-figure-surface-contour-model.ts";
export { gradientContourBeats, gradientBeatIndex, gradientComparisonBounds } from "./gradient-contour-story.ts";

// The fixed primary still uses its checked field and canonical reference stage.
// Source-only variants remain gated on review of this explanation.
export const gradientContourModel = createGradientContourModel();
export const gradientContourReference = createKpSurfaceContourModel();
const referenceScore = createKpSurfaceContourScore(gradientContourReference);
const surface = withKpSurfaceContourLevel(projectKpSurfaceContourBeat(referenceScore, 2), gradientContourModel.level);
const map = withKpSurfaceContourLevel(projectKpSurfaceContourBeat(referenceScore, 5), gradientContourModel.level);
export const gradientContourBrief = Object.freeze({
  readerContext: "A reader who understands position, height, signed arithmetic and small moves; partial derivatives, projection and contours are introduced here.",
  motivatingGap: "Height cannot tell you which direction increases it fastest; local coordinate slopes predict the effect of a move.",
  question: "What is a gradient, and why does it point uphill?",
  successCriterion: "Explain the local change rule and why equal-length directions maximize it when aligned with the gradient.",
  bridge: "Coordinate contributions add on the local ramp; the gradient packages them. A fixed-length move has greatest signed projection when aligned. Contour perpendicularity follows afterward.",
  evidenceBeats: ["east", "north", "linear-change", "gradient", "projection", "across", "general-projection", "tangent"],
  payoff: "The gradient encodes the direction and greatest local rate, not a height or commanded displacement.",
  boundary: "Local first-order approximation, equal horizontal distance units, not finite-step endpoint height or physiological effort."
});
export const gradientContourCheckpoints = Object.freeze(gradientContourBeats.map((_, index) => index / (gradientContourBeats.length - 1)));
const unit = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const t = unit(x); return t * t * (3 - 2 * t); };

type EvidencePose = Readonly<{ view: number; angle: number; ramp: number; overhead: number; components: number; tangent: number; direction: number; candidates: number; rightAngle: number }>;
const hillside: EvidencePose = { view: 0, angle: Math.PI / 2, ramp: 0, overhead: 0, components: 0, tangent: 0, direction: 0, candidates: 1, rightAngle: 0 };
const ramp: EvidencePose = { ...hillside, ramp: 1, direction: 1, candidates: 0 };
const projection: EvidencePose = { ...ramp, overhead: 1, components: 1 };
const uphill: EvidencePose = { ...projection, angle: Math.PI / 4 };
const contour: EvidencePose = { ...uphill, view: 1, ramp: 0, components: 0 };
// Evidence names select existing renderer poses. Prose-only beats hold a pose
// instead of replaying unrelated camera/contour motions to fill a new stop.
const poses = {
  hillside, ramp, "gradient-ramp": { ...ramp, angle: Math.PI / 4 }, "level-ramp": { ...ramp, angle: Math.PI * .75 },
  projection, uphill, contour, follow: contour,
  tangent: { ...contour, tangent: 1, rightAngle: 1 }
} satisfies Record<GradientEvidence, EvidencePose>;

/** State is a pure projection of this score, never accumulated transit history.
 * Beat insertion cannot silently move the comparison's playback interval. */
export function sampleGradientContour(progress: number) {
  if (!Number.isFinite(progress)) throw new RangeError("Gradient playhead must be finite.");
  const position = unit(progress) * (gradientContourBeats.length - 1);
  const attention = projectGradientComparison(position);
  const visible = attention?.visibleBeat ?? Math.round(position);
  const visualPosition = attention?.visualPosition ?? position;
  const index = Math.min(Math.floor(visualPosition), gradientContourBeats.length - 2);
  const fromBeat = gradientContourBeats[index]!, toBeat = gradientContourBeats[index + 1]!;
  const from = poses[fromBeat.evidence], to = poses[toBeat.evidence];
  const phase = visualPosition - index, t = ease(phase);
  const mix = (key: keyof EvidencePose) => from[key] + (to[key] - from[key]) * t;
  const stage = interpolateKpSurfaceContourProjection({ from: surface, to: map, progress: mix("view") });
  const startAngle = Math.atan2(gradientContourModel.source.point.y * Math.sqrt(2), gradientContourModel.source.point.x);
  const orbit = toBeat.slug === "follow" ? t : 0;
  const point = gradientContourPoint(gradientContourModel, startAngle + Math.PI * 2 * orbit);
  const direction = gradientUnitDirection(Math.cos(mix("angle")), Math.sin(mix("angle")));
  const slope = gradientContourModel.derivative(direction);
  const components = gradientDirectionComponents(gradientContourModel, direction);
  if (components.kind !== "regular") throw new Error("The primary explanation requires a regular point.");
  // Reuse the reviewed overhead-before-circle ordering, including reverse.
  const viewChanges = from.overhead !== to.overhead;
  const localViewProgress = viewChanges ? ease(phase * 2) : mix("overhead");
  const componentPresence = viewChanges ? ease((phase - .5) * 2) : mix("components");
  return Object.freeze({ position, visible, attention, stage, point, direction, slope: Math.abs(slope) < 1e-12 ? 0 : slope,
    height: gradientContourModel.height(point), tangentPresence: mix("tangent"), directionPresence: mix("direction"),
    localViewProgress, components, rampPresence: mix("ramp"), componentPresence,
    candidatePresence: mix("candidates"), rightAnglePresence: mix("rightAngle"),
    fraction: String(visible + 1) + " / " + gradientContourBeats.length,
    accessiblePosition: "Step " + (visible + 1) + " of " + gradientContourBeats.length + ": " + gradientContourBeats[visible]!.title });
}
