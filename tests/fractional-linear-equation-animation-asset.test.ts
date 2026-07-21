import assert from "node:assert/strict";
import test from "node:test";

import { compileKpAnimationAssetSemanticRefs } from "../src/animation/asset.ts";
import {
  createFractionalLinearEquationAnimationAsset
} from "../src/animation/fractional-linear-equation-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { checkKpAnimationRuntimeRewindClockLaw } from "../src/animation/runtime-laws.ts";
import { createKpEquationLinearRearrangementBindings } from "../src/rendering/equation-linear-rearrangement-bindings.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/public-api.ts";

test("fractional equation composes into one renderer-neutral animation asset", () => {
  const animation = createFractionalLinearEquationAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  assert.deepEqual(refs.diagnostics, []);
  assert.equal(animation.bundle.objects.length, 7);
  assert.equal(animation.transformations.length, 6);
  assert.equal(animation.renderTargets.length, 1);
  assert.equal(animation.renderTargets[0]?.kind, "equation");
  assert.equal(animation.metadata?.["equationNativeHandoffRecipe"], "atomic-v1");
});

test("fractional subtraction reuses the accepted balanced-introduction engine", () => {
  const bindings = createKpEquationLinearRearrangementBindings(
    createFractionalLinearEquationAnimationAsset()
  );
  assert.deepEqual(bindings[0], {
    transformationId: "transform.fractional-linear.subtract-both-sides-3",
    kind: "balanced-introduction"
  });
});

test("fractional additive cancellation and difference use reviewed motifs", () => {
  const bindings = createKpEquationLinearRearrangementBindings(
    createFractionalLinearEquationAnimationAsset()
  );
  assert.deepEqual(bindings.slice(1, 3).map(({ transformationId, kind }) => ({
    transformationId,
    kind
  })), [
    {
      transformationId: "transform.fractional-linear.cancel-additive-inverses",
      kind: "cancel-additive-inverses"
    },
    {
      transformationId: "transform.fractional-linear.simplify-right-difference",
      kind: "simplify-constant-difference"
    }
  ]);
  assert.ok(bindings[2]?.successorSynthesisBinding);
});

test("multiplication enters as one balanced operation on both sides", () => {
  const bindings = createKpEquationLinearRearrangementBindings(
    createFractionalLinearEquationAnimationAsset()
  );
  assert.deepEqual(bindings[3], {
    transformationId: "transform.fractional-linear.multiply-both-sides-2",
    kind: "balanced-introduction"
  });
});

test("denominator removal has an explicit multiplicative cancellation kind", () => {
  const bindings = createKpEquationLinearRearrangementBindings(
    createFractionalLinearEquationAnimationAsset()
  );
  assert.deepEqual(bindings[4], {
    transformationId: "transform.fractional-linear.cancel-denominator",
    kind: "cancel-multiplicative-inverses"
  });
});

test("two times four coalesces through explicit product synthesis", () => {
  const bindings = createKpEquationLinearRearrangementBindings(
    createFractionalLinearEquationAnimationAsset()
  );
  assert.equal(bindings[5]?.transformationId,
    "transform.fractional-linear.simplify-right-product");
  assert.equal(bindings[5]?.kind, "simplify-constant-product");
  assert.ok(bindings[5]?.successorSynthesisBinding);
});

test("every transition settles through a total atomic native handoff", () => {
  const animation = createFractionalLinearEquationAnimationAsset();
  const transitionCount = animation.transformations.length;

  for (let index = 0; index < transitionCount; index += 1) {
    const runtimeFrame = sampleKpAnimationRuntimeFrame({
      animation,
      progress: (index + 0.5) / transitionCount
    });
    const renderPlan = projectKpReaderEquationRenderPlan({
      animation,
      runtimeFrame
    });
    const materialPlan = compileKpReaderEquationMaterialPlan(renderPlan);
    assert.deepEqual(renderPlan.diagnostics, []);
    assert.deepEqual(materialPlan.diagnostics, []);
    assert.equal(renderPlan.transitions.length, 1);
    assert.equal(materialPlan.transitions.length, 1);
    assert.ok(materialPlan.transitions[0]!.owners.length > 0);
  }

  assert.equal(animation.metadata?.["equationNativeHandoffRecipe"], "atomic-v1");
});

test("each operation focuses only its causal symbols", () => {
  const animation = createFractionalLinearEquationAnimationAsset();
  const expectedFocusCounts = [3, 2, 3, 3, 2, 3];

  expectedFocusCounts.forEach((expectedCount, index) => {
    const frame = sampleKpAnimationRuntimeFrame({
      animation,
      progress: (index + 0.5) / expectedFocusCounts.length
    });
    assert.equal(frame.focusSelectorIds.length, expectedCount);
    assert.equal(frame.activeAnnotationIds.length, 1);
  });
});

test("dense direct seeks and rewinds preserve the exact semantic phase", () => {
  const animation = createFractionalLinearEquationAnimationAsset();
  const progressSamples = Array.from({ length: 97 }, (_, index) => index / 96);

  assert.deepEqual(
    checkKpAnimationRuntimeRewindClockLaw({ animation, progressSamples }),
    {
      lawId: "animation-runtime.rewind-clock",
      passed: true,
      failures: []
    }
  );

  for (const progress of progressSamples) {
    const first = sampleKpAnimationRuntimeFrame({ animation, progress });
    const second = sampleKpAnimationRuntimeFrame({ animation, progress });
    assert.deepEqual(second, first);
  }
});
