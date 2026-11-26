import { test } from 'node:test';
import assert from 'node:assert/strict';
import { documentTheaterOffset, documentTheaterExitPresence } from '../src/reader/app/document-theater-depth.ts';

test('the equation tucks below approaching text and returns after clearance', () => {
  const text = [{ top: 100, bottom: 200 }];
  const sample = (center: number) => documentTheaterOffset(center, text, 82);
  assert.equal(sample(47), 0);
  assert.equal(sample(63), 95);
  assert.equal(sample(79), 174);
  for (const center of [79, 100, 150, 200, 252]) {
    assert.equal(center - 41 + sample(center), 212); // 12px below text
  }
  assert.equal(sample(253), 0);
  assert.equal(sample(400), 0);
  assert.equal(documentTheaterOffset(63, text, 82, true), 190);
  const positions = [47, 63, 79, 150, 253, 400];
  assert.deepEqual(positions.map(sample), [...positions].reverse().map(sample).reverse());
  for (let center = -100; center <= 800; center += .5) {
    const value = sample(center);
    assert.ok(Number.isFinite(value) && value >= 0 && value <= 206);
  }
  assert.equal(documentTheaterOffset(0, [], 82), 0);
});

test('the final stage withdraws before sticky release and restores on reverse', () => {
  const sample = (position: number) => documentTheaterExitPresence(position, 1000, 100, 180);
  assert.equal(sample(1100), 1);
  assert.equal(sample(1190), .5);
  assert.equal(sample(1280), 0);
  assert.equal(sample(1400), 0);
  assert.deepEqual([1100, 1190, 1280, 1190, 1100].map(sample), [1, .5, 0, .5, 1]);
});
