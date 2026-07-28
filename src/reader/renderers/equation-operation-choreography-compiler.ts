import type { KpAnimationAsset } from "../../animation/asset.ts";
import type {
  KpCounterOrbitCancellationChoreography,
  KpSynchronizedBalancedIntroductionChoreography
} from "../../animation/equation-operation-choreography.ts";
import type {
  KpRegisteredEquationOperationChoreography
} from "../../animation/balanced-introduction-presentation-plan.ts";
import type {
  EquationVisualMotifKind
} from "../../animation/motifs/visual-motif.ts";
import type {
  KpSemanticTransformation
} from "../../semantic/asset-transformation.ts";
import {
  createKpEquationLinearRearrangementBinding
} from "../../rendering/equation-linear-rearrangement-bindings.ts";
import {
  kpEquationPresentationProfile
} from "../../rendering/equation-presentation-policy.ts";
import {
  compileKpFractionCompositionCancellationPresentationPlan
} from "../../animation/fraction-composition-cancellation-presentation.ts";

/**
 * This reader trust boundary is the only mint for executable operation
 * choreography. A motif label alone cannot authorize native-glyph timing or
 * contact paths.
 */
export function compileKpEquationOperationChoreography(input: {
  readonly animation: KpAnimationAsset;
  readonly transformation: KpSemanticTransformation;
  readonly motifKind?: EquationVisualMotifKind | undefined;
  readonly direction: "forward" | "rewind";
}): KpRegisteredEquationOperationChoreography | undefined {
  const binding = createKpEquationLinearRearrangementBinding({
    animation: input.animation,
    transformation: input.transformation
  });
  if (binding === undefined) return undefined;

  if (binding.kind === "balanced-introduction") {
    // Existing profiles without branch authority keep their established
    // compositor behavior; the canonical balanced-solve factory always
    // supplies the certificate-producing schedule.
    if (binding.branchSchedule === undefined) return undefined;
    if (input.motifKind !== "append-after-shift") {
      throw new Error(
        `Balanced introduction ${input.transformation.id} requires append-after-shift.`
      );
    }
    if (binding.branchSchedule.strategy.kind !== "together") return undefined;
    const semanticEntityIds = binding.branchSchedule.operation.branches
      .flatMap(({ entityIds }) => entityIds);
    requireUniqueNonempty(
      semanticEntityIds,
      `balanced introduction ${input.transformation.id}`
    );
    return Object.freeze({
      schemaVersion: "kp.equation-operation-choreography.v1",
      kind: "synchronized-balanced-introduction",
      id: `operation-choreography.${input.transformation.id}.${input.direction}`,
      transformationId: input.transformation.id,
      direction: input.direction,
      linearRearrangementKind: binding.kind,
      semanticEntityIds: Object.freeze(semanticEntityIds),
      branchSchedule: binding.branchSchedule
    }) as KpSynchronizedBalancedIntroductionChoreography;
  }

  if (
    binding.kind !== "cancel-additive-inverses" &&
    binding.kind !== "cancel-multiplicative-inverses"
  ) {
    return undefined;
  }
  if (input.motifKind !== "cancelation") {
    throw new Error(
      `Inverse cancellation ${input.transformation.id} requires cancelation.`
    );
  }
  const profile = kpEquationPresentationProfile(input.animation);
  if (
    profile.cancellation !== "counter-orbit-v1" ||
    profile.zeroWitness !== "none"
  ) {
    return undefined;
  }
  const cancellation = input.transformation.correspondenceMap?.records.find(
    ({ relation }) => relation === "cancelation"
  );
  if (cancellation === undefined) {
    throw new Error(
      `Counter-orbit cancellation ${input.transformation.id} requires a cancellation relation.`
    );
  }
  requireUniqueNonempty(
    cancellation.sourceSelectorIds,
    `counter-orbit cancellation ${input.transformation.id}`
  );
  if (cancellation.sourceSelectorIds.length < 2) {
    throw new Error(
      `Counter-orbit cancellation ${input.transformation.id} requires at least two sources.`
    );
  }
  const operationPresentationPlan =
    compileKpFractionCompositionCancellationPresentationPlan(
      input.transformation
    );
  return Object.freeze({
    schemaVersion: "kp.equation-operation-choreography.v1",
    kind: "counter-orbit-cancellation",
    id: `operation-choreography.${input.transformation.id}.${input.direction}`,
    transformationId: input.transformation.id,
    direction: input.direction,
    linearRearrangementKind: binding.kind,
    relationRecordId: cancellation.id,
    semanticEntityIds: Object.freeze([...cancellation.sourceSelectorIds]),
    cancellationRecipe: "counter-orbit-v1",
    zeroWitnessRecipe: "none",
    ...(operationPresentationPlan === undefined
      ? {}
      : { operationPresentationPlan })
  }) as KpCounterOrbitCancellationChoreography;
}

function requireUniqueNonempty(values: readonly string[], label: string): void {
  if (
    values.length === 0 ||
    values.some((value) => value.trim().length === 0) ||
    new Set(values).size !== values.length
  ) {
    throw new Error(`${label} requires unique, non-empty semantic entities.`);
  }
}
