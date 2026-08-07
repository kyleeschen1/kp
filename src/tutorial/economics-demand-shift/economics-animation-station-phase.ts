export type KpEconomicsStationPhase =
  | "approach"
  | "ready"
  | "scrub"
  | "settle"
  | "handoff";

export type KpEconomicsStationCueKind = "ordinary" | "motion";

export type KpEconomicsStationOwnership =
  | "incoming-passage"
  | "active-passage"
  | "motion-block"
  | "settled-passage"
  | "successor";

export interface KpEconomicsStationPhaseBoundaries {
  readonly approachStartPx: number;
  readonly readyStartPx: number;
  readonly scrubStartPx: number;
  readonly scrubEndPx: number;
  readonly handoffEndPx: number;
}

export interface KpEconomicsStationPhaseInput {
  readonly passageId: string;
  readonly cueKind: KpEconomicsStationCueKind;
  readonly anchorPx: number;
  readonly boundaries: KpEconomicsStationPhaseBoundaries;
  readonly beforeCheckpointId: string;
  readonly afterCheckpointId: string;
  readonly motionBlockId?: string | undefined;
  readonly projectedSemanticProgress?: number | undefined;
}

export interface KpEconomicsStationPhaseProjection {
  readonly phase: KpEconomicsStationPhase;
  readonly activePassageId: string | undefined;
  readonly activeMotionBlockId: string | undefined;
  readonly semanticProgress: number;
  readonly checkpointId: string;
  readonly ownership: KpEconomicsStationOwnership;
  readonly phaseProgress: number;
}

export interface KpEconomicsOrdinaryStationGeometry {
  readonly usableBottomPx: number;
  readonly cuePinStartY: number;
  readonly cuePinEndY: number;
  readonly cueExitEndY: number;
}

export interface KpEconomicsMotionStationGeometry extends
    KpEconomicsOrdinaryStationGeometry {
  readonly motionScrubEndY: number;
  readonly motionEndY: number;
}

/**
 * Keeps the ordinary reading hold tied to station geometry, never prose height.
 * The duplicated scrub boundary lets ordinary cues reuse the phase projector
 * without manufacturing a semantic motion interval.
 */
export function kpEconomicsOrdinaryStationPhaseBoundaries(
  geometry: KpEconomicsOrdinaryStationGeometry
): KpEconomicsStationPhaseBoundaries {
  return Object.freeze({
    approachStartPx: geometry.usableBottomPx,
    readyStartPx: geometry.cuePinStartY,
    scrubStartPx: geometry.cuePinEndY,
    scrubEndPx: geometry.cuePinEndY,
    handoffEndPx: geometry.cueExitEndY
  });
}

export function kpEconomicsMotionStationPhaseBoundaries(
  geometry: KpEconomicsMotionStationGeometry
): KpEconomicsStationPhaseBoundaries {
  return Object.freeze({
    approachStartPx: geometry.usableBottomPx,
    readyStartPx: geometry.cuePinStartY,
    scrubStartPx: geometry.cueExitEndY,
    scrubEndPx: geometry.motionScrubEndY,
    handoffEndPx: geometry.motionEndY
  });
}

/**
 * Projects station truth directly from one local anchor. It stays economics-
 * local until the stacked exemplar and a second projection prove the seam.
 */
export function projectKpEconomicsStationPhase(
  input: KpEconomicsStationPhaseInput
): KpEconomicsStationPhaseProjection {
  const boundaries = normalizeBoundaries(input.boundaries);
  const anchor = Number.isFinite(input.anchorPx)
    ? input.anchorPx
    : boundaries.approachStartPx;
  const motionCue = input.cueKind === "motion";
  const motionBlockId = motionCue && input.motionBlockId !== undefined &&
      input.motionBlockId.length > 0
    ? input.motionBlockId
    : undefined;

  if (anchor > boundaries.readyStartPx) {
    return projection({
      input,
      phase: "approach",
      ownership: "incoming-passage",
      semanticProgress: 0,
      phaseProgress: descendingProgress(
        anchor,
        boundaries.approachStartPx,
        boundaries.readyStartPx
      )
    });
  }

  if (anchor > boundaries.scrubStartPx) {
    return projection({
      input,
      phase: "ready",
      ownership: "active-passage",
      semanticProgress: 0,
      phaseProgress: descendingProgress(
        anchor,
        boundaries.readyStartPx,
        boundaries.scrubStartPx
      )
    });
  }

  if (motionCue && anchor > boundaries.scrubEndPx) {
    const semanticProgress = input.projectedSemanticProgress === undefined
      ? descendingProgress(
          anchor,
          boundaries.scrubStartPx,
          boundaries.scrubEndPx
        )
      : clamp(input.projectedSemanticProgress);
    return Object.freeze({
      phase: "scrub",
      activePassageId: input.passageId,
      activeMotionBlockId: motionBlockId,
      semanticProgress,
      checkpointId: semanticProgress >= 1
        ? input.afterCheckpointId
        : input.beforeCheckpointId,
      ownership: "motion-block",
      phaseProgress: semanticProgress
    });
  }

  if (anchor > boundaries.handoffEndPx) {
    const settleStart = motionCue
      ? boundaries.scrubEndPx
      : boundaries.scrubStartPx;
    return projection({
      input,
      phase: "settle",
      ownership: "settled-passage",
      semanticProgress: motionCue ? 1 : 0,
      phaseProgress: descendingProgress(
        anchor,
        settleStart,
        boundaries.handoffEndPx
      )
    });
  }

  return Object.freeze({
    phase: "handoff",
    activePassageId: undefined,
    activeMotionBlockId: undefined,
    semanticProgress: motionCue ? 1 : 0,
    checkpointId: motionCue
      ? input.afterCheckpointId
      : input.beforeCheckpointId,
    ownership: "successor",
    phaseProgress: 1
  });
}

function projection(input: {
  readonly input: KpEconomicsStationPhaseInput;
  readonly phase: Exclude<KpEconomicsStationPhase, "scrub" | "handoff">;
  readonly ownership: Exclude<
    KpEconomicsStationOwnership,
    "motion-block" | "successor"
  >;
  readonly semanticProgress: number;
  readonly phaseProgress: number;
}): KpEconomicsStationPhaseProjection {
  return Object.freeze({
    phase: input.phase,
    activePassageId: input.input.passageId,
    activeMotionBlockId: undefined,
    semanticProgress: input.semanticProgress,
    checkpointId: input.semanticProgress >= 1
      ? input.input.afterCheckpointId
      : input.input.beforeCheckpointId,
    ownership: input.ownership,
    phaseProgress: input.phaseProgress
  });
}

function normalizeBoundaries(
  input: KpEconomicsStationPhaseBoundaries
): KpEconomicsStationPhaseBoundaries {
  const approachStartPx = finite(input.approachStartPx, 1);
  const readyStartPx = Math.min(
    approachStartPx,
    finite(input.readyStartPx, approachStartPx)
  );
  const scrubStartPx = Math.min(
    readyStartPx,
    finite(input.scrubStartPx, readyStartPx)
  );
  const scrubEndPx = Math.min(
    scrubStartPx,
    finite(input.scrubEndPx, scrubStartPx)
  );
  const handoffEndPx = Math.min(
    scrubEndPx,
    finite(input.handoffEndPx, scrubEndPx)
  );
  return Object.freeze({
    approachStartPx,
    readyStartPx,
    scrubStartPx,
    scrubEndPx,
    handoffEndPx
  });
}

function descendingProgress(
  position: number,
  start: number,
  end: number
): number {
  if (start <= end) return position <= end ? 1 : 0;
  return clamp((start - position) / (start - end));
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
