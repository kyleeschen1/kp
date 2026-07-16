export interface KpMaterialContinuityQualityBudgets {
  readonly maximumBoundaryDisplacementPx: number;
  readonly maximumBoundaryVelocityDeltaPx: number;
  readonly minimumAttention: number;
  readonly maximumBundleSeparationPx: number;
  readonly maximumResidualTransformPx: number;
  readonly maximumStructuralScaleSkew: number;
}

export interface KpMaterialContinuityBoundarySample {
  readonly id: string;
  readonly stableOwnershipRequired: boolean;
  readonly beforeOwnerId: string;
  readonly afterOwnerId: string;
  readonly before: {
    readonly x: number;
    readonly y: number;
    readonly velocityX: number;
    readonly velocityY: number;
    readonly attention: number;
  };
  readonly after: {
    readonly x: number;
    readonly y: number;
    readonly velocityX: number;
    readonly velocityY: number;
    readonly attention: number;
  };
}

export interface KpMaterialReconciliationSample {
  readonly id: string;
  readonly sourceBundlePoint: { readonly x: number; readonly y: number };
  readonly targetBundlePoint: { readonly x: number; readonly y: number };
  readonly residualTransformPx: number;
  readonly structuralScaleAlong: number;
  readonly structuralScaleAcross: number;
}

export type KpMaterialContinuityViolation =
  | {
      readonly lawId: "material-continuity.stable-owner";
      readonly sampleId: string;
      readonly actual: string;
      readonly limit: "same-owner";
    }
  | {
      readonly lawId:
        | "material-continuity.boundary-displacement"
        | "material-continuity.boundary-velocity"
        | "material-continuity.attention-floor"
        | "material-continuity.bundle-convergence"
        | "material-continuity.native-settlement"
        | "material-continuity.structural-deformation";
      readonly sampleId: string;
      readonly actual: number;
      readonly limit: number;
    };

export const kpDefaultMaterialContinuityQualityBudgets:
  KpMaterialContinuityQualityBudgets = {
    maximumBoundaryDisplacementPx: 0.75,
    maximumBoundaryVelocityDeltaPx: 1.5,
    minimumAttention: 0.08,
    maximumBundleSeparationPx: 1,
    maximumResidualTransformPx: 0.25,
    maximumStructuralScaleSkew: 0.015
  };

export function evaluateKpMaterialContinuityQuality(input: {
  readonly boundaries?: readonly KpMaterialContinuityBoundarySample[];
  readonly reconciliations?: readonly KpMaterialReconciliationSample[];
  readonly budgets?: KpMaterialContinuityQualityBudgets;
}): readonly KpMaterialContinuityViolation[] {
  const budgets = input.budgets ?? kpDefaultMaterialContinuityQualityBudgets;
  const violations: KpMaterialContinuityViolation[] = [];
  for (const sample of input.boundaries ?? []) {
    if (
      sample.stableOwnershipRequired &&
      sample.beforeOwnerId !== sample.afterOwnerId
    ) {
      violations.push({
        lawId: "material-continuity.stable-owner",
        sampleId: sample.id,
        actual: `${sample.beforeOwnerId}->${sample.afterOwnerId}`,
        limit: "same-owner"
      });
    }
    pushNumericViolation(
      violations,
      "material-continuity.boundary-displacement",
      sample.id,
      distance(sample.before, sample.after),
      budgets.maximumBoundaryDisplacementPx,
      "maximum"
    );
    pushNumericViolation(
      violations,
      "material-continuity.boundary-velocity",
      sample.id,
      distance(
        { x: sample.before.velocityX, y: sample.before.velocityY },
        { x: sample.after.velocityX, y: sample.after.velocityY }
      ),
      budgets.maximumBoundaryVelocityDeltaPx,
      "maximum"
    );
    pushNumericViolation(
      violations,
      "material-continuity.attention-floor",
      sample.id,
      Math.min(sample.before.attention, sample.after.attention),
      budgets.minimumAttention,
      "minimum"
    );
  }
  for (const sample of input.reconciliations ?? []) {
    pushNumericViolation(
      violations,
      "material-continuity.bundle-convergence",
      sample.id,
      distance(sample.sourceBundlePoint, sample.targetBundlePoint),
      budgets.maximumBundleSeparationPx,
      "maximum"
    );
    pushNumericViolation(
      violations,
      "material-continuity.native-settlement",
      sample.id,
      Math.abs(sample.residualTransformPx),
      budgets.maximumResidualTransformPx,
      "maximum"
    );
    pushNumericViolation(
      violations,
      "material-continuity.structural-deformation",
      sample.id,
      Math.abs(sample.structuralScaleAlong - sample.structuralScaleAcross),
      budgets.maximumStructuralScaleSkew,
      "maximum"
    );
  }
  return violations;
}

function pushNumericViolation(
  violations: KpMaterialContinuityViolation[],
  lawId: Exclude<
    KpMaterialContinuityViolation["lawId"],
    "material-continuity.stable-owner"
  >,
  sampleId: string,
  actual: number,
  limit: number,
  comparison: "maximum" | "minimum"
): void {
  const failed = comparison === "maximum" ? actual > limit : actual < limit;
  if (failed) violations.push({ lawId, sampleId, actual, limit });
}

function distance(
  left: { readonly x: number; readonly y: number },
  right: { readonly x: number; readonly y: number }
): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

