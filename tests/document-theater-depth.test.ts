import { test } from 'node:test';
import assert from 'node:assert/strict';
import { documentTheaterDepth } from '../src/reader/app/document-theater-depth.ts';

test('paper buries the whole equation before contact and releases it only after clearance', () => {
  // A paragraph occupies [100, 200]; the equation extends 41px from its center.
  const sample = (center: number) => documentTheaterDepth(center, [200, 600], [100, 80], 82);
  assert.equal(sample(35), 0);
  assert.equal(sample(47), .5);
  assert.equal(sample(59), 1); // lower edge first meets paper
  assert.equal(sample(241), 1); // upper edge finally clears paper
  assert.equal(sample(253), .5);
  assert.equal(sample(265), 0);
  assert.equal(sample(400), 0); // clear interval for mathematical motion
  const positions = [35, 47, 59, 150, 241, 253, 265, 400, 500];
  assert.deepEqual(positions.map(sample), [...positions].reverse().map(sample).reverse());
  for (let center = -100; center <= 800; center += .5) {
    const value = sample(center);
    assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
  }
  assert.equal(documentTheaterDepth(0, [], [], 82), 0);
});
