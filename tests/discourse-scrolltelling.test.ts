import test from 'node:test';
import assert from 'node:assert/strict';
import { discourseCorridor, discourseProgress } from '../src/experiments/discourse-scrolltelling/scroll.ts';

test('measured discourse edges hold reading endpoints and scrub reversibly', () => {
  const landings = [100, 800, 1600, 2150, 3100];
  for (let i = 0; i < 4; i++) {
    const from = landings[i]!, span = landings[i + 1]! - from;
    assert.equal(discourseProgress(landings, from + span * .1), i / 4);
    assert.ok(Math.abs(discourseProgress(landings, from + span * .5) - (i + .5) / 4) < 1e-10);
    assert.equal(discourseProgress(landings, from + span * .9), (i + 1) / 4);
  }
  const positions = Array.from({ length: 321 }, (_, i) => i * 10);
  const forward = positions.map(y => discourseProgress(landings, y));
  assert.deepEqual([...positions].reverse().map(y => discourseProgress(landings, y)).reverse(), forward);
  forward.forEach((p, i) => { assert.ok(p >= 0 && p <= 1); if (i) assert.ok(p >= forward[i - 1]!); });
  for (const y of positions) assert.ok(Number.isInteger(discourseProgress(landings, y, true) * 4));
});

test('discourse geometry rejects missing, inverted or nonfinite landings', () => {
  for (const values of [[], [0, 1, 2, 3], [0, 1, 1, 2, 3], [0, 3, 2, 4, 5], [0, 1, 2, 3, NaN]]) {
    assert.throws(() => discourseCorridor(values));
  }
  assert.throws(() => discourseProgress([0, 1, 2, 3, 4], Infinity));
});
