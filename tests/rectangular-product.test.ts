import assert from 'node:assert/strict';
import test from 'node:test';
import { context } from '../src/experiments/rectangular-product/source.ts';
import { rectangularContext } from '../src/experiments/rectangular-product/model.ts';
import { product as standalone } from '../src/experiments/dot-product-passage/source.ts';
import { valueOf, DotPassageGap } from '../src/experiments/dot-product-passage/model.ts';

test('rectangular context retains the selected cell and original entries', () => {
  const { product, passage } = context;
  assert.equal(passage.cell, product.cell(0, 0));
  assert.equal(passage.dot.result, product.result.rows[0]![0]);
  assert.equal(valueOf(passage.dot.result), -3);
  for (const pair of passage.dot.pairs) {
    assert.equal(pair.left, product.left.rows[0]![pair.index]);
    assert.equal(pair.right, product.right.rows[pair.index]![0]);
  }
  assert.throws(() => rectangularContext(standalone), DotPassageGap);
  assert.throws(() => rectangularContext(product, 2, 0));
});

test('placement follows the completed dot passage without changing its phases', () => {
  for (let i = 0; i <= 4; i++) assert.equal(context.sample(i / 5).dotProgress, i / 4);
  assert.equal(context.sample(.8).placement, 0);
  assert.equal(context.sample(1).placement, 1);
  assert.equal(context.sample(1).beat.id, 'placed');
  for (const p of [0, .1, .34, .75, .9, 1]) {
    const frame = context.sample(p); context.sample(1); context.sample(0);
    assert.deepEqual(context.sample(p), frame);
  }
  assert.throws(() => context.sample(NaN), DotPassageGap);
});
