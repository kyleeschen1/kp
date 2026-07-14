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
  createJacobianHessianComparisonAnimationAsset,
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

test("createJacobianHessianComparisonAnimationAsset composes derivative formulas in a row layout", () => {
  const animation = createJacobianHessianComparisonAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  const tree = describeKpAnimationAssetTransformationTree(animation);

  assert.equal(animation.id, "animation.comparison.jacobian-hessian");
  assert.deepEqual(animation.metadata, {
    compositionKind: "synchronized-comparison",
    comparisonKind: "jacobian-hessian",
    clockCoupling: "shared-progress",
    derivativeOrders: "1 2"
  });
  assert.deepEqual(animation.layout, {
    id: "layout.comparison.jacobian-hessian.row",
    kind: "row",
    childIds: [
      "render.comparison.jacobian.formula",
      "render.comparison.hessian.formula"
    ],
    title: "Jacobian and Hessian formulas"
  });
  assert.deepEqual(
    animation.bundle.objects.map((object) => [object.id, object.objectType]),
    [
      ["formula-jacobian", "latex-form"],
      ["formula-hessian", "latex-form"],
      ["comparison-jacobian-hessian", "latex-comparison"]
    ]
  );
  assert.deepEqual(
    animation.renderTargets.map((target) => [
      target.id,
      target.kind,
      target.selectorIds
    ]),
    [
      [
        "render.comparison.jacobian.formula",
        "equation",
        [
          "formula-jacobian.expression",
          "formula-jacobian.derivative-order",
          "formula-jacobian.matrix-entries",
          "comparison-jacobian-hessian.first-order",
          "comparison-jacobian-hessian.shared-matrix-form"
        ]
      ],
      [
        "render.comparison.hessian.formula",
        "equation",
        [
          "formula-hessian.expression",
          "formula-hessian.derivative-order",
          "formula-hessian.matrix-entries",
          "comparison-jacobian-hessian.second-order",
          "comparison-jacobian-hessian.shared-matrix-form"
        ]
      ]
    ]
  );
  assert.deepEqual(animation.timeline, {
    id: "timeline.comparison.jacobian-hessian.shared",
    durationMs: 1800,
    beatCount: 50,
    markerIds: [
      "transform.comparison.jacobian-hessian.present-jacobian",
      "transform.comparison.jacobian-hessian.present-hessian",
      "transform.comparison.jacobian-hessian.compare-derivative-structure"
    ]
  });
  assert.equal(tree.rootKind, "sequence");
  assert.deepEqual(tree.forwardPhases.map((phase) => phase.nodeIds), [
    [
      "transform.comparison.jacobian-hessian.present-jacobian",
      "transform.comparison.jacobian-hessian.present-hessian"
    ],
    ["transform.comparison.jacobian-hessian.compare-derivative-structure"]
  ]);
  assert.ok(
    refs.semanticObjectRefs.some(
      (ref) => ref.objectId === "comparison-jacobian-hessian"
    )
  );
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
});

test("comparison layout animation assets are available through the animation catalog", () => {
  assert.deepEqual(
    createComparisonLayoutAnimationAssets().map((animation) => animation.id),
    [
      "animation.comparison.linear-solve-programming",
      "animation.comparison.jacobian-hessian"
    ]
  );
  assert.ok(
    createKpAnimationAssets()
      .map((animation) => animation.id)
      .includes("animation.comparison.linear-solve-programming")
  );
  assert.ok(
    createKpAnimationAssets()
      .map((animation) => animation.id)
      .includes("animation.comparison.jacobian-hessian")
  );
});
