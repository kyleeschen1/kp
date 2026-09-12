import assert from "node:assert/strict";
import test from "node:test";
import { motionObservationExample } from "../src/semantic/motion-observation.ts";
import { checkMotionLesson, sampleMotionLesson } from "../src/tutorial/mechanics-motion/mechanics-motion-sequence.ts";

const result = checkMotionLesson(motionObservationExample);
if (result.status !== "checked") throw new Error(result.expected);
const lesson = result.lesson;
test("motion explanation has four exact reversible correspondence stops", () => {
  const frames = lesson.checkpoints.map(p => sampleMotionLesson(lesson, p));
  assert.deepEqual(frames.map(f => f.point.time), [0, 2, 4, 6]);
  assert.deepEqual(frames.map(f => f.fraction), ["1 / 4", "2 / 4", "3 / 4", "4 / 4"]);
  assert.ok(frames.every(f => f.origin === 0 && f.operationId === "motion.observe-linear-trip"));
  assert.deepEqual([...lesson.checkpoints].reverse().map(p => sampleMotionLesson(lesson, p)).reverse(), frames);
  for (const p of [NaN, Infinity, -1, 2]) assert.throws(() => sampleMotionLesson(lesson, p), RangeError);
  assert.throws(() => sampleMotionLesson({ ...lesson }, 0), /checked motion/);
});
test("action holds anticipatory prose and modeled pause advances time without position", () => {
  const moving = sampleMotionLesson(lesson, .5 / 3);
  assert.equal(moving.attention.phaseKind, "act");
  assert.equal(moving.beat.slug, "describe");
  assert.ok(moving.point.time > 0 && moving.point.time < 2);
  const pause = sampleMotionLesson(lesson, 1.5 / 3);
  assert.equal(pause.point.position, 5);
  assert.ok(pause.point.time > 2 && pause.point.time < 4);
});
test("a valid mathematical record cannot silently borrow an incompatible narrative", () => {
  const observations = motionObservationExample.observations.map((o, i) => ({ ...o, position: i + 1 }));
  assert.equal(checkMotionLesson({ ...motionObservationExample, observations }).status, "repair");
});
