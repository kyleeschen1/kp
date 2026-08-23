import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpLogProductEquivalenceOccurrencesV2,
  isKpCompiledLogProductEquivalenceOccurrencesV2
} from "../src/domain-ir/log-product-equivalence-occurrences-v2.ts";
import {
  kpCanonicalCompiledLogProductOperation,
  kpMultiFactorCompiledLogProductOperation
} from "../src/semantic/log-product-transformation-compiler.ts";

test("binary log equivalence has explicit retained, relation, copy, and target occurrences", () => {
  const ledger = compile(kpCanonicalCompiledLogProductOperation);
  assert.equal(isKpCompiledLogProductEquivalenceOccurrencesV2(ledger), true);
  assert.equal(ledger.retainedWitness.kind, "retained-witness");
  assert.equal(ledger.equality.kind, "equality");
  assert.equal(ledger.provenanceCopies.length, 2);
  assert.equal(ledger.target.kind, "native-target");
  assert.deepEqual(
    ledger.provenanceCopies.map(({ factorSemanticId }) => factorSemanticId),
    ["semantic.log-product.variable.x", "semantic.log-product.variable.y"]
  );
});

test("every semantic occurrence has exclusive paint identity", () => {
  const ledger = compile(kpCanonicalCompiledLogProductOperation);
  const paintIds = [
    ledger.retainedWitness.paintOccurrenceId,
    ledger.equality.paintOccurrenceId,
    ...ledger.provenanceCopies.map(({ paintOccurrenceId }) => paintOccurrenceId),
    ledger.target.paintOccurrenceId
  ];
  assert.equal(new Set(paintIds).size, paintIds.length);
  assert.equal(ledger.provenanceCopies.some(({ paintOccurrenceId }) =>
    paintOccurrenceId === ledger.retainedWitness.paintOccurrenceId), false);
});

test("occurrence compilation scales from two to three provenance branches", () => {
  const ledger = compile(kpMultiFactorCompiledLogProductOperation);
  assert.equal(ledger.provenanceCopies.length, 3);
  ledger.provenanceCopies.forEach((copy) => {
    assert.equal(copy.correspondenceRecordIds.length, 5);
    assert.equal(copy.sourceEntityIds.length, 5);
    assert.equal(copy.targetEntityIds.length, 5);
  });
});

test("copies cannot manufacture compiler authority", () => {
  assert.throws(() => compileKpLogProductEquivalenceOccurrencesV2({
    transitionId: "transition.log-product.fixture",
    relationStateId: "state.log-product-equivalence.relation",
    relationEntityId: "selector.log-product-equivalence.relation",
    operation: { ...kpCanonicalCompiledLogProductOperation }
  }), /canonical compiled operation/);
});

function compile(
  operation: typeof kpCanonicalCompiledLogProductOperation
) {
  return compileKpLogProductEquivalenceOccurrencesV2({
    transitionId: `transition.${operation.transformation.id}`,
    relationStateId: "state.log-product-equivalence.relation",
    relationEntityId: "selector.log-product-equivalence.relation",
    operation
  });
}
