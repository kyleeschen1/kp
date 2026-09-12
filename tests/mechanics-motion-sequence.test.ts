import assert from "node:assert/strict";
import test from "node:test";
import { motionObservationExample } from "../src/semantic/motion-observation.ts";
import { checkMotionLesson, sampleMotionLesson } from "../src/tutorial/mechanics-motion/mechanics-motion-sequence.ts";

const result = checkMotionLesson(motionObservationExample);
if (result.status !== "checked") throw new Error(result.expected);
const lesson = result.lesson;
test("motion explanation has seven exact reversible stops", () => {
  const frames = lesson.checkpoints.map(p => sampleMotionLesson(lesson, p));
  assert.deepEqual(frames.map(f => f.point.time), [0, 2, 4, 6, 6, 6, 6]);
  assert.deepEqual(frames.map(f => f.fraction), ["1 / 7", "2 / 7", "3 / 7", "4 / 7", "5 / 7", "6 / 7", "7 / 7"]);
  assert.deepEqual([...lesson.checkpoints].reverse().map(p => sampleMotionLesson(lesson, p)).reverse(), frames);
  for (const p of [NaN, Infinity, -1, 2]) assert.throws(() => sampleMotionLesson(lesson, p), RangeError);
  assert.throws(() => sampleMotionLesson({ ...lesson }, 0), /checked motion/);
});
test("action holds anticipatory prose and changing zero cannot move the physical point", () => {
  const moving = sampleMotionLesson(lesson, .5 / 6);
  assert.equal(moving.attention.phaseKind, "act");
  assert.equal(moving.beat.slug, "describe");
  assert.ok(moving.point.time > 0 && moving.point.time < 2);
  const shift = sampleMotionLesson(lesson, 3.5 / 6);
  assert.equal(shift.point.position, 2);
  assert.ok(shift.origin > 0 && shift.origin < 3);
});
test("a valid mathematical record cannot silently borrow an incompatible narrative", () => {
  const observations = motionObservationExample.observations.map((o, i) => ({ ...o, position: i + 1 }));
  assert.equal(checkMotionLesson({ ...motionObservationExample, observations }).status, "repair");
});
