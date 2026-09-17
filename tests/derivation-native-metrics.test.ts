import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sameDerivationNativeMetrics as same } from '../src/tutorial/mechanics-relations/derivation-native-metrics.ts';

test('viewport rounding noise cannot retire unchanged native scenes', () => {
  const dimensions = [54.399993896484375, 39.833343505859375, '19.36px KaTeX_Main'];
  const translated = [54.40000915527344, 39.83332824707031, '19.36px KaTeX_Main'];
  assert.ok(same(dimensions, translated));
  assert.ok(same(translated, dimensions));
});

test('real layout changes, any font change and invalid measurements invalidate', () => {
  assert.equal(same([54.4, '19.36px KaTeX_Main'], [54.42, '19.36px KaTeX_Main']), false);
  assert.equal(same([54.4, '19.36px KaTeX_Main'], [54.4, '19.361px KaTeX_Main']), false);
  assert.equal(same([54.4, 'KaTeX_Main'], [54.4, 'KaTeX_Math']), false);
  assert.equal(same([54.4], [54.4, 20]), false);
  for (const value of [NaN, Infinity, -Infinity]) assert.equal(same([value], [value]), false);
  // Keep comparing to the retained baseline, so small changes cannot accumulate unnoticed.
  assert.ok(same([54.4], [54.405]));
  assert.equal(same([54.4], [54.42]), false);
});
