import { strict as assert } from "node:assert";
import test from "node:test";

import { createEquationOperationTransition } from "../src/math/equation-transform.ts";
import { createEquationMotionPlan } from "../src/rendering/equation-motion-plan.ts";
import { createEquationMotionPlayer } from "../src/rendering/equation-motion-player.ts";

const createSubtractBothSidesPlan = () =>
  createEquationMotionPlan(
    createEquationOperationTransition({
      sourceLatex: "x + 3 = 7",
      operation: {
        kind: "subtractBothSides",
        valueLatex: "3"
      }
    })
  );

const createRightSimplificationPlan = () =>
  createEquationMotionPlan(
    createEquationOperationTransition({
      sourceLatex: "x = 7 - 3",
      operation: {
        kind: "simplifySide",
        side: "right",
        rule: "evaluate-constant-difference"
      }
    })
  );

test("createEquationMotionPlayer samples explicit progress", () => {
  const sampledProgress: number[] = [];
  const player = createEquationMotionPlayer(createSubtractBothSidesPlan(), {
    render: (frame) => sampledProgress.push(frame.progress)
  });

  player.setProgress(0.25);
  player.setProgress(0.75);

  assert.deepEqual(sampledProgress, [0.25, 0.75]);
  assert.equal(player.getProgress(), 0.75);
});

test("createEquationMotionPlayer rewinds by sampling backward", () => {
  const sampledProgress: number[] = [];
  const player = createEquationMotionPlayer(createRightSimplificationPlan(), {
    render: (frame) => sampledProgress.push(frame.progress)
  });

  player.setProgress(1);
  player.rewindTo(0, { steps: 4 });

  assert.deepEqual(sampledProgress, [1, 0.75, 0.5, 0.25, 0]);
});

test("createEquationMotionPlayer plays forward in steps", () => {
  const sampledProgress: number[] = [];
  const player = createEquationMotionPlayer(createSubtractBothSidesPlan(), {
    render: (frame) => sampledProgress.push(frame.progress)
  });

  player.playTo(1, { steps: 4 });

  assert.deepEqual(sampledProgress, [0.25, 0.5, 0.75, 1]);
  assert.equal(player.getProgress(), 1);
});

test("createEquationMotionPlayer lands stepped playback on exact clamped target", () => {
  const sampledProgress: number[] = [];
  const player = createEquationMotionPlayer(createSubtractBothSidesPlan(), {
    render: (frame) => sampledProgress.push(frame.progress)
  });

  player.playTo(0.7, { steps: 3 });

  assert.equal(sampledProgress.length, 3);
  assert.equal(sampledProgress.at(-1), 0.7);
  assert.equal(player.getProgress(), 0.7);
});

test("createEquationMotionPlayer clamps explicit progress through sampler", () => {
  const sampledProgress: number[] = [];
  const player = createEquationMotionPlayer(createSubtractBothSidesPlan(), {
    render: (frame) => sampledProgress.push(frame.progress)
  });

  player.setProgress(Number.NaN);
  player.setProgress(2);

  assert.deepEqual(sampledProgress, [0, 1]);
  assert.equal(player.getProgress(), 1);
});

test("createEquationMotionPlayer rejects invalid step counts", () => {
  const player = createEquationMotionPlayer(createSubtractBothSidesPlan(), {
    render: () => undefined
  });
  const expectedError = /Equation motion steps must be a positive integer/;

  assert.throws(() => player.playTo(1, { steps: 0 }), expectedError);
  assert.throws(() => player.playTo(1, { steps: 1.5 }), expectedError);
  assert.throws(() => player.playTo(1, { steps: Number.NaN }), expectedError);
  assert.throws(() => player.playTo(1, { steps: -1 }), expectedError);
  assert.throws(() => player.playTo(1, { steps: Number.POSITIVE_INFINITY }), expectedError);
});
