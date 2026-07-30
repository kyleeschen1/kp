import type {
  KpRegisteredEquationOperationChoreography
} from "../../animation/balanced-introduction-presentation-plan.ts";
import type {
  KpFactorCommonTermMotifBinding
} from "../../animation/factoring-motif-binding.ts";
import type {
  KpVerifiedDistributionPresentationPlan,
  KpVerifiedFactoringPresentationPlan,
  KpVerifiedFractionMaterialPresentationPlan,
  KpVerifiedStructuralSuccessionPresentationPlan
} from "../../animation/operation-presentation-plan-types.ts";
import type {
  KpRegisteredSuccessorSynthesisBinding
} from "../../animation/successor-synthesis-presentation-plan.ts";
import type {
  KpEquationStructuralSuccessionIntent,
  KpEquationVisualMotifIntent
} from "../../animation/structural-succession-presentation.ts";
import type {
  KpExplicitStaticCheckpointPlan
} from "../../animation/operation-presentation-plan-types.ts";
import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "../../animation/motifs/executable-successor-motif-program.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "../../animation/motifs/executable-successor-motif-program-validator.ts";

declare const kpReaderEquationPresentationPlanAuthority: unique symbol;

type KpRegisteredFactorCommonTermMotifBinding =
  KpFactorCommonTermMotifBinding & {
    readonly operationPresentationPlan:
      KpVerifiedFactoringPresentationPlan;
  };

type KpRegisteredEquationStructuralSuccessionIntent =
  KpEquationStructuralSuccessionIntent & {
    readonly operationPresentationPlan:
      KpVerifiedStructuralSuccessionPresentationPlan;
  };

interface KpReaderEquationPresentationPlanBase {
  readonly schemaVersion: "kp.reader-equation-transition-presentation-plan.v1";
  readonly kind: "reader-equation-transition-presentation-plan";
  readonly transitionId: string;
  readonly [kpReaderEquationPresentationPlanAuthority]: true;
}

export type KpReaderEquationTransitionPresentationPlan =
  | (KpReaderEquationPresentationPlanBase & {
      readonly planKind: "default-motion";
    })
  | (KpReaderEquationPresentationPlanBase & {
      readonly planKind: "visual-motif";
      readonly visualMotif: KpEquationVisualMotifIntent;
    })
  | (KpReaderEquationPresentationPlanBase & {
      readonly planKind: "factoring";
      readonly visualMotif: KpEquationVisualMotifIntent;
      readonly factoringMotifBinding:
        KpRegisteredFactorCommonTermMotifBinding;
    })
  | (KpReaderEquationPresentationPlanBase & {
      readonly planKind: "distribution";
      readonly visualMotif: KpEquationVisualMotifIntent;
      readonly distributionOperationPlans:
        readonly KpVerifiedDistributionPresentationPlan[];
    })
  | (KpReaderEquationPresentationPlanBase & {
      readonly planKind: "fraction-material";
      readonly visualMotif?: KpEquationVisualMotifIntent | undefined;
      readonly fractionMaterialPresentationPlan:
        KpVerifiedFractionMaterialPresentationPlan;
    })
  | (KpReaderEquationPresentationPlanBase & {
      readonly planKind: "structural-succession";
      readonly visualMotif: KpEquationVisualMotifIntent;
      readonly structuralSuccession:
        KpRegisteredEquationStructuralSuccessionIntent;
    })
  | (KpReaderEquationPresentationPlanBase & {
      readonly planKind: "successor-synthesis";
      readonly executableProgram:
        KpVerifiedExecutableSuccessorMotifProgram;
      readonly successorSyntheses:
        readonly [
          KpRegisteredSuccessorSynthesisBinding,
          ...KpRegisteredSuccessorSynthesisBinding[]
        ];
    })
  | (KpReaderEquationPresentationPlanBase & {
      readonly planKind: "operation-choreography";
      readonly visualMotif: KpEquationVisualMotifIntent;
      readonly operationChoreography:
        KpRegisteredEquationOperationChoreography;
    })
  | (KpReaderEquationPresentationPlanBase & {
      readonly planKind: "explicit-static-checkpoint";
      readonly staticCheckpoint: KpExplicitStaticCheckpointPlan;
    });

export interface KpReaderEquationTransitionPresentationEvidence {
  readonly visualMotif?: KpEquationVisualMotifIntent | undefined;
  readonly factoringMotifBinding?:
    KpRegisteredFactorCommonTermMotifBinding | undefined;
  readonly distributionOperationPlans?:
    readonly KpVerifiedDistributionPresentationPlan[] | undefined;
  readonly fractionMaterialPresentationPlan?:
    KpVerifiedFractionMaterialPresentationPlan | undefined;
  readonly structuralSuccession?:
    KpRegisteredEquationStructuralSuccessionIntent | undefined;
  readonly successorSyntheses?:
    readonly KpRegisteredSuccessorSynthesisBinding[] | undefined;
  readonly executableProgram?:
    KpVerifiedExecutableSuccessorMotifProgram | undefined;
  readonly operationChoreography?:
    KpRegisteredEquationOperationChoreography | undefined;
  readonly staticCheckpoint?: KpExplicitStaticCheckpointPlan | undefined;
}

/**
 * This is the sole reader-plan mint. Keeping the previously independent
 * evidence inside a branded discriminated union prevents callers from
 * assembling contradictory presentation combinations on a transition.
 */
export function createKpReaderEquationTransitionPresentationPlan(input: {
  readonly transitionId: string;
  readonly visualMotif?: KpEquationVisualMotifIntent | undefined;
  readonly factoringMotifBinding?:
    KpRegisteredFactorCommonTermMotifBinding | undefined;
  readonly distributionOperationPlans?:
    readonly KpVerifiedDistributionPresentationPlan[] | undefined;
  readonly fractionMaterialPresentationPlan?:
    KpVerifiedFractionMaterialPresentationPlan | undefined;
  readonly structuralSuccession?:
    KpRegisteredEquationStructuralSuccessionIntent | undefined;
  readonly successorSyntheses?:
    readonly KpRegisteredSuccessorSynthesisBinding[] | undefined;
  readonly executableProgram?:
    KpVerifiedExecutableSuccessorMotifProgram | undefined;
  readonly operationChoreography?:
    KpRegisteredEquationOperationChoreography | undefined;
  readonly staticCheckpoint?: KpExplicitStaticCheckpointPlan | undefined;
}): KpReaderEquationTransitionPresentationPlan {
  if (input.transitionId.trim().length === 0) {
    throw new Error("Reader equation presentation plan requires a transition id.");
  }
  const successorSyntheses = input.successorSyntheses ?? [];
  const distributionOperationPlans = input.distributionOperationPlans ?? [];
  const specializedCount = [
    input.factoringMotifBinding,
    distributionOperationPlans.length === 0
      ? undefined
      : distributionOperationPlans,
    input.fractionMaterialPresentationPlan,
    input.structuralSuccession,
    successorSyntheses.length === 0 ? undefined : successorSyntheses,
    input.operationChoreography,
    input.staticCheckpoint
  ].filter((value) => value !== undefined).length;
  if (specializedCount > 1) {
    throw new Error(
      `Reader transition ${input.transitionId} has competing presentation authorities.`
    );
  }
  if (
    successorSyntheses.length > 0 &&
    input.executableProgram === undefined
  ) {
    throw new Error(
      `Reader transition ${input.transitionId} requires a minted executable ` +
      "program for successor synthesis."
    );
  }
  if (
    input.executableProgram !== undefined &&
    successorSyntheses.length === 0
  ) {
    throw new Error(
      `Reader transition ${input.transitionId} cannot carry an executable ` +
      "program without successor synthesis."
    );
  }
  if (
    input.executableProgram !== undefined &&
    (
      !isKpVerifiedExecutableSuccessorMotifProgram(input.executableProgram) ||
      input.executableProgram.kind !== "operation-evaluation"
    )
  ) {
    throw new Error(
      `Reader transition ${input.transitionId} requires a verified ` +
      "operation-evaluation executable program."
    );
  }
  const requiresTopLevelMotif =
    input.factoringMotifBinding !== undefined ||
    distributionOperationPlans.length > 0 ||
    input.structuralSuccession !== undefined ||
    input.operationChoreography !== undefined;
  if (requiresTopLevelMotif && input.visualMotif === undefined) {
    throw new Error(
      `Reader transition ${input.transitionId} has specialized presentation ` +
      "without a canonical visual motif."
    );
  }
  const base = {
    schemaVersion:
      "kp.reader-equation-transition-presentation-plan.v1" as const,
    kind: "reader-equation-transition-presentation-plan" as const,
    transitionId: input.transitionId
  };
  const raw =
    input.staticCheckpoint !== undefined
      ? {
          ...base,
          planKind: "explicit-static-checkpoint" as const,
          staticCheckpoint: input.staticCheckpoint
        }
      : input.factoringMotifBinding !== undefined
      ? {
          ...base,
          planKind: "factoring" as const,
          visualMotif: input.visualMotif!,
          factoringMotifBinding: input.factoringMotifBinding
        }
      : distributionOperationPlans.length > 0
        ? {
            ...base,
            planKind: "distribution" as const,
            visualMotif: input.visualMotif!,
            distributionOperationPlans: Object.freeze([
              ...distributionOperationPlans
            ])
          }
      : input.fractionMaterialPresentationPlan !== undefined
        ? {
            ...base,
            planKind: "fraction-material" as const,
            ...(input.visualMotif === undefined
              ? {}
              : { visualMotif: input.visualMotif }),
            fractionMaterialPresentationPlan:
              input.fractionMaterialPresentationPlan
          }
      : input.structuralSuccession !== undefined
        ? {
            ...base,
            planKind: "structural-succession" as const,
            visualMotif: input.visualMotif!,
            structuralSuccession: input.structuralSuccession
          }
        : successorSyntheses.length > 0
          ? {
              ...base,
              planKind: "successor-synthesis" as const,
              executableProgram: input.executableProgram!,
              successorSyntheses: Object.freeze([...successorSyntheses]) as
                readonly [
                  KpRegisteredSuccessorSynthesisBinding,
                  ...KpRegisteredSuccessorSynthesisBinding[]
                ]
            }
          : input.operationChoreography !== undefined
            ? {
                ...base,
                planKind: "operation-choreography" as const,
                visualMotif: input.visualMotif!,
                operationChoreography: input.operationChoreography
              }
            : input.visualMotif !== undefined
              ? {
                  ...base,
                  planKind: "visual-motif" as const,
                  visualMotif: input.visualMotif
                }
              : {
                  ...base,
                  planKind: "default-motion" as const
                };
  // Only this validated constructor can provide the private reader authority.
  return Object.freeze(raw) as KpReaderEquationTransitionPresentationPlan;
}

export function projectKpReaderEquationTransitionPresentation(
  plan: KpReaderEquationTransitionPresentationPlan
): KpReaderEquationTransitionPresentationEvidence {
  switch (plan.planKind) {
    case "default-motion":
      return Object.freeze({});
    case "visual-motif":
      return Object.freeze({ visualMotif: plan.visualMotif });
    case "factoring":
      return Object.freeze({
        visualMotif: plan.visualMotif,
        factoringMotifBinding: plan.factoringMotifBinding
      });
    case "distribution":
      return Object.freeze({
        visualMotif: plan.visualMotif,
        distributionOperationPlans: plan.distributionOperationPlans
      });
    case "fraction-material":
      return Object.freeze({
        ...(plan.visualMotif === undefined
          ? {}
          : { visualMotif: plan.visualMotif }),
        fractionMaterialPresentationPlan:
          plan.fractionMaterialPresentationPlan
      });
    case "structural-succession":
      return Object.freeze({
        visualMotif: plan.visualMotif,
        structuralSuccession: plan.structuralSuccession
      });
    case "successor-synthesis":
      return Object.freeze({
        executableProgram: plan.executableProgram,
        successorSyntheses: plan.successorSyntheses
      });
    case "operation-choreography":
      return Object.freeze({
        visualMotif: plan.visualMotif,
        operationChoreography: plan.operationChoreography
      });
    case "explicit-static-checkpoint":
      return Object.freeze({
        staticCheckpoint: plan.staticCheckpoint
      });
  }
}
