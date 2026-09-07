import type { KpEquationLinearRearrangementKind } from "../animation/equation-linear-rearrangement-kind.ts";
import type {
  KpEquationCancellationPresentationRecipe,
  KpEquationContinuantPresentationRecipe,
  KpEquationZeroWitnessPresentationRecipe
} from "../animation/equation-presentation-policy.ts";
import type { KpSemanticBranchSchedule } from "../animation/branch-schedule.ts";
import { kpCounterOrbitCancellationTiming } from "../animation/counter-orbit-cancellation-timing.ts";

// Native and legacy renderers share this pure progress projection. Importing it
// must not load legacy token geometry, DOM measurement, or token rendering.
export interface KpEquationLinearRearrangementFrame {
  readonly kind: KpEquationLinearRearrangementKind;
  readonly reservationProgress: number;
  readonly persistentReflowProgress: number;
  readonly focalTransitProgress: number;
  readonly meetProgress: number;
  readonly collapseProgress: number;
  readonly resultRevealProgress: number;
  readonly recognitionProgress: number;
  readonly structureEntryProgress: number;
  readonly branchProgress: number;
  readonly branchTravelProgress: number;
  readonly branchSettlementProgress: number;
  readonly operatorDescentProgress: number;
  readonly branchScheduleId?: string | undefined;
  readonly scheduledBranchProgress?: Readonly<Record<string, number>> | undefined;
}

export function sampleKpEquationLinearRearrangementFrame(
  kind: KpEquationLinearRearrangementKind,
  progress: number,
  cancellationPresentationRecipe?:
    KpEquationCancellationPresentationRecipe | undefined,
  continuantPresentationRecipe?:
    KpEquationContinuantPresentationRecipe | undefined,
  zeroWitnessPresentationRecipe?:
    KpEquationZeroWitnessPresentationRecipe | undefined,
  branchSchedule?: KpSemanticBranchSchedule | undefined
): KpEquationLinearRearrangementFrame {
  const p = clamp01(progress);
  const reservationProgress = smooth(windowProgress(p, 0.1, 0.46));
  const reserveThenTransit = isSuccessorKind(kind) &&
    continuantPresentationRecipe === "reserve-then-transit-v1";
  const transitThenReflow = isSuccessorKind(kind) &&
    continuantPresentationRecipe === "transit-then-reflow-v1";
  // Without a +0 teaching beat, begin survivor compaction as the canceled ink
  // finishes retiring instead of concentrating it at the phase boundary.
  const counterOrbitReflowStart = zeroWitnessPresentationRecipe === "none"
    ? kpCounterOrbitCancellationTiming.retirementEnd
    : 0.94;
  const persistentReflowProgress = isCancellationKind(kind) &&
      cancellationPresentationRecipe === "counter-orbit-v1"
    ? smooth(windowProgress(p, counterOrbitReflowStart, 0.99))
    : transitThenReflow
      ? smooth(windowProgress(p, 0.82, 0.94))
    : reserveThenTransit
      ? smooth(windowProgress(p, 0.08, 0.26))
      : reservationProgress;
  const scheduledBranchProgress = kind === "balanced-introduction" && branchSchedule !== undefined
    ? branchSchedule.sample(windowProgress(p, 0.38, 0.7))
    : undefined;
  return {
    kind,
    reservationProgress,
    persistentReflowProgress,
    focalTransitProgress: smooth(windowProgress(p, reserveThenTransit ? 0.32 : 0.28, 0.7)),
    meetProgress: smooth(windowProgress(
      p,
      kpCounterOrbitCancellationTiming.meetStart,
      kpCounterOrbitCancellationTiming.contactAt
    )),
    collapseProgress: smooth(windowProgress(p, 0.62, 0.8)),
    resultRevealProgress: smooth(windowProgress(p, 0.68, 0.88)),
    recognitionProgress: smooth(windowProgress(p, 0.76, 0.92)),
    structureEntryProgress: kind === "divide-both-sides"
      ? smooth(windowProgress(p, 0.34, 0.72))
      : 0,
    branchProgress: kind === "split-fraction-sum"
      ? smooth(windowProgress(p, 0.2, 0.28))
      : 0,
    branchTravelProgress: kind === "split-fraction-sum"
      ? smooth(windowProgress(p, 0.2, 0.62))
      : kind === "merge-fractions"
        ? smooth(windowProgress(p, 0.22, 0.76))
        : 0,
    branchSettlementProgress: kind === "merge-fractions"
      ? smooth(windowProgress(p, 0.84, 0.98))
      : 0,
    operatorDescentProgress: kind === "split-fraction-sum"
      ? smooth(windowProgress(p, 0.54, 0.82))
      : kind === "merge-fractions"
        ? smooth(windowProgress(p, 0.22, 0.72))
        : 0,
    ...(branchSchedule === undefined
      ? {}
      : {
          branchScheduleId: branchSchedule.id,
          ...(scheduledBranchProgress === undefined ? {} : { scheduledBranchProgress })
        })
  };
}

export function isCancellationKind(kind: KpEquationLinearRearrangementKind): boolean {
  return kind === "cancel-additive-inverses" || kind === "cancel-multiplicative-inverses";
}

export function isSuccessorKind(kind: KpEquationLinearRearrangementKind): boolean {
  return kind === "simplify-constant-difference" ||
    kind === "simplify-constant-quotient" ||
    kind === "simplify-constant-product";
}

export function windowProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

export function smooth(progress: number): number {
  return progress * progress * progress *
    (progress * (progress * 6 - 15) + 10);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
