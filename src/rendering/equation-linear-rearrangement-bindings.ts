import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import {
  createKpSuccessorSynthesisBindingFromMetadata,
  type KpSuccessorSynthesisBinding
} from "../animation/successor-synthesis.ts";
import {
  kpEquationLinearRearrangementKindForTransformType,
  type KpEquationLinearRearrangementKind
} from "../animation/equation-linear-rearrangement-kind.ts";
import {
  createKpBalancedBranchScheduling,
  type KpBalancedBranchScheduling
} from "../animation/equation-balanced-branch-scheduling.ts";
import {
  resolveKpEquationPresentationBranchStrategy
} from "../animation/equation-presentation-profile-decoder.ts";

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
    const binding = createKpEquationLinearRearrangementBinding({
      animation,
      transformation
    });
    return binding === undefined ? [] : [binding];
  });
}

export function createKpEquationLinearRearrangementBinding(input: {
  readonly animation: KpAnimationAsset;
  readonly transformation: KpSemanticTransformation;
}): KpEquationLinearRearrangementBinding | undefined {
  const { animation, transformation } = input;
  const kind = kpEquationLinearRearrangementKindForTransformType(
    transformation.transformType
  );
  if (kind === undefined) return undefined;
  const causalRecord = transformation.correspondenceMap?.records.find(
    (record) => record.relation !== "identity"
  );
  if (causalRecord === undefined) {
    throw new Error(
      `Linear rearrangement ${transformation.id} requires a causal correspondence.`
    );
  }
  const selectedBranchStrategy =
    resolveKpEquationPresentationBranchStrategy(animation);
  const branchScheduling = kind === "balanced-introduction"
    ? createKpBalancedBranchScheduling({
        transformationId: transformation.id,
        authorityId: `kp.algebra.${kebabCase(transformation.transformType)}`,
        targetSelectorIds: causalRecord.targetSelectorIds,
        selectedStrategy: selectedBranchStrategy
      })
    : undefined;
  return {
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
              operationId: `kp.algebra.${kind}`,
              supplementalSourceSelectorIds:
                transformation.correspondenceMap?.records
                  .filter(({ relation }) => relation === "removal")
                  .flatMap(({ sourceSelectorIds }) => sourceSelectorIds)
            })
        }
      : {})
  };
}

function isSuccessorKind(kind: KpEquationLinearRearrangementKind): boolean {
  return kind === "simplify-constant-difference" ||
    kind === "simplify-constant-quotient" ||
    kind === "simplify-constant-product";
}

function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
