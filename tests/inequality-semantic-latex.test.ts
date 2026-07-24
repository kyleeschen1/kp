import assert from "node:assert/strict";
import test from "node:test";

import { createInequalitySignFlipAnimationAsset } from "../src/animation/inequality-sign-flip-adapter.ts";
import { createKpInequalitySelectorAnnotatedLatex } from "../src/editor/inequality-semantic-latex.ts";
import { compileKpSemanticEquationTransitionResult } from "../src/domain-ir/public-api.ts";

test("inequality negative scaling compiles persistence, scaling, and relation pivot", () => {
  const animation = createInequalitySignFlipAnimationAsset();
  const result = compileKpSemanticEquationTransitionResult({
    transformation: animation.transformations[0]!,
    bundle: animation.bundle
  });
  assert.equal(result.status, "semantic");
  assert.deepEqual(
    result.ir?.relations.map((relation) => relation.lifecycle),
    ["persist", "enter", "role-change", "exit", "enter"]
  );
});

test("inequality states annotate each visible algebraic role exactly once", () => {
  const animation = createInequalitySignFlipAnimationAsset();
  for (const object of animation.bundle.objects) {
    const annotated = createKpInequalitySelectorAnnotatedLatex({
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
