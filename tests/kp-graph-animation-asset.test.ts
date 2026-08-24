import { strict as assert } from "node:assert";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  compileKpAnimationAssetSemanticRefs,
  describeKpAnimationAssetTransformationTree,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  createGraphAnimationAssets,
  createGraphSurfaceModeAnimationAsset,
  createLinearMapVectorAnimationAsset
} from "../src/animation/graph-adapter.ts";
import {
  checkLinearMapVectorGraphRewindLaw,
  sampleLinearMapVectorGraphRuntimeFrame
} from "../src/animation/graph-runtime-frame.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";

test("createGraphSurfaceModeAnimationAsset wraps graph surface motion in an AnimationAsset", () => {
  const animation = createGraphSurfaceModeAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  const tree = describeKpAnimationAssetTransformationTree(animation);

  assert.equal(animation.id, "animation.graph.surface-mode.mesh-to-donut");
  assert.equal(animation.renderTargets[0]?.kind, "graph");
  assert.deepEqual(animation.renderTargets[0]?.objectIds, [
    "saddle-orbit-graph",
    "saddle-orbit-x-axis",
    "saddle-orbit-y-axis",
    "saddle-orbit-z-axis",
    "saddle-surface"
  ]);
  assert.deepEqual(animation.renderTargets[0]?.selectorIds, [
    "saddle-orbit-graph.surfaceMode.mesh",
    "saddle-orbit-graph.surfaceMode.donut"
  ]);
  assert.deepEqual(animation.transformations.map((transform) => transform.id), [
    "transform.graph.surface-mode.mesh-to-donut"
  ]);
  assert.deepEqual(animation.transformations[0]?.preserves, [
    "identity",
    "structure",
    "presentation"
  ]);
  assert.deepEqual(tree.forwardPhases.map((phase) => phase.nodeIds), [
    ["transform.graph.surface-mode.mesh-to-donut"]
  ]);
  assert.deepEqual(tree.rewindPhases.map((phase) => phase.nodeIds), [
    ["transform.graph.surface-mode.mesh-to-donut"]
  ]);
  assert.ok(refs.semanticObjectRefs.some((ref) => ref.objectId === "saddle-surface"));
  assert.equal(refs.renderTargetRefs[0]?.kind, "graph");
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
});

test("createLinearMapVectorAnimationAsset exposes vector motion as graph animation semantics", () => {
  const animation = createLinearMapVectorAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);

  assert.equal(animation.id, "animation.graph.vector.linear-map-scale");
  assert.deepEqual(
    animation.bundle.objects.map((object) => [object.id, object.objectType]),
    [
      ["matrix.scale", "matrix"],
      ["linear-map.scale", "linear-map"],
      ["graph.vector-plane", "graph-2d"],
      ["vector.scale.source", "vector"],
      ["vector.scale.target", "vector"]
    ]
  );
  assert.deepEqual(animation.transformations.map((transform) => transform.id), [
    "transform.graph.vector.apply-linear-map-scale"
  ]);
  assert.deepEqual(animation.transformations[0]?.sourceObjectIds, [
    "linear-map.scale",
    "vector.scale.source"
  ]);
  assert.deepEqual(animation.transformations[0]?.targetObjectIds, [
    "linear-map.scale",
    "vector.scale.target"
  ]);
  assert.deepEqual(animation.renderTargets[0]?.metadata, {
    graphMotionKind: "linear-map-vector-motion",
    linearMapId: "linear-map.scale",
    sourceVectorId: "vector.scale.source",
    targetVectorId: "vector.scale.target"
  });
  assert.deepEqual(refs.transformationRefs[0]?.preserves, [
    "identity",
    "value",
    "structure"
  ]);
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
});

test("graph animation placeholders are available through the animation catalog", () => {
  assert.deepEqual(
    createGraphAnimationAssets().map((animation) => animation.id),
    [
      "animation.graph.surface-mode.mesh-to-donut",
      "animation.graph.vector.linear-map-scale",
      "animation.graph-2d.quadratic-translate-right-two",
      "animation.graph-3d.saddle-denominator-four-to-eight",
      "animation.derivative-rules.tangent-graph",
      "animation.integral-ftc.area-sweep",
      "animation.dot-projection.basic"
    ]
  );
  assert.ok(
    createKpAnimationAssets()
      .map((animation) => animation.id)
      .includes("animation.graph.vector.linear-map-scale")
  );
});

test("linear map vector graph sample consumes animation runtime frames", () => {
  const animation = createLinearMapVectorAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.graph.vector.midpoint",
    animation,
    beat: 10
  });
  const graphFrame = sampleLinearMapVectorGraphRuntimeFrame({
    animation,
    runtimeFrame
  });

  assert.deepEqual(graphFrame, {
    id: "graph-frame.runtime.graph.vector.midpoint.render.graph.vector.linear-map-scale",
    kind: "graph-vector-runtime-frame",
    animationId: "animation.graph.vector.linear-map-scale",
    renderTargetId: "render.graph.vector.linear-map-scale",
    graphId: "graph.vector-plane",
    linearMapId: "linear-map.scale",
    sourceVectorId: "vector.scale.source",
    targetVectorId: "vector.scale.target",
    runtimeFrameId: "runtime.graph.vector.midpoint",
    phaseId: "animation.graph.vector.linear-map-scale.forward.0",
    progress: 0.5,
    graphProgress: 0.5,
    beat: 10,
    activeTransformationIds: [
      "transform.graph.vector.apply-linear-map-scale"
    ],
    sourceCoordinates: [1, 2],
    targetCoordinates: [2, 6],
    currentCoordinates: [1.5, 4],
    pathCoordinates: [
      [1, 2],
      [2, 6]
    ]
  });
});

test("linear map vector graph runtime frame has an exact rewind law", () => {
  const animation = createLinearMapVectorAnimationAsset();
  const forwardQuarter = sampleLinearMapVectorGraphRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction: "forward",
      progress: 0.25
    })
  });
  const rewindThreeQuarter = sampleLinearMapVectorGraphRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction: "rewind",
      progress: 0.75
    })
  });
  const rewindStart = sampleLinearMapVectorGraphRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction: "rewind",
      progress: 0
    })
  });

  assert.equal(forwardQuarter.graphProgress, 0.25);
  assert.equal(rewindThreeQuarter.graphProgress, 0.25);
  assert.deepEqual(
    rewindThreeQuarter.currentCoordinates,
    forwardQuarter.currentCoordinates
  );
  assert.deepEqual(rewindStart.currentCoordinates, [2, 6]);
  assert.deepEqual(
    checkLinearMapVectorGraphRewindLaw({
      animation,
      sampleProgresses: [0, 0.25, 0.5, 0.75, 1]
    }),
    {
      lawId: "graph-runtime.linear-map-vector.rewind",
      passed: true,
      failures: []
    }
  );
});
