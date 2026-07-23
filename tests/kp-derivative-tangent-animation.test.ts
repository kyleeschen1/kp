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
  secantTangentStateAt,
  tangentStateAt
} from "../src/animation/derivative-tangent-adapter.ts";
import {
  checkDerivativeTangentRuntimeLaw,
  sampleDerivativeTangentRuntimeFrame
} from "../src/animation/derivative-tangent-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";

test("derivative tangent asset synchronizes the difference quotient and secant convergence", () => {
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
        "transform.derivative-rules.tangent-graph.converge-difference-quotient",
        "definition.symbolic.calculus.derivative-limit"
      ],
      [
        "transform.derivative-rules.tangent-graph.converge-secant",
        "definition.graph.derivative.secant-tangent-convergence"
      ]
    ]
  );
  assert.equal(tree.rootKind, "parallel");
  assert.deepEqual(tree.forwardPhases.map((phase) => phase.nodeIds), [
    [
      "transform.derivative-rules.tangent-graph.converge-difference-quotient",
      "transform.derivative-rules.tangent-graph.converge-secant"
    ]
  ]);
  assert.deepEqual(
    animation.transformations[0]?.correspondenceMap?.records.map(
      (record) => record.relation
    ),
    ["role-change", "identity", "fan-in"]
  );
  assert.deepEqual(
    animation.transformations[1]?.correspondenceMap?.records.map(
      (record) => record.relation
    ),
    ["identity", "identity", "identity", "identity", "identity", "identity"]
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

test("derivative tangent runtime frame converges the finite quotient on the shared clock", () => {
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
      anchorX: frame.anchorX,
      anchorY: frame.anchorY,
      h: frame.h,
      movingX: frame.movingX,
      movingY: frame.movingY,
      secantSlope: frame.secantSlope,
      secantIntercept: frame.secantIntercept,
      secantSegment: frame.secantSegment,
      tangentSegment: frame.tangentSegment,
      currentSampleLatex: frame.currentSampleLatex,
      derivativeDisplayLatex: frame.derivativeDisplayLatex,
      activeTransformationIds: frame.activeTransformationIds
    },
    {
      graphProgress: 0.5,
      anchorX: 1,
      anchorY: 1,
      h: 0.5,
      movingX: 1.5,
      movingY: 3.375,
      secantSlope: 4.75,
      secantIntercept: -3.75,
      secantSegment: [
        [-0.25, -4.9375],
        [2.25, 6.9375]
      ],
      tangentSegment: [
        [-0.25, -2.75],
        [2.25, 4.75]
      ],
      currentSampleLatex: "h=0.50,\\quad m_{\\mathrm{sec}}=4.75",
      derivativeDisplayLatex: "f'(1)=3",
      activeTransformationIds: [
        "transform.derivative-rules.tangent-graph.converge-difference-quotient",
        "transform.derivative-rules.tangent-graph.converge-secant"
      ]
    }
  );
  assert.deepEqual(tangentStateAt(2), {
    x: 2,
    y: 8,
    slope: 12,
    intercept: -16
  });
  assert.deepEqual(secantTangentStateAt(1, 0), {
    anchorX: 1,
    anchorY: 1,
    h: 0,
    movingX: 1,
    movingY: 1,
    secantSlope: 3,
    secantIntercept: -2,
    tangentSlope: 3,
    tangentIntercept: -2
  });
  assert.deepEqual(checkDerivativeTangentRuntimeLaw({ animation }), {
    lawId: "graph-runtime.derivative-tangent",
    passed: true,
    failures: []
  });
});
