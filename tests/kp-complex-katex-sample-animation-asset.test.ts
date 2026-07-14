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
  createComplexKatexSampleAnimationAssets,
  createFourierTransformPairSampleAnimationAsset,
  createFundamentalTheoremCalculusSampleAnimationAsset
} from "../src/animation/complex-katex-sample-adapter.ts";
import {
  createAnimationAssetAgendaRows
} from "../src/project-dashboard/generated-algebra-catalog.ts";

test("createFundamentalTheoremCalculusSampleAnimationAsset exposes FTC forms as a comparison animation", () => {
  const animation = createFundamentalTheoremCalculusSampleAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  const tree = describeKpAnimationAssetTransformationTree(animation);

  assert.equal(animation.id, "animation.sample.fundamental-theorem-calculus");
  assert.deepEqual(animation.layout, {
    id: "layout.sample.fundamental-theorem-calculus.row",
    kind: "row",
    childIds: [
      "render.sample.ftc.derivative-form",
      "render.sample.ftc.net-change-form"
    ],
    title: "Fundamental Theorem of Calculus forms"
  });
  assert.deepEqual(animation.timeline, {
    id: "timeline.sample.fundamental-theorem-calculus.shared",
    durationMs: 1800,
    beatCount: 50,
    markerIds: [
      "transform.sample.fundamental-theorem-calculus.present-1",
      "transform.sample.fundamental-theorem-calculus.present-2",
      "transform.sample.fundamental-theorem-calculus.compare"
    ]
  });
  assert.deepEqual(
    animation.bundle.objects.map((object) => [object.id, object.objectType]),
    [
      ["formula-ftc-derivative", "latex-form"],
      ["formula-ftc-net-change", "latex-form"],
      ["comparison-ftc-forms", "latex-comparison"]
    ]
  );
  assert.deepEqual(tree.forwardPhases.map((phase) => phase.nodeIds), [
    [
      "transform.sample.fundamental-theorem-calculus.present-1",
      "transform.sample.fundamental-theorem-calculus.present-2"
    ],
    ["transform.sample.fundamental-theorem-calculus.compare"]
  ]);
  assert.ok(
    refs.semanticObjectRefs.some(
      (ref) => ref.objectId === "comparison-ftc-forms"
    )
  );
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
});

test("createFourierTransformPairSampleAnimationAsset exposes forward and inverse transform forms", () => {
  const animation = createFourierTransformPairSampleAnimationAsset();
  const transform = animation.transformations.find(
    (candidate) => candidate.transformType === "compareFourierTransformPair"
  );

  assert.equal(animation.id, "animation.sample.fourier-transform-pair");
  assert.deepEqual(
    animation.renderTargets.map((target) => [
      target.id,
      target.kind,
      target.selectorIds
    ]),
    [
      [
        "render.sample.fourier.forward-transform",
        "equation",
        [
          "formula-fourier-transform.expression",
          "formula-fourier-transform.frequency-function",
          "formula-fourier-transform.kernel",
          "formula-fourier-transform.measure",
          "comparison-fourier-transform-pair.forward",
          "comparison-fourier-transform-pair.kernel-sign"
        ]
      ],
      [
        "render.sample.fourier.inverse-transform",
        "equation",
        [
          "formula-inverse-fourier-transform.expression",
          "formula-inverse-fourier-transform.time-function",
          "formula-inverse-fourier-transform.kernel",
          "formula-inverse-fourier-transform.measure",
          "comparison-fourier-transform-pair.inverse",
          "comparison-fourier-transform-pair.kernel-sign"
        ]
      ]
    ]
  );
  assert.deepEqual(transform?.preserves, ["structure", "role"]);
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
});

test("complex KaTeX sample assets are available through the animation catalog and dashboard search", () => {
  assert.deepEqual(
    createComplexKatexSampleAnimationAssets().map((animation) => animation.id),
    [
      "animation.sample.fundamental-theorem-calculus",
      "animation.sample.fourier-transform-pair"
    ]
  );
  assert.ok(
    createKpAnimationAssets()
      .map((animation) => animation.id)
      .includes("animation.sample.fourier-transform-pair")
  );
  assert.deepEqual(
    createAnimationAssetAgendaRows(
      "fourier sample render-target-kind:equation"
    ).map((row) => row.id),
    ["animation-sample-fourier-transform-pair"]
  );
  assert.deepEqual(
    createAnimationAssetAgendaRows(
      "fundamental-theorem comparison-ftc-forms"
    ).map((row) => row.id),
    ["animation-sample-fundamental-theorem-calculus"]
  );
});
