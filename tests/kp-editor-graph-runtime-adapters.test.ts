import assert from "node:assert/strict";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { sampleLinearMapVectorGraphRuntimeFrame } from "../src/animation/graph-runtime-frame.ts";
import { sampleDerivativeTangentRuntimeFrame } from "../src/animation/derivative-tangent-runtime-frame.ts";

test("vector scaling exposes concrete start, midpoint, and end coordinates", () => {
  const animation = createKpAnimationAssets().find((a) => a.id === "animation.graph.vector.linear-map-scale");
  assert.ok(animation);
  const coordinates = [0, 0.5, 1].map((progress) =>
    sampleLinearMapVectorGraphRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress })
    }).currentCoordinates
  );
  assert.deepEqual(coordinates, [[1, 2], [1.5, 4], [2, 6]]);
});

test("derivative tangent moves along x cubed while its slope changes", () => {
  const animation = createKpAnimationAssets().find((a) => a.id === "animation.derivative-rules.tangent-graph");
  assert.ok(animation);
  const points = [0, 0.5, 1].map((progress) => {
    const frame = sampleDerivativeTangentRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress })
    });
    return [frame.x, frame.y, frame.slope];
  });
  assert.deepEqual(points, [[0, 0, 0], [1, 1, 3], [2, 8, 12]]);
});
