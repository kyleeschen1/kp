import assert from "node:assert/strict";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { sampleLinearMapVectorGraphRuntimeFrame } from "../src/animation/graph-runtime-frame.ts";
import { sampleDerivativeTangentRuntimeFrame } from "../src/animation/derivative-tangent-runtime-frame.ts";
import { sampleIntegralAreaSweepRuntimeFrame } from "../src/animation/integral-area-sweep-runtime-frame.ts";
import { sampleDotProjectionRuntimeFrame } from "../src/animation/dot-projection-runtime-frame.ts";

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

test("dot projection drops the source point onto the target vector", () => {
  const animation = createKpAnimationAssets().find((a) => a.id === "animation.dot-projection.basic");
  assert.ok(animation);
  const drops = [0, 0.5, 1].map((progress) =>
    sampleDotProjectionRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress })
    }).dropPoint
  );
  assert.deepEqual(drops, [[3, 4], [3, 2], [3, 0]]);
});

test("integral sweep grows its bound and accumulated area together", () => {
  const animation = createKpAnimationAssets().find((a) => a.id === "animation.integral-ftc.area-sweep");
  assert.ok(animation);
  const areas = [0, 0.5, 1].map((progress) => {
    const frame = sampleIntegralAreaSweepRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress })
    });
    return [frame.upperBound, frame.accumulatedArea];
  });
  assert.deepEqual(areas, [[0, 0], [1.5, 1.125], [3, 9]]);
});

test("derivative secant point converges to the tangent anchor", () => {
  const animation = createKpAnimationAssets().find((a) => a.id === "animation.derivative-rules.tangent-graph");
  assert.ok(animation);
  const points = [0, 0.5, 1].map((progress) => {
    const frame = sampleDerivativeTangentRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress })
    });
    return [frame.h, frame.movingX, frame.movingY, frame.secantSlope];
  });
  assert.deepEqual(points, [
    [1, 2, 8, 7],
    [0.5, 1.5, 3.375, 4.75],
    [0, 1, 1, 3]
  ]);
});
