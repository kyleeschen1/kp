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
} from "../../animation/equation-presentation-policy.ts";
import {
  compileKpEquationCancellationPresentationPlan
} from "../../animation/equation-cancellation-presentation.ts";
import {
  createKpExplicitStaticCheckpointPlan,
  type KpExplicitStaticCheckpointReason
} from "../../animation/operation-presentation-plan-types.ts";

export type KpEquationOperationChoreographyDecision =
  | {
      readonly status: "not-applicable";
    }
  | {
      readonly status: "verified";
      readonly choreography: KpRegisteredEquationOperationChoreography;
    }
  | {
      readonly status: "explicit-static";
      readonly checkpoint: ReturnType<
        typeof createKpExplicitStaticCheckpointPlan
      >;
    };

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
  readonly balancedIntroductionEntryWindow?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
}): KpRegisteredEquationOperationChoreography | undefined {
  const decision = decideKpEquationOperationChoreography(input);
  return decision.status === "verified"
    ? decision.choreography
    : undefined;
}

export function decideKpEquationOperationChoreography(input: {
  readonly animation: KpAnimationAsset;
  readonly transformation: KpSemanticTransformation;
  readonly motifKind?: EquationVisualMotifKind | undefined;
  readonly direction: "forward" | "rewind";
  readonly balancedIntroductionEntryWindow?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
}): KpEquationOperationChoreographyDecision {
  const binding = createKpEquationLinearRearrangementBinding({
    animation: input.animation,
    transformation: input.transformation
  });
  if (binding === undefined) return { status: "not-applicable" };

  if (binding.kind === "balanced-introduction") {
    if (binding.branchSchedule === undefined) {
      return staticDecision(
        input.transformation.id,
        "missing-verified-plan",
        "Balanced introduction has no certified branch schedule."
      );
    }
    if (input.motifKind !== "append-after-shift") {
      throw new Error(
        `Balanced introduction ${input.transformation.id} requires append-after-shift.`
      );
    }
    if (binding.branchSchedule.strategy.kind !== "together") {
      return staticDecision(
        input.transformation.id,
        "unsupported-presentation",
        "Balanced introduction is not scheduled as one atomic branch cohort."
      );
    }
    const semanticEntityIds = binding.branchSchedule.operation.branches
      .flatMap(({ entityIds }) => entityIds);
    requireUniqueNonempty(
      semanticEntityIds,
      `balanced introduction ${input.transformation.id}`
    );
    assertBalancedEntryWindow(input.balancedIntroductionEntryWindow);
    return {
      status: "verified",
      choreography: Object.freeze({
        schemaVersion: "kp.equation-operation-choreography.v1",
        kind: "synchronized-balanced-introduction",
        id:
          `operation-choreography.${input.transformation.id}.` +
          input.direction,
        transformationId: input.transformation.id,
        direction: input.direction,
        linearRearrangementKind: binding.kind,
        semanticEntityIds: Object.freeze(semanticEntityIds),
        branchSchedule: binding.branchSchedule,
        ...(input.balancedIntroductionEntryWindow === undefined
          ? {}
          : {
              entryWindow: Object.freeze({
                ...input.balancedIntroductionEntryWindow
              })
            })
      }) as KpSynchronizedBalancedIntroductionChoreography
    };
  }

  if (
    binding.kind !== "cancel-additive-inverses" &&
    binding.kind !== "cancel-multiplicative-inverses"
  ) {
    return { status: "not-applicable" };
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
    return staticDecision(
      input.transformation.id,
      "unsupported-presentation",
      "Cancellation profile has no verified canonical choreography."
    );
  }
  const cancellation = input.transformation.correspondenceMap?.records.find(
    ({ relation }) => relation === "cancelation"
  );
  if (cancellation === undefined) {
    return staticDecision(
      input.transformation.id,
      "missing-verified-plan",
      "Cancellation semantics do not provide a verified inverse relation."
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
    compileKpEquationCancellationPresentationPlan(
      input.transformation
    );
  if (operationPresentationPlan === undefined) {
    return staticDecision(
      input.transformation.id,
      "missing-verified-plan",
      "Cancellation has no role-complete operation presentation plan."
    );
  }
  return {
    status: "verified",
    // This compiler is the choreography mint; the private brand is applied
    // only after semantic relation and role-complete plan validation above.
    choreography: Object.freeze({
      schemaVersion: "kp.equation-operation-choreography.v1",
      kind: "counter-orbit-cancellation",
      id:
        `operation-choreography.${input.transformation.id}.` +
        input.direction,
      transformationId: input.transformation.id,
      direction: input.direction,
      linearRearrangementKind: binding.kind,
      relationRecordId: cancellation.id,
      semanticEntityIds: Object.freeze([...cancellation.sourceSelectorIds]),
      cancellationRecipe: "counter-orbit-v1",
      zeroWitnessRecipe: "none",
      operationPresentationPlan
    }) as unknown as KpCounterOrbitCancellationChoreography
  };
}

function staticDecision(
  transformationId: string,
  reason: KpExplicitStaticCheckpointReason,
  summary: string
): Extract<
  KpEquationOperationChoreographyDecision,
  { readonly status: "explicit-static" }
> {
  return Object.freeze({
    status: "explicit-static",
    checkpoint: createKpExplicitStaticCheckpointPlan({
      transformationId,
      reason,
      summary
    })
  });
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

function assertBalancedEntryWindow(
  window: { readonly start: number; readonly end: number } | undefined
): void {
  if (window === undefined) return;
  if (
    !Number.isFinite(window.start) ||
    !Number.isFinite(window.end) ||
    window.start < 0 ||
    window.end > 1 ||
    window.start >= window.end
  ) {
    throw new Error(
      "Balanced introduction entry window must increase within the host clock."
    );
  }
}
