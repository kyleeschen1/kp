import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionFoldIntent
} from "../src/semantic/fraction-composition-fold-intent.ts";
import {
  compileKpFractionCompositionStaticProjection
} from "../src/semantic/fraction-composition-fold-projection.ts";
import {
  compileKpFractionCompositionFoldTimeline,
  projectKpFractionCompositionAnimationProgress,
  sampleKpFractionCompositionTimeline
} from "../src/semantic/fraction-composition-fold-timeline.ts";

function projection(mode: "expanded" | "collapsed") {
  return compileKpFractionCompositionStaticProjection(
    createKpFractionCompositionFoldIntent({ mode })
  );
}

test("fraction fold timing preserves all thirteen certified operations", () => {
  const expanded = compileKpFractionCompositionFoldTimeline(
    projection("expanded")
  );
  const collapsed = compileKpFractionCompositionFoldTimeline(
    projection("collapsed")
  );

  assert.equal(expanded.id, collapsed.id);
  assert.deepEqual(
    expanded.phases.map(({ nodeId }) => nodeId),
    collapsed.phases.map(({ nodeId }) => nodeId)
  );
  assert.deepEqual(
    expanded.phases.flatMap(({ operationIds }) => operationIds),
    collapsed.phases.flatMap(({ operationIds }) => operationIds)
  );
  assert.equal(
    expanded.phases.flatMap(({ operationIds }) => operationIds).length,
    13
  );
  assert.ok(expanded.totalBeats > collapsed.totalBeats);
});

test("fraction checkpoints land on exact successor starts", () => {
  const timeline = compileKpFractionCompositionFoldTimeline(
    projection("expanded")
  );
  const sample = sampleKpFractionCompositionTimeline({
    timeline,
    progress: timeline.checkpoints["difference-simplified"]
  });

  assert.equal(sample.activeNodeId, timeline.phases[3]!.nodeId);
  assert.equal(sample.beat, timeline.phases[3]!.startBeat);
  assert.equal(sample.phaseProgress, 0);
  assert.equal(timeline.checkpoints.factored, 0);
  assert.equal(timeline.checkpoints.solved, 1);
});

test("fraction projection maps group density onto every canonical operation", () => {
  for (const mode of ["expanded", "collapsed"] as const) {
    const timeline = compileKpFractionCompositionFoldTimeline(
      projection(mode)
    );
    for (const [index, phase] of timeline.phases.entries()) {
      const sample = sampleKpFractionCompositionTimeline({
        timeline,
        progress: phase.startBeat / timeline.totalBeats
      });
      const operationOffset = timeline.phases
        .slice(0, index)
        .reduce((sum, candidate) => sum + candidate.operationIds.length, 0);
      assert.equal(
        projectKpFractionCompositionAnimationProgress({ timeline, sample }),
        operationOffset / 13
      );
    }
  }
});

test("fraction timeline sampling is deterministic and rewind-independent", () => {
  const timeline = compileKpFractionCompositionFoldTimeline(
    projection("collapsed")
  );
  const first = sampleKpFractionCompositionTimeline({
    timeline,
    progress: 0.358
  });
  sampleKpFractionCompositionTimeline({ timeline, progress: 0.9 });
  assert.deepEqual(
    sampleKpFractionCompositionTimeline({ timeline, progress: 0.358 }),
    first
  );
  assert.equal(
    projectKpFractionCompositionAnimationProgress({
      timeline,
      sample: sampleKpFractionCompositionTimeline({ timeline, progress: 0 })
    }),
    0
  );
  assert.equal(
    projectKpFractionCompositionAnimationProgress({
      timeline,
      sample: sampleKpFractionCompositionTimeline({ timeline, progress: 1 })
    }),
    1
  );
});
