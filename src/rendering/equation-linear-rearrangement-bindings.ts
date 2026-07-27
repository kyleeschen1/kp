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

export function createKpEquationSuccessorSynthesisBindings(input: {
  readonly animation: KpAnimationAsset;
  readonly transformation: KpSemanticTransformation;
}): readonly KpSuccessorSynthesisBinding[] {
  const selectors = new Map(
    input.animation.bundle.objects.flatMap(
      (object) => object.selectors
    ).map((selector) => [selector.id, selector])
  );
  const kind = kpEquationLinearRearrangementKindForTransformType(
    input.transformation.transformType
  );
  const supplementalSourceSelectorIds =
    input.transformation.correspondenceMap?.records
      .filter(({ relation }) => relation === "removal")
      .flatMap(({ sourceSelectorIds }) => sourceSelectorIds);
  const successorCorrespondences =
    input.transformation.correspondenceMap?.records.filter(
      (correspondence) =>
        correspondence.targetSelectorIds.length > 0 &&
        correspondence.targetSelectorIds.every((selectorId) =>
          selectors.get(selectorId)?.metadata?.["successorTarget"] === true
        )
    ) ?? [];
  return successorCorrespondences.flatMap(
    (correspondence) => {
      const targetOperationIds = correspondence.targetSelectorIds.map(
        (selectorId) =>
          selectors.get(selectorId)?.metadata?.["successorOperationId"]
      ).filter((value): value is string => typeof value === "string");
      const operationId =
        targetOperationIds[0] ??
        (kind !== undefined && isSuccessorKind(kind)
          ? `kp.algebra.${kind}`
          : `kp.algebra.${kebabCase(input.transformation.transformType)}`);
      if (
        targetOperationIds.some((candidate) => candidate !== operationId)
      ) {
        throw new Error(
          `Successor relation ${correspondence.id} has conflicting operation authority.`
        );
      }
      const scopedSupplementalSourceSelectorIds =
        supplementalSourceSelectorIds?.filter((selectorId) => {
          const selector = selectors.get(selectorId);
          const contribution =
            selector?.metadata?.["successorContribution"];
          if (contribution !== "material-input" && contribution !== "catalyst") {
            return false;
          }
          const supplementalOperationId =
            selector?.metadata?.["successorOperationId"];
          if (
            successorCorrespondences.length > 1 &&
            typeof supplementalOperationId !== "string"
          ) {
            throw new Error(
              `Successor source ${selectorId} needs operation authority because ${input.transformation.id} contains multiple syntheses.`
            );
          }
          return supplementalOperationId === undefined ||
            supplementalOperationId === operationId;
        });
      return [createKpSuccessorSynthesisBindingFromMetadata({
        bundle: input.animation.bundle,
        transformation: input.transformation,
        correspondence,
        operationId,
        supplementalSourceSelectorIds: scopedSupplementalSourceSelectorIds
      })];
    }
  );
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
  const successorSynthesisBindings =
    createKpEquationSuccessorSynthesisBindings(input);
  if (isSuccessorKind(kind) && successorSynthesisBindings.length !== 1) {
    throw new Error(
      `Linear successor ${transformation.id} requires exactly one synthesis binding.`
    );
  }
  return {
    transformationId: transformation.id,
    kind,
    ...(branchScheduling === undefined ? {} : branchScheduling),
    ...(isSuccessorKind(kind)
      ? {
          successorSynthesisBinding: successorSynthesisBindings[0]
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
