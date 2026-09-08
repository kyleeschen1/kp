import { test } from "node:test";
import assert from "node:assert/strict";
import { createKpFocusDeckCheckpointMap, resolveKpFocusDeckVisibleBeat as reasoningVisibleBeat } from "../src/tutorial/focus-deck-beat-navigation.ts";
import { boundKpFocusDeckTravel, settleKpFocusDeckTravel } from "../src/tutorial/focus-deck-continuous-navigation.ts";

test("shared checkpoints preserve uniform subranges and unequal authored scores without owning a clock", () => {
  for (const values of [[0, 1/13, 2/13, 3/13, 4/13], [0, .16, .34, .5, .68, .84, 1]]) {
    const map = createKpFocusDeckCheckpointMap(values);
    for (let index = 0; index <= map.last; index++) {
      assert.equal(map.progressAt(index), values[index]);
      assert.equal(map.positionAt(values[index]!), index);
    }
    for (let sample = 0; sample <= 1000; sample++) {
      const position = sample / 1000 * map.last;
      assert.ok(Math.abs(map.positionAt(map.progressAt(position)) - position) < 1e-12);
    }
    values[0] = .9;
    assert.equal(map.checkpoints[0], 0, "external mutation cannot invalidate the mapping");
    for (const value of [NaN, Infinity, -1, map.last + 1]) assert.throws(() => map.progressAt(value));
    for (const value of [NaN, Infinity, -1, 2]) assert.throws(() => map.positionAt(value));
  }
  for (const values of [[], [0], [0, 0], [.2, .1], [0, NaN], [-.1, 1], [0, 1.1]]) {
    assert.throws(() => createKpFocusDeckCheckpointMap(values));
  }
});

test("shared settlement preserves supply-tax policy and never erases visible multi-beat travel", () => {
  for (let origin = 0; origin <= 4; origin++) {
    for (let hundredths = -100; hundredths <= 500; hundredths++) {
      const position = hundredths / 100;
      const visible = Math.round(Math.max(0, Math.min(4, position)));
      assert.equal(boundKpFocusDeckTravel(position, 4), Math.max(0, Math.min(4, position)));
      for (const direction of [-1, 0, 1]) for (const committed of [false, true]) {
        const expected = visible !== origin ? visible : committed && direction !== 0
          ? Math.max(0, Math.min(4, origin + direction)) : visible;
        assert.equal(settleKpFocusDeckTravel({ position, origin, committed, direction, lastCheckpoint: 4 }), expected);
      }
    }
  }
  assert.throws(() => boundKpFocusDeckTravel(NaN, 4));
  assert.throws(() => boundKpFocusDeckTravel(1, 1.5));
});

test("visible beat responds during travel and resists midpoint jitter", () => {
  assert.equal(reasoningVisibleBeat(.7, 0, 4), 1);
  for (const position of [.49, .51, .46]) assert.equal(reasoningVisibleBeat(position, 1, 4), 1);
  assert.equal(reasoningVisibleBeat(.44, 1, 4), 0);
  assert.equal(reasoningVisibleBeat(.51, 0, 4), 0);
  assert.equal(reasoningVisibleBeat(.56, 0, 4), 1);
  for (let previous = 0; previous <= 4; previous++) {
    for (let endpoint = 0; endpoint <= 4; endpoint++) assert.equal(reasoningVisibleBeat(endpoint, previous, 4), endpoint);
  }
  assert.equal(reasoningVisibleBeat(-10, 0, 4), 0);
  assert.equal(reasoningVisibleBeat(10, 0, 4), 4);
  assert.throws(() => reasoningVisibleBeat(NaN, 0, 4));
});
