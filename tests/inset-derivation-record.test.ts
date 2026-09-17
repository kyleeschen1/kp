import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleInsetDerivationRecord as sample } from '../src/tutorial/mechanics-relations/energy-derivation-presentation.ts';

test('inset fenceposts yield overlapping paint and restore native ownership at exact docks', () => {
  for (const height of [40, 54, 108]) for (const distance of [120, 230, 900]) {
    for (let i = 0; i <= 100; i++) {
      const p = i / 100, frame = sample(p, distance, height);
      assert.deepEqual(sample(p, distance, height), frame);
      for (const presence of [frame.sourcePresence, frame.targetPresence]) assert.ok(presence >= 0 && presence <= 1);
      if (p === 0 || p === 1) {
        assert.equal(frame.inspectionOpacity, 0);
        assert.equal(frame.sourcePresence, 1); assert.equal(frame.targetPresence, 1);
      } else {
        assert.equal(frame.inspectionOpacity, 1);
        if (p * distance <= height) assert.equal(frame.sourcePresence, 0);
        if ((1 - p) * distance <= height) assert.equal(frame.targetPresence, 0);
        assert.equal(frame.sourceEmphasis, 0); assert.equal(frame.targetEmphasis, 0);
      }
      const reverse = sample(1 - p, distance, height);
      assert.ok(Math.abs(frame.sourcePresence - reverse.targetPresence) < 1e-12);
    }
  }
  assert.throws(() => sample(NaN, 230, 54));
  assert.throws(() => sample(.5, 0, 54));
  assert.throws(() => sample(.5, 230, -1));
});
