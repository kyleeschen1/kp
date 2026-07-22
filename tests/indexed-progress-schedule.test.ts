import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpIndexedProgressSchedule,
  kpParallel,
  kpSequence,
  kpStagger
} from "../src/animation/indexed-progress-schedule.ts";

test("parallel and sequence policies change lane timing without changing lane identity", () => {
  const parallel = createKpIndexedProgressSchedule({ id: "terms.parallel", ids: ["left", "right"], strategy: kpParallel() });
  const sequence = createKpIndexedProgressSchedule({ id: "terms.sequence", ids: ["left", "right"], strategy: kpSequence() });

  assert.deepEqual(parallel.sample(0.25), { left: 0.15625, right: 0.15625 });
  assert.deepEqual(sequence.sample(0.25), { left: 0.5, right: 0 });
  assert.deepEqual(sequence.sample(0.75), { left: 1, right: 0.5 });
});

test("stagger composes overlap while preserving exact endpoints", () => {
  const schedule = createKpIndexedProgressSchedule({
    id: "terms.stagger",
    ids: ["first", "second", "third"],
    strategy: kpStagger(0.5)
  });
  assert.deepEqual(schedule.sample(0), { first: 0, second: 0, third: 0 });
  const middle = schedule.sample(0.5);
  assert.equal(middle.first, 1);
  assert.equal(middle.second, 0.5);
  assert.equal(middle.third, 0);
  assert.deepEqual(schedule.sample(1), { first: 1, second: 1, third: 1 });
});
