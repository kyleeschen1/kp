import assert from "node:assert/strict";
import test from "node:test";

import { defineKpFiniteBinderExpansionOperation } from
  "../src/semantic/finite-binder-expansion-operation.ts";
import { defineKpFiniteBinderRange } from
  "../src/semantic/finite-binder-range.ts";
import { proveKpFiniteBinderScope } from
  "../src/semantic/finite-binder-scope-proof.ts";
import {
  normalizeKpFiniteSumSourceEndpoint,
  normalizeKpFiniteSumTargetEndpoint,
  type KpNormalizedFiniteSumSourceEndpoint,
  type KpNormalizedFiniteSumTargetEndpoint
} from "../src/semantic/finite-sum-endpoint-normalizer.ts";

function endpoints(targetLatex = "a_1+a_2+a_3"): Readonly<{
  source: KpNormalizedFiniteSumSourceEndpoint;
  target: KpNormalizedFiniteSumTargetEndpoint;
}> {
  const source = normalizeKpFiniteSumSourceEndpoint("\\sum_{i=1}^{3} a_i");
  const target = normalizeKpFiniteSumTargetEndpoint(targetLatex);
  assert.equal(source.status, "normalized");
  assert.equal(target.status, "normalized");
  if (source.status !== "normalized" || target.status !== "normalized") {
    throw new Error("Expected canonical endpoints.");
  }
  return { source: source.endpoint, target: target.endpoint };
}

function operationInput(targetLatex = "a_1+a_2+a_3") {
  const normalized = endpoints(targetLatex);
  const scope = proveKpFiniteBinderScope(normalized.source.semantic);
  assert.equal(scope.status, "verified");
  if (scope.status !== "verified") throw new Error("Expected scope proof.");
  const range = defineKpFiniteBinderRange(
    normalized.source.semantic,
    scope.proof
  );
  assert.equal(range.status, "verified");
  if (range.status !== "verified") throw new Error("Expected range proof.");
  return {
    ...normalized,
    scopeProof: scope.proof,
    rangeProof: range.range
  };
}

test("canonical expansion derives three distinct ordered body instances", () => {
  const result = defineKpFiniteBinderExpansionOperation(operationInput());
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;

  const { operation } = result;
  assert.deepEqual(
    operation.target.instances.map(({ ordinal, indexValue }) => ({
      ordinal,
      indexValue
    })),
    [
      { ordinal: 0, indexValue: 1 },
      { ordinal: 1, indexValue: 2 },
      { ordinal: 2, indexValue: 3 }
    ]
  );
  const ids = operation.target.instances.map(({ id }) => id);
  assert.equal(new Set(ids).size, 3);
  assert.ok(ids.every((id) => id !== operation.source.semantic.body.id));
  assert.equal(operation.identityPolicy,
    "derive-distinct-occurrences-never-clone-identity");
});

test("one source body and reference derive every target occurrence", () => {
  const result = defineKpFiniteBinderExpansionOperation(operationInput());
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  const templateEdges = result.operation.lineage.filter(({ relation }) =>
    relation === "body-template-instantiates"
  );
  const referenceEdges = result.operation.lineage.filter(({ relation }) =>
    relation === "bound-reference-substitutes-integer"
  );
  assert.equal(templateEdges.length, 3);
  assert.equal(referenceEdges.length, 3);
  assert.equal(new Set(templateEdges.map(({ sourceId }) => sourceId)).size, 1);
  assert.equal(new Set(templateEdges.map(({ targetId }) => targetId)).size, 3);
  assert.equal(Object.isFrozen(result.operation.lineage), true);
});

test("range boundaries derive the first and last references without cloning identity", () => {
  const result = defineKpFiniteBinderExpansionOperation(operationInput());
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;

  const { operation } = result;
  const boundaryEdges = operation.lineage.filter(({ relation }) =>
    relation === "lower-bound-materializes-reference" ||
    relation === "upper-bound-materializes-reference"
  );
  assert.deepEqual(boundaryEdges, [
    {
      sourceId: operation.source.semantic.lowerBound.id,
      targetId: operation.target.instances[0]!.references[0]!.id,
      relation: "lower-bound-materializes-reference",
      ordinal: 0
    },
    {
      sourceId: operation.source.semantic.upperBound.id,
      targetId: operation.target.instances[2]!.references[0]!.id,
      relation: "upper-bound-materializes-reference",
      ordinal: 2
    }
  ]);
  assert.ok(boundaryEdges.every(({ sourceId, targetId }) =>
    sourceId !== targetId
  ));
});

test("sum operator derives connectors without persisting its identity", () => {
  const result = defineKpFiniteBinderExpansionOperation(operationInput());
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  const connectorEdges = result.operation.lineage.filter(({ relation }) =>
    relation === "operator-introduces-connector"
  );
  assert.equal(connectorEdges.length, 2);
  assert.ok(connectorEdges.every(({ sourceId }) =>
    sourceId === result.operation.source.semantic.operator.id
  ));
  assert.ok(result.operation.target.connectors.every(({ id }) =>
    id !== result.operation.source.semantic.operator.id
  ));
});

test("operation rejects term count order and template mismatches", () => {
  const count = defineKpFiniteBinderExpansionOperation(
    operationInput("a_1+a_2")
  );
  const order = defineKpFiniteBinderExpansionOperation(
    operationInput("a_1+a_3+a_2")
  );
  const template = defineKpFiniteBinderExpansionOperation({
    ...operationInput(),
    target: {
      ...operationInput().target,
      terms: operationInput().target.terms.map((term) => ({
        ...term,
        bodySymbol: "b"
      })) as unknown as KpNormalizedFiniteSumTargetEndpoint["terms"]
    }
  });
  assert.equal(count.status === "invalid-expansion"
    ? count.diagnostic.code : undefined,
  "finite-binder-expansion.term-count-mismatch");
  assert.equal(order.status === "invalid-expansion"
    ? order.diagnostic.code : undefined,
  "finite-binder-expansion.term-order-mismatch");
  assert.equal(template.status === "invalid-expansion"
    ? template.diagnostic.code : undefined,
  "finite-binder-expansion.body-template-mismatch");
});

test("operation rejects proofs from another source", () => {
  const input = operationInput();
  const result = defineKpFiniteBinderExpansionOperation({
    ...input,
    rangeProof: { ...input.rangeProof, sourceId: input.source.semantic.body.id }
  });
  assert.equal(result.status === "invalid-expansion"
    ? result.diagnostic.code : undefined,
  "finite-binder-expansion.proof-mismatch");
});

test("expansion operation owns semantics but no motion or arithmetic", () => {
  const result = defineKpFiniteBinderExpansionOperation(operationInput());
  assert.doesNotMatch(
    JSON.stringify(result),
    /trajectory|keyframe|opacity|duration|renderer|sumValue|productValue/u
  );
});
