import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionFoldIntent
} from "../src/semantic/foldable-distribution-fold-intent.ts";
import {
  compileKpFoldableDistributionStaticProjection
} from "../src/semantic/foldable-distribution-fold-projection.ts";
import {
  compileKpFoldableDistributionFoldTimeline,
  sampleKpFoldableDistributionTimeline
} from "../src/semantic/foldable-distribution-fold-timeline.ts";

function projection(mode: "expanded" | "collapsed") {
  return compileKpFoldableDistributionStaticProjection(
    createKpFoldableDistributionFoldIntent({ mode })
  );
}

test("fold timing preserves one ordered six-operation semantic trace", () => {
  const expanded = compileKpFoldableDistributionFoldTimeline(
    projection("expanded")
  );
  const collapsed = compileKpFoldableDistributionFoldTimeline(
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
  assert.equal(expanded.phases.flatMap(({ operationIds }) => operationIds).length, 6);
  assert.ok(expanded.totalBeats > collapsed.totalBeats);
});

test("collapsed groups remain visible and checkpoints span the shared clock", () => {
  const timeline = compileKpFoldableDistributionFoldTimeline(
    projection("collapsed")
  );

  assert.deepEqual(
    timeline.phases.map(({ detail }) => detail),
    ["collapsed", "collapsed", "leaf", "leaf"]
  );
  assert.ok(timeline.phases.every(
    ({ endBeat, startBeat, minimumVisibleBeats }) =>
      endBeat - startBeat >= minimumVisibleBeats
  ));
  assert.equal(timeline.checkpoints.factored, 0);
  assert.equal(timeline.checkpoints.collected, 1);
});

test("sampling is deterministic, clamped, and symmetric under rewind", () => {
  const timeline = compileKpFoldableDistributionFoldTimeline(
    projection("expanded")
  );

  assert.deepEqual(
    sampleKpFoldableDistributionTimeline({ timeline, progress: 0.42 }),
    sampleKpFoldableDistributionTimeline({ timeline, progress: 0.42 })
  );
  assert.equal(
    sampleKpFoldableDistributionTimeline({ timeline, progress: -1 }).progress,
    0
  );
  assert.equal(
    sampleKpFoldableDistributionTimeline({ timeline, progress: 2 }).progress,
    1
  );
  const forward = sampleKpFoldableDistributionTimeline({
    timeline,
    progress: 0.42
  });
  sampleKpFoldableDistributionTimeline({ timeline, progress: 0.88 });
  assert.deepEqual(
    sampleKpFoldableDistributionTimeline({ timeline, progress: 0.42 }),
    forward
  );
});
