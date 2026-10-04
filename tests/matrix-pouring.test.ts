import assert from 'node:assert/strict';
import test from 'node:test';
import { pouringModel, pouringBeats, samplePouring } from '../src/experiments/rectangular-product/pouring-model.ts';
import { valueOf } from '../src/experiments/dot-product-passage/model.ts';
import { structureModel, structureBeats, sampleStructure } from '../src/experiments/rectangular-product/structure-model.ts';

test('both receiving rows reuse each input component and preserve output column order', () => {
  const model = pouringModel();
  assert.deepEqual(model.product.result.rows.map(row => row.map(valueOf)), [[-3, 13], [18, -5]]);
  for (const [c, column] of model.columns.entries()) for (const [r, passage] of column.entries()) {
    assert.equal(passage.cell, model.product.cell(r, c));
    assert.equal(passage.dot.result, model.product.result.rows[r]![c]);
    for (const pair of passage.dot.pairs) {
      assert.equal(pair.left, model.product.left.rows[r]![pair.index]);
      assert.equal(pair.right, model.product.right.rows[pair.index]![c]);
      assert.equal(pair.right, column[1 - r]!.dot.pairs[pair.index]!.right);
    }
  }
});
test('named holds and arbitrary seeks are deterministic in either direction', () => {
  const positions = Array.from({ length: 101 }, (_, i) => i / 100);
  const forward = positions.map(samplePouring);
  assert.deepEqual([...positions].reverse().map(samplePouring).reverse(), forward);
  pouringBeats.forEach((beat, i) => assert.equal(samplePouring(i / (pouringBeats.length - 1)).beat, beat));
  assert.throws(() => samplePouring(NaN), /finite/);
});

test('number-free view retains exact intermediate objects through compatible composition', () => {
  const { product, next } = structureModel;
  assert.equal(next.right, product.result);
  assert.equal(next.left.columnCount, product.result.rowCount);
  assert.deepEqual(next.result.rows.map(row => row.map(valueOf)), [[-3, 13], [18, -5], [15, 8]]);
  next.columns[0]!.forEach(cell => cell.dot.pairs.forEach((pair, i) => {
    assert.equal(pair.right, product.cell(i, 0).result);
  }));
  structureBeats.forEach((beat, i) => assert.equal(sampleStructure(i / (structureBeats.length - 1)).beat, beat));
  assert.throws(() => sampleStructure(Infinity), /finite/);
});
