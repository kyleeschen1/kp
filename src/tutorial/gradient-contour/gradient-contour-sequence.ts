import { createGradientContourModel, gradientContourPoint, gradientUnitDirection, gradientDirectionComponents } from "./gradient-contour-model.ts";
import { gradientComparisonReading, projectGradientComparison } from "./gradient-contour-attention.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { createKpSurfaceContourModel, createKpSurfaceContourScore, projectKpSurfaceContourBeat,
  interpolateKpSurfaceContourProjection, withKpSurfaceContourLevel } from "../kinetic-figure-surface-contour/kinetic-figure-surface-contour-model.ts";

// Discovery is deliberately one primary. Source-only visual variants are gated
// on its review; the fixed reference stage must not silently render other fields.
export const gradientContourModel = createGradientContourModel();
export const gradientContourReference = createKpSurfaceContourModel();
const referenceScore = createKpSurfaceContourScore(gradientContourReference);
const surface = withKpSurfaceContourLevel(projectKpSurfaceContourBeat(referenceScore, 2), gradientContourModel.level);
const map = withKpSurfaceContourLevel(projectKpSurfaceContourBeat(referenceScore, 5), gradientContourModel.level);
const math = (latex: string) => renderLatexToHtml(latex, { displayMode: false, output: "htmlAndMathml" });
const g = gradientContourModel.atPoint.gradient;
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
  { slug: "ramp", title: "Look at the local ramp", html: "<p>Very near the point, the surface is almost a <strong>flat ramp</strong>. The vertical segment shows the rise above your starting height. Sliding the tip along a dotted level line leaves that rise unchanged. Only travel across these lines adds height.</p>" },
  { slug: "components", title: "What part of your direction climbs?", html: `<p>${gradientComparisonReading.prepare.lead} ${gradientComparisonReading.prepare.body}</p>` },
  { slug: "across", title: "The longest across projection", html: `<p>${gradientComparisonReading.conclude.lead} ${gradientComparisonReading.conclude.body}</p>` },
  { slug: "uphill", title: "Why the partial derivatives point uphill", html: `<p>The coordinate slopes here are ${math(`f_x=${g.x}`)} and ${math(`f_y=${g.y}`)}. A tiny move gives ${math(`\\Delta f\\approx ${g.x}\\Delta x+${g.y}\\Delta y`)}. This is the dot product with ${math(`\\nabla f=(${g.x},${g.y})`)}: its length times your move’s projection onto it. That projection is largest when you point along the gradient—the uphill direction we found.</p>` }
]);
export const gradientContourCheckpoints = Object.freeze(gradientContourBeats.map((_, index) => index / (gradientContourBeats.length - 1)));
const unit = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const t = unit(x); return t * t * (3 - 2 * t); };

/** Every fact and paint position is sampled from one semantic playhead. No
 * accumulated orbit, direction state or completion callback survives a seek. */
export function sampleGradientContour(progress: number) {
  if (!Number.isFinite(progress)) throw new RangeError("Gradient playhead must be finite.");
  const position = unit(progress) * (gradientContourBeats.length - 1);
  const attention = projectGradientComparison(position);
  const visible = attention?.visibleBeat ?? Math.round(position);
  const visualPosition = attention?.visualPosition ?? position;
  const stage = interpolateKpSurfaceContourProjection({ from: surface, to: map, progress: unit(position) });
  const startAngle = Math.atan2(gradientContourModel.source.point.y * Math.sqrt(2), gradientContourModel.source.point.x);
  const point = gradientContourPoint(gradientContourModel, startAngle + Math.PI * 2 * ease(position - 1));
  const angle = Math.PI * .75 - Math.PI * .25 * ease(visualPosition - 3) - Math.PI * .25 * ease(visualPosition - 5);
  const direction = gradientUnitDirection(Math.cos(angle), Math.sin(angle));
  const slope = gradientContourModel.derivative(direction);
  const components = gradientDirectionComponents(gradientContourModel, direction);
  if (components.kind !== "regular") throw new Error("The primary explanation requires a regular point.");
  const rampPresence = ease(position - 3) * (1 - ease(position - 6));
  return Object.freeze({ position, visible, attention, stage, point, direction, slope: Math.abs(slope) < 1e-12 ? 0 : slope,
    height: gradientContourModel.height(point), tangentPresence: ease(position - 2), directionPresence: ease(position - 3),
    // Establish the overhead view before revealing its full comparison circle.
    // Otherwise the magnified ramp's foreshortened circle can leave the plot.
    localViewProgress: ease((position - 4) * 2),
    components, rampPresence, componentPresence: ease((position - 4.5) * 2) * (1 - ease(position - 6)),
    candidatePresence: 1 - ease(position), rightAnglePresence: ease(visualPosition - 5),
    fraction: `${visible + 1} / ${gradientContourBeats.length}`,
    accessiblePosition: `Step ${visible + 1} of ${gradientContourBeats.length}: ${gradientContourBeats[visible]!.title}` });
}
