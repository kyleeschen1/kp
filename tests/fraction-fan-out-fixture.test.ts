import assert from "node:assert/strict";
import test from "node:test";

import { createKpOpaqueFractionFanOutFixture } from "../src/semantic/fraction-fan-out-fixture.ts";
import {
  listKpStructuredExpressionSubtrees,
  resolveKpStructuredExpressionSubtree
} from "../src/semantic/structured-expression.ts";

test("fraction fan-out preserves the complete quotient subtree as an opaque factor", () => {
  const fixture = createKpOpaqueFractionFanOutFixture();
  const sourceFactor = resolveKpStructuredExpressionSubtree(
    fixture.source,
    "fraction-fan-out.source.factor"
  );
  const targetFactors = [
    "fraction-fan-out.target.factor.x",
    "fraction-fan-out.target.factor.6"
  ].map((id) => resolveKpStructuredExpressionSubtree(fixture.target, id));

  assert.equal(sourceFactor?.kind, "quotient");
  assert.deepEqual(targetFactors.map((factor) => {
    assert.equal(factor?.kind, "quotient");
    if (factor?.kind !== "quotient") return undefined;
    return [factor.numerator.kind === "number" ? factor.numerator.value : undefined,
      factor.denominator.kind === "number" ? factor.denominator.value : undefined];
  }), [[2, 3], [2, 3]]);
  assert.deepEqual(fixture.normalFormPlan.lineage[0], {
    relation: "fan-out",
    sourceSubtreeIds: ["fraction-fan-out.source.factor"],
    targetSubtreeIds: [
      "fraction-fan-out.target.factor.x",
      "fraction-fan-out.target.factor.6"
    ]
  });
});

test("fraction fan-out retains stable authored identities below every quotient root", () => {
  const fixture = createKpOpaqueFractionFanOutFixture();
  assert.deepEqual(
    listKpStructuredExpressionSubtrees(fixture.target)
      .filter(({ id }) => id.startsWith("fraction-fan-out.target.factor"))
      .map(({ id, kind }) => [id, kind]),
    [
      ["fraction-fan-out.target.factor.x", "quotient"],
      ["fraction-fan-out.target.factor.x.numerator", "number"],
      ["fraction-fan-out.target.factor.x.denominator", "number"],
      ["fraction-fan-out.target.factor.6", "quotient"],
      ["fraction-fan-out.target.factor.6.numerator", "number"],
      ["fraction-fan-out.target.factor.6.denominator", "number"]
    ]
  );
});

test("fraction fan-out rejects a changed denominator inside an otherwise valid target", () => {
  assert.throws(
    () => createKpOpaqueFractionFanOutFixture({ secondCopyDenominator: 4 }),
    /rewrite\.roles\.factor-copies\[1\].*complete semantic subtree/
  );
});
