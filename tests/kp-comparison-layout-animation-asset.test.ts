import { strict as assert } from "node:assert";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  compileKpAnimationAssetSemanticRefs,
  describeKpAnimationAssetTransformationTree,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createComparisonLayoutAnimationAssets,
  createLinearSolveProgrammingComparisonAnimationAsset
} from "../src/animation/comparison-layout-adapter.ts";

test("createLinearSolveProgrammingComparisonAnimationAsset composes equation and programming targets in a row layout", () => {
  const animation = createLinearSolveProgrammingComparisonAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  const tree = describeKpAnimationAssetTransformationTree(animation);

  assert.equal(animation.id, "animation.comparison.linear-solve-programming");
  assert.deepEqual(animation.metadata, {
    childAnimationIds:
      "animation.linear-solve.solve-x animation.programming.add.execution-trace",
    compositionKind: "synchronized-comparison",
    clockCoupling: "shared-progress"
  });
  assert.deepEqual(animation.layout, {
    id: "layout.comparison.linear-solve-programming.row",
    kind: "row",
    childIds: [
      "render.comparison.linear-solve.equation",
      "render.comparison.programming.trace"
    ],
    title: "Equation and program trace"
  });
  assert.deepEqual(
    animation.renderTargets.map((target) => [target.id, target.kind]),
    [
      ["render.comparison.linear-solve.equation", "equation"],
      ["render.comparison.programming.trace", "programming"]
    ]
  );
  assert.deepEqual(animation.timeline, {
    id: "timeline.comparison.linear-solve-programming.shared",
    durationMs: 2400,
    beatCount: 50,
    markerIds: [
      "animation.linear-solve.solve-x",
      "animation.programming.add.execution-trace"
    ]
  });
  assert.equal(tree.rootKind, "parallel");
  assert.deepEqual(tree.forwardPhases[0]?.nodeIds, [
    "transform.linear-solve.subtract-both-sides-3",
    "transform.linear-solve.cancel-left-additive-inverse",
    "transform.linear-solve.simplify-right-difference",
    "transform.programming.add.call",
    "transform.programming.add.evaluate-return",
    "transform.programming.add.return",
    "transform.programming.add.output"
  ]);
  assert.ok(
    refs.semanticObjectRefs.some(
      (ref) => ref.objectId === "source-file.programming.add"
    )
  );
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
});

test("comparison layout animation assets are available through the animation catalog", () => {
  assert.deepEqual(
    createComparisonLayoutAnimationAssets().map((animation) => animation.id),
    ["animation.comparison.linear-solve-programming"]
  );
  assert.ok(
    createKpAnimationAssets()
      .map((animation) => animation.id)
      .includes("animation.comparison.linear-solve-programming")
  );
});
