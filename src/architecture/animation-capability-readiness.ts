import {
  compileEquationIntent,
  listKpEquationIntentSurfaceVocabularies,
  type KpCompiledEquationIntentPlan
} from "../authoring/compile-equation-intent.ts";
import {
  kpEquationGenerationPressureCorpora,
  kpEquationGenerationPressureFixtures
} from
  "../authoring/equation-generation-pressure-contract.ts";
import {
  evaluateKpBalancedOperationAuthoringCorpus,
  kpBalancedOperationAuthoringCorpus
} from "../authoring/balanced-operation-authoring-corpus.ts";
import {
  evaluateKpFiniteBinderAuthoringCorpus,
  KP_FINITE_BINDER_AUTHORING_CORPUS_AUTHORITY
} from "../authoring/finite-binder-authoring-corpus.ts";
import {
  KP_BOTH_SIDES_EQUATION_SERIES_AUTHORING_AUTHORITY,
  kpEquationSeriesBothSidesAuthoringDeclarations
} from "../authoring/equation-series-both-sides-authoring.ts";
import { evaluateKpLogarithmBaseAuthoringEvidence } from
  "../authoring/logarithm-base-authoring-evidence.ts";
import { kpExponentialHomomorphismAuthoringCorpus } from
  "../authoring/exponential-homomorphism-authoring-corpus.ts";
import {
  evaluateKpRootRewriteAuthoringCorpus,
  kpRootRewritePromotionAuthorities
} from "../authoring/root-rewrite-authoring-corpus.ts";
import {
  KP_BOTH_SIDES_CAUSAL_RECIPE_AUTHORITY
} from "../animation/both-sides-causal-recipe.ts";
import {
  KP_BOTH_SIDES_OPERATION_FAMILY_AUTHORITY
} from "../semantic/both-sides-operation-family.ts";
import {
  KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY,
  KP_PYTHON_EXTRACT_HELPER_AUTHORING_AUTHORITY,
  KP_PYTHON_EXTRACT_HELPER_CORPUS_AUTHORITY,
  KP_PYTHON_EXTRACT_HELPER_OPERATION_AUTHORITY,
  KP_TYPESCRIPT_EXTRACT_HELPER_AUTHORING_AUTHORITY,
  KP_TYPESCRIPT_EXTRACT_HELPER_CORPUS_AUTHORITY,
  KP_TYPESCRIPT_EXTRACT_HELPER_OPERATION_AUTHORITY
} from "../domain-ir/code-extract-helper-authorities.ts";
import {
  KP_FINITE_BINDER_AUTHORING_COMPILER_AUTHORITY,
  KP_FINITE_SUM_EXPANSION_ANIMATION_ID
} from "../domain-ir/finite-binder-authorities.ts";
import { KP_FINITE_BINDER_EXPANSION_RECIPE } from
  "../domain-ir/finite-binder-causal-recipe.ts";
import { KP_FINITE_BINDER_EXPANSION_KERNEL_AUTHORITY } from
  "../semantic/finite-binder-expansion-kernel.ts";
import { KP_FINITE_BINDER_EXPAND_OPERATION } from
  "../semantic/finite-binder-expansion-operation.ts";
import { KP_FINITE_SUM_ENDPOINT_NORMALIZER } from
  "../semantic/finite-sum-endpoint-normalizer.ts";
import { KP_FINITE_PRODUCT_EXPAND_OPERATION } from
  "../semantic/finite-product-expansion-operation.ts";
import { KP_FINITE_PRODUCT_ENDPOINT_NORMALIZER } from
  "../semantic/finite-product-endpoint-normalizer.ts";
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
import {
  createKpAnimationDomainFrontendEvidence,
  type KpAnimationDomainFrontendEvidence,
  type KpAnimationDomainFrontendRequirementEvidence
} from "./animation-domain-frontend-evidence.ts";
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
  readonly planKind:
    | KpCompiledEquationIntentPlan["kind"]
    | "equation-transform-series-runtime"
    | "root-rewrite-plan"
    | "finite-binder-authoring-artifact"
    | "code-refactor-semantic-plan";
  readonly resolvedAuthorityIds: readonly string[];
  readonly generationCorpusAuthorityIds: readonly string[];
  readonly requiredCompilerAuthorityIds?: readonly string[];
  readonly requiredFrontendAuthorityIds?: readonly string[];
  readonly sourcePath:
    | "src/authoring/compile-equation-intent.ts"
    | "src/authoring/compile-equation-transform-series.ts"
    | "src/authoring/root-rewrite-authoring-corpus.ts"
    | "src/authoring/finite-binder-authoring-api.ts"
    | "src/authoring/code-operation-discovery-api.ts";
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
  readonly frontendEvidence: KpAnimationDomainFrontendEvidence;
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
    const frontendMatches = matchedFrontendRequirements(
      capability.id,
      input.frontendEvidence.requirements
    );
    const directIntent = directIntentForCapability(
      assetMatches.map(({ assetId }) => assetId),
      compilerMatches,
      frontendMatches,
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
        ]),
        ...(evidence.requiredCompilerAuthorityIds === undefined ? {} : {
          requiredCompilerAuthorityIds: Object.freeze([
            ...evidence.requiredCompilerAuthorityIds
          ])
        }),
        ...(evidence.requiredFrontendAuthorityIds === undefined ? {} : {
          requiredFrontendAuthorityIds: Object.freeze([
            ...evidence.requiredFrontendAuthorityIds
          ])
        })
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
    frontendEvidence: createKpAnimationDomainFrontendEvidence(),
    directIntentEvidence: createDirectIntentEvidence()
  });
}

export function createKpAnimationCapabilityDirectIntentEvidence():
readonly KpAnimationCapabilityDirectIntentEvidence[] {
  return createDirectIntentEvidence();
}

function createDirectIntentEvidence():
readonly KpAnimationCapabilityDirectIntentEvidence[] {
  const intentEvidence = listKpEquationIntentSurfaceVocabularies().map(
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
        generationCorpusAuthorityIds: Object.freeze([
          ...kpEquationGenerationPressureFixtures
            .filter(({ request }) =>
              request.animationId === vocabulary.animationId &&
              request.operation.operationId === vocabulary.operationId)
            .flatMap(({ id }) => [
              id,
              ...kpEquationGenerationPressureCorpora
                .filter(({ fixtureIds }) => fixtureIds.includes(id))
                .map(({ id: corpusId }) => corpusId)
            ]),
          ...kpExponentialHomomorphismAuthoringCorpus.cases
            .filter((fixture) =>
              fixture.expectedStatus === "accepted" &&
              fixture.request.animationId === vocabulary.animationId &&
              fixture.request.operation.operationId === vocabulary.operationId)
            .map(() => kpExponentialHomomorphismAuthoringCorpus.id)
        ]),
        sourcePath: "src/authoring/compile-equation-intent.ts" as const
      });
    }
  );
  const balancedEvidence = createBalancedOperationDirectEvidence();
  const logarithmBaseEvidence = createLogarithmBaseDirectEvidence();
  const rootRewriteEvidence = createRootRewriteDirectEvidence();
  const finiteBinderEvidence = createFiniteBinderDirectEvidence();
  const codeEvidence = createCodeRefactorDirectEvidence();
  return Object.freeze([
    ...intentEvidence,
    ...(balancedEvidence === undefined ? [] : [balancedEvidence]),
    ...(logarithmBaseEvidence === undefined ? [] : [logarithmBaseEvidence]),
    ...(rootRewriteEvidence === undefined ? [] : [rootRewriteEvidence]),
    ...(finiteBinderEvidence === undefined ? [] : [finiteBinderEvidence]),
    ...codeEvidence
  ]);
}

function createFiniteBinderDirectEvidence():
KpAnimationCapabilityDirectIntentEvidence | undefined {
  const corpus = evaluateKpFiniteBinderAuthoringCorpus();
  if (corpus.status !== "passed" || corpus.acceptedCount !== 4 ||
      corpus.repairCount !== 2) return undefined;
  const compilerAuthorities = Object.freeze([
    KP_FINITE_SUM_ENDPOINT_NORMALIZER,
    KP_FINITE_PRODUCT_ENDPOINT_NORMALIZER,
    KP_FINITE_BINDER_EXPANSION_KERNEL_AUTHORITY,
    KP_FINITE_BINDER_EXPAND_OPERATION,
    KP_FINITE_PRODUCT_EXPAND_OPERATION,
    KP_FINITE_BINDER_EXPANSION_RECIPE,
    KP_FINITE_BINDER_AUTHORING_CORPUS_AUTHORITY
  ]);
  return Object.freeze({
    animationId: KP_FINITE_SUM_EXPANSION_ANIMATION_ID,
    operationId: KP_FINITE_BINDER_EXPANSION_KERNEL_AUTHORITY,
    authoringAuthorityId:
      KP_FINITE_BINDER_AUTHORING_COMPILER_AUTHORITY,
    planKind: "finite-binder-authoring-artifact" as const,
    resolvedAuthorityIds: compilerAuthorities,
    generationCorpusAuthorityIds: Object.freeze([
      KP_FINITE_BINDER_AUTHORING_CORPUS_AUTHORITY
    ]),
    requiredCompilerAuthorityIds: compilerAuthorities,
    sourcePath: "src/authoring/finite-binder-authoring-api.ts" as const
  });
}

function createCodeRefactorDirectEvidence():
readonly KpAnimationCapabilityDirectIntentEvidence[] {
  return Object.freeze([Object.freeze({
    animationId: "animation.programming.typescript-free-shipping-refactor",
    operationId: KP_TYPESCRIPT_EXTRACT_HELPER_OPERATION_AUTHORITY,
    authoringAuthorityId:
      KP_TYPESCRIPT_EXTRACT_HELPER_AUTHORING_AUTHORITY,
    planKind: "code-refactor-semantic-plan" as const,
    resolvedAuthorityIds: Object.freeze([
      KP_TYPESCRIPT_EXTRACT_HELPER_OPERATION_AUTHORITY,
      KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY
    ]),
    generationCorpusAuthorityIds: Object.freeze([
      KP_TYPESCRIPT_EXTRACT_HELPER_CORPUS_AUTHORITY
    ]),
    requiredCompilerAuthorityIds: Object.freeze([
      KP_TYPESCRIPT_EXTRACT_HELPER_OPERATION_AUTHORITY,
      KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY,
      KP_TYPESCRIPT_EXTRACT_HELPER_CORPUS_AUTHORITY
    ]),
    requiredFrontendAuthorityIds: Object.freeze([
      "frontend.code.typescript-compiler.v1"
    ]),
    sourcePath: "src/authoring/code-operation-discovery-api.ts" as const
  }), Object.freeze({
    animationId: "animation.programming.python-free-shipping-refactor",
    operationId: KP_PYTHON_EXTRACT_HELPER_OPERATION_AUTHORITY,
    authoringAuthorityId: KP_PYTHON_EXTRACT_HELPER_AUTHORING_AUTHORITY,
    planKind: "code-refactor-semantic-plan" as const,
    resolvedAuthorityIds: Object.freeze([
      KP_PYTHON_EXTRACT_HELPER_OPERATION_AUTHORITY,
      KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY
    ]),
    generationCorpusAuthorityIds: Object.freeze([
      KP_PYTHON_EXTRACT_HELPER_CORPUS_AUTHORITY
    ]),
    requiredCompilerAuthorityIds: Object.freeze([
      KP_PYTHON_EXTRACT_HELPER_OPERATION_AUTHORITY,
      KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY,
      KP_PYTHON_EXTRACT_HELPER_CORPUS_AUTHORITY
    ]),
    requiredFrontendAuthorityIds: Object.freeze([
      "frontend.code.python-ast.v1"
    ]),
    sourcePath: "src/authoring/code-operation-discovery-api.ts" as const
  })]);
}

function createRootRewriteDirectEvidence():
KpAnimationCapabilityDirectIntentEvidence | undefined {
  const result = evaluateKpRootRewriteAuthoringCorpus();
  if (result.status !== "passed" || result.acceptedCount < 3 ||
      result.repairCount < 1) return undefined;
  return Object.freeze({
    animationId: kpRootRewritePromotionAuthorities.exemplarAnimationId,
    operationId: kpRootRewritePromotionAuthorities.operationAuthorityId,
    authoringAuthorityId:
      kpRootRewritePromotionAuthorities.authoringAuthorityId,
    planKind: "root-rewrite-plan" as const,
    resolvedAuthorityIds: Object.freeze([
      kpRootRewritePromotionAuthorities.operationAuthorityId,
      kpRootRewritePromotionAuthorities.recipeAuthorityId
    ]),
    generationCorpusAuthorityIds: Object.freeze([
      kpRootRewritePromotionAuthorities.corpusAuthorityId
    ]),
    sourcePath: "src/authoring/root-rewrite-authoring-corpus.ts" as const
  });
}

function createBalancedOperationDirectEvidence():
KpAnimationCapabilityDirectIntentEvidence | undefined {
  const corpus = evaluateKpBalancedOperationAuthoringCorpus();
  const expectedOperationCount = 6;
  if (corpus.status !== "passed" ||
      kpEquationSeriesBothSidesAuthoringDeclarations.length !==
        expectedOperationCount) {
    return undefined;
  }
  return Object.freeze({
    animationId: "animation.algebra.log-exponent.solve-two-power-x",
    operationId: KP_BOTH_SIDES_OPERATION_FAMILY_AUTHORITY,
    authoringAuthorityId:
      KP_BOTH_SIDES_EQUATION_SERIES_AUTHORING_AUTHORITY,
    planKind: "equation-transform-series-runtime" as const,
    resolvedAuthorityIds: Object.freeze([
      KP_BOTH_SIDES_OPERATION_FAMILY_AUTHORITY,
      KP_BOTH_SIDES_CAUSAL_RECIPE_AUTHORITY
    ]),
    generationCorpusAuthorityIds: Object.freeze([
      kpBalancedOperationAuthoringCorpus.id
    ]),
    sourcePath:
      "src/authoring/compile-equation-transform-series.ts" as const
  });
}

function createLogarithmBaseDirectEvidence():
KpAnimationCapabilityDirectIntentEvidence | undefined {
  const evidence = evaluateKpLogarithmBaseAuthoringEvidence();
  if (evidence.status !== "passed") return undefined;
  return Object.freeze({
    animationId: evidence.animationId,
    operationId: evidence.operationId,
    authoringAuthorityId: evidence.authoringAuthorityId,
    planKind: "equation-transform-series-runtime" as const,
    resolvedAuthorityIds: Object.freeze([
      ...evidence.resolvedAuthorityIds
    ]),
    generationCorpusAuthorityIds: Object.freeze([
      ...evidence.generationCorpusAuthorityIds
    ]),
    sourcePath:
      "src/authoring/compile-equation-transform-series.ts" as const
  });
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
    case "homomorphic-crossover-semantic-motion-plan":
      return Object.freeze([
        plan.operationId,
        plan.extensionPackId,
        plan.operationKind,
        plan.recipeId,
        plan.semanticAuthorityId,
        plan.callerRegistrationId
      ]);
    case "exponential-homomorphism-correspondence-plan":
      return Object.freeze([
        plan.operationId,
        plan.extensionPackId,
        plan.operationKind,
        plan.recipeId,
        plan.semanticAuthorityId,
        plan.callerRegistrationId
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

function matchedFrontendRequirements(
  capabilityId: string,
  requirements:
    readonly KpAnimationDomainFrontendRequirementEvidence[]
): readonly Extract<
  KpAnimationDomainFrontendRequirementEvidence,
  { readonly status: "matched" }
>[] {
  return requirements.filter((requirement): requirement is Extract<
    KpAnimationDomainFrontendRequirementEvidence,
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
  frontendMatches: readonly Extract<
    KpAnimationDomainFrontendRequirementEvidence,
    { readonly status: "matched" }
  >[],
  directIntents: readonly KpAnimationCapabilityDirectIntentEvidence[]
): KpAnimationCapabilityDirectIntentEvidence | undefined {
  const compilerAuthorityIds = new Set(compilerMatches.flatMap((match) =>
    match.evidence.map(({ authorityId }) => authorityId)
  ));
  const frontendAuthorityIds = new Set(frontendMatches.map((match) =>
    match.authorityId
  ));
  return directIntents.find((intent) =>
    exemplarIds.includes(intent.animationId) &&
    intent.resolvedAuthorityIds.some((authorityId) =>
      compilerAuthorityIds.has(authorityId)) &&
    (intent.requiredCompilerAuthorityIds === undefined ||
      intent.requiredCompilerAuthorityIds.every((authorityId) =>
        compilerAuthorityIds.has(authorityId))) &&
    (intent.requiredFrontendAuthorityIds === undefined ||
      intent.requiredFrontendAuthorityIds.every((authorityId) =>
        frontendAuthorityIds.has(authorityId)))
  );
}
