import {
  compileEquationIntent,
  listKpEquationIntentSurfaceVocabularies,
  type KpCompiledEquationIntentPlan
} from "../authoring/compile-equation-intent.ts";
import { kpEquationGenerationPressureFixtures } from
  "../authoring/equation-generation-pressure-contract.ts";
import type { KpAnimationCapabilityPlan } from
  "./animation-capability-plan.ts";
import {
  createKpAnimationCapabilityAssetEvidence,
  type KpAnimationCapabilityAssetEvidence,
  type KpAnimationCapabilityAssetRequirementEvidence
} from "./animation-capability-asset-evidence.ts";
import {
  createKpAnimationCapabilityCompilerEvidence,
  type KpAnimationCapabilityCompilerEvidence,
  type KpAnimationCapabilityCompilerRequirementEvidence
} from "./animation-capability-compiler-evidence.ts";
import { kpAnimationCapabilityPlan } from
  "./cross-domain-animation-capability-plan.ts";

export const KP_ANIMATION_CAPABILITY_READINESS_SCHEMA =
  "kp.animation-capability-readiness.v1" as const;

export type KpAnimationCapabilityReadinessStatus =
  | "Direct"
  | "Registered"
  | "Exemplar"
  | "Missing";

export interface KpAnimationCapabilityDirectIntentEvidence {
  readonly animationId: string;
  readonly operationId: string;
  readonly authoringAuthorityId: string;
  readonly planKind: KpCompiledEquationIntentPlan["kind"];
  readonly resolvedAuthorityIds: readonly string[];
  readonly generationCorpusAuthorityIds: readonly string[];
  readonly sourcePath: "src/authoring/compile-equation-intent.ts";
}

export interface KpAnimationCapabilityReadiness {
  readonly schemaVersion: typeof KP_ANIMATION_CAPABILITY_READINESS_SCHEMA;
  readonly kind: "animation-capability-readiness";
  readonly gates: readonly [
    "direct-intent-and-registered-authority",
    "registered-compiler-authority",
    "exact-generated-exemplar",
    "no-trustworthy-evidence"
  ];
  readonly directIntentEvidence:
    readonly KpAnimationCapabilityDirectIntentEvidence[];
  readonly entries: readonly KpAnimationCapabilityReadinessEntry[];
}

export type KpAnimationCapabilityReadinessEntry =
  | Readonly<{
      capabilityId: string;
      status: "Direct";
      evidence: Readonly<{
        gate: "direct-intent-and-registered-authority";
        directIntent: KpAnimationCapabilityDirectIntentEvidence;
        matchedCompilerRequirementIds: readonly string[];
      }>;
    }>
  | Readonly<{
      capabilityId: string;
      status: "Registered";
      evidence: Readonly<{
        gate: "registered-compiler-authority";
        matchedCompilerRequirementIds: readonly string[];
      }>;
    }>
  | Readonly<{
      capabilityId: string;
      status: "Exemplar";
      evidence: Readonly<{
        gate: "exact-generated-exemplar";
        matchedAssetRequirementIds: readonly string[];
        assetIds: readonly string[];
      }>;
    }>
  | Readonly<{
      capabilityId: string;
      status: "Missing";
      evidence: Readonly<{
        gate: "no-trustworthy-evidence";
        missingRequirementIds: readonly string[];
      }>;
    }>;

/**
 * Status is a precedence-ordered proof over exact IDs. A playable asset cannot
 * imply registration, and a registered operation cannot imply that the direct
 * authoring facade accepts the capability.
 */
export function compileKpAnimationCapabilityReadiness(input: {
  readonly plan: KpAnimationCapabilityPlan;
  readonly assetEvidence: KpAnimationCapabilityAssetEvidence;
  readonly compilerEvidence: KpAnimationCapabilityCompilerEvidence;
  readonly directIntentEvidence:
    readonly KpAnimationCapabilityDirectIntentEvidence[];
}): KpAnimationCapabilityReadiness {
  const entries = Object.freeze(input.plan.entries.map((capability) => {
    const compilerMatches = matchedCompilerRequirements(
      capability.id,
      input.compilerEvidence.requirements
    );
    const assetMatches = matchedAssetRequirements(
      capability.id,
      input.assetEvidence.requirements
    );
    const directIntent = directIntentForCapability(
      capability.requirements
        .filter(({ kind }) => kind === "canonical-exemplar")
        .map(({ authorityId }) => authorityId),
      compilerMatches,
      input.directIntentEvidence
    );
    if (directIntent !== undefined) {
      return Object.freeze({
        capabilityId: capability.id,
        status: "Direct" as const,
        evidence: Object.freeze({
          gate: "direct-intent-and-registered-authority" as const,
          directIntent,
          matchedCompilerRequirementIds: Object.freeze(
            compilerMatches.map(({ requirementId }) => requirementId)
          )
        })
      });
    }
    if (compilerMatches.length > 0) {
      return Object.freeze({
        capabilityId: capability.id,
        status: "Registered" as const,
        evidence: Object.freeze({
          gate: "registered-compiler-authority" as const,
          matchedCompilerRequirementIds: Object.freeze(
            compilerMatches.map(({ requirementId }) => requirementId)
          )
        })
      });
    }
    if (assetMatches.length > 0) {
      return Object.freeze({
        capabilityId: capability.id,
        status: "Exemplar" as const,
        evidence: Object.freeze({
          gate: "exact-generated-exemplar" as const,
          matchedAssetRequirementIds: Object.freeze(
            assetMatches.map(({ requirementId }) => requirementId)
          ),
          assetIds: Object.freeze(assetMatches.map(({ assetId }) => assetId))
        })
      });
    }
    return Object.freeze({
      capabilityId: capability.id,
      status: "Missing" as const,
      evidence: Object.freeze({
        gate: "no-trustworthy-evidence" as const,
        missingRequirementIds: Object.freeze(capability.requirements.map(
          ({ id }) => id
        ))
      })
    });
  }));

  return Object.freeze({
    schemaVersion: KP_ANIMATION_CAPABILITY_READINESS_SCHEMA,
    kind: "animation-capability-readiness" as const,
    gates: Object.freeze([
      "direct-intent-and-registered-authority",
      "registered-compiler-authority",
      "exact-generated-exemplar",
      "no-trustworthy-evidence"
    ] as const),
    directIntentEvidence: Object.freeze(input.directIntentEvidence.map(
      (evidence) => Object.freeze({
        ...evidence,
        resolvedAuthorityIds: Object.freeze([
          ...evidence.resolvedAuthorityIds
        ]),
        generationCorpusAuthorityIds: Object.freeze([
          ...evidence.generationCorpusAuthorityIds
        ])
      })
    )),
    entries
  });
}

export function createKpAnimationCapabilityReadiness():
KpAnimationCapabilityReadiness {
  return compileKpAnimationCapabilityReadiness({
    plan: kpAnimationCapabilityPlan,
    assetEvidence: createKpAnimationCapabilityAssetEvidence(),
    compilerEvidence: createKpAnimationCapabilityCompilerEvidence(),
    directIntentEvidence: createDirectIntentEvidence()
  });
}

export function createKpAnimationCapabilityDirectIntentEvidence():
readonly KpAnimationCapabilityDirectIntentEvidence[] {
  return createDirectIntentEvidence();
}

function createDirectIntentEvidence():
readonly KpAnimationCapabilityDirectIntentEvidence[] {
  return Object.freeze(listKpEquationIntentSurfaceVocabularies().map(
    (vocabulary) => {
      const result = compileEquationIntent({
        animationId: vocabulary.animationId,
        operation: {
          operationId: vocabulary.operationId,
          roleBindings: vocabulary.canonicalRoleBindings
        },
        explanationDepth: "standard"
      });
      if (result.status !== "accepted") {
        throw new Error(
          `Direct equation intent ${vocabulary.animationId} no longer compiles.`
        );
      }
      return Object.freeze({
        animationId: result.plan.animationId,
        operationId: result.plan.operationId,
        authoringAuthorityId: vocabulary.authoringAuthorityId,
        planKind: result.plan.kind,
        resolvedAuthorityIds: authorityIdsForPlan(result.plan),
        generationCorpusAuthorityIds: Object.freeze(
          kpEquationGenerationPressureFixtures
            .filter(({ request }) =>
              request.animationId === vocabulary.animationId &&
              request.operation.operationId === vocabulary.operationId)
            .map(({ id }) => id)
        ),
        sourcePath: "src/authoring/compile-equation-intent.ts" as const
      });
    }
  ));
}

function authorityIdsForPlan(
  plan: KpCompiledEquationIntentPlan
): readonly string[] {
  switch (plan.kind) {
    case "function-wrap-motif-plan":
      return Object.freeze([
        plan.operationId,
        plan.extensionPackId,
        plan.recipeId
      ]);
    case "cancellation-semantic-motion-plan":
      return Object.freeze([plan.operationId, plan.contractId]);
    case "distribution-operation-plan":
      return Object.freeze([
        plan.operationId,
        plan.operationSpecId,
        plan.inverseOperationId
      ]);
  }
}

function matchedCompilerRequirements(
  capabilityId: string,
  requirements:
    readonly KpAnimationCapabilityCompilerRequirementEvidence[]
): readonly Extract<
  KpAnimationCapabilityCompilerRequirementEvidence,
  { readonly status: "matched" }
>[] {
  return requirements.filter((requirement): requirement is Extract<
    KpAnimationCapabilityCompilerRequirementEvidence,
    { readonly status: "matched" }
  > => requirement.capabilityId === capabilityId &&
    requirement.status === "matched");
}

function matchedAssetRequirements(
  capabilityId: string,
  requirements: readonly KpAnimationCapabilityAssetRequirementEvidence[]
): readonly Extract<
  KpAnimationCapabilityAssetRequirementEvidence,
  { readonly status: "matched" }
>[] {
  return requirements.filter((requirement): requirement is Extract<
    KpAnimationCapabilityAssetRequirementEvidence,
    { readonly status: "matched" }
  > => requirement.capabilityId === capabilityId &&
    requirement.status === "matched");
}

function directIntentForCapability(
  exemplarIds: readonly string[],
  compilerMatches: readonly Extract<
    KpAnimationCapabilityCompilerRequirementEvidence,
    { readonly status: "matched" }
  >[],
  directIntents: readonly KpAnimationCapabilityDirectIntentEvidence[]
): KpAnimationCapabilityDirectIntentEvidence | undefined {
  const compilerAuthorityIds = new Set(compilerMatches.flatMap((match) =>
    match.evidence.map(({ authorityId }) => authorityId)
  ));
  return directIntents.find((intent) =>
    exemplarIds.includes(intent.animationId) &&
    intent.resolvedAuthorityIds.some((authorityId) =>
      compilerAuthorityIds.has(authorityId)
    )
  );
}
