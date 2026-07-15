import assert from "node:assert/strict";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { sampleLinearMapVectorGraphRuntimeFrame } from "../src/animation/graph-runtime-frame.ts";

test("graph viewport consumes the existing vector runtime sampler", () => {
  const animation = createKpAnimationAssets().find((a) => a.id === "animation.graph.vector.linear-map-scale");
  assert.ok(animation);
  const frame = sampleLinearMapVectorGraphRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: 0.5 })
  });
  assert.deepEqual(frame.currentCoordinates, [1.5, 4]);
});
