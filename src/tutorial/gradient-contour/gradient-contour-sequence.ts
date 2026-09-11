import { createGradientContourModel, gradientContourPoint, gradientUnitDirection, gradientDirectionComponents } from "./gradient-contour-model.ts";
import { createKpSurfaceContourModel, createKpSurfaceContourScore, projectKpSurfaceContourBeat,
  interpolateKpSurfaceContourProjection, withKpSurfaceContourLevel } from "../kinetic-figure-surface-contour/kinetic-figure-surface-contour-model.ts";

// Discovery is deliberately one primary. Source-only visual variants are gated
// on its review; the fixed reference stage must not silently render other fields.
export const gradientContourModel = createGradientContourModel();
export const gradientContourReference = createKpSurfaceContourModel();
const referenceScore = createKpSurfaceContourScore(gradientContourReference);
const surface = withKpSurfaceContourLevel(projectKpSurfaceContourBeat(referenceScore, 2), gradientContourModel.level);
const map = withKpSurfaceContourLevel(projectKpSurfaceContourBeat(referenceScore, 5), gradientContourModel.level);
// Editorial obligations remain inspectable beside the score, not a new runtime
// or universal motivation schema. Semantic evidence is checked separately.
export const gradientContourBrief = Object.freeze({
  readerContext: "A reader who can interpret height and a direction, but does not yet know what a gradient is for.",
  motivatingGap: "Choose a direction that gains the most height for the same horizontal distance; the surface alone makes comparison difficult.",
  question: "How can a contour map tell you which way climbs fastest?",
  successCriterion: "Greatest instantaneous height increase among Euclidean unit horizontal directions at a regular point.",
  bridge: "The local tangent plane has zero rise along the contour tangent. Decompose an equal-length direction; only its across-contour part contributes rise.",
  evidenceBeats: ["follow", "tangent", "ramp", "components", "across"],
  payoff: "Choose the uphill normal; the gradient names this direction and its greatest rate.",
  boundary: "Local first-order approximation, not finite-step endpoint height or physiological effort."
});
export const gradientContourBeats = Object.freeze([
  { slug: "height", title: "Choose a direction", html: "<p>You’re standing on a hillside. <strong>Which direction climbs fastest?</strong> Compare the same small horizontal distance in each direction—not walking effort. The surface shows heights; a map will help us choose.</p>" },
  { slug: "contour", title: "One contour, one height", html: "<p>Look straight down. The highlighted contour connects positions with the <strong>same height</strong>. The point stays on that same contour as the view turns.</p>" },
  { slug: "follow", title: "Travel without climbing", html: "<p>Follow the contour around and return to the point. Your position changes, but your <strong>height stays at 1.50</strong>. The curve bends to keep you level.</p>" },
  { slug: "tangent", title: "One locally level direction", html: "<p>At this point, the contour’s direction is its <strong>tangent</strong>. It gives zero instantaneous rise. A straight tangent step eventually leaves the curved contour; we are comparing the very start of a step.</p>" },
  { slug: "ramp", title: "Look at the local ramp", html: "<p>Very near the point, replace the curved surface with its <strong>local flat approximation</strong>. On this ramp, the dotted lines are level. Sideways travel changes position without changing height; across them, the ramp rises.</p>" },
  { slug: "components", title: "What part of your direction climbs?", html: "<p>A diagonal direction has two parts: <strong>across</strong> the level lines and <strong>along</strong> them. The dashed sideways part adds no rise. The endpoint has exactly the height gained by the across part alone—in this local model.</p>" },
  { slug: "across", title: "Spend the whole direction on climbing", html: "<p>Keep the horizontal direction’s length fixed and turn it straight across. The sideways part shrinks to zero; the across part becomes the whole direction. <strong>No direction of that length can have a longer across part</strong>, so this gives the greatest local rise.</p>" },
  { slug: "uphill", title: "Now name it: the gradient", html: "<p>Our choice is the <strong>uphill normal</strong>, perpendicular to the contour. The gradient, ∇f = (2, 2), points this way; its length, 2.83, is the greatest instantaneous rise per unit horizontal distance. The map now tells us how to choose.</p>" }
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
  const angle = Math.PI * .75 - Math.PI * .25 * ease(position - 4) - Math.PI * .25 * ease(position - 5);
  const direction = gradientUnitDirection(Math.cos(angle), Math.sin(angle));
  const slope = gradientContourModel.derivative(direction);
  const components = gradientDirectionComponents(gradientContourModel, direction);
  if (components.kind !== "regular") throw new Error("The primary explanation requires a regular point.");
  const rampPresence = ease(position - 3) * (1 - ease(position - 6));
  return Object.freeze({ position, visible, stage, point, direction, slope: Math.abs(slope) < 1e-12 ? 0 : slope,
    height: gradientContourModel.height(point), tangentPresence: ease(position - 2), directionPresence: ease(position - 4),
    components, rampPresence, componentPresence: ease(position - 4) * (1 - ease(position - 6)),
    candidatePresence: 1 - ease(position), rightAnglePresence: ease(position - 5),
    fraction: `${visible + 1} / ${gradientContourBeats.length}`,
    accessiblePosition: `Step ${visible + 1} of ${gradientContourBeats.length}: ${gradientContourBeats[visible]!.title}` });
}
