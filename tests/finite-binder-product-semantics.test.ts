import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
  KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX,
  kpCanonicalFiniteProductExpansionOperation
} from "../src/semantic/canonical-finite-product-expansion.ts";
import {
  normalizeKpFiniteProductSourceEndpoint,
  normalizeKpFiniteProductTargetEndpoint
} from "../src/semantic/finite-product-endpoint-normalizer.ts";
import {
  defineKpFiniteProductExpansionOperation
} from "../src/semantic/finite-product-expansion-operation.ts";
import { defineKpFiniteBinderRange } from
  "../src/semantic/finite-binder-range.ts";
import { proveKpFiniteBinderScope } from
  "../src/semantic/finite-binder-scope-proof.ts";

test("product pressure normalizes its operator, range, template, and implicit adjacency", () => {
  const source = normalizeKpFiniteProductSourceEndpoint(
    KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX
  );
  const target = normalizeKpFiniteProductTargetEndpoint(
    KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX
  );
  assert.equal(source.status, "normalized");
  assert.equal(target.status, "normalized");
  if (source.status !== "normalized" || target.status !== "normalized") return;

  assert.equal(source.endpoint.semantic.operator.operator, "product");
  assert.equal(source.endpoint.semantic.binder.symbol, "k");
  assert.deepEqual([
    source.endpoint.semantic.lowerBound.value,
    source.endpoint.semantic.upperBound.value,
    source.endpoint.semantic.body.sourceLatex
  ], [0, 2, "x_k"]);
  assert.deepEqual(
    target.endpoint.factors.map(({ ordinal, bodySymbol, indexValue }) => ({
      ordinal,
      bodySymbol,
      indexValue
    })),
    [
      { ordinal: 0, bodySymbol: "x", indexValue: 0 },
      { ordinal: 1, bodySymbol: "x", indexValue: 1 },
      { ordinal: 2, bodySymbol: "x", indexValue: 2 }
    ]
  );
  assert.deepEqual(target.endpoint.adjacencies.map((adjacency) => ({
    role: adjacency.role,
    between: adjacency.betweenFactorOrdinals,
    rawLatex: adjacency.rawLatex
  })), [
    { role: "implicit-multiplicative-adjacency", between: [0, 1], rawLatex: "" },
    { role: "implicit-multiplicative-adjacency", between: [1, 2], rawLatex: "" }
  ]);
});

test("canonical product derives distinct ordered factors without evaluating them", () => {
  const operation = kpCanonicalFiniteProductExpansionOperation;
  assert.deepEqual(
    operation.target.instances.map(({ ordinal, indexValue }) => ({
      ordinal,
      indexValue
    })),
    [
      { ordinal: 0, indexValue: 0 },
      { ordinal: 1, indexValue: 1 },
      { ordinal: 2, indexValue: 2 }
    ]
  );
  assert.equal(new Set(operation.target.instances.map(({ id }) => id)).size, 3);
  assert.ok(operation.target.instances.every(({ id }) =>
    id !== operation.source.semantic.body.id
  ));
  assert.equal(operation.arithmeticPolicy,
    "describe-expansion-never-evaluate-product");
  assert.doesNotMatch(
    JSON.stringify(operation),
    /productValue|computedProduct|trajectory|keyframe|opacity|duration|renderer/u
  );
});

test("product operator derives semantic adjacency without inventing connector paint", () => {
  const operation = kpCanonicalFiniteProductExpansionOperation;
  assert.equal(operation.target.adjacencies.length, 2);
  assert.ok(operation.target.adjacencies.every(({ paintPolicy }) =>
    paintPolicy === "no-explicit-connector-glyph"
  ));
  const edges = operation.lineage.filter(({ relation }) =>
    relation === "product-operator-establishes-adjacency"
  );
  assert.equal(edges.length, 2);
  assert.ok(edges.every(({ sourceId }) =>
    sourceId === operation.source.semantic.operator.id
  ));
});

test("product pressure reuses scope and range proofs without weakening them", () => {
  const operation = kpCanonicalFiniteProductExpansionOperation;
  assert.equal(operation.scopeProof.captureAvoidance,
    "proved-by-closed-substitution");
  assert.deepEqual(operation.rangeProof.values, [0, 1, 2]);
  assert.deepEqual(
    operation.lineage.filter(({ relation }) =>
      relation === "lower-bound-materializes-reference" ||
      relation === "upper-bound-materializes-reference"
    ).map(({ relation, ordinal }) => ({ relation, ordinal })),
    [
      { relation: "lower-bound-materializes-reference", ordinal: 0 },
      { relation: "upper-bound-materializes-reference", ordinal: 2 }
    ]
  );
});

test("product operation rejects count, order, template, and proof mismatches", () => {
  const source = normalizeKpFiniteProductSourceEndpoint(
    KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX
  );
  assert.equal(source.status, "normalized");
  if (source.status !== "normalized") return;
  const scope = proveKpFiniteBinderScope(source.endpoint.semantic);
  assert.equal(scope.status, "verified");
  if (scope.status !== "verified") return;
  const range = defineKpFiniteBinderRange(source.endpoint.semantic, scope.proof);
  assert.equal(range.status, "verified");
  if (range.status !== "verified") return;
  const input = (targetLatex: string) => {
    const target = normalizeKpFiniteProductTargetEndpoint(targetLatex);
    assert.equal(target.status, "normalized");
    if (target.status !== "normalized") throw new Error("Expected target.");
    return {
      source: source.endpoint,
      target: target.endpoint,
      scopeProof: scope.proof,
      rangeProof: range.range
    };
  };

  const count = defineKpFiniteProductExpansionOperation(input("x_0x_1"));
  const order = defineKpFiniteProductExpansionOperation(input("x_0x_2x_1"));
  const template = defineKpFiniteProductExpansionOperation(input("y_0y_1y_2"));
  const proof = defineKpFiniteProductExpansionOperation({
    ...input("x_0x_1x_2"),
    rangeProof: { ...range.range, sourceId: source.endpoint.semantic.body.id }
  });
  assert.equal(count.status === "invalid-expansion"
    ? count.diagnostic.code : undefined,
  "finite-product-expansion.factor-count-mismatch");
  assert.equal(order.status === "invalid-expansion"
    ? order.diagnostic.code : undefined,
  "finite-product-expansion.factor-order-mismatch");
  assert.equal(template.status === "invalid-expansion"
    ? template.diagnostic.code : undefined,
  "finite-product-expansion.body-template-mismatch");
  assert.equal(proof.status === "invalid-expansion"
    ? proof.diagnostic.code : undefined,
  "finite-product-expansion.proof-mismatch");
});

test("product endpoint grammar rejects explicit multiplication and malformed factors", () => {
  assert.equal(
    normalizeKpFiniteProductTargetEndpoint("x_0\\cdot x_1\\cdot x_2").status,
    "unsupported-shape"
  );
  assert.equal(
    normalizeKpFiniteProductTargetEndpoint("x_0y_1x_2").status,
    "unsupported-shape"
  );
  assert.equal(
    normalizeKpFiniteProductSourceEndpoint("\\prod_{k=0}^{2} x_j").status,
    "unsupported-shape"
  );
});
