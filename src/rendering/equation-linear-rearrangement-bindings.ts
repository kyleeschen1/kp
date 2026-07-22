import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  createKpSuccessorSynthesisBindingFromMetadata,
  type KpSuccessorSynthesisBinding
} from "../animation/successor-synthesis.ts";
import {
  kpEquationLinearRearrangementKindForTransformType,
  type KpEquationLinearRearrangementKind
} from "./equation-linear-rearrangement.ts";
import {
  createKpBalancedBranchScheduling,
  type KpBalancedBranchScheduling
} from "../animation/equation-balanced-branch-scheduling.ts";

export interface KpEquationLinearRearrangementBinding {
  readonly transformationId: string;
  readonly kind: KpEquationLinearRearrangementKind;
  readonly branchOperation?: KpBalancedBranchScheduling["branchOperation"] | undefined;
  readonly branchSchedules?: KpBalancedBranchScheduling["branchSchedules"] | undefined;
  readonly branchSchedule?: KpBalancedBranchScheduling["branchSchedule"] | undefined;
  readonly successorSynthesisBinding?: KpSuccessorSynthesisBinding | undefined;
}

export function createKpEquationLinearRearrangementBindings(
  animation: KpAnimationAsset
): readonly KpEquationLinearRearrangementBinding[] {
  return animation.transformations.flatMap((transformation) => {
    const kind = kpEquationLinearRearrangementKindForTransformType(
      transformation.transformType
    );
    if (kind === undefined) return [];
    const causalRecord = transformation.correspondenceMap?.records.find(
      (record) => record.relation !== "identity"
    );
    if (causalRecord === undefined) {
      throw new Error(
        `Linear rearrangement ${transformation.id} requires a causal correspondence.`
      );
    }
    const selectedBranchStrategy = animation.metadata?.[
      "equationBranchPresentationStrategy"
    ];
    const branchScheduling = kind === "balanced-introduction"
      ? createKpBalancedBranchScheduling({
          transformationId: transformation.id,
          authorityId: `kp.algebra.${kebabCase(transformation.transformType)}`,
          targetSelectorIds: causalRecord.targetSelectorIds,
          selectedStrategy: selectedBranchStrategy
        })
      : undefined;
    return [{
      transformationId: transformation.id,
      kind,
      ...(branchScheduling === undefined ? {} : branchScheduling),
      ...(isSuccessorKind(kind)
        ? {
            successorSynthesisBinding:
              createKpSuccessorSynthesisBindingFromMetadata({
                bundle: animation.bundle,
                transformation,
                correspondence: causalRecord,
                operationId: `kp.algebra.${kind}`
              })
          }
        : {})
    }];
  });
}

function isSuccessorKind(kind: KpEquationLinearRearrangementKind): boolean {
  return kind === "simplify-constant-difference" ||
    kind === "simplify-constant-quotient" ||
    kind === "simplify-constant-product";
}

function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
