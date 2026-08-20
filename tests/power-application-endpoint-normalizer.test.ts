import assert from "node:assert/strict";
import test from "node:test";

import { normalizeKpPowerApplicationEndpoint } from
  "../src/semantic/power-application-endpoint-normalizer.ts";

test("normalizes grouped additive exponents with spelling provenance", () => {
  const result = normalizeKpPowerApplicationEndpoint("b^{x+y+z}");
  assert.equal(result.status, "normalized");
  if (result.status !== "normalized") return;
  assert.equal(result.endpoint.rawLatex, "b^{x+y+z}");
  assert.deepEqual(result.endpoint.base, {
    role: "shared-base",
    rawLatex: "b",
    expression: { kind: "identifier", name: "b" }
  });
  assert.equal(result.endpoint.superscriptRegion.grouping, "braces");
  assert.equal(result.endpoint.superscriptRegion.rawLatex, "{x+y+z}");
  assert.equal(result.endpoint.superscriptRegion.contentLatex, "x+y+z");
  assert.equal(result.endpoint.superscriptRegion.combination.kind, "sum");
  assert.deepEqual(
    result.endpoint.superscriptRegion.combination.operands.map((operand) =>
      operand.kind === "identifier" ? operand.name : operand.kind
    ),
    ["x", "y", "z"]
  );
  assert.deepEqual(result.endpoint.superscriptRegion.combination.connectors, [
    { index: 0, operator: "+", role: "source-additive-connector" },
    { index: 1, operator: "+", role: "source-additive-connector" }
  ]);
});

test("normalizes a grouped difference without licensing the sum law", () => {
  const result = normalizeKpPowerApplicationEndpoint("2^(x-y)");
  assert.equal(result.status, "normalized");
  if (result.status !== "normalized") return;
  assert.equal(result.endpoint.base.rawLatex, "2");
  assert.equal(result.endpoint.superscriptRegion.grouping, "parentheses");
  assert.equal(result.endpoint.superscriptRegion.combination.kind, "difference");
  assert.deepEqual(result.endpoint.superscriptRegion.combination.connectors, [{
    index: 0,
    operator: "-",
    role: "source-subtractive-connector"
  }]);
});

test("rejects malformed or ungrouped homomorphic power shapes", () => {
  for (const latex of [
    "b^x+y",
    "b^{xy}",
    "b^{x+y",
    "x+y",
    "b^x"
  ]) {
    const result = normalizeKpPowerApplicationEndpoint(latex);
    assert.equal(result.status, "unsupported-shape", latex);
    if (result.status === "unsupported-shape") {
      assert.equal(result.diagnostic.code,
        "power-application.unsupported-shape");
      assert.match(result.diagnostic.repair, /explicitly grouped/u);
    }
  }
});

test("normalization is deterministic immutable and presentation-free", () => {
  const first = normalizeKpPowerApplicationEndpoint("b^{x+y}");
  const second = normalizeKpPowerApplicationEndpoint("b^{x+y}");
  assert.deepEqual(first, second);
  assert.equal(Object.isFrozen(first), true);
  assert.doesNotMatch(JSON.stringify(first),
    /geometry|timing|opacity|renderer|DOM/u);
});
