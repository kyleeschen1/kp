import assert from "node:assert/strict";
import test from "node:test";
import { constant, variable } from "../src/math/expression.ts";
import { createKpScalarExpression, createKpTypedMatrixFromRows } from "../src/math/typed-semantic-math.ts";
import { matrixProduct } from "../src/math/matrix-product.ts";
import { MatrixColumnGap, matrixEnvironmentFromProduct } from "../src/experiments/matrix-column-product/environment.ts";
import { columnExampleFromProduct, columnExampleFromVectorProduct, example, beats, numberOf } from "../src/experiments/matrix-column-combinations/model.ts";
import { stageHtml, calculationLatex } from "../src/experiments/matrix-column-combinations/presentation.ts";

const matrix = (id: string, rows: readonly (readonly number[])[]) => createKpTypedMatrixFromRows({ id,
  rows: rows.map((row, i) => row.map((value, j) => createKpScalarExpression({
    id: `${id}.${i}.${j}`, expression: constant(value),
  }))),
});
const product = (left = [[1, 2], [3, 4]], right = [[2], [1]]) => matrixProduct({
  id: "test.Av", left: matrix("test.A", left), right: matrix("test.v", right),
});

test("one real vector column retains every source, coefficient, pair and result reference", () => {
  const source = product(), scene = columnExampleFromVectorProduct(source);
  assert.equal(scene.env.product, source);
  assert.equal(scene.env.A, source.left);
  assert.equal(scene.env.B, source.right);
  assert.equal(scene.env.B.columnCount, 1);
  assert.equal(scene.env.product.result.columnCount, 1);
  assert.equal(scene.env.product.cells.length, 2);
  assert.deepEqual(scene.combination.result.entries.map(numberOf), [4, 10]);
  for (const term of scene.combination.terms) {
    assert.equal(term.coefficient, source.right.rows[term.index]![0]);
    term.pairs.forEach((pair, row) => {
      assert.equal(pair, source.cell(row, 0).dot.pairs[term.index]);
      assert.equal(term.entries[row], pair.product);
    });
  }
  scene.combination.result.entries.forEach((entry, row) => assert.equal(entry, source.result.rows[row]![0]));
});

test("vector cues and native markup describe A v = Av without a phantom column", () => {
  const scene = columnExampleFromVectorProduct(product([[-2, 3], [0.5, 0]], [[0], [-2]]));
  assert.deepEqual(scene.labels, ["A", "v", "Av"]);
  assert.match(scene.beats.find(beat => beat.id === "weights")!.cue, /v₁ = 0 and v₂ = -2/);
  assert.match(scene.beats.at(-1)!.cue, /output vector Av/);
  assert.doesNotMatch(scene.beats.map(beat => beat.cue).join(" "), /\bB\b|\bAB\b|other column|second result/);
  const html = stageHtml(scene);
  assert.match(html, /b-0-0/);
  assert.match(html, /c-1-0/);
  assert.doesNotMatch(html, /[bc]-[01]-1/);
  assert.match(calculationLatex(scene), /-6/);
});

test("the established two-column adapter and default cues retain their contract", () => {
  assert.throws(() => columnExampleFromVectorProduct(product([[1, 2], [3, 4]], [[1, 0], [0, 1]])), MatrixColumnGap);
  assert.throws(() => matrixEnvironmentFromProduct(product()), MatrixColumnGap);
  assert.throws(() => columnExampleFromProduct(product()), MatrixColumnGap);
  assert.equal(example().beats, beats);
  assert.deepEqual(example().labels, ["A", "B", "AB"]);
  assert.throws(() => columnExampleFromVectorProduct(product([[1, 2]], [[1], [2]])), MatrixColumnGap);
});

test("ordinary signed decimals and zero remain valid", () => {
  for (const [left, right, expected] of [
    [[[0, 0], [0, 0]], [[-2], [3]], [0, 0]],
    [[[-2, 3], [4, -1]], [[-1], [2]], [8, -6]],
    [[[0.5, 0], [0, 0.5]], [[-1], [1.5]], [-0.5, 0.75]],
  ] as const) {
    const source = matrixProduct({ id: "test.Av", left: matrix("test.A", left), right: matrix("test.v", right) });
    assert.deepEqual(columnExampleFromVectorProduct(source).combination.result.entries.map(numberOf), expected);
  }
});

test("scientific notation is rejected in factors, intermediate products and final sums", () => {
  const cases = [
    product([[1e-7, 0], [0, 1]], [[0], [1]]),
    product([[1e20, -1e20], [0, 1]], [[10], [10]]),
    product([[6e20, 6e20], [0, 1]], [[1], [1]]),
    product([[0.000001, 0], [0, 1]], [[0.1], [1]]),
  ];
  for (const source of cases) assert.throws(() => columnExampleFromVectorProduct(source),
    (error: unknown) => error instanceof MatrixColumnGap && /scientific notation/.test(error.message));
});

test("unresolved parameters return the typed presentation gap", () => {
  const left = createKpTypedMatrixFromRows({ id: "test.A", rows: [0, 1].map(i => [0, 1].map(j =>
    createKpScalarExpression({ id: `test.x.${i}.${j}`, expression: variable("x") }))) });
  const source = matrixProduct({ id: "test.Av", left, right: matrix("test.v", [[1], [1]]) });
  assert.throws(() => columnExampleFromVectorProduct(source),
    (error: unknown) => error instanceof MatrixColumnGap && error.code === "kp.matrix-column.unsupported");
});
