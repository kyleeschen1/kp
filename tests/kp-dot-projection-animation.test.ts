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
  assert.equal(tree.rootKind, "sequence");
  assert.deepEqual(
    animation.transformations.map((transformation) =>
      transformation.definitionId
    ),
    [
      "definition.symbolic.linear-algebra.dot-product",
      "definition.symbolic.linear-algebra.vector-projection"
    ]
  );
  assert.deepEqual(
    animation.bundle.objects
      .filter(({ objectType }) => objectType === "dot-product-component-pair")
      .map(({ id, value }) => ({ id, value })),
    [
      {
        id: "expression.dot-projection.component-pair.x",
        value: {
          index: 0,
          axis: "x",
          sourceComponent: 4,
          targetComponent: 1,
          product: 4,
          cumulativeDotProduct: 4,
          sourceGeometryId: "geometry.vector.dot-projection.left.component.x",
          targetGeometryId: "geometry.vector.dot-projection.right.component.x",
          projectionGeometryId:
            "geometry.vector.dot-projection.projection.component.x",
          latex: "4\\cdot1=4"
        }
      },
      {
        id: "expression.dot-projection.component-pair.y",
        value: {
          index: 1,
          axis: "y",
          sourceComponent: 2,
          targetComponent: 1,
          product: 2,
          cumulativeDotProduct: 6,
          sourceGeometryId: "geometry.vector.dot-projection.left.component.y",
          targetGeometryId: "geometry.vector.dot-projection.right.component.y",
          projectionGeometryId:
            "geometry.vector.dot-projection.projection.component.y",
          latex: "2\\cdot1=2"
        }
      }
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

test("dot-projection beats and exact rewind share one deterministic clock", () => {
  const animation = createDotProjectionAnimationAsset();
  const samples = [0, 1 / 8, 2 / 8, 3 / 8, 4 / 8, 5 / 8, 6 / 8, 7 / 8, 1];
  const forward = samples.map((progress) => sampleDotProjectionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress })
  }));
  const rewind = samples.map((progress) => sampleDotProjectionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction: "rewind",
      progress: 1 - progress
    })
  }));

  assert.deepEqual(forward.map(({ semanticBeatId }) => semanticBeatId), [
    "source-pose",
    "component-pair-x",
    "component-pair-y",
    "dot-settlement",
    "projection-scale",
    "projection-drop",
    "orthogonal-decomposition",
    "native-settlement",
    "native-settlement"
  ]);
  assert.deepEqual(
    rewind.map((frame) => ({
      beat: frame.semanticBeatId,
      drop: frame.dropPoint,
      pairs: frame.componentPairs
    })),
    forward.map((frame) => ({
      beat: frame.semanticBeatId,
      drop: frame.dropPoint,
      pairs: frame.componentPairs
    }))
  );
});

test("dot-projection runtime computes exact indexed perpendicular geometry", () => {
  const animation = createDotProjectionAnimationAsset();
  const frame = sampleDotProjectionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 11 / 16
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
      dotProduct: 6,
      projectionVector: [3, 3],
      orthogonalVector: [1, -1],
      dropPoint: [3.5, 2.5],
      angleRadians: Math.acos(3 / Math.sqrt(10))
    }
  );
  assert.deepEqual(
    frame.componentPairs.map(({ index, product, status }) =>
      [index, product, status]
    ),
    [[0, 4, "accumulated"], [1, 2, "accumulated"]]
  );
  assert.equal(frame.semanticBeatId, "projection-drop");
  assert.equal(frame.projectionDropProgress, 0.5);
  assert.match(frame.accessibleDescription, /perpendicular residual \(1, -1\)/);
  assert.deepEqual(checkDotProjectionRuntimeLaw({ animation }), {
    lawId: "graph-runtime.dot-projection",
    passed: true,
    failures: []
  });
});
