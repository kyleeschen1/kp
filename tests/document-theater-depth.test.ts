import { test } from 'node:test';
import assert from 'node:assert/strict';
import { documentFrameExchange, documentTheaterExitPresence } from '../src/reader/app/document-theater-depth.ts';

test('the final stage withdraws before sticky release and restores on reverse', () => {
  const sample = (position: number) => documentTheaterExitPresence(position, 1000, 100, 180);
  assert.equal(sample(1100), 1);
  assert.equal(sample(1190), .5);
  assert.equal(sample(1280), 0);
  assert.equal(sample(1400), 0);
  assert.deepEqual([1100, 1190, 1280, 1190, 1100].map(sample), [1, .5, 0, .5, 1]);
});

test('frame prominence is reversible and prose owns the entire overlap', () => {
  const sample = (top: number) => documentFrameExchange(top, 180, 500, 580);
  assert.equal(sample(260).front, 'stage');
  assert.equal(sample(308).front, 'prose');
  for (let top = 320; top <= 580; top++) assert.equal(sample(top).prose, 1);
  assert.equal(sample(640).front, 'stage');
  const positions = [260, 284, 308, 420, 604, 616, 640];
  assert.deepEqual(positions.map(sample), [...positions].reverse().map(sample).reverse());
});
