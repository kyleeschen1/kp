import assert from "node:assert/strict";
import test from "node:test";
import { passage, product } from "../src/experiments/dot-product-passage/source.ts";
import { dotPassage, DotPassageGap, valueOf, sample } from "../src/experiments/dot-product-passage/model.ts";
import { constant } from "../src/math/expression.ts";
import { createKpScalarExpression, createKpTypedMatrixFromRows } from "../src/math/typed-semantic-math.ts";
import { matrixProduct } from "../src/math/matrix-product.ts";

test("passage retains the original dot, pair products and result with signed values", () => {
  assert.equal(passage.cell, product.cell(0, 0));
  assert.equal(passage.dot, passage.cell.dot);
  assert.deepEqual(passage.dot.pairs.map(p => valueOf(p.product)), [8, -5, -6]);
  assert.equal(valueOf(passage.dot.result), -3);
  for (const pair of passage.dot.pairs) {
    assert.equal(pair.left, product.left.rows[0]![pair.index]);
    assert.equal(pair.right, product.right.rows[pair.index]![0]);
    assert.notEqual(pair.product.id, pair.left.id);
  }
  assert.ok(Object.isFrozen(passage));
});

test("presentation rejects unsupported lengths, broken references and nonfinite values", () => {
  const scalar = (id: string, n: number) => createKpScalarExpression({ id, expression: constant(n) });
  const make = (values: number[]) => matrixProduct({ id: "test.product",
    left: createKpTypedMatrixFromRows({ id: "test.left", rows: [values.map((n, i) => scalar(`l${i}`, n))] }),
    right: createKpTypedMatrixFromRows({ id: "test.right", rows: values.map((_, i) => [scalar(`r${i}`, 1)]) }),
  }).cell(0, 0);
  assert.throws(() => dotPassage(make([1, 2])), DotPassageGap);
  assert.throws(() => dotPassage(make([1, Infinity, 3])), DotPassageGap);
  assert.throws(() => dotPassage(Object.freeze({ ...passage.cell, result: passage.dot.pairs[0]!.product })), DotPassageGap);
  assert.throws(() => dotPassage({ ...passage.cell }), DotPassageGap);
});

test("sampling has exact native checkpoints and no dependence on playback history", () => {
  for (const [i, id] of ["vectors", "pairs", "products", "addition", "sum"].entries()) {
    const frame = sample(i / 4); assert.equal(frame.beat.id, id); assert.equal(frame.local, 1);
  }
  for (const p of [.1, .28, .45, .61, .78, .95]) {
    const held = sample(p); sample(1); sample(0); assert.deepEqual(sample(p), held);
  }
  assert.throws(() => sample(NaN), DotPassageGap);
});


test("negative notation follows its expression context without changing scalar values", async () => {
  const { calculationLatex, stageHtml } = await import("../src/experiments/dot-product-passage/presentation.ts");
  assert.equal(calculationLatex(passage), "2\\times 4+-1\\times 5+3\\times -2=8+-5+-6=-3");
  const html = stageHtml(passage);
  assert.ok(!html.includes("syntax-pair-left-1-open"));
  assert.ok(!html.includes("syntax-pair-right-2-open"));
  assert.equal(valueOf(passage.dot.pairs[1]!.product), -5);
  assert.equal(valueOf(passage.dot.pairs[2]!.product), -6);
});
