import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_FINITE_SUM_ENDPOINT_NORMALIZER,
  normalizeKpFiniteSumSourceEndpoint,
  normalizeKpFiniteSumTargetEndpoint
} from "../src/semantic/finite-sum-endpoint-normalizer.ts";

test("canonical bounded sum normalizes explicit source roles", () => {
  const result = normalizeKpFiniteSumSourceEndpoint(
    "\\sum_{i=1}^{3} a_i"
  );
  assert.equal(result.status, "normalized");
  if (result.status !== "normalized") return;

  assert.equal(result.endpoint.authority, KP_FINITE_SUM_ENDPOINT_NORMALIZER);
  assert.deepEqual({
    operator: result.endpoint.semantic.operator.operator,
    binder: result.endpoint.semantic.binder.symbol,
    lower: result.endpoint.semantic.lowerBound.value,
    upper: result.endpoint.semantic.upperBound.value,
    body: result.endpoint.semantic.body.sourceLatex,
    reference: result.endpoint.semantic.body.references[0]?.symbol
  }, {
    operator: "sum",
    binder: "i",
    lower: 1,
    upper: 3,
    body: "a_i",
    reference: "i"
  });
});

test("canonical expanded target preserves term and connector order", () => {
  const result = normalizeKpFiniteSumTargetEndpoint("a_1+a_2+a_3");
  assert.equal(result.status, "normalized");
  if (result.status !== "normalized") return;

  assert.deepEqual(
    result.endpoint.terms.map(({ ordinal, bodySymbol, indexValue }) => ({
      ordinal,
      bodySymbol,
      indexValue
    })),
    [
      { ordinal: 0, bodySymbol: "a", indexValue: 1 },
      { ordinal: 1, bodySymbol: "a", indexValue: 2 },
      { ordinal: 2, bodySymbol: "a", indexValue: 3 }
    ]
  );
  assert.deepEqual(result.endpoint.connectors.map(({ ordinal, rawLatex }) => ({
    ordinal,
    rawLatex
  })), [{ ordinal: 0, rawLatex: "+" }, { ordinal: 1, rawLatex: "+" }]);
});

test("normalizer accepts authored braces and negative integer limits", () => {
  const source = normalizeKpFiniteSumSourceEndpoint(
    "  \\sum_{j=-2}^{0} B_{j}  "
  );
  const target = normalizeKpFiniteSumTargetEndpoint("B_{-2} + B_{-1} + B_{0}");
  assert.equal(source.status, "normalized");
  assert.equal(target.status, "normalized");
  if (source.status === "normalized") {
    assert.equal(source.endpoint.semantic.lowerBound.value, -2);
    assert.equal(source.endpoint.semantic.upperBound.value, 0);
    assert.equal(source.endpoint.semantic.body.sourceLatex, "B_{j}");
  }
});

test("normalizer fails closed on unbounded symbolic or mismatched forms", () => {
  const unsupported = [
    normalizeKpFiniteSumSourceEndpoint("\\sum_i a_i"),
    normalizeKpFiniteSumSourceEndpoint("\\sum_{i=1}^{n} a_i"),
    normalizeKpFiniteSumSourceEndpoint("\\sum_{i=1}^{3} a_j"),
    normalizeKpFiniteSumSourceEndpoint("\\prod_{i=1}^{3} a_i"),
    normalizeKpFiniteSumTargetEndpoint("a_1+b_2+a_3"),
    normalizeKpFiniteSumTargetEndpoint("a_1-a_2"),
    normalizeKpFiniteSumTargetEndpoint("a_1+a_{i+1}")
  ];
  assert.ok(unsupported.every(({ status }) => status === "unsupported-shape"));
});

test("normalization exposes no legality lineage or presentation authority", () => {
  const source = normalizeKpFiniteSumSourceEndpoint("\\sum_{i=1}^{3} a_i");
  assert.doesNotMatch(
    JSON.stringify(source),
    /scopeProof|capture|lineage|trajectory|keyframe|opacity|duration|renderer/u
  );
});
