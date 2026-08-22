import {
  defineKpFiniteProductExpansionOperation
} from "./finite-product-expansion-operation.ts";
import {
  normalizeKpFiniteProductSourceEndpoint,
  normalizeKpFiniteProductTargetEndpoint
} from "./finite-product-endpoint-normalizer.ts";
import { defineKpFiniteBinderRange } from "./finite-binder-range.ts";
import { proveKpFiniteBinderScope } from "./finite-binder-scope-proof.ts";

export const KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX =
  "\\prod_{k=0}^{2} x_k" as const;
export const KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX =
  "x_0x_1x_2" as const;

const source = normalizeKpFiniteProductSourceEndpoint(
  KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX
);
const target = normalizeKpFiniteProductTargetEndpoint(
  KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX
);
if (source.status !== "normalized" || target.status !== "normalized") {
  throw new Error("Canonical finite-product endpoints failed normalization.");
}
const scope = proveKpFiniteBinderScope(source.endpoint.semantic);
if (scope.status !== "verified") {
  throw new Error(`Canonical finite-product scope failed: ${scope.diagnostic.message}`);
}
const range = defineKpFiniteBinderRange(source.endpoint.semantic, scope.proof);
if (range.status !== "verified") {
  throw new Error(`Canonical finite-product range failed: ${range.diagnostic.message}`);
}
const operation = defineKpFiniteProductExpansionOperation({
  source: source.endpoint,
  target: target.endpoint,
  scopeProof: scope.proof,
  rangeProof: range.range
});
if (operation.status !== "verified") {
  throw new Error(
    `Canonical finite-product expansion failed: ${operation.diagnostic.message}`
  );
}

/**
 * This fixture proves product semantics only. It does not authorize reuse of
 * the approved sum choreography; the next slice owns product presentation.
 */
export const kpCanonicalFiniteProductExpansionOperation = operation.operation;
