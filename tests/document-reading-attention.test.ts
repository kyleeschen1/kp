import { test } from "node:test";
import assert from "node:assert/strict";
import { compileDocumentReadingAttention, documentStoryFocusActive } from "../src/reader/app/document-theater-attention.ts";

const geometry = { states: [undefined, 'state.example', undefined, 'state.last'], positions: [100, 500, 900, 1300], holds: [100, 100, 100, 100] };
const attention = compileDocumentReadingAttention(geometry);
const sample = (position: number, motionMode: 'full' | 'essential' = 'full') =>
  attention({ position, motionMode, readingDocument: false, hasSelection: false });

test('reading handoff is exclusive, held and reversible without a second clock', () => {
  const frames = [
    [400, { kind: 'prose', presence: 1 }],
    [452, { kind: 'prose', presence: .5 }],
    [468, { kind: 'prose', presence: 0 }],
    [484, { kind: 'annotation', stateId: 'state.example', presence: .5 }],
    [500, { kind: 'annotation', stateId: 'state.example', presence: 1 }],
    [800, { kind: 'annotation', stateId: 'state.example', presence: 1 }],
    [852, { kind: 'annotation', stateId: 'state.example', presence: .5 }],
    [868, { kind: 'prose', presence: 1 }],
    [1416, { kind: 'annotation', stateId: 'state.last', presence: .5 }],
    [1432, { kind: 'prose', presence: 1 }]
  ] as const;
  for (const [position, expected] of [...frames, ...[...frames].reverse(), ...frames])
    assert.deepEqual(sample(position), expected);
});

test('selection and Read all reclaim prose; essential motion uses stable endpoints', () => {
  for (const flags of [{ readingDocument: true, hasSelection: false }, { readingDocument: false, hasSelection: true }])
    assert.deepEqual(attention({ position: 500, motionMode: 'full', ...flags }), { kind: 'prose', presence: 1 });
  assert.deepEqual(sample(484, 'essential'), { kind: 'prose', presence: 1 });
  assert.deepEqual(sample(852, 'essential'), { kind: 'annotation', stateId: 'state.example', presence: 1 });
  assert.deepEqual(sample(868, 'essential'), { kind: 'prose', presence: 1 });
  assert.deepEqual(sample(500), { kind: 'annotation', stateId: 'state.example', presence: 1 });
});

test('an authored opening note orients entry immediately and restores without replay', () => {
  const opening = compileDocumentReadingAttention({
    states: ['opening', undefined, 'later'], positions: [500, 900, 1300], holds: [100, 100, 100]
  });
  for (const motionMode of ['full', 'essential'] as const) {
    const at = (position: number) => opening({ position, motionMode, readingDocument: false, hasSelection: false });
    for (const position of [-100, 0, 468, 500, 800, 500, 0])
      assert.deepEqual(at(position), { kind: 'annotation', stateId: 'opening', presence: 1 });
    assert.deepEqual(at(900), { kind: 'prose', presence: 1 });
    assert.deepEqual(at(1300), { kind: 'annotation', stateId: 'later', presence: 1 });
    for (const position of [0, 500]) for (const flags of [
      { readingDocument: true, hasSelection: false }, { readingDocument: false, hasSelection: true }
    ]) assert.deepEqual(opening({ position, motionMode, ...flags }), { kind: 'prose', presence: 1 });
  }
  assert.deepEqual(opening({ position: 852, motionMode: 'full', readingDocument: false, hasSelection: false }),
    { kind: 'annotation', stateId: 'opening', presence: .5 });
  // A prose-led reading still owns its opening; later annotations are not pulled forward.
  assert.deepEqual(sample(0), { kind: 'prose', presence: 1 });
});

test('attention cannot attach before the preceding mathematical hold finishes', () => {
  const tight = compileDocumentReadingAttention({ states: [undefined, 'note'], positions: [0, 100], holds: [80, 20] });
  const at = (position: number) => tight({ position, motionMode: 'full', readingDocument: false, hasSelection: false });
  assert.deepEqual(at(80), { kind: 'prose', presence: 1 });
  assert.deepEqual(at(90), { kind: 'prose', presence: 0 });
  assert.deepEqual(at(95), { kind: 'annotation', stateId: 'note', presence: .5 });
  assert.throws(() => compileDocumentReadingAttention({ states: [undefined, 'note'], positions: [0, 100], holds: [100, 20] }), /native hold/);
  assert.throws(() => compileDocumentReadingAttention({ ...geometry, holds: [] }), /one position and hold/);
  assert.throws(() => compileDocumentReadingAttention({ ...geometry, positions: [100, 500, NaN, 1300] }), /finite/);
  assert.throws(() => sample(NaN), /finite playhead/);
});

test('story focus releases at the end of its hold and reconstructs on reversal', () => {
  for (const position of [99, 100, 150, 201, 150, 99])
    assert.equal(documentStoryFocusActive(position, 100, 100), position >= 100 && position <= 200);
});
