import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionExpressionChain,
  verifyKpFoldableDistributionExpressionChain
} from "../src/semantic/foldable-distribution-expression-chain.ts";
import {
  kpFoldableDistributionPreservationManifest as manifest
} from "../src/reader/compiler/foldable-distribution-preservation-manifest.ts";
import {
  createKpStructuredExpression,
  listKpStructuredExpressionSubtrees
} from "../src/semantic/structured-expression.ts";

test("foldable distribution chain constructs the four frozen source states", () => {
  const chain = createKpFoldableDistributionExpressionChain();

  assert.deepEqual(
    chain.map(({ id, latex }) => ({ id, latex })),
    manifest.expressionChain
  );
  assert.ok(Object.isFrozen(chain));
  assert.ok(chain.every(({ expression }) => Object.isFrozen(expression.root)));
  assert.ok(chain.every(({ expression }) => {
    const ids = listKpStructuredExpressionSubtrees(expression).map(({ id }) => id);
    return new Set(ids).size === ids.length;
  }));
});

test("every foldable distribution state independently normalizes to 5x plus 4", () => {
  const verification = verifyKpFoldableDistributionExpressionChain(
    createKpFoldableDistributionExpressionChain()
  );

  assert.equal(verification.ok, true, verification.diagnostics.join("\n"));
  assert.deepEqual(verification.expected, {
    coefficients: { x: 5 },
    constant: 4
  });
  assert.deepEqual(
    verification.stateNormalForms,
    Array.from({ length: 4 }, () => ({
      coefficients: { x: 5 },
      constant: 4
    }))
  );
});

test("expression-chain verification rejects silent algebra drift", () => {
  const chain = createKpFoldableDistributionExpressionChain();
  const drifted = [
    ...chain.slice(0, 3),
    {
      ...chain[3]!,
      expression: createKpStructuredExpression({
        root: {
          id: "drifted.root",
          kind: "sum",
          terms: [
            {
              id: "drifted.term-6x",
              kind: "product",
              factors: [
                { id: "drifted.coefficient-6", kind: "number", value: 6 },
                { id: "drifted.x", kind: "symbol", name: "x" }
              ]
            },
            { id: "drifted.constant-4", kind: "number", value: 4 }
          ]
        }
      })
    }
  ];
  const verification = verifyKpFoldableDistributionExpressionChain(drifted);

  assert.equal(verification.ok, false);
  assert.match(
    verification.diagnostics.join("\n"),
    /collected normalizes to.*\"x\":6/
  );

  const incomplete = verifyKpFoldableDistributionExpressionChain(chain.slice(1));
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.diagnostics[0] ?? "", /Expected 4 expression states/);
});
