import { strict as assert } from "node:assert";
import test from "node:test";

import { createEquationOperationTransition } from "../src/math/equation-transform.ts";
import {
  createEquationMotionPlan,
  type EquationMotionPlan
} from "../src/rendering/equation-motion-plan.ts";
import { createEquationMotionPlayer } from "../src/rendering/equation-motion-player.ts";
import {
  createRoleAwareMotionTrack
} from "../src/rendering/role-aware-motion-primitives.ts";

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

test("createEquationMotionPlayer rewinds role-aware primitive tracks", () => {
  const sampled = [] as Array<{
    progress: number;
    y: number;
    scale: number;
  }>;
  const player = createEquationMotionPlayer(
    planWithTrack(createRoleAwareMotionTrack("x", "inline-to-fraction")),
    {
      render: (frame) => {
        const token = frame.tokens.find((candidate) => candidate.tokenId === "x");
        assert.ok(token);
        sampled.push({
          progress: frame.progress,
          y: token.pose.y,
          scale: token.pose.scale
        });
      }
    }
  );

  player.setProgress(1);
  player.rewindTo(0, { steps: 2 });

  assert.deepEqual(sampled.map((frame) => frame.progress), [1, 0.5, 0]);
  assert.equal(sampled[0]?.y, -10);
  assert.equal(sampled[0]?.scale, 0.86);
  assert.equal(sampled.at(-1)?.y, 0);
  assert.equal(sampled.at(-1)?.scale, 1);
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

function planWithTrack(
  track: EquationMotionPlan["tracks"][number]
): EquationMotionPlan {
  return {
    sourceLatex: "x",
    targetLatex: "x",
    correspondenceMap: {
      id: "test.role-aware-motion",
      records: [
        {
          id: "identity.x",
          relation: "identity",
          sourceSelectorIds: ["x"],
          targetSelectorIds: ["x"],
          summary: "x role changes"
        }
      ]
    },
    tokens: [
      {
        id: "x",
        lifecycle: track.lifecycle,
        correspondenceRelation: "identity",
        semanticLifecycle: "identity-preserved",
        visualLifecycle: track.visualLifecycle,
        label: "x",
        sourceMotionId: "x.source",
        targetMotionId: "x.target"
      }
    ],
    tracks: [track]
  };
}
