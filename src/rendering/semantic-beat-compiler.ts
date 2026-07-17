import type {
  EasingName,
  EquationMotionTrack,
  MotionPose
} from "./equation-motion-plan.ts";
import type { EquationVisualMotifPhaseId } from "./visual-motif.ts";
import { kpCopyFanOutPhaseIds } from "../animation/copy-fan-out-choreography.ts";
import { kpSubstitutionPhaseIds } from "../animation/substitution-choreography.ts";
import { kpDerivativePowerPhaseIds } from "../animation/derivative-power-choreography.ts";

export type SemanticBeatId = EquationVisualMotifPhaseId;

export interface SemanticBeatDefinition {
  readonly id: SemanticBeatId;
  readonly startBeat: number;
  readonly endBeat: number;
  readonly easing: EasingName;
  readonly summary: string;
}

export interface SemanticBeatTimelineInput {
  readonly id: string;
  readonly beatCount: number;
  readonly beats: readonly SemanticBeatDefinition[];
}

export interface SemanticBeatTimeline {
  readonly id: string;
  readonly beatCount: number;
  readonly beats: readonly SemanticBeatDefinition[];
}

export interface SemanticBeatMotionTrackInput {
  readonly tokenId: string;
  readonly timeline: SemanticBeatTimeline;
  readonly beatId: SemanticBeatId;
  readonly lifecycle: EquationMotionTrack["lifecycle"];
  readonly visualLifecycle: EquationMotionTrack["visualLifecycle"];
  readonly from: MotionPose;
  readonly to: MotionPose;
}

export const linearEquationDemoBeatTimeline = compileSemanticBeatTimeline({
  id: "linear-equation-demo",
  beatCount: 50,
  beats: [
    {
      id: "artifact-enter",
      startBeat: 25,
      endBeat: 50,
      easing: "ease-out",
      summary: "Visual artifacts enter after their semantic hosts make room."
    },
    {
      id: "artifact-exit",
      startBeat: 0,
      endBeat: 25,
      easing: "ease-out",
      summary: "Visual artifacts exit before replacement artifacts settle."
    },
    {
      id: "layout-shift",
      startBeat: 0,
      endBeat: 25,
      easing: "ease-in-out",
      summary: "Persisted tokens shift before introduced tokens appear."
    },
    {
      id: "introduced-token-enter",
      startBeat: 25,
      endBeat: 50,
      easing: "ease-out",
      summary: "New tokens fade and scale in after layout room exists."
    },
    {
      id: "relation-flip",
      startBeat: 0,
      endBeat: 50,
      easing: "ease-in-out",
      summary: "An inequality relation turns through the full negative-multiplication transition."
    },
    {
      id: "cancel-meet",
      startBeat: 0,
      endBeat: 20,
      easing: "ease-in-out",
      summary: "Cancelled tokens move toward the shared midpoint."
    },
    {
      id: "cancel-collapse",
      startBeat: 20,
      endBeat: 25,
      easing: "ease-out",
      summary: "Cancelled tokens dissolve after meeting."
    },
    {
      id: "post-cancel-layout-shift",
      startBeat: 30,
      endBeat: 50,
      easing: "ease-in-out",
      summary: "Remaining tokens settle after cancellation."
    },
    {
      id: "final-simplify-meet",
      startBeat: 0,
      endBeat: 20,
      easing: "ease-in-out",
      summary: "Source tokens for a simplification move toward the midpoint."
    },
    {
      id: "final-simplify-collapse",
      startBeat: 20,
      endBeat: 25,
      easing: "ease-out",
      summary: "Source tokens shrink and fade at the midpoint."
    },
    {
      id: "final-simplify-reveal",
      startBeat: 25,
      endBeat: 35,
      easing: "ease-in-out",
      summary: "The simplified target token grows from the shared midpoint."
    },
    {
      id: "dot-pair-focus",
      startBeat: 0,
      endBeat: 12,
      easing: "ease-in-out",
      summary: "An index-matched component pair receives causal focus."
    },
    {
      id: "dot-product-form",
      startBeat: 10,
      endBeat: 30,
      easing: "ease-in-out",
      summary: "The focused pair forms a persistent component product."
    },
    {
      id: "dot-accumulate",
      startBeat: 25,
      endBeat: 42,
      easing: "ease-in-out",
      summary: "Completed component products persist in the running sum."
    },
    {
      id: "dot-result-reveal",
      startBeat: 39,
      endBeat: 50,
      easing: "ease-in-out",
      summary: "The accumulated products hand off to the scalar result."
    },
    {
      id: "radical-fragment-focus",
      startBeat: 0,
      endBeat: 9,
      easing: "ease-in-out",
      summary: "Fractional-exponent fragments receive focus before they leave their source positions."
    },
    {
      id: "radical-corner-gather",
      startBeat: 7,
      endBeat: 34,
      easing: "ease-in-out",
      summary: "Independent exponent fragments travel on staggered arcs into an opposite-corner region."
    },
    {
      id: "radical-representation-handoff",
      startBeat: 30,
      endBeat: 43,
      easing: "ease-in-out",
      summary: "Gathered exponent material hands off to the radical hook and overbar representations."
    },
    {
      id: "radical-native-settle",
      startBeat: 41,
      endBeat: 50,
      easing: "ease-in-out",
      summary: "Semantic radical fragments settle into the native KaTeX radical without a whole-expression scale."
    },
    {
      id: "unwrap-artifact-exit",
      startBeat: 0,
      endBeat: 20,
      easing: "ease-out",
      summary: "Unwrapped delimiters exit before the unwrapped token settles."
    },
    {
      id: "wrap-artifact-enter",
      startBeat: 20,
      endBeat: 50,
      easing: "ease-out",
      summary: "Wrapper artifacts enter around an already moving token."
    },
    {
      id: "wrapped-token-shift",
      startBeat: 0,
      endBeat: 20,
      easing: "ease-in-out",
      summary: "Wrapped or unwrapped tokens move before delimiter artifacts finish."
    },
    ...kpCopyFanOutPhaseIds.map((id) => ({
      id,
      startBeat: copyFanOutBeatRange(id)[0],
      endBeat: copyFanOutBeatRange(id)[1],
      easing: "ease-in-out" as const,
      summary: `Copy/fan-out ${id.replaceAll("-", " ")} phase.`
    })),
    ...kpSubstitutionPhaseIds.map((id) => ({
      id,
      startBeat: substitutionBeatRange(id)[0],
      endBeat: substitutionBeatRange(id)[1],
      easing: "ease-in-out" as const,
      summary: `Substitution ${id.replaceAll("-", " ")} phase.`
    })),
    ...kpDerivativePowerPhaseIds.map((id) => ({
      id,
      startBeat: derivativePowerBeatRange(id)[0],
      endBeat: derivativePowerBeatRange(id)[1],
      easing: "ease-in-out" as const,
      summary: `Derivative power ${id.replaceAll("-", " ")} phase.`
    }))
  ]
});

function copyFanOutBeatRange(
  id: typeof kpCopyFanOutPhaseIds[number]
): readonly [number, number] {
  switch (id) {
    case "contract-source": return [0, 10];
    case "branch-descendants": return [10, 18];
    case "transit-descendants": return [17, 39];
    case "arrive-descendants": return [36, 46];
    case "settle-descendants": return [45, 50];
  }
}

function substitutionBeatRange(
  id: typeof kpSubstitutionPhaseIds[number]
): readonly [number, number] {
  switch (id) {
    case "establish-value-source": return [0, 10];
    case "transmit-substitution-value": return [7, 34];
    case "replace-substitution-occupant": return [31, 42];
    case "settle-substitution-replacement": return [40, 50];
  }
}

function derivativePowerBeatRange(
  id: typeof kpDerivativePowerPhaseIds[number]
): readonly [number, number] {
  switch (id) {
    case "orient-exponent": return [0, 9];
    case "reflow-continuants": return [6, 17];
    case "branch-exponent": return [14, 22];
    case "drop-coefficient": return [18, 36];
    case "decrement-successor": return [22, 38];
    case "settle-derivative": return [37, 46];
    case "release-derivative-focus": return [44, 50];
  }
}

export function compileSemanticBeatTimeline(
  input: SemanticBeatTimelineInput
): SemanticBeatTimeline {
  assertPositiveBeatCount(input);
  assertUniqueBeatIds(input.beats);

  for (const beat of input.beats) {
    assertValidBeat(input, beat);
  }

  return {
    id: input.id,
    beatCount: input.beatCount,
    beats: input.beats.map((beat) => ({ ...beat }))
  };
}

export function findSemanticBeat(
  timeline: SemanticBeatTimeline,
  beatId: SemanticBeatId
): SemanticBeatDefinition {
  const beat = timeline.beats.find((candidate) => candidate.id === beatId);

  if (beat === undefined) {
    throw new Error(`Unknown semantic beat ${beatId} in ${timeline.id}.`);
  }

  return beat;
}

export function progressBetweenSemanticBeat(
  timeline: SemanticBeatTimeline,
  progress: number,
  beatId: SemanticBeatId
): number {
  const beat = findSemanticBeat(timeline, beatId);
  const currentBeat = normalizeProgress(progress) * timeline.beatCount;

  return clampNumber(
    (currentBeat - beat.startBeat) / (beat.endBeat - beat.startBeat),
    0,
    1
  );
}

export function easedProgressBetweenSemanticBeat(
  timeline: SemanticBeatTimeline,
  progress: number,
  beatId: SemanticBeatId
): number {
  const beat = findSemanticBeat(timeline, beatId);

  return applyBeatEasing(
    beat.easing,
    progressBetweenSemanticBeat(timeline, progress, beatId)
  );
}

export function createSemanticBeatMotionTrack(
  input: SemanticBeatMotionTrackInput
): EquationMotionTrack {
  const beat = findSemanticBeat(input.timeline, input.beatId);

  return {
    tokenId: input.tokenId,
    lifecycle: input.lifecycle,
    visualLifecycle: input.visualLifecycle,
    start: beat.startBeat / input.timeline.beatCount,
    end: beat.endBeat / input.timeline.beatCount,
    easing: beat.easing,
    from: { ...input.from },
    to: { ...input.to }
  };
}

export function applyBeatEasing(
  easing: EasingName,
  progress: number
): number {
  switch (easing) {
    case "linear":
      return progress;
    case "ease-in":
      return progress * progress;
    case "ease-out":
      return 1 - (1 - progress) * (1 - progress);
    case "ease-in-out":
      return (1 - Math.cos(Math.PI * progress)) / 2;
    default:
      return assertNever(easing);
  }
}

function assertPositiveBeatCount(input: SemanticBeatTimelineInput): void {
  if (!Number.isFinite(input.beatCount) || input.beatCount <= 0) {
    throw new Error(`Semantic beat timeline ${input.id} beatCount must be positive.`);
  }
}

function assertUniqueBeatIds(beats: readonly SemanticBeatDefinition[]): void {
  const ids = new Set<SemanticBeatId>();

  for (const beat of beats) {
    if (ids.has(beat.id)) {
      throw new Error(`Duplicate semantic beat id ${beat.id}.`);
    }

    ids.add(beat.id);
  }
}

function assertValidBeat(
  timeline: SemanticBeatTimelineInput,
  beat: SemanticBeatDefinition
): void {
  if (
    !Number.isFinite(beat.startBeat) ||
    !Number.isFinite(beat.endBeat) ||
    beat.startBeat < 0 ||
    beat.endBeat > timeline.beatCount ||
    beat.endBeat <= beat.startBeat
  ) {
    throw new Error(
      `Semantic beat ${beat.id} must satisfy 0 <= start < end <= beatCount.`
    );
  }
}

function normalizeProgress(progress: number): number {
  if (Number.isNaN(progress)) {
    return 0;
  }

  return clampNumber(progress, 0, 1);
}

function clampNumber(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled semantic beat easing: ${value}`);
}
