import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  compileKpAnimationAssetSemanticRefs
} from "../src/animation/asset.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan,
  validateKpReaderEquationMaterialPlanTotality
} from "../src/reader/renderers/public-api.ts";

test("fraction composition assembles one canonical 14-state animation asset", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();

  assert.equal(animation.bundle.objects.length, 14);
  assert.equal(animation.transformations.length, 13);
  assert.equal(animation.transformationTree.root.kind, "sequence");
  assert.deepEqual(compileKpAnimationAssetSemanticRefs(animation).diagnostics, []);
  assert.equal(animation.metadata?.["canonicalPaintPolicy"], "exclusive-when-active");
  assert.equal(JSON.stringify(animation).includes("whole-equation-fade"), false);
});

test("every adjacent transition reaches semantic material totality in both directions", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const progressSamples = animation.transformations.map(
    (_transformation, index) => (index + 0.5) / animation.transformations.length
  );

  for (const direction of ["forward", "rewind"] as const) {
    for (const progress of progressSamples) {
      const runtimeFrame = sampleKpAnimationRuntimeFrame({
        id: `runtime.fraction-composition.${direction}.${progress}`,
        animation,
        direction,
        progress
      });
      const renderPlan = projectKpReaderEquationRenderPlan({
        animation,
        runtimeFrame
      });
      const materialPlan = compileKpReaderEquationMaterialPlan(renderPlan);

      assert.deepEqual(renderPlan.diagnostics, [], String(progress));
      assert.equal(renderPlan.transitions.length, 1, String(progress));
      assert.equal(renderPlan.transitions[0]?.semanticStatus, "ready", String(progress));
      assert.deepEqual(materialPlan.diagnostics, [], String(progress));
      assert.deepEqual(
        validateKpReaderEquationMaterialPlanTotality(renderPlan, materialPlan),
        [],
        String(progress)
      );
    }
  }
});

test("canonical planning retains structural motifs and opaque arithmetic synthesis", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const transitions = animation.transformations.map((_transformation, index) => {
    const frame = sampleKpAnimationRuntimeFrame({
      animation,
      progress: (index + 0.5) / animation.transformations.length
    });
    return projectKpReaderEquationRenderPlan({
      animation,
      runtimeFrame: frame
    }).transitions[0]!;
  });

  assert.deepEqual(
    transitions.map(({ visualMotif }) => visualMotif?.kind),
    [
      "copy-fan-out",
      "fraction-factor-split",
      "simplify-into",
      "simplify-into",
      "append-after-shift",
      "cancelation",
      "simplify-into",
      "append-after-shift",
      "cancelation",
      "simplify-into",
      "append-after-shift",
      "cancelation",
      "simplify-into"
    ]
  );
  assert.equal(
    transitions
      .filter(({ transformType }) => transformType.startsWith("simplifyConstant"))
      .every(({ successorSyntheses }) => successorSyntheses?.length === 1),
    true
  );
});
