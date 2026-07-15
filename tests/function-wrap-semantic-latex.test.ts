import assert from "node:assert/strict";
import test from "node:test";

import { createFunctionWrapAnimationAsset } from "../src/animation/function-wrap-adapter.ts";
import { createKpFunctionWrapSelectorAnnotatedLatex } from "../src/editor/function-wrap-semantic-latex.ts";
import { compileKpSemanticEquationTransitionResult } from "../src/rendering/semantic-equation-transition-compiler.ts";

test("function wrapping compiles role-change and wrapper introduction semantics", () => {
  const animation = createFunctionWrapAnimationAsset();
  const transformation = animation.transformations[0]!;
  const result = compileKpSemanticEquationTransitionResult({
    transformation,
    bundle: animation.bundle
  });
  assert.equal(result.status, "semantic");
  assert.deepEqual(
    result.ir?.relations.map((relation) => relation.lifecycle),
    ["role-change", "enter"]
  );
});

test("function-wrap states annotate the function, delimiters, and argument", () => {
  const animation = createFunctionWrapAnimationAsset();
  for (const object of animation.bundle.objects) {
    const annotated = createKpFunctionWrapSelectorAnnotatedLatex({
      objectId: object.id,
      selectors: object.selectors
    });
    assert.ok(annotated, object.id);
    assert.deepEqual(
      annotated.annotations.map((annotation) => annotation.selectorId),
      object.selectors.map((selector) => selector.id)
    );
  }
});
