import assert from "node:assert/strict";
import test from "node:test";

import { createKpOpaqueFractionFanOutFixture } from "../src/semantic/fraction-fan-out-fixture.ts";
import {
  createKpVerifiedFractionFactoringFixture,
  verifyKpFractionReverseFactoring
} from "../src/semantic/fraction-reverse-factoring.ts";
import { createKpStructuredExpression } from "../src/semantic/structured-expression.ts";

test("fraction factoring is the verified inverse of opaque subtree distribution", () => {
  const fixture = createKpVerifiedFractionFactoringFixture();

  assert.equal(fixture.verification.lawId, "kp.algebra.factor.v1");
  assert.equal(fixture.verification.reverseLawId, "kp.algebra.distribute.v1");
  assert.equal(fixture.verification.sourceRootId, fixture.distributed.root.id);
  assert.equal(fixture.verification.targetRootId, fixture.factored.root.id);
  assert.deepEqual(fixture.verification.lineage[0], {
    relation: "fan-in",
    sourceSubtreeIds: [
      "fraction-fan-out.target.factor.x",
      "fraction-fan-out.target.factor.6"
    ],
    targetSubtreeIds: ["fraction-fan-out.source.factor"]
  });
});

test("reverse factoring rejects a factored denominator that cannot redistribute", () => {
  const fanOut = createKpOpaqueFractionFanOutFixture();
  const factored = createKpStructuredExpression({
    root: {
      id: "fraction-fan-out.source.root",
      kind: "product",
      factors: [
        {
          id: "fraction-fan-out.source.factor",
          kind: "quotient",
          numerator: {
            id: "fraction-fan-out.source.factor.numerator",
            kind: "number",
            value: 2
          },
          denominator: {
            id: "fraction-fan-out.source.factor.denominator",
            kind: "number",
            value: 4
          }
        },
        {
          id: "fraction-fan-out.source.grouped-sum",
          kind: "sum",
          terms: [
            { id: "fraction-fan-out.source.addend.x", kind: "symbol", name: "x" },
            { id: "fraction-fan-out.source.addend.6", kind: "number", value: 6 }
          ]
        }
      ]
    }
  });
  const result = verifyKpFractionReverseFactoring({
    distributed: fanOut.target,
    factored
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.deepEqual(result.diagnostics.map(({ code, path }) => [code, path]), [
    ["factor-lineage-mismatch", "reverse.roles.factor-copies[0]"],
    ["factor-lineage-mismatch", "reverse.roles.factor-copies[1]"]
  ]);
});
