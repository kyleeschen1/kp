import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpBehavior
} from "../src/semantic/asset-behavior.ts";
import {
  inspectKpBehaviorAt
} from "../src/semantic/asset-inspection.ts";
import {
  createLinearSolveKpBehavior
} from "../src/semantic/linear-solve-asset.ts";

test("inspectKpBehaviorAt returns sampled frame and extracted active ids", () => {
  const behavior = createKpBehavior({
    id: "behavior.inspectable",
    durationMs: 1000,
    sample: ({ timeMs, progress }) => ({
      timeMs,
      progress,
      activeTransformationIds:
        progress < 0.5 ? ["transform.subtract"] : ["transform.cancel"],
      activeSelectorIds: progress < 0.5 ? ["eq0.x"] : ["eq1.x"],
      phaseId: progress < 0.5 ? "subtract" : "cancel"
    })
  });

  assert.deepEqual(
    inspectKpBehaviorAt({
      behavior,
      timeMs: 750,
      activeTransformationIds: (frame) => frame.activeTransformationIds,
      activeSelectorIds: (frame) => frame.activeSelectorIds,
      phaseId: (frame) => frame.phaseId
    }),
    {
      behaviorId: "behavior.inspectable",
      timeMs: 750,
      progress: 0.75,
      phaseId: "cancel",
      activeTransformationIds: ["transform.cancel"],
      activeSelectorIds: ["eq1.x"],
      frame: {
        timeMs: 750,
        progress: 0.75,
        activeTransformationIds: ["transform.cancel"],
        activeSelectorIds: ["eq1.x"],
        phaseId: "cancel"
      }
    }
  );
});

test("inspectKpBehaviorAt can inspect the linear-solve active transformation", () => {
  const behavior = createLinearSolveKpBehavior();
  const inspection = inspectKpBehaviorAt({
    behavior,
    timeMs: 1200,
    activeTransformationIds: (frame) =>
      frame.cardFrame.parentTimelineFrame.tracks
        .filter((track) => track.kind === "transformation" && track.active)
        .map((track) => track.targetId)
  });

  assert.equal(inspection.behaviorId, "behavior.linear-solve.card");
  assert.equal(inspection.progress, 0.5);
  assert.deepEqual(inspection.activeTransformationIds, [
    "transform.linear-solve.cancel-left-additive-inverse"
  ]);
});
