import assert from "node:assert/strict";
import test from "node:test";

import { kpSchemeFactorialTimeline } from
  "../src/animation/scheme-factorial-canonical-timeline.ts";
import {
  magnetizeKpSchemeFactorialSeek,
  sampleKpSchemeFactorialTimeline,
  seekKpSchemeFactorialCheckpoint
} from "../src/animation/scheme-factorial-timeline.ts";

const timeline = kpSchemeFactorialTimeline;

test("compiles all six score beats onto one normalized clock", () => {
  assert.equal(timeline.intervals.length, 6);
  assert.equal(timeline.intervals[0]?.motion.start, 0);
  assert.equal(timeline.intervals.at(-1)?.hold.end, 1);
  for (let index = 0; index < timeline.intervals.length; index += 1) {
    const interval = timeline.intervals[index]!;
    assert.ok(interval.motion.start < interval.motion.end);
    assert.ok(interval.hold.start < interval.hold.end);
    assert.equal(interval.motion.end, interval.hold.start);
    if (index > 0) {
      assert.equal(timeline.intervals[index - 1]?.hold.end,
        interval.motion.start);
    }
  }
});

test("captions remain stable throughout each motion and reading hold", () => {
  for (const interval of timeline.intervals) {
    for (const progress of [
      interval.motion.start,
      (interval.motion.start + interval.motion.end) / 2,
      interval.hold.start,
      interval.seekProgress,
      interval.hold.end === 1
        ? 1
        : interval.hold.end - 0.000001
    ]) {
      assert.equal(sampleKpSchemeFactorialTimeline({ timeline, progress }).caption,
        interval.caption);
    }
    const hold = sampleKpSchemeFactorialTimeline({
      timeline,
      progress: interval.seekProgress
    });
    assert.equal(hold.phase, "hold");
    assert.equal(hold.localProgress, 1);
    assert.equal(hold.settledCheckpointId, interval.toCheckpointId);
  }
});

test("named checkpoints seek directly and magnetically without replay", () => {
  for (const [checkpointId, progress] of Object.entries(
    timeline.checkpointSeeks
  )) {
    assert.equal(seekKpSchemeFactorialCheckpoint(timeline, checkpointId),
      progress);
    assert.equal(magnetizeKpSchemeFactorialSeek(timeline, progress + 0.005),
      progress);
  }
  assert.throws(() => seekKpSchemeFactorialCheckpoint(timeline, "missing"),
    /Unknown/);
  assert.equal(magnetizeKpSchemeFactorialSeek(timeline, 0.333, 0), 0.333);
});

test("one local progress drives all active motif channels", () => {
  for (const interval of timeline.intervals) {
    const progress = (interval.motion.start + interval.motion.end) / 2;
    const sample = sampleKpSchemeFactorialTimeline({ timeline, progress });
    for (const channel of [sample.structuralProgress, sample.bindingProgress,
      sample.decisionProgress, sample.summaryProgress, sample.returnProgress]) {
      if (channel !== null) assert.equal(channel, sample.localProgress);
    }
  }
});

test("dense direct seek and rewind are history independent", () => {
  const ascending = Array.from({ length: 1001 }, (_, index) =>
    sampleKpSchemeFactorialTimeline({
      timeline,
      progress: index / 1000,
      direction: "forward"
    }));
  const descending = Array.from({ length: 1001 }, (_, index) =>
    sampleKpSchemeFactorialTimeline({
      timeline,
      progress: (1000 - index) / 1000,
      direction: "rewind"
    })).reverse();
  assert.deepEqual(descending.map(({ direction: _direction, ...sample }) => sample),
    ascending.map(({ direction: _direction, ...sample }) => sample));
  assert.throws(() => sampleKpSchemeFactorialTimeline({
    timeline,
    progress: Number.NaN
  }), /finite/);
});
