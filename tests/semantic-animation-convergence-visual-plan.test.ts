import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticAnimationConvergenceVisualPlan
} from "../src/editor/semantic-animation-convergence-visual-plan.ts";

test("gold visual plan covers every manifest topic at five deterministic states", () => {
  const plan = createKpSemanticAnimationConvergenceVisualPlan();

  assert.equal(plan.length, 9);
  for (const item of plan) {
    assert.deepEqual(
      item.frames.map(({ kind }) => kind),
      [
        "source-endpoint",
        "phase-forward",
        "direct-seek",
        "phase-rewind",
        "target-endpoint"
      ]
    );
    assert.equal(item.frames[2]?.progress, 0.67);
    assert.deepEqual(item.frames[3], {
      id: "rewind-330",
      kind: "phase-rewind",
      direction: "rewind",
      progress: 0.33,
      matchingForwardProgress: 0.33,
      directionEntryProgress:
        item.preservation.topic === "distribution" ? 1 : 0.67,
      requiresNativeEndpoint: false
    });
  }
});

test("lesson authority selects reader surfaces while catalog authority selects editor", () => {
  const plan = createKpSemanticAnimationConvergenceVisualPlan();
  assert.deepEqual(
    plan.map(({ preservation, surface }) => [
      preservation.topic,
      surface
    ]),
    [
      ["solve-x", "equation-reader"],
      ["distribution", "distribution-reader"],
      ["factoring", "editor-player"],
      ["fractions", "equation-reader"],
      ["radical", "editor-player"],
      ["structural-wrap", "editor-player"],
      ["matrix-composition", "editor-player"],
      ["equation-graph", "editor-player"],
      ["program-trace", "editor-player"]
    ]
  );
  assert.equal(
    plan.find(({ preservation }) => preservation.topic === "distribution")
      ?.frames.find(({ direction }) => direction === "rewind")
      ?.directionEntryProgress,
    1
  );
});
