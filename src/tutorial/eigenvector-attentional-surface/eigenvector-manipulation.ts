import {
  applyKpEigenvectorMatrix,
  kpEigenvectorAttentionalFixture,
  scaleKpEigenvectorPoint,
  type KpEigenvectorPoint
} from "./eigenvector-math.ts";

export interface KpEigenvectorScalarManipulationState {
  readonly coefficient: number;
  readonly input: KpEigenvectorPoint;
  readonly output: KpEigenvectorPoint;
  readonly isInEigenspace: true;
  readonly isEigenvector: boolean;
  readonly semanticObjectIds: readonly [
    "eigenvector-demo/vector/v",
    "eigenvector-demo/eigenspace/lambda-3"
  ];
  readonly explanation: string;
}

export const kpEigenvectorScalarControl = {
  minimum: -2.5,
  maximum: 2.5,
  step: 0.25,
  initial: 1
} as const;

export interface KpEigenvectorScalarMotionFrame {
  readonly progress: number;
  readonly output: KpEigenvectorPoint;
  readonly settled: boolean;
}

export function projectKpEigenvectorScalarManipulation(
  requestedCoefficient: number
): KpEigenvectorScalarManipulationState {
  const coefficient = clampAndSnapCoefficient(requestedCoefficient);
  const fixture = kpEigenvectorAttentionalFixture;
  const input = scaleKpEigenvectorPoint(
    fixture.persistentVector.coordinates,
    coefficient
  );
  const output = applyKpEigenvectorMatrix(
    fixture.transformation.matrix,
    input
  );
  const isEigenvector = coefficient !== 0;
  return {
    coefficient,
    input,
    output,
    isInEigenspace: true,
    isEigenvector,
    semanticObjectIds: [
      "eigenvector-demo/vector/v",
      "eigenvector-demo/eigenspace/lambda-3"
    ],
    explanation: isEigenvector
      ? "Every nonzero multiple stays on this line and is an eigenvector."
      : "Zero belongs to the eigenspace, but zero is not an eigenvector."
  };
}

/** A retargeted slider begins at the currently painted point, never a stale step. */
export function sampleKpEigenvectorScalarTransition(input: {
  readonly from: KpEigenvectorPoint;
  readonly to: KpEigenvectorPoint;
  readonly progress: number;
  readonly reducedMotion?: boolean;
}): KpEigenvectorScalarMotionFrame {
  const requested = clamp01(input.progress);
  const progress = input.reducedMotion === true && requested > 0
    ? 1
    : requested;
  const eased = progress * progress * (3 - 2 * progress);
  return {
    progress,
    output: progress === 0
      ? input.from
      : progress === 1
        ? input.to
        : [
            stableNumber(input.from[0] + (input.to[0] - input.from[0]) * eased),
            stableNumber(input.from[1] + (input.to[1] - input.from[1]) * eased)
          ],
    settled: progress === 1
  };
}

function clampAndSnapCoefficient(requested: number): number {
  if (!Number.isFinite(requested)) {
    return kpEigenvectorScalarControl.initial;
  }
  const clamped = Math.min(
    kpEigenvectorScalarControl.maximum,
    Math.max(kpEigenvectorScalarControl.minimum, requested)
  );
  const snapped = Math.round(clamped / kpEigenvectorScalarControl.step) *
    kpEigenvectorScalarControl.step;
  return Object.is(snapped, -0) ? 0 : snapped;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function stableNumber(value: number): number {
  return Number(value.toFixed(12));
}
