import type {
  KpOperationEvaluationFamilyCandidateResolution
} from "./operation-evaluation-family-profile.ts";

export interface KpCarrierPreservingSimplificationRecipe {
  readonly schemaVersion: "kp.carrier-preserving-simplification-recipe.v1";
  readonly kind: "carrier-preserving-simplification-recipe";
  readonly id: string;
  readonly status: "promoted";
  readonly family: "carrier-preserving-simplification";
  readonly handoff: "persistent-carrier-transfer";
  readonly profileId:
    "kp.evaluation-family.carrier-preserving-simplification.v1";
  readonly transformationId: string;
  readonly endpointRefs: {
    readonly sourceObjectId: string;
    readonly targetObjectId: string;
  };
  readonly carrier: {
    readonly correspondenceRecordId: string;
    readonly sourceSelectorRef: string;
    readonly targetSelectorRef: string;
    readonly ownership: "exclusive-transit-owner";
    readonly anchorPolicy: "measured-ink-center";
    readonly baselinePolicy: "preserve-measured-ink-baseline";
  };
  readonly identityLawWitness: {
    readonly lawId: string;
    readonly sourceSelectorRef: string;
    readonly removalRecordId: string;
  };
  readonly removedSyntaxCohort: {
    readonly selectorRefs: readonly [string, ...string[]];
    readonly correspondenceRecordIds: readonly [string, ...string[]];
    readonly ownership: "source-native-until-withdrawal";
  };
  readonly stationaryContext: readonly {
    readonly correspondenceRecordId: string;
    readonly sourceSelectorRef: string;
    readonly targetSelectorRef: string;
    readonly ownership: "native-stationary";
  }[];
  readonly settlement: {
    readonly targetSelectorRef: string;
    readonly ownership: "native-target";
    readonly policy: "exact-native-ink";
  };
}

export type KpCarrierPreservingSimplificationRecipeCompilation =
  | {
      readonly status: "compiled";
      readonly recipe: KpCarrierPreservingSimplificationRecipe;
    }
  | {
      readonly status: "unresolved-candidate";
      readonly resolutionStatus: Exclude<
        KpOperationEvaluationFamilyCandidateResolution["status"],
        "candidate-resolved"
      >;
      readonly message: string;
    };

/**
 * The recipe is the handoff between semantic authority and optical policy.
 * It identifies what must move and who owns paint, while leaving sampling and
 * all measured poses to the eventual rendering adapter.
 */
export function compileKpCarrierPreservingSimplificationRecipe(
  resolution: KpOperationEvaluationFamilyCandidateResolution
): KpCarrierPreservingSimplificationRecipeCompilation {
  if (resolution.status !== "candidate-resolved") {
    return Object.freeze({
      status: "unresolved-candidate" as const,
      resolutionStatus: resolution.status,
      message: resolution.message
    });
  }
  const { profile, evidence } = resolution;
  const recipe = Object.freeze({
    schemaVersion: "kp.carrier-preserving-simplification-recipe.v1" as const,
    kind: "carrier-preserving-simplification-recipe" as const,
    id: `recipe.${evidence.id}`,
    status: "promoted" as const,
    family: profile.family,
    handoff: profile.handoff,
    profileId: profile.id,
    transformationId: evidence.transformationId,
    endpointRefs: Object.freeze({ ...evidence.endpoints }),
    carrier: Object.freeze({
      correspondenceRecordId: evidence.carrier.correspondenceRecordId,
      sourceSelectorRef: evidence.carrier.sourceSelectorId,
      targetSelectorRef: evidence.carrier.targetSelectorId,
      ownership: "exclusive-transit-owner" as const,
      anchorPolicy: "measured-ink-center" as const,
      baselinePolicy: "preserve-measured-ink-baseline" as const
    }),
    identityLawWitness: Object.freeze({
      lawId: evidence.identityLawWitness.lawId,
      sourceSelectorRef: evidence.identityLawWitness.sourceSelectorId,
      removalRecordId: evidence.identityLawWitness.removalRecordId
    }),
    removedSyntaxCohort: Object.freeze({
      selectorRefs: Object.freeze([
        ...evidence.removedSyntaxCohort.selectorIds
      ]) as readonly [string, ...string[]],
      correspondenceRecordIds: Object.freeze([
        ...evidence.removedSyntaxCohort.correspondenceRecordIds
      ]) as readonly [string, ...string[]],
      ownership: "source-native-until-withdrawal" as const
    }),
    stationaryContext: Object.freeze(evidence.stationaryContext.map(
      (context) => Object.freeze({
        correspondenceRecordId: context.correspondenceRecordId,
        sourceSelectorRef: context.sourceSelectorId,
        targetSelectorRef: context.targetSelectorId,
        ownership: "native-stationary" as const
      })
    )),
    settlement: Object.freeze({
      targetSelectorRef: evidence.carrier.targetSelectorId,
      ownership: "native-target" as const,
      policy: "exact-native-ink" as const
    })
  } satisfies KpCarrierPreservingSimplificationRecipe);
  return Object.freeze({ status: "compiled" as const, recipe });
}
