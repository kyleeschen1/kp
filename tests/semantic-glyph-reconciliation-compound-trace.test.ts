import assert from "node:assert/strict";
import test from "node:test";

import { createKpGlyphReconciliationCompoundTrace } from "../src/animation/semantic-glyph-reconciliation-compound-trace.ts";
import {
  createKpNativeKatexCompoundScenePlan,
  type KpNativeKatexCompoundScene
} from "../src/rendering/native-katex-compound-scene-plan.ts";
import type { KpNativeKatexSceneTrack } from "../src/rendering/native-katex-scene-compositor.ts";

test("compound trace speeds up every canonical operation without omission", () => {
  const trace = createKpGlyphReconciliationCompoundTrace();

  assert.ok(trace.operationIds.length > 2);
  assert.equal(new Set(trace.operationIds).size, trace.operationIds.length);
  assert.ok(trace.compressionRatio > 0);
  assert.ok(trace.compressionRatio < 1);
  assert.equal(trace.accessibilityTranscript.length, trace.operationIds.length);
  assert.deepEqual(
    trace.segments.map(({ operationId }) => operationId),
    trace.operationIds
  );
  assert.equal(trace.segments[0]?.startMs, 0);
  assert.equal(trace.segments.at(-1)?.endMs, trace.compressedDurationMs);
});

test("compound trace drill-down restores the exact paused parent frame", () => {
  const trace = createKpGlyphReconciliationCompoundTrace({
    parentProgress: 0.371
  });

  assert.equal(trace.drillDown.parentClock.paused, true);
  assert.equal(trace.drillDown.childClock.nested, true);
  assert.equal(trace.drillDown.restore.exact, true);
  assert.equal(trace.drillDown.restore.elapsedMs, trace.drillDown.parentClock.elapsedMs);
  assert.equal(trace.drillDown.restore.progress, trace.drillDown.parentClock.progress);
  assert.deepEqual(trace.drillDown.actionIds, trace.operationIds);
  assert.equal(trace.drillDown.parentClock.progress, 0.371);
});

test("compound scene plan maps the canonical trace to one active generic scene", () => {
  const trace = createKpGlyphReconciliationCompoundTrace();
  const plan = createKpNativeKatexCompoundScenePlan({
    timeline: trace,
    scenes: scenesFor(trace.operationIds)
  });

  assert.deepEqual(
    plan.segments.map(({ operationId }) => operationId),
    trace.operationIds
  );
  assert.equal(plan.totalDurationMs, trace.compressedDurationMs);
  for (let index = 0; index < trace.segments.length; index += 1) {
    const segment = trace.segments[index]!;
    const middle = plan.sample(
      (segment.startMs + segment.durationMs / 2) /
        trace.compressedDurationMs
    );
    assert.equal(middle.activeSceneIndex, index);
    assert.equal(middle.operationId, trace.operationIds[index]);
    assert.ok(Math.abs(middle.localProgress - 0.5) < Number.EPSILON * 8);
    assert.equal(middle.visualOwner, "material-scene");
    assert.deepEqual(middle.materialSceneIds, [`scene.${index}`]);
  }
});

test("compound scene boundaries, direct seek, and reverse are exact", () => {
  const trace = createKpGlyphReconciliationCompoundTrace();
  const plan = createKpNativeKatexCompoundScenePlan({
    timeline: trace,
    scenes: scenesFor(trace.operationIds)
  });
  const progresses = Array.from({ length: 101 }, (_, index) => index / 100);
  const forward = progresses.map((progress) => plan.sample(progress));
  const reverse = [...progresses].reverse()
    .map((progress) => plan.sample(progress))
    .reverse();

  assert.deepEqual(forward, reverse);
  assert.equal(plan.sample(0).visualOwner, "source-native");
  assert.equal(plan.sample(1).visualOwner, "target-native");
  assert.deepEqual(plan.sample(0).materialSceneIds, []);
  assert.deepEqual(plan.sample(1).materialSceneIds, []);
  trace.segments.slice(0, -1).forEach((segment, index) => {
    const boundary = plan.sample(segment.endMs / trace.compressedDurationMs);
    assert.equal(boundary.activeSceneIndex, index + 1);
    assert.equal(boundary.localProgress, 0);
    assert.equal(boundary.visualOwner, "source-native");
    assert.deepEqual(boundary.materialSceneIds, []);
  });
  assert.equal(
    forward.every(({ materialSceneIds }) => materialSceneIds.length <= 1),
    true
  );
  assert.deepEqual(plan.sample(0.437), plan.sample(0.437));
});

test("compound scene plan rejects reordered or missing scenes", () => {
  const trace = createKpGlyphReconciliationCompoundTrace();
  const scenes = scenesFor(trace.operationIds);

  assert.throws(
    () => createKpNativeKatexCompoundScenePlan({
      timeline: trace,
      scenes: [scenes[1]!, scenes[0]!, ...scenes.slice(2)]
    }),
    /canonical operation order/
  );
  assert.throws(
    () => createKpNativeKatexCompoundScenePlan({
      timeline: trace,
      scenes: scenes.slice(1)
    }),
    /exactly one scene/
  );
});

function scenesFor(
  operationIds: readonly string[]
): readonly KpNativeKatexCompoundScene[] {
  return operationIds.map((operationId, index) => ({
    id: `scene.${index}`,
    operationId,
    tracks: [track(index)]
  }));
}

function track(index: number): KpNativeKatexSceneTrack {
  return {
    id: `track.${index}`,
    componentId: `component.${index}`,
    lifecycle: "persist",
    sourceAtomId: `source.${index}`,
    targetAtomId: `target.${index}`,
    visualAtomId: `source.${index}`,
    paintKind: "glyph",
    sizingMode: "rect",
    startRect: { left: index, top: 0, width: 10, height: 20 },
    endRect: { left: index + 10, top: 0, width: 10, height: 20 },
    startOpacity: 1,
    endOpacity: 1
  };
}
