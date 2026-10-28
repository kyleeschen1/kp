import assert from 'node:assert/strict';
import test from 'node:test';
import { compileFractionalTheaterFocus, fractionalTheaterFocus, fractionalSliderPresence } from '../src/reader/app/fractional-theater-focus.ts';
import { fractionalPassageIndex } from '../src/reader/app/fractional-rising-scroll.ts';
import { fractionalPassageOperations } from '../src/reader/compiler/fractional-passage-operations.ts';

test('prose is present only near arrival and through its hold, including reverse and direct seeks', () => {
  const input = { positions: [100, 600, 1100], holds: [300, 300, 100] };
  const focus = (position: number) => fractionalTheaterFocus({ ...input, position });
  assert.deepEqual(focus(75), [0, 0, 0]);
  assert.deepEqual(focus(88), [.5, 0, 0]);
  assert.deepEqual(focus(100), [1, 0, 0]);
  assert.deepEqual(focus(300), [1, 0, 0]);
  assert.deepEqual(focus(400), [1, 0, 0]);
  assert.deepEqual(focus(412), [.5, 0, 0]);
  assert.deepEqual(focus(424), [0, 0, 0]);
  assert.deepEqual(focus(588), [0, .5, 0]);
  assert.deepEqual(focus(2000), [0, 0, 0]);
  assert.throws(() => fractionalTheaterFocus({ ...input, holds: [], position: 300 }), /one hold per passage/);
  for (const invalid of [
    { positions: [100, 90], holds: [0, 0] },
    { positions: [NaN], holds: [0] },
    { positions: [100], holds: [-1] }
  ]) assert.throws(() => compileFractionalTheaterFocus(invalid), /ordered finite/);
});

test('slider dissolves only after completion, including reverse traversal', () => {
  for (const [position, expected] of [[90, 1], [100, 1], [112, .5], [124, 0], [200, 0], [112, .5], [100, 1]]) {
    assert.equal(fractionalSliderPresence(position!, 100), expected);
  }
});

test('sparse focus matches the complete law for long documents, jumps, reversals and overlapping spans', () => {
  for (const input of [
    { positions: Array.from({ length: 10000 }, (_, i) => 100 + i * 120),
      holds: Array.from({ length: 10000 }, () => 60) },
    { positions: [100, 115, 130], holds: [24, 24, 24] }
  ]) {
    const focus = compileFractionalTheaterFocus(input);
    for (const position of [-100, 0, 62, 70, 80, 86, 95, 210, 101200, 1199990, 2000000, 70]) {
      const expected = fractionalTheaterFocus({ ...input, position });
      const actual = focus(position);
      assert.deepEqual(expected, expected.map((_, index) => actual.get(index) ?? 0));
      if (input.positions.length === 10000) assert.ok(actual.size <= 1);
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
