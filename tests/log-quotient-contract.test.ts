import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalLogQuotientContract,
  kpCanonicalLogQuotientContract
} from "../src/semantic/log-quotient-contract.ts";
import {
  kpCanonicalLogQuotientStates,
  listKpLogQuotientExpressionNodes
} from "../src/semantic/log-quotient-states.ts";

test("log quotient contract fixes exact endpoint trees and rewind text", () => {
  assert.deepEqual(
    kpCanonicalLogQuotientStates.map(({ id, kind, latex }) => ({ id, kind, latex })),
    [
      {
        id: "log-quotient.state.difference",
        kind: "log-difference",
        latex: "\\ln(x)-\\ln(y)"
      },
      {
        id: "log-quotient.state.quotient",
        kind: "log-of-quotient",
        latex: "\\ln(\\frac{x}{y})"
      }
    ]
  );
  assert.deepEqual(kpCanonicalLogQuotientContract.rewind, {
    targetStateId: "log-quotient.state.difference",
    exactLatex: "\\ln(x)-\\ln(y)"
  });
  assert.equal(kpCanonicalLogQuotientContract.rewriteFrontier.kind, "standalone-expression");
  assert.deepEqual(kpCanonicalLogQuotientContract.rewriteFrontier.anchoredContextSemanticIds, []);
});

test("x, y, and one logarithm wrapper retain semantic identity across endpoints", () => {
  const sourceIds = listKpLogQuotientExpressionNodes(kpCanonicalLogQuotientContract.source)
    .map(({ semanticId }) => semanticId);
  const targetIds = listKpLogQuotientExpressionNodes(kpCanonicalLogQuotientContract.target)
    .map(({ semanticId }) => semanticId);
  for (const semanticId of kpCanonicalLogQuotientContract.materialPolicy.persistentSemanticIds) {
    assert.equal(sourceIds.includes(semanticId), true, `source lacks ${semanticId}`);
    assert.equal(targetIds.includes(semanticId), true, `target lacks ${semanticId}`);
  }
  assert.deepEqual(
    kpCanonicalLogQuotientContract.structuralRequirements.map(({ kind }) => kind),
    [
      "preserve-shell",
      "retire-shell-after-material-departs",
      "retire-operator-after-operands-depart",
      "introduce-shell-after-material-arrives"
    ]
  );
});

test("subtraction and the fraction bar are causally related but never identical", () => {
  const pair = kpCanonicalLogQuotientContract.materialPolicy.forbiddenIdentityPairs[0];
  assert.deepEqual(pair, {
    sourceSemanticId: "semantic.log-quotient.operator.subtract",
    targetSemanticId: "semantic.log-quotient.shell.fraction-bar",
    reason: "The subtraction licenses the quotient rewrite but is not the fraction bar."
  });
  assert.equal(
    kpCanonicalLogQuotientContract.materialPolicy.retiringSemanticIds.includes(
      "semantic.log-quotient.operator.subtract"
    ),
    true
  );
  assert.equal(
    kpCanonicalLogQuotientContract.materialPolicy.introducedSemanticIds.includes(
      "semantic.log-quotient.shell.fraction-bar"
    ),
    true
  );
});

test("contract rejects an endpoint pair that cannot reconstruct the source exactly", () => {
  assert.throws(
    () => createKpCanonicalLogQuotientContract({
      states: [kpCanonicalLogQuotientStates[1], kpCanonicalLogQuotientStates[0]]
    }),
    /exact ordered endpoint pair/
  );
});
