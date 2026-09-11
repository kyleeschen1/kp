import type { KpLessonAttentionPhase, KpLessonAttentionPlan } from "../../reader/document/public-api.ts";
import { projectKpReaderAttention } from "../../reader/runtime/attention-projector.ts";

// These are the existing overlay's semantic owners, not a second scene registry.
export const gradientComparisonTargets = [
  "gradient.unit-direction", "gradient.across-component",
  "gradient.along-component", "gradient.equal-horizontal-reach"
] as const;
type ComparisonTarget = typeof gradientComparisonTargets[number];
type ComparisonPhase = Omit<KpLessonAttentionPhase, "focusRefs"> & {
  readonly focusRefs: readonly ComparisonTarget[];
};

export const gradientComparisonReading = Object.freeze({
  prepare: Object.freeze({
    lead: "Across the level lines adds rise. Sideways adds none on this local ramp.",
    body: "Keep the horizontal step length fixed. Can more of it point across the level lines?"
  }),
  conclude: Object.freeze({
    lead: "Now the whole direction contributes to climbing.",
    body: "No equal-length direction can have a larger across part. Since sideways adds no rise, straight across gives the greatest local rise."
  })
});
const viewingCue = "Watch the across part of the step.";
const phase = (kind: KpLessonAttentionPhase["kind"], start: number, end: number): ComparisonPhase => ({
  id: `gradient.comparison.${kind}`, kind, beatId: kind === "inspect" ? "across" : "components",
  checkpointId: kind === "inspect" ? "across" : "components",
  startProgressPermille: start, endProgressPermille: end,
  cue: kind === "inspect" ? "All across: greatest local rise." : viewingCue,
  focusRefs: gradientComparisonTargets
});

// One bounded passage uses the existing four-phase projector. Stops 5 and 6
// remain learner-paced; these fractions only phrase the user-started transit.
// They are provisional presentation policy, not a universal reading timer.
export const gradientComparisonPlan: KpLessonAttentionPlan = Object.freeze({
  kind: "phased-attention-v1",
  phases: Object.freeze([
    phase("orient", 0, 100), phase("act", 100, 850),
    phase("settle", 850, 925), phase("inspect", 925, 1000)
  ])
});

export function projectGradientComparison(position: number) {
  if (!Number.isFinite(position)) throw new Error("Comparison position must be finite.");
  if (position < 5 || position > 6) return undefined;
  const projection = projectKpReaderAttention({
    attention: gradientComparisonPlan, progressPermille: (position - 5) * 1000
  });
  if (!projection) throw new Error("The comparison requires its authored attention plan.");
  const concluded = projection.phaseKind === "inspect";
  return Object.freeze({
    ...projection,
    visualPosition: 5 + projection.visualProgressPermille / 1000,
    // New interpretation is only available after the motion has settled.
    reading: concluded ? gradientComparisonReading.conclude : gradientComparisonReading.prepare,
    readingKind: concluded ? "conclude" as const : "prepare" as const,
    visibleBeat: concluded ? 6 : 5
  });
}
