import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFiniteBinderSemanticId,
  type KpFiniteBinderSource
} from "../src/domain-ir/finite-binder-vocabulary.ts";
import {
  KP_MAX_EXPLICIT_FINITE_BINDER_TERMS,
  defineKpFiniteBinderRange
} from "../src/semantic/finite-binder-range.ts";
import {
  proveKpFiniteBinderScope,
  type KpVerifiedFiniteBinderScope
} from "../src/semantic/finite-binder-scope-proof.ts";
import {
  normalizeKpFiniteSumSourceEndpoint
} from "../src/semantic/finite-sum-endpoint-normalizer.ts";

function source(latex = "\\sum_{i=1}^{3} a_i"): KpFiniteBinderSource {
  const result = normalizeKpFiniteSumSourceEndpoint(latex);
  assert.equal(result.status, "normalized");
  if (result.status !== "normalized") throw new Error("Expected source.");
  return result.endpoint.semantic;
}

function scope(value: KpFiniteBinderSource): KpVerifiedFiniteBinderScope {
  const result = proveKpFiniteBinderScope(value);
  assert.equal(result.status, "verified");
  if (result.status !== "verified") throw new Error("Expected scope proof.");
  return result.proof;
}

test("canonical finite range is inclusive ordered and immutable", () => {
  const value = source();
  const result = defineKpFiniteBinderRange(value, scope(value));
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;

  assert.deepEqual({
    inclusion: result.range.inclusion,
    order: result.range.order,
    lower: result.range.lower,
    upper: result.range.upper,
    cardinality: result.range.cardinality,
    values: result.range.values
  }, {
    inclusion: "closed",
    order: "ascending",
    lower: 1,
    upper: 3,
    cardinality: 3,
    values: [1, 2, 3]
  });
  assert.equal(Object.isFrozen(result.range.values), true);
});

test("single and negative ranges retain deterministic integer order", () => {
  for (const [latex, expected] of [
    ["\\sum_{i=2}^{2} a_i", [2]],
    ["\\sum_{i=-2}^{1} a_i", [-2, -1, 0, 1]]
  ] as const) {
    const value = source(latex);
    const result = defineKpFiniteBinderRange(value, scope(value));
    assert.deepEqual(
      result.status === "verified" ? result.range.values : undefined,
      expected
    );
  }
});

test("range refuses descending bounds rather than evaluating an empty fold", () => {
  const value = source("\\sum_{i=3}^{1} a_i");
  const result = defineKpFiniteBinderRange(value, scope(value));
  assert.equal(
    result.status === "unsupported-range" ? result.diagnostic.code : undefined,
    "finite-binder-range.descending"
  );
});

test("range refuses a proof from another source", () => {
  const value = source();
  const proof = {
    ...scope(value),
    sourceId: createKpFiniteBinderSemanticId("other.sum.source")
  };
  const result = defineKpFiniteBinderRange(value, proof);
  assert.equal(
    result.status === "unsupported-range" ? result.diagnostic.code : undefined,
    "finite-binder-range.scope-mismatch"
  );
});

test("range has a named explicit expansion guard", () => {
  const value = source();
  const upper = value.lowerBound.value + KP_MAX_EXPLICIT_FINITE_BINDER_TERMS;
  const oversized: KpFiniteBinderSource = {
    ...value,
    upperBound: { ...value.upperBound, value: upper }
  };
  const result = defineKpFiniteBinderRange(oversized, scope(oversized));
  assert.equal(
    result.status === "unsupported-range" ? result.diagnostic.code : undefined,
    "finite-binder-range.too-large"
  );
});

test("normalizer refuses unsafe integer bounds before range allocation", () => {
  const result = normalizeKpFiniteSumSourceEndpoint(
    "\\sum_{i=1}^{9007199254740992} a_i"
  );
  assert.equal(result.status, "unsupported-shape");
});

test("range semantics contain no arithmetic or presentation policy", () => {
  const value = source();
  const result = defineKpFiniteBinderRange(value, scope(value));
  assert.doesNotMatch(
    JSON.stringify(result),
    /sumValue|productValue|identityValue|lineage|trajectory|opacity|duration/u
  );
});
