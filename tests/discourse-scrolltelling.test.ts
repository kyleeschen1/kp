import test from 'node:test';
import assert from 'node:assert/strict';
import { discourseCorridor, discourseProgress } from '../src/experiments/discourse-scrolltelling/scroll.ts';
import { attentionComments, attentionFrame, attentionTravel, attentionAtPosition, attentionPosition, revealFrame } from '../src/experiments/discourse-scrolltelling/attention-card-model.ts';
import { passage } from '../src/experiments/dot-product-passage/source.ts';

test('comments and focus hold existing math while transformations scrub reversibly', () => {
  assert.equal(attentionFrame(attentionTravel(0)).progress, 0);
  assert.equal(attentionFrame(attentionTravel(2)).progress, .25);
  assert.equal(attentionFrame(attentionTravel(4)).progress, .5);
  assert.equal(attentionFrame(attentionTravel(6)).progress, 1);
  assert.deepEqual(attentionComments[4]!.refs, passage.dot.pairs.slice(1).map(pair => pair.product));
  for (const index of [1, 3, 5]) {
    const comment = attentionComments[index]!;
    assert.equal(comment.kind, 'transform');
    if (comment.kind !== 'transform') throw new Error('Expected transformation');
    for (const motion of [0, .2, .5, .8, 1]) {
      const frame = attentionFrame(attentionTravel(index, motion));
      assert.ok(Math.abs(frame.progress - (comment.from + (comment.to - comment.from) * motion)) < 1e-10);
    }
    assert.equal(attentionFrame(attentionTravel(index, .5), true).progress, comment.from);
    assert.equal(attentionFrame(attentionTravel(index, 1) + .001, true).progress, comment.to);
  }
  const samples = Array.from({ length: 501 }, (_, i) => i / 500);
  const frames = samples.map(t => attentionFrame(t));
  assert.deepEqual([...samples].reverse().map(t => attentionFrame(t)).reverse(), frames);
  frames.forEach((frame, i) => { if (i) assert.ok(frame.progress >= frames[i - 1]!.progress); });
  assert.throws(() => attentionFrame(NaN));
  assert.throws(() => attentionTravel(99));
  assert.throws(() => attentionTravel(2, .5));
  assert.throws(() => attentionTravel(1, Infinity));
});

test('mixed prose and brief cues use measured boundaries in both directions', () => {
  const landings = [0, 450, 1000, 1800, 2050, 2300, 2700, 3200];
  for (let index = 0; index < attentionComments.length; index++) {
    const y = attentionPosition(landings, index);
    assert.equal(attentionFrame(attentionAtPosition(landings, y)).index, index);
  }
  for (const index of [1, 3, 5]) for (const motion of [0, .25, .5, 1]) {
    const frame = attentionFrame(attentionAtPosition(landings, attentionPosition(landings, index, motion)));
    assert.ok(Math.abs(frame.motion - motion) < 1e-10);
  }
  assert.throws(() => attentionAtPosition([0, 0], 0));
  assert.throws(() => attentionAtPosition(landings, NaN));
});

test('reveal gates effects on text clearance and rejects overlapping intervals', () => {
  const boundaries = attentionComments.map((_, i) => ({ start: i * 1000, clear: i * 1000 + 400, end: i * 1000 + 700 }));
  for (const i of [1, 3, 5]) {
    const comment = attentionComments[i]!;
    if (comment.kind !== 'transform') throw new Error('Expected transformation');
    assert.equal(revealFrame(boundaries, boundaries[i]!.clear - 1).progress, comment.from);
    assert.equal(revealFrame(boundaries, boundaries[i]!.clear).progress, comment.from);
    assert.ok(Math.abs(revealFrame(boundaries, boundaries[i]!.clear + 150).progress - (comment.from + comment.to) / 2) < 1e-10);
    assert.equal(revealFrame(boundaries, boundaries[i]!.clear - 1).cleared, false);
  }
  assert.throws(() => revealFrame(boundaries, NaN));
  assert.throws(() => revealFrame(boundaries.map(b => ({ ...b, clear: b.start })), 0));
  assert.throws(() => revealFrame(boundaries.map(b => ({ ...b, end: b.end + 1000 })), 0));
});

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
