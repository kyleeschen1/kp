import {
  findKpAnimationTransformationPhaseCohort,
  type KpAnimationTransformationPhaseCohort
} from "../../animation/transformation-phase-cohorts.ts";
import type { KpAnimationAsset } from "../../animation/asset.ts";
import {
  sampleKpReaderAnimationFrame,
  type KpReaderAnimationFrame,
  type KpReaderClockSample
} from "../runtime/public-api.ts";

export interface KpReaderCanonicalEquationFramePlan {
  readonly animationProgress: number;
  readonly runtimeFrame: KpReaderAnimationFrame;
  readonly cohort: KpAnimationTransformationPhaseCohort;
  readonly transitionId: string;
  readonly phaseProgress: number;
}

/**
 * Hosts choose where progress comes from, but canonical semantic frame
 * selection is shared. Rewind changes traversal, not the forward semantic
 * meaning of a sampled point on the animation timeline.
 */
export function planKpReaderCanonicalEquationFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly clock: KpReaderClockSample;
  readonly animationProgress: number;
  readonly cohorts: readonly KpAnimationTransformationPhaseCohort[];
}): KpReaderCanonicalEquationFramePlan | undefined {
  requireUnitProgress(input.animationProgress);
  if (input.cohorts.length === 0) {
    throw new Error("Canonical equation frame planning requires phase cohorts.");
  }
  const runtimeFrame = sampleKpReaderAnimationFrame({
    animation: input.animation,
    clock: {
      ...input.clock,
      progress: input.animationProgress,
      progressPermille: Math.round(input.animationProgress * 1_000),
      direction: "forward"
    }
  });
  const cohort = findKpAnimationTransformationPhaseCohort({
    cohorts: input.cohorts,
    transformationIds: runtimeFrame.activeTransformationIds
  });
  if (cohort === undefined) return undefined;
  return Object.freeze({
    animationProgress: input.animationProgress,
    runtimeFrame,
    cohort,
    transitionId: cohort.id,
    phaseProgress: localPhaseProgress(
      input.animationProgress,
      runtimeFrame.phase.phaseIndex,
      input.cohorts.length
    )
  });
}

function localPhaseProgress(
  progress: number,
  phaseIndex: number,
  phaseCount: number
): number {
  if (progress === 1) return 1;
  return Math.max(0, Math.min(1, progress * phaseCount - phaseIndex));
}

function requireUnitProgress(progress: number): void {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new Error(
      "Canonical equation animation progress must be between 0 and 1."
    );
  }
}
