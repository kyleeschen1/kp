import type { KpLessonAttentionPhase, KpLessonAttentionPlan } from "../../reader/document/public-api.ts";
import { projectKpReaderAttention } from "../../reader/runtime/attention-projector.ts";
import { gradientComparisonBounds, gradientComparisonReading, type GradientComparisonReading } from "./gradient-contour-story.ts";
export { gradientComparisonReading } from "./gradient-contour-story.ts";

// These are the existing overlay's semantic owners, not a second scene registry.
export const gradientComparisonTargets = [
  "gradient.unit-direction", "gradient.across-component",
  "gradient.along-component", "gradient.equal-horizontal-reach"
] as const;
type ComparisonTarget = typeof gradientComparisonTargets[number];
type ComparisonPhase = Omit<KpLessonAttentionPhase, "focusRefs"> & {
  readonly focusRefs: readonly ComparisonTarget[];
};

export const gradientComparisonAnnotations = Object.freeze({
  "gradient.across-component": { label: "Across", detail: "adds rise" },
  "gradient.along-component": { label: "Along", detail: "no rise" }
} satisfies Partial<Record<ComparisonTarget, { readonly label: string; readonly detail: string }>>);
// Direction-neutral wording also describes reverse playback and free scrubbing.
const viewingCue = "Watch the across part as the direction turns.";
const instructionRoles = {
  orient: "Before the move", act: "Watch", settle: "Watch", inspect: "What this shows"
} as const satisfies Record<KpLessonAttentionPhase["kind"], string>;
const phase = (kind: KpLessonAttentionPhase["kind"], start: number, end: number): ComparisonPhase => ({
  id: `gradient.comparison.${kind}`, kind, beatId: kind === "inspect" ? "across" : "components",
  checkpointId: kind === "inspect" ? "across" : "components",
  startProgressPermille: start, endProgressPermille: end,
  cue: kind === "inspect" ? "All across: greatest local rise." : viewingCue,
  // Name the perceptual subject, not every object that remains on screen.
  // Direction, along-part and fixed reach support the across-part comparison.
  focusRefs: ["gradient.across-component"]
});

// One bounded passage uses the existing four-phase projector. Its named stops
// remain learner-paced; these fractions only phrase the user-started transit.
// They are provisional presentation policy, not a universal reading timer.
export const gradientComparisonPlan: KpLessonAttentionPlan = Object.freeze({
  kind: "phased-attention-v1",
  phases: Object.freeze([
    phase("orient", 0, 100), phase("act", 100, 850),
    phase("settle", 850, 925), phase("inspect", 925, 1000)
  ])
});

export function projectGradientComparison(position: number, reading: GradientComparisonReading = gradientComparisonReading) {
  if (!Number.isFinite(position)) throw new Error("Comparison position must be finite.");
  const { start, end } = gradientComparisonBounds;
  if (position < start || position > end) return undefined;
  const projection = projectKpReaderAttention({
    attention: gradientComparisonPlan, progressPermille: (position - start) / (end - start) * 1000
  });
  if (!projection) throw new Error("The comparison requires its authored attention plan.");
  const concluded = projection.phaseKind === "inspect";
  return Object.freeze({
    ...projection,
    instructionRole: instructionRoles[projection.phaseKind],
    visualPosition: start + (end - start) * projection.visualProgressPermille / 1000,
    // New interpretation is only available after the motion has settled.
    reading: concluded ? reading.conclude : reading.prepare,
    readingKind: concluded ? "conclude" as const : "prepare" as const,
    visibleBeat: concluded ? end : start
  });
}
