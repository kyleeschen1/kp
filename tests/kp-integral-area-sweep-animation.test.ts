import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import {
  areaSweepStateAt,
  createIntegralAreaSweepAnimationAsset,
  integralAreaSweepAnimationId
} from "../src/animation/integral-area-sweep-adapter.ts";
import {
  checkIntegralAreaSweepRuntimeLaw,
  sampleIntegralAreaSweepRuntimeFrame
} from "../src/animation/integral-area-sweep-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";

test("integral area-sweep asset preserves the accumulation bound contract", () => {
  const animation = createIntegralAreaSweepAnimationAsset();
  const [transformation] = animation.transformations;

  assert.equal(animation.id, integralAreaSweepAnimationId);
  assert.equal(
    transformation?.definitionId,
    "definition.symbolic.calculus.accumulation-derivative-ftc"
  );
  assert.deepEqual(
    transformation?.lawRefs?.map((law) => law.id),
    [
      "law.graph.integral-area-accumulation",
      "law.graph.integral-area-sweep-provenance"
    ]
  );
  assert.deepEqual(checkKpAnimationAssetReferenceClosure(animation), {
    lawId: "animation.reference-closure",
    passed: true,
    failures: []
  });
  assert.deepEqual(checkKpAnimationAssetSeekRewindLaw(animation), {
    lawId: "animation.seek-rewind",
    passed: true,
    failures: []
  });
});

test("integral area-sweep runtime samples exact area and mirrored rewind", () => {
  const animation = createIntegralAreaSweepAnimationAsset();
  const frame = sampleIntegralAreaSweepRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 0.5
    }),
    sampleCount: 5
  });

  assert.deepEqual(
    {
      graphProgress: frame.graphProgress,
      lowerBound: frame.lowerBound,
      upperBound: frame.upperBound,
      accumulatedArea: frame.accumulatedArea,
      integrandAtUpperBound: frame.integrandAtUpperBound,
      areaPolygon: frame.areaPolygon
    },
    {
      graphProgress: 0.5,
      lowerBound: 0,
      upperBound: 1.5,
      accumulatedArea: 1.125,
      integrandAtUpperBound: 2.25,
      areaPolygon: [
        [0, 0],
        [0, 0],
        [0.375, 0.140625],
        [0.75, 0.5625],
        [1.125, 1.265625],
        [1.5, 2.25],
        [1.5, 0]
      ]
    }
  );
  assert.deepEqual(areaSweepStateAt(3), {
    lowerBound: 0,
    upperBound: 3,
    accumulatedArea: 9,
    integrandAtUpperBound: 9
  });
  assert.deepEqual(checkIntegralAreaSweepRuntimeLaw({ animation }), {
    lawId: "graph-runtime.integral-area-sweep",
    passed: true,
    failures: []
  });
});
