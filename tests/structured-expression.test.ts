import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpStructuredExpression,
  listKpStructuredExpressionSubtrees,
  resolveKpStructuredExpressionSubtree,
  type KpStructuredExpressionNode
} from "../src/semantic/structured-expression.ts";

test("structured expressions preserve explicit subtree identity and authored topology", () => {
  const authored = distributionExpression();
  const expression = createKpStructuredExpression({ root: authored });

  assert.equal(expression.schemaVersion, "kp.structured-expression.v1");
  assert.deepEqual(
    listKpStructuredExpressionSubtrees(expression).map((node) => [node.id, node.kind]),
    [
      ["expr.distribution", "product"],
      ["expr.factor.a", "symbol"],
      ["expr.grouped-sum", "sum"],
      ["expr.addend.b", "symbol"],
      ["expr.addend.c", "symbol"]
    ]
  );
  assert.equal(
    resolveKpStructuredExpressionSubtree(expression, "expr.grouped-sum")?.kind,
    "sum"
  );
  assert.equal(resolveKpStructuredExpressionSubtree(expression, "missing"), undefined);
  assert.notEqual(expression.root, authored);
  assert.ok(Object.isFrozen(expression));
  assert.ok(Object.isFrozen(expression.root));
});

test("structured expression identity survives equivalent reconstruction", () => {
  const first = createKpStructuredExpression({ root: distributionExpression() });
  const second = createKpStructuredExpression({ root: distributionExpression() });

  assert.deepEqual(first, second);
  assert.notEqual(first.root, second.root);
  assert.deepEqual(
    listKpStructuredExpressionSubtrees(first).map((node) => node.id),
    listKpStructuredExpressionSubtrees(second).map((node) => node.id)
  );
});

test("structured expressions reject ambiguous or invalid subtree contracts", () => {
  assert.throws(() => createKpStructuredExpression({
    root: {
      id: "expr.duplicate",
      kind: "sum",
      terms: [
        { id: "expr.term", kind: "symbol", name: "x" },
        { id: "expr.term", kind: "number", value: 1 }
      ]
    }
  }), /duplicates subtree id expr\.term/);
  assert.throws(() => createKpStructuredExpression({
    root: { id: "expr.invalid-sum", kind: "sum", terms: [] }
  }), /requires at least two children/);
  assert.throws(() => createKpStructuredExpression({
    root: { id: "expr.invalid-number", kind: "number", value: Number.NaN }
  }), /must be finite/);
  assert.throws(() => createKpStructuredExpression({
    root: { id: "expr.invalid-symbol", kind: "symbol", name: " " }
  }), /name must not be empty/);
});

test("structured expressions reject cyclic authored objects", () => {
  const cyclic = {
    id: "expr.cycle",
    kind: "negate" as const,
    value: undefined as unknown as KpStructuredExpressionNode
  };
  cyclic.value = cyclic;
  assert.throws(
    () => createKpStructuredExpression({ root: cyclic }),
    /contains a cycle at subtree expr\.cycle/
  );
});

function distributionExpression(): KpStructuredExpressionNode {
  return {
    id: "expr.distribution",
    kind: "product",
    factors: [
      { id: "expr.factor.a", kind: "symbol", name: "a" },
      {
        id: "expr.grouped-sum",
        kind: "sum",
        terms: [
          { id: "expr.addend.b", kind: "symbol", name: "b" },
          { id: "expr.addend.c", kind: "symbol", name: "c" }
        ]
      }
    ]
  };
}
