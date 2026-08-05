import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import {
  createLinearMapVectorAnimationAsset
} from "../src/animation/graph-adapter.ts";
import { sampleLinearMapVectorGraphRuntimeFrame } from
  "../src/animation/graph-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from
  "../src/animation/runtime-sampler.ts";
import { createKpEditorAnimationLibrary } from
  "../src/editor/animation-library.ts";

const animationId = "animation.graph.vector.linear-map-scale";

test("linear-map placeholder retains unique graph semantics", () => {
  const animation = createLinearMapVectorAnimationAsset();
  assert.equal(animation.id, animationId);
  assert.deepEqual(animation.metadata, {
    domain: "linear-algebra",
    placeholderContract: true,
    graphMotionKind: "linear-map-vector-motion"
  });
  assert.deepEqual(animation.bundle.objects.map(({ id, objectType }) =>
    [id, objectType]), [
    ["matrix.scale", "matrix"],
    ["linear-map.scale", "linear-map"],
    ["graph.vector-plane", "graph-2d"],
    ["vector.scale.source", "vector"],
    ["vector.scale.target", "vector"]
  ]);
  assert.deepEqual(animation.timeline, {
    id: "timeline.graph.vector.linear-map-scale",
    durationMs: 1_600,
    beatCount: 20
  });
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);

  const midpoint = sampleLinearMapVectorGraphRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: 0.5 })
  });
  assert.deepEqual(midpoint.sourceCoordinates, [1, 2]);
  assert.deepEqual(midpoint.targetCoordinates, [2, 6]);
  assert.deepEqual(midpoint.currentCoordinates, [1.5, 4]);
  assert.deepEqual(midpoint.pathCoordinates, [[1, 2], [2, 6]]);
});

test("linear-map placeholder remains the vector-add-scale graph caller", () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ sampleId }) => sampleId === "sample.animation.vector-add-scale.basic"
  );
  assert.ok(descriptor);
  assert.equal(descriptor.animationId, animationId);
  assert.equal(descriptor.familyId, "family.linear-algebra.vector-add-scale");
  assert.deepEqual(descriptor.renderTargetKinds, ["graph"]);
});

test("linear-map placeholder keeps named product and conformance references", async () => {
  const references = [
    ["src/animation/graph-adapter.ts", "createLinearMapVectorAnimationAsset"],
    ["src/editor/graph-svg-domain-renderers.ts", `case "${animationId}"`],
    ["src/editor/selected-surface-capability.ts", `"${animationId}"`],
    [
      "src/animation/symbolic-manipulation-family-registry.ts",
      "sample.animation.vector-add-scale.basic"
    ],
    ["tests/kp-graph-animation-asset.test.ts", animationId],
    ["tests/kp-editor-graph-runtime-adapters.test.ts", animationId],
    ["tests/editor-animation-library.browser.spec.ts", animationId],
    ["tests/kp-symbolic-family-animation-resolver.test.ts", animationId]
  ] as const;
  for (const [path, token] of references) {
    const source = await readFile(path, "utf8");
    assert.ok(source.includes(token), `${path} no longer proves ${token}`);
  }
});
