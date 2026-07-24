import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { createKpSolveXSelectorAnnotatedLatex } from "../src/rendering/solve-x-selector-annotated-latex.ts";
import { compileKpSemanticEquationTransitionResult } from "../src/domain-ir/public-api.ts";

test("solve-x transformations retain complete semantic lifecycle maps", () => {
  const animation = createLinearSolveAnimationAsset();
  for (const transformation of animation.transformations) {
    const result = compileKpSemanticEquationTransitionResult({
      transformation,
      bundle: animation.bundle
    });
    assert.equal(result.status, "semantic", transformation.id);
    assert.deepEqual(result.diagnostics, [], transformation.id);
  }
});

test("solve-x states annotate every semantic selector for KaTeX motion", () => {
  const animation = createLinearSolveAnimationAsset();
  for (const object of animation.bundle.objects) {
    const annotated = createKpSolveXSelectorAnnotatedLatex({
      objectId: object.id,
      selectorIds: object.selectors.map((selector) => selector.id)
    });
    assert.ok(annotated, object.id);
    assert.deepEqual(
      annotated.annotations.map((annotation) => annotation.selectorId),
      object.selectors.map((selector) => selector.id)
    );
  }
});
