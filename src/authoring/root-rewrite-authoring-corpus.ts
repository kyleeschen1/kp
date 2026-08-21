import {
  compileKpRootRewritePlan,
  KP_ROOT_REWRITE_PLAN_AUTHORITY,
  type KpBlockedRootRewriteDraft,
  type KpRootRewritePlanDraft,
  type KpRootRewritePlanInput,
  type KpVerifiedRootRewritePlan
} from "../semantic/root-rewrite-plan.ts";
import { kpCompoundRootCarrierExemplar } from
  "../semantic/compound-root-carrier-exemplar.ts";
import { kpRootCompositionPressureCorpus } from
  "../semantic/root-composition-pressure-corpus.ts";
import { KP_ROOT_REWRITE_VOCABULARY_AUTHORITY } from
  "../semantic/root-rewrite-vocabulary.ts";

export const KP_ROOT_REWRITE_AUTHORING_AUTHORITY =
  "authoring.equation.radical-inversion.v1" as const;
export const KP_ROOT_REWRITE_RECIPE_AUTHORITY =
  "recipe.equation.radical-inversion.v1" as const;
export const KP_ROOT_REWRITE_GENERATION_CORPUS_AUTHORITY =
  "corpus.equation.radical-inversion.v1" as const;
export const KP_ROOT_REWRITE_PROMOTED_ANIMATION_ID =
  "animation.algebra.radical.compound-carrier-normalization" as const;

export interface KpRootRewriteAuthoringRequest {
  readonly schemaVersion: "kp.root-rewrite-authoring-request.v1";
  readonly id: string;
  readonly animationId: string;
  readonly naturalLanguage: string;
  readonly sourceLatex: string;
  readonly targetLatex?: string;
  readonly draft: KpRootRewritePlanInput;
}

export type KpRootRewriteAuthoringResult =
  | Readonly<{
      status: "accepted";
      plan: KpVerifiedRootRewritePlan;
      recipeAuthorityId: typeof KP_ROOT_REWRITE_RECIPE_AUTHORITY;
    }>
  | Readonly<{
      status: "repair-required";
      code: "root-rewrite.no-valid-law";
      message: string;
      repair: string;
    }>;

export type KpRootRewriteAuthoringCorpusCase = Readonly<{
  id: string;
  expectedStatus: KpRootRewriteAuthoringResult["status"];
  request: KpRootRewriteAuthoringRequest;
}>;

/**
 * The author supplies semantic intent and evidence; the root compiler remains
 * the sole authority that may turn those fields into executable dispositions.
 */
export function compileKpRootRewriteAuthoringRequest(
  request: KpRootRewriteAuthoringRequest
): KpRootRewriteAuthoringResult {
  const result = compileKpRootRewritePlan(request.draft);
  if (result.status === "typed-gap") {
    return Object.freeze({
      status: "repair-required" as const,
      code: result.diagnostic.code,
      message: result.diagnostic.message,
      repair: result.diagnostic.repair
    });
  }
  return Object.freeze({
    status: "accepted" as const,
    plan: result.plan,
    recipeAuthorityId: KP_ROOT_REWRITE_RECIPE_AUTHORITY
  });
}

export const kpRootRewriteAuthoringCorpus = Object.freeze({
  schemaVersion: "kp.root-rewrite-authoring-corpus.v1" as const,
  id: KP_ROOT_REWRITE_GENERATION_CORPUS_AUTHORITY,
  cases: Object.freeze(createCorpusCases())
});

export function evaluateKpRootRewriteAuthoringCorpus(): Readonly<{
  status: "passed" | "failed";
  acceptedCount: number;
  repairCount: number;
}> {
  let acceptedCount = 0;
  let repairCount = 0;
  for (const entry of kpRootRewriteAuthoringCorpus.cases) {
    const result = compileKpRootRewriteAuthoringRequest(entry.request);
    if (result.status !== entry.expectedStatus) {
      return Object.freeze({ status: "failed", acceptedCount, repairCount });
    }
    if (result.status === "accepted") acceptedCount += 1;
    else repairCount += 1;
  }
  return Object.freeze({ status: "passed", acceptedCount, repairCount });
}

function createCorpusCases(): readonly KpRootRewriteAuthoringCorpusCase[] {
  const nested = kpRootCompositionPressureCorpus.cases.find((entry) =>
    entry.kind === "nested-root-pressure-case");
  const composed = kpRootCompositionPressureCorpus.cases.find((entry) =>
    entry.kind === "composed-root-pressure-case");
  const blocked = kpRootCompositionPressureCorpus.cases.find((entry) =>
    entry.kind === "blocked-root-pressure-case");
  if (nested?.kind !== "nested-root-pressure-case" ||
      composed?.kind !== "composed-root-pressure-case" ||
      blocked?.kind !== "blocked-root-pressure-case") {
    throw new Error("Root promotion corpus is incomplete.");
  }
  return [
    corpusCase("root-authoring.compound-carrier", "accepted",
      requestForPlan({
        id: "request.root.compound-carrier",
        animationId: KP_ROOT_REWRITE_PROMOTED_ANIMATION_ID,
        naturalLanguage:
          "Rewrite the principal square root of this squared expression as an absolute value.",
        sourceLatex: kpCompoundRootCarrierExemplar.states[0].latex,
        targetLatex: kpCompoundRootCarrierExemplar.states[1].latex,
        plan: kpCompoundRootCarrierExemplar.plan
      })),
    corpusCase("root-authoring.nested-index-composition", "accepted",
      requestForPlan({
        id: "request.root.nested-index-composition",
        animationId: "animation.generated.root.nested-index-composition",
        naturalLanguage: "Compose the nested square roots into a fourth root.",
        sourceLatex: nested.states[0].latex,
        targetLatex: nested.states[1].latex,
        plan: nested.plan
      })),
    corpusCase("root-authoring.factoring-first", "accepted",
      requestForPlan({
        id: "request.root.factoring-first",
        animationId: "animation.generated.root.factoring-first",
        naturalLanguage:
          "Factor the perfect-square trinomial before normalizing the root.",
        sourceLatex: composed.states[0].latex,
        targetLatex: composed.states[2].latex,
        plan: composed.plan
      })),
    corpusCase("root-authoring.blocked-distribution", "repair-required",
      Object.freeze({
        schemaVersion: "kp.root-rewrite-authoring-request.v1" as const,
        id: "request.root.blocked-distribution",
        animationId: "animation.generated.root.invalid-sum-distribution",
        naturalLanguage: "Distribute this root over the sum.",
        sourceLatex: blocked.source.latex,
        draft: Object.freeze({
          schemaVersion: "kp.root-rewrite-plan-draft.v1" as const,
          id: "plan.root.blocked-authoring-distribution",
          operationClass: "blocked-rewrite" as const,
          vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
          sourceStateId: blocked.source.id,
          roleBindings: Object.freeze({
            "source-expression":
              blocked.source.occurrences["expression"]!
          }),
          evidence: Object.freeze({
            "no-valid-root-law": "evidence.root.no-sum-distribution"
          }),
          priorOperationIds: Object.freeze([]) as readonly []
        } satisfies KpBlockedRootRewriteDraft)
      }))
  ];
}

function requestForPlan(input: {
  id: string;
  animationId: string;
  naturalLanguage: string;
  sourceLatex: string;
  targetLatex: string;
  plan: KpVerifiedRootRewritePlan;
}): KpRootRewriteAuthoringRequest {
  // Recompilation proves that serialized semantic authority, not object
  // provenance or caller geometry, is sufficient to recover the same plan.
  const draft = Object.freeze({
    schemaVersion: "kp.root-rewrite-plan-draft.v1" as const,
    id: `${input.plan.id}.authoring-round-trip`,
    operationClass: input.plan.operationClass,
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: input.plan.sourceStateId,
    targetStateId: input.plan.targetStateId,
    roleBindings: input.plan.roleBindings,
    evidence: input.plan.evidence,
    priorOperationIds: input.plan.priorOperationIds
  }) as KpRootRewritePlanDraft;
  return Object.freeze({
    schemaVersion: "kp.root-rewrite-authoring-request.v1" as const,
    id: input.id,
    animationId: input.animationId,
    naturalLanguage: input.naturalLanguage,
    sourceLatex: input.sourceLatex,
    targetLatex: input.targetLatex,
    draft
  });
}

function corpusCase(
  id: string,
  expectedStatus: KpRootRewriteAuthoringResult["status"],
  request: KpRootRewriteAuthoringRequest
): KpRootRewriteAuthoringCorpusCase {
  return Object.freeze({ id, expectedStatus, request });
}

export const kpRootRewritePromotionAuthorities = Object.freeze({
  operationAuthorityId: KP_ROOT_REWRITE_PLAN_AUTHORITY,
  recipeAuthorityId: KP_ROOT_REWRITE_RECIPE_AUTHORITY,
  authoringAuthorityId: KP_ROOT_REWRITE_AUTHORING_AUTHORITY,
  corpusAuthorityId: KP_ROOT_REWRITE_GENERATION_CORPUS_AUTHORITY,
  exemplarAnimationId: KP_ROOT_REWRITE_PROMOTED_ANIMATION_ID
});
