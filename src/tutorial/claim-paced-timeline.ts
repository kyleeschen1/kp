import { normalizeAnimationProgress } from "../animation/kernel.ts";

export interface KpTutorialClaimPace {
  readonly id: string;
  readonly claimId: string;
  readonly checkpointId: string;
  readonly units: number;
}

export interface KpTutorialClaimSpan extends KpTutorialClaimPace {
  readonly startProgress: number;
  readonly endProgress: number;
  readonly startBeat: number;
  readonly endBeat: number;
  readonly startMs: number;
  readonly endMs: number;
}

export interface KpTutorialClaimPacedTimeline {
  readonly id: string;
  readonly clockId: string;
  readonly durationMs: number;
  readonly beatCount: number;
  readonly spans: readonly KpTutorialClaimSpan[];
}

export interface KpTutorialClaimPacedFrame {
  readonly timelineId: string;
  readonly clockId: string;
  readonly progress: number;
  readonly beat: number;
  readonly elapsedMs: number;
  readonly activeClaimId: string;
  readonly activeCheckpointId: string;
  readonly localProgress: number;
}

export function compileKpTutorialClaimPacedTimeline(input: {
  readonly id: string;
  readonly clockId: string;
  readonly millisecondsPerUnit: number;
  readonly beatsPerUnit: number;
  readonly paces: readonly KpTutorialClaimPace[];
}): KpTutorialClaimPacedTimeline {
  if (
    input.paces.length === 0 ||
    !Number.isFinite(input.millisecondsPerUnit) ||
    input.millisecondsPerUnit <= 0 ||
    !Number.isFinite(input.beatsPerUnit) ||
    input.beatsPerUnit <= 0 ||
    input.paces.some((pace) => !Number.isFinite(pace.units) || pace.units <= 0)
  ) {
    throw new Error("Claim-paced timelines require positive authored units.");
  }

  const totalUnits = input.paces.reduce((sum, pace) => sum + pace.units, 0);
  const durationMs = totalUnits * input.millisecondsPerUnit;
  const beatCount = totalUnits * input.beatsPerUnit;
  let elapsedUnits = 0;
  const spans = input.paces.map((pace) => {
    const startUnits = elapsedUnits;
    elapsedUnits += pace.units;
    return {
      ...pace,
      startProgress: startUnits / totalUnits,
      endProgress: elapsedUnits / totalUnits,
      startBeat: startUnits * input.beatsPerUnit,
      endBeat: elapsedUnits * input.beatsPerUnit,
      startMs: startUnits * input.millisecondsPerUnit,
      endMs: elapsedUnits * input.millisecondsPerUnit
    };
  });

  return {
    id: input.id,
    clockId: input.clockId,
    durationMs,
    beatCount,
    spans
  };
}

export function sampleKpTutorialClaimPacedTimeline(
  timeline: KpTutorialClaimPacedTimeline,
  progress: number
): KpTutorialClaimPacedFrame {
  const clamped = normalizeAnimationProgress(progress);
  const span =
    timeline.spans.find(
      (candidate, index) =>
        clamped >= candidate.startProgress &&
        (clamped < candidate.endProgress || index === timeline.spans.length - 1)
    ) ?? timeline.spans[timeline.spans.length - 1];
  if (span === undefined) {
    throw new Error(`Claim-paced timeline ${timeline.id} has no spans.`);
  }
  const spanLength = span.endProgress - span.startProgress;

  return {
    timelineId: timeline.id,
    clockId: timeline.clockId,
    progress: clamped,
    beat: clamped * timeline.beatCount,
    elapsedMs: clamped * timeline.durationMs,
    activeClaimId: span.claimId,
    activeCheckpointId: span.checkpointId,
    localProgress:
      spanLength === 0
        ? 1
        : normalizeAnimationProgress((clamped - span.startProgress) / spanLength)
  };
}
