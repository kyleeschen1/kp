import assert from 'node:assert/strict';
import test from 'node:test';
import { fractionalTheaterFocus, fractionalSliderPresence } from '../src/reader/app/fractional-theater-focus.ts';
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
