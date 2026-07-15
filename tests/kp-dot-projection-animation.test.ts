import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  describeKpAnimationAssetTransformationTree
} from "../src/animation/asset.ts";
import {
  createDotProjectionAnimationAsset,
  dotProjectionAnimationId
} from "../src/animation/dot-projection-adapter.ts";
import {
  checkDotProjectionRuntimeLaw,
  sampleDotProjectionRuntimeFrame
} from "../src/animation/dot-projection-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";

test("dot-projection asset synchronizes scalar and geometric interpretations", () => {
  const animation = createDotProjectionAnimationAsset();
  const tree = describeKpAnimationAssetTransformationTree(animation);

  assert.equal(animation.id, dotProjectionAnimationId);
  assert.equal(tree.rootKind, "parallel");
  assert.deepEqual(
    animation.transformations.map((transformation) =>
      transformation.definitionId
    ),
    [
      "definition.symbolic.linear-algebra.dot-product",
      "definition.symbolic.linear-algebra.vector-projection"
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

test("dot-projection runtime computes exact perpendicular geometry", () => {
  const animation = createDotProjectionAnimationAsset();
  const frame = sampleDotProjectionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 0.5
    })
  });

  assert.deepEqual(
    {
      dotProduct: frame.dotProduct,
      projectionVector: frame.projectionVector,
      orthogonalVector: frame.orthogonalVector,
      dropPoint: frame.dropPoint,
      angleRadians: frame.angleRadians
    },
    {
      dotProduct: 12,
      projectionVector: [3, 0],
      orthogonalVector: [0, 4],
      dropPoint: [3, 2],
      angleRadians: Math.acos(0.6)
    }
  );
  assert.deepEqual(checkDotProjectionRuntimeLaw({ animation }), {
    lawId: "graph-runtime.dot-projection",
    passed: true,
    failures: []
  });
});
