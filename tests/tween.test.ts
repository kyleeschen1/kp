import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createNumberTweenFrames,
  sampleSaddleDenominatorAnimationFrames
} from "../src/animation/tween.ts";
import { createSaddleDenominatorAnimationIntent } from "../src/semantic/animation.ts";
import { createSaddleSurface3D } from "../src/semantic/graph.ts";

test("createNumberTweenFrames samples a bounded numeric tween", () => {
  const frames = createNumberTweenFrames({
    from: 4,
    to: 8,
    durationMs: 1000,
    easing: "ease-in-out",
    frameCount: 3
  });

  assert.deepEqual(frames, [
    {
      timeMs: 0,
      progress: 0,
      easedProgress: 0,
      value: 4
    },
    {
      timeMs: 500,
      progress: 0.5,
      easedProgress: 0.5,
      value: 6
    },
    {
      timeMs: 1000,
      progress: 1,
      easedProgress: 1,
      value: 8
    }
  ]);
});

test("sampleSaddleDenominatorAnimationFrames samples morph grids from intent", () => {
  const surface = createSaddleSurface3D({
    id: "saddle-surface",
    graphId: "saddle-orbit-graph",
    denominator: 4,
    xDomain: [-2, 2],
    yDomain: [-2, 2],
    xSampleCount: 3,
    ySampleCount: 3
  });
  const intent = createSaddleDenominatorAnimationIntent({
    id: "flatten-saddle",
    label: "flatten saddle",
    targetId: "saddle-surface",
    fromDenominator: 4,
    toDenominator: 8,
    durationMs: 1000
  });
  const frames = sampleSaddleDenominatorAnimationFrames(surface, intent, 3);

  assert.deepEqual(
    frames.map((frame) => ({
      timeMs: frame.timeMs,
      denominator: frame.denominator
    })),
    [
      { timeMs: 0, denominator: 4 },
      { timeMs: 500, denominator: 6 },
      { timeMs: 1000, denominator: 8 }
    ]
  );
  assert.deepEqual(frames[2]?.grid[1]?.[2], {
    x: 2,
    y: 0,
    z: 0.5
  });
});
