import type {
  EasingName,
  EquationMotionTrack,
  MotionPose
} from "./equation-motion-plan.ts";

export type SemanticBeatId =
  | "layout-shift"
  | "introduced-token-enter"
  | "cancel-meet"
  | "cancel-collapse"
  | "post-cancel-layout-shift"
  | "final-simplify-meet"
  | "final-simplify-collapse"
  | "final-simplify-reveal";

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
  beatCount: 20,
  beats: [
    {
      id: "layout-shift",
      startBeat: 0,
      endBeat: 8,
      easing: "ease-in-out",
      summary: "Persisted tokens shift before introduced tokens appear."
    },
    {
      id: "introduced-token-enter",
      startBeat: 8,
      endBeat: 20,
      easing: "ease-out",
      summary: "New tokens fade and scale in after layout room exists."
    },
    {
      id: "cancel-meet",
      startBeat: 0,
      endBeat: 8,
      easing: "ease-in-out",
      summary: "Cancelled tokens move toward the shared midpoint."
    },
    {
      id: "cancel-collapse",
      startBeat: 8,
      endBeat: 10,
      easing: "ease-out",
      summary: "Cancelled tokens dissolve after meeting."
    },
    {
      id: "post-cancel-layout-shift",
      startBeat: 14,
      endBeat: 20,
      easing: "ease-in-out",
      summary: "Remaining tokens settle after cancellation."
    },
    {
      id: "final-simplify-meet",
      startBeat: 0,
      endBeat: 8,
      easing: "ease-in-out",
      summary: "Source tokens for a simplification move toward the midpoint."
    },
    {
      id: "final-simplify-collapse",
      startBeat: 8,
      endBeat: 10,
      easing: "ease-out",
      summary: "Source tokens shrink and fade at the midpoint."
    },
    {
      id: "final-simplify-reveal",
      startBeat: 10,
      endBeat: 14,
      easing: "ease-in-out",
      summary: "The simplified target token grows from the shared midpoint."
    }
  ]
});

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
