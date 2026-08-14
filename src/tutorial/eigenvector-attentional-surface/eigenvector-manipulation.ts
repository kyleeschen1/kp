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
