import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  describeKpAnimationAssetTransformationTree
} from "../src/animation/asset.ts";
import {
  createDerivativeTangentAnimationAsset,
  derivativeTangentAnimationId,
  tangentStateAt
} from "../src/animation/derivative-tangent-adapter.ts";
import {
  checkDerivativeTangentRuntimeLaw,
  sampleDerivativeTangentRuntimeFrame
} from "../src/animation/derivative-tangent-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";

test("derivative tangent asset synchronizes the power rule and graph motion", () => {
  const animation = createDerivativeTangentAnimationAsset();
  const tree = describeKpAnimationAssetTransformationTree(animation);

  assert.equal(animation.id, derivativeTangentAnimationId);
  assert.deepEqual(
    animation.transformations.map((transformation) => [
      transformation.id,
      transformation.definitionId
    ]),
    [
      [
        "transform.derivative-rules.tangent-graph.apply-power-rule",
        "definition.symbolic.calculus.derivative-power-rule"
      ],
      [
        "transform.derivative-rules.tangent-graph.move-tangent",
        "definition.graph.derivative.tangent-motion"
      ]
    ]
  );
  assert.equal(tree.rootKind, "parallel");
  assert.deepEqual(tree.forwardPhases.map((phase) => phase.nodeIds), [
    [
      "transform.derivative-rules.tangent-graph.apply-power-rule",
      "transform.derivative-rules.tangent-graph.move-tangent"
    ]
  ]);
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

test("derivative tangent runtime frame uses 3x squared on the shared clock", () => {
  const animation = createDerivativeTangentAnimationAsset();
  const frame = sampleDerivativeTangentRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 0.5
    })
  });

  assert.deepEqual(
    {
      graphProgress: frame.graphProgress,
      x: frame.x,
      y: frame.y,
      slope: frame.slope,
      intercept: frame.intercept,
      tangentSegment: frame.tangentSegment,
      activeTransformationIds: frame.activeTransformationIds
    },
    {
      graphProgress: 0.5,
      x: 1,
      y: 1,
      slope: 3,
      intercept: -2,
      tangentSegment: [
        [0.25, -1.25],
        [1.75, 3.25]
      ],
      activeTransformationIds: [
        "transform.derivative-rules.tangent-graph.apply-power-rule",
        "transform.derivative-rules.tangent-graph.move-tangent"
      ]
    }
  );
  assert.deepEqual(tangentStateAt(2), {
    x: 2,
    y: 8,
    slope: 12,
    intercept: -16
  });
  assert.deepEqual(checkDerivativeTangentRuntimeLaw({ animation }), {
    lawId: "graph-runtime.derivative-tangent",
    passed: true,
    failures: []
  });
});
