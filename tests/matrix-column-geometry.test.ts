import assert from 'node:assert/strict';
import test from 'node:test';
import { constant, variable } from '../src/math/expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows } from '../src/math/typed-semantic-math.ts';
import { matrixProduct } from '../src/math/matrix-product.ts';
import { MatrixColumnGap } from '../src/experiments/matrix-column-product/environment.ts';
import { numberOf } from '../src/experiments/matrix-column-combinations/model.ts';
import { prepareColumnGeometry, sampleColumnGeometry, type ColumnPoint } from '../src/matrix-reference/column-geometry.ts';

const matrix = (id: string, rows: readonly (readonly number[])[]) => createKpTypedMatrixFromRows({ id,
  rows: rows.map((row, i) => row.map((value, j) => createKpScalarExpression({ id: `${id}.${i}.${j}`, expression: constant(value) }))),
});
const product = (left = [[1, 2], [3, 4]], right = [[2], [1]]) => matrixProduct({
  id: 'geometry.Av', left: matrix('geometry.A', left), right: matrix('geometry.v', right),
});
const near = (actual: ColumnPoint, expected: ColumnPoint) => actual.forEach((value, index) =>
  assert.ok(Math.abs(value - expected[index]!) < 1e-10, `${actual} differs from ${expected}`));

test('geometry retains original column, coefficient, contribution and result identities', () => {
  const source = product(), prepared = prepareColumnGeometry(source);
  assert.equal(prepared.scene.env.product, source);
  assert.equal(prepared.productId, source.id);
  assert.equal(prepared.matrixId, source.left.id);
  assert.equal(prepared.inputId, source.right.id);
  prepared.terms.forEach((term, index) => {
    const original = prepared.scene.combination.terms[index]!;
    assert.equal(term.columnId, original.vector.id);
    assert.equal(term.coefficientId, original.coefficient.id);
    assert.deepEqual(term.columnEntryIds, original.vector.entries.map(entry => entry.id));
    assert.deepEqual(term.productEntryIds, original.entries.map(entry => entry.id));
    assert.deepEqual(term.column, original.vector.entries.map(numberOf));
    assert.deepEqual(term.contribution, original.entries.map(numberOf));
    assert.equal(term.weight, numberOf(original.coefficient));
  });
  assert.equal(prepared.result.matrixId, source.result.id);
  assert.equal(prepared.result.id, prepared.scene.combination.result.id);
  assert.deepEqual(prepared.result.entryIds, source.result.rows.map(row => row[0]!.id));
  assert.deepEqual(prepared.result.value, [4, 10]);
});

test('seven existing checkpoints move columns to signed contributions and a head-to-tail sum', () => {
  const prepared = prepareColumnGeometry(product([[-2, 3], [4, -1]], [[-1], [2]]));
  const at = (phase: number) => sampleColumnGeometry(prepared, phase / 6);
  assert.deepEqual(Array.from({ length: 7 }, (_, phase) => at(phase).beatId),
    ['initial', 'columns', 'weights', 'distribute', 'scaled', 'sum', 'placed']);
  for (const phase of [0, 1, 2, 3]) {
    assert.deepEqual(at(phase).terms.map(term => term.start), [[0, 0], [0, 0]]);
    assert.deepEqual(at(phase).terms.map(term => term.end), [[-2, 4], [3, -1]]);
    assert.equal(at(phase).result.visible, false);
  }
  assert.deepEqual(at(4).terms.map(term => term.end), [[2, -4], [6, -2]]);
  assert.deepEqual(at(4).terms.map(term => term.start), [[0, 0], [0, 0]]);
  assert.deepEqual(at(5).terms.map(term => term.start), [[0, 0], [2, -4]]);
  assert.deepEqual(at(5).terms.map(term => term.end), [[2, -4], [8, -6]]);
  assert.deepEqual(at(5).result.end, [8, -6]);
  assert.equal(at(5).result.visible, true);
  assert.deepEqual(at(6).terms, at(5).terms);
  const scaling = sampleColumnGeometry(prepared, 3.5 / 6);
  near(scaling.terms[0]!.end, [0, 0]);
  near(scaling.terms[1]!.end, [4.5, -1.5]);
  const translating = sampleColumnGeometry(prepared, 4.5 / 6);
  near(translating.terms[1]!.start, [1, -2]);
  near(translating.terms[1]!.end, [7, -4]);
  assert.equal(translating.result.visible, false);
});

test('zero vectors, zero weights and complete cancellation preserve stable endpoints', () => {
  for (const [left, right, expected] of [
    [[[0, 0], [0, 0]], [[-2], [3]], [0, 0]],
    [[[5, 2], [-3, 7]], [[0], [0]], [0, 0]],
    [[[5, 5], [-3, -3]], [[2], [-2]], [0, 0]],
    [[[5, 2], [-3, 7]], [[0], [2]], [4, 14]],
  ] as const) {
    const prepared = prepareColumnGeometry(matrixProduct({ id: 'zero.Av', left: matrix('zero.A', left), right: matrix('zero.v', right) }));
    const frame = sampleColumnGeometry(prepared, 1);
    assert.deepEqual(frame.result.end, expected);
    assert.deepEqual(frame.terms[1]!.end, expected);
    assert.deepEqual(frame.terms[1]!.start, prepared.terms[0].contribution);
    assert.ok(prepared.domain[1] >= 1.2);
    assert.equal(frame.result.visible, true);
  }
});

test('source-fixed square framing includes all intermediates, even large cancelling contributions', () => {
  const sources = [product(), product([[1000, 1000], [-2, -2]], [[5], [-5]]),
    product([[0.5, 0], [0, 0.5]], [[-1], [1.5]]), product([[0, 0], [0, 0]], [[0], [0]])];
  for (const source of sources) {
    const prepared = prepareColumnGeometry(source), bounds = prepared.domain;
    assert.equal(bounds[0], -bounds[1]);
    for (let tick = 0; tick <= 240; tick++) {
      const frame = sampleColumnGeometry(prepared, tick / 240);
      const points = [...frame.terms.flatMap(term => [term.start, term.end]), frame.result.start, frame.result.end];
      for (const point of points) for (const coordinate of point)
        assert.ok(Number.isFinite(coordinate) && coordinate >= bounds[0] && coordinate <= bounds[1]);
      assert.equal(prepared.domain, bounds);
    }
  }
});

test('direct seek, interruption and reverse have the same immutable sampled state', () => {
  const prepared = prepareColumnGeometry(product([[2, -4], [-1, 2]], [[-3], [1]]));
  const ticks = Array.from({ length: 61 }, (_, tick) => tick / 60);
  const forward = ticks.map(progress => sampleColumnGeometry(prepared, progress));
  const backward = [...ticks].reverse().map(progress => sampleColumnGeometry(prepared, progress)).reverse();
  assert.deepEqual(forward, backward);
  for (const progress of [0.81, 0.21, 1, 0.59, 0, 0.81])
    assert.deepEqual(sampleColumnGeometry(prepared, progress), sampleColumnGeometry(prepareColumnGeometry(prepared.scene.env.product), progress));
  assert.ok(Object.isFrozen(prepared) && Object.isFrozen(prepared.terms) && Object.isFrozen(prepared.terms[0].column));
  const frame = forward[25]!;
  assert.ok(Object.isFrozen(frame) && Object.isFrozen(frame.terms) && Object.isFrozen(frame.terms[0]!.end));
  assert.deepEqual(sampleColumnGeometry(prepared, -1), sampleColumnGeometry(prepared, 0));
  assert.deepEqual(sampleColumnGeometry(prepared, 2), sampleColumnGeometry(prepared, 1));
  for (const progress of [NaN, Infinity, -Infinity]) assert.throws(() => sampleColumnGeometry(prepared, progress), MatrixColumnGap);
});

test('geometry inherits the canonical numeric and dimensional admission boundary', () => {
  for (const source of [
    product([[1, 2]], [[1], [2]]), product([[1, 2], [3, 4]], [[1, 0], [0, 1]]),
    product([[1e-7, 0], [0, 1]], [[0], [1]]),
    product([[1e20, -1e20], [0, 1]], [[10], [10]]),
  ]) assert.throws(() => prepareColumnGeometry(source), MatrixColumnGap);
  const unresolved = createKpTypedMatrixFromRows({ id: 'free.A', rows: [0, 1].map(i => [0, 1].map(j =>
    createKpScalarExpression({ id: `free.${i}.${j}`, expression: variable('x') }))) });
  assert.throws(() => prepareColumnGeometry(matrixProduct({ id: 'free.Av', left: unresolved, right: matrix('free.v', [[0], [0]]) })), MatrixColumnGap);
});
