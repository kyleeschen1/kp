import { createKpFiniteBinderCausalRecipe } from
  "../domain-ir/finite-binder-causal-recipe.ts";
import {
  defineKpFiniteBinderExpansionOperation,
  type KpVerifiedFiniteBinderExpansionOperation
} from "./finite-binder-expansion-operation.ts";
import { kpFiniteBinderCaseLedger } from "./finite-binder-case-ledger.ts";
import { defineKpFiniteBinderRange } from "./finite-binder-range.ts";
import { proveKpFiniteBinderScope } from "./finite-binder-scope-proof.ts";
import {
  normalizeKpFiniteSumSourceEndpoint,
  normalizeKpFiniteSumTargetEndpoint
} from "./finite-sum-endpoint-normalizer.ts";

export const KP_FINITE_BINDER_EXPANSION_CORPUS_AUTHORITY =
  "corpus.equation.finite-binder-expansion.v1" as const;

export interface KpFiniteBinderCorpusRequest {
  readonly id: string;
  readonly sourceLatex: string;
  readonly targetLatex?: string | undefined;
}

export type KpFiniteBinderCorpusResult =
  | Readonly<{
      status: "accepted";
      operation: KpVerifiedFiniteBinderExpansionOperation;
      recipeId: "recipe.equation.finite-binder-expansion.v1";
    }>
  | Readonly<{
      status: "repair-required";
      code:
        | "finite-binder-corpus.target-required"
        | "finite-binder-corpus.source-unsupported"
        | "finite-binder-corpus.target-unsupported"
        | "finite-binder-corpus.scope-illegal"
        | "finite-binder-corpus.range-unsupported"
        | "finite-binder-corpus.expansion-invalid";
      causeCode: string;
      message: string;
      repair: string;
    }>;

export interface KpFiniteBinderCorpusCase {
  readonly id: string;
  readonly expectedStatus: KpFiniteBinderCorpusResult["status"];
  readonly request: KpFiniteBinderCorpusRequest;
}

export const kpFiniteBinderExpansionCorpus = Object.freeze({
  schemaVersion: "kp.finite-binder-expansion-corpus.v1" as const,
  kind: "finite-binder-expansion-corpus" as const,
  authority: KP_FINITE_BINDER_EXPANSION_CORPUS_AUTHORITY,
  cases: Object.freeze(kpFiniteBinderCaseLedger.cases.map((entry) =>
    Object.freeze({
      id: `corpus.${entry.id}`,
      expectedStatus: entry.disposition === "verified-direct-expansion"
        ? "accepted" as const
        : "repair-required" as const,
      request: Object.freeze({
        id: `request.${entry.id}`,
        sourceLatex: entry.sourceLatex,
        ...(entry.targetLatex === undefined ? {} : {
          targetLatex: entry.targetLatex
        })
      })
    })
  ))
});

/**
 * Corpus compilation exercises the actual semantic authority chain. Every
 * unsupported shape returns a typed repair; none may fall through to a visual
 * approximation or a generic animation.
 */
export function compileKpFiniteBinderCorpusRequest(
  request: KpFiniteBinderCorpusRequest
): KpFiniteBinderCorpusResult {
  const source = normalizeKpFiniteSumSourceEndpoint(request.sourceLatex);
  if (source.status !== "normalized") {
    return repair("finite-binder-corpus.source-unsupported",
      source.diagnostic.code, source.diagnostic.message,
      source.diagnostic.repair);
  }
  const scope = proveKpFiniteBinderScope(source.endpoint.semantic);
  if (scope.status !== "verified") {
    return repair("finite-binder-corpus.scope-illegal",
      scope.diagnostic.code, scope.diagnostic.message,
      scope.diagnostic.repair);
  }
  const range = defineKpFiniteBinderRange(
    source.endpoint.semantic,
    scope.proof
  );
  if (range.status !== "verified") {
    return repair("finite-binder-corpus.range-unsupported",
      range.diagnostic.code, range.diagnostic.message,
      range.diagnostic.repair);
  }
  if (request.targetLatex === undefined) {
    return repair("finite-binder-corpus.target-required",
      "finite-binder-corpus.target-required",
      "A direct finite expansion requires an explicit target endpoint.",
      "Provide the exact ordered target or choose a different semantic operation.");
  }
  const target = normalizeKpFiniteSumTargetEndpoint(request.targetLatex);
  if (target.status !== "normalized") {
    return repair("finite-binder-corpus.target-unsupported",
      target.diagnostic.code, target.diagnostic.message,
      target.diagnostic.repair);
  }
  const operation = defineKpFiniteBinderExpansionOperation({
    source: source.endpoint,
    target: target.endpoint,
    scopeProof: scope.proof,
    rangeProof: range.range
  });
  if (operation.status !== "verified") {
    return repair("finite-binder-corpus.expansion-invalid",
      operation.diagnostic.code, operation.diagnostic.message,
      operation.diagnostic.repair);
  }
  const recipe = createKpFiniteBinderCausalRecipe(operation.operation);
  return Object.freeze({
    status: "accepted" as const,
    operation: operation.operation,
    recipeId: recipe.recipe
  });
}

export function evaluateKpFiniteBinderExpansionCorpus(): Readonly<{
  status: "passed" | "failed";
  acceptedCount: number;
  repairCount: number;
}> {
  let acceptedCount = 0;
  let repairCount = 0;
  for (const candidate of kpFiniteBinderExpansionCorpus.cases) {
    const result = compileKpFiniteBinderCorpusRequest(candidate.request);
    if (result.status !== candidate.expectedStatus) {
      return Object.freeze({ status: "failed", acceptedCount, repairCount });
    }
    if (result.status === "accepted") acceptedCount += 1;
    else repairCount += 1;
  }
  return Object.freeze({ status: "passed", acceptedCount, repairCount });
}

function repair(
  code: Extract<KpFiniteBinderCorpusResult, {
    status: "repair-required";
  }>["code"],
  causeCode: string,
  message: string,
  repairText: string
): KpFiniteBinderCorpusResult {
  return Object.freeze({
    status: "repair-required" as const,
    code,
    causeCode,
    message,
    repair: repairText
  });
}
