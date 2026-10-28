import assert from 'node:assert/strict';
import test from 'node:test';
import { compileFractionalTheaterFocus, fractionalTheaterFocus, fractionalSliderPresence } from '../src/reader/app/fractional-theater-focus.ts';
import { fractionalPassageIndex } from '../src/reader/app/fractional-rising-scroll.ts';
import { fractionalPassageOperations } from '../src/reader/compiler/fractional-passage-operations.ts';

test('the measured stage crossing drives complementary emphasis with identical reverse and direct seeks', () => {
  const input = { positions: [100, 600, 1100], heights: [72, 96, 48], stageOffset: 14 };
  const focus = (position: number) => fractionalTheaterFocus({ ...input, position });
  assert.deepEqual(focus(300), [1, .12, .12]);
  assert.deepEqual(focus(490), [1, .12, .12]);
  assert.deepEqual(focus(514), [.12, 1, .12]);
  for (const position of [490, 496, 502, 508, 514, 508, 502, 496, 490]) {
    const state = focus(position);
    assert.ok(Math.abs(state[0]! + state[1]! - 1.12) < 1e-12);
    assert.deepEqual(state, focus(position));
  }
  assert.deepEqual(focus(2000), [.12, .12, 1]);
  assert.throws(() => fractionalTheaterFocus({ ...input, heights: [], position: 300 }), /measured passage heights/);
});

test('slider dissolves only after completion, including reverse traversal', () => {
  for (const [position, expected] of [[90, 1], [100, 1], [112, .5], [124, 0], [200, 0], [112, .5], [100, 1]]) {
    assert.equal(fractionalSliderPresence(position!, 100), expected);
  }
});

test('sparse focus matches the complete law for long documents, jumps, reversals and overlapping spans', () => {
  for (const input of [
    { positions: Array.from({ length: 10000 }, (_, i) => 100 + i * 120),
      heights: Array.from({ length: 10000 }, (_, i) => 24 + (i % 3) * 24), stageOffset: 14 },
    { positions: [100, 115, 130], heights: [24, 24, 24], stageOffset: 14 }
  ]) {
    const focus = compileFractionalTheaterFocus(input);
    for (const position of [-100, 0, 62, 70, 80, 86, 95, 210, 101200, 1199990, 2000000, 70]) {
      const expected = fractionalTheaterFocus({ ...input, position });
      const actual = focus(position);
      assert.deepEqual(expected, expected.map((_, index) => actual.get(index) ?? .12));
      if (input.positions.length === 10000) assert.ok(actual.size <= 2);
    }
  }
});

test('passage lookup reaches far destinations without walking intervening paragraphs', () => {
  let reads = 0;
  const positions = new Proxy(Array.from({ length: 100000 }, (_, i) => i * 100), {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) reads++;
      return Reflect.get(target, key, receiver);
    }
  });
  assert.equal(fractionalPassageIndex(positions, 9999901), 99999);
  assert.ok(reads <= 17);
  assert.equal(fractionalPassageIndex([], 100), 0);
  assert.equal(fractionalPassageIndex([100, 200, 300], -1), 0);
  assert.equal(fractionalPassageIndex([100, 200, 300], 200), 1);
});

test('only explicitly associated operations have controls; intervening comments retain the result', () => {
  const checkpoints = [
    { beatId: 'intro', progressPermille: 0 },
    { beatId: 'first', progressPermille: 500 },
    { beatId: 'comment', progressPermille: 500 },
    { beatId: 'last', progressPermille: 1000 }
  ];
  const operations = [{ id: 'a' }, { id: 'b' }];
  const associations = { first: 'a', last: 'b' };
  const bindings = fractionalPassageOperations(checkpoints, operations, associations);
  assert.deepEqual([...bindings.keys()], ['first', 'last']);
  assert.deepEqual(bindings.get('last'), { transformationId: 'b', start: 500, end: 1000 });
  assert.throws(() => fractionalPassageOperations(checkpoints, operations, {}), /Unbound passage/);
  assert.throws(() => fractionalPassageOperations(checkpoints, operations, { ...associations, first: 'missing' }), /Unknown passage operation/);
  assert.throws(() => fractionalPassageOperations(checkpoints, operations, { ...associations, first: 'b' }), /source and result/);
});
