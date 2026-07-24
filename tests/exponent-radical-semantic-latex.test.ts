import assert from "node:assert/strict";
import test from "node:test";

import {
  createExponentExpansionAnimationAsset,
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import { createKpExponentRadicalSelectorAnnotatedLatex } from "../src/editor/exponent-radical-semantic-latex.ts";
import { compileKpSemanticEquationTransitionResult } from "../src/domain-ir/public-api.ts";

test("exponent expansion and radical rewriting compile complete semantics", () => {
  for (const animation of [
    createExponentExpansionAnimationAsset(),
    createExponentRadicalRewriteAnimationAsset()
  ]) {
    for (const transformation of animation.transformations) {
      const result = compileKpSemanticEquationTransitionResult({
        transformation,
        bundle: animation.bundle
      });
      assert.equal(result.status, "semantic", transformation.id);
      assert.deepEqual(result.diagnostics, [], transformation.id);
    }
  }
});

test("exponent and radical states reserve structural glyphs for DOM binding", () => {
  for (const animation of [
    createExponentExpansionAnimationAsset(),
    createExponentRadicalRewriteAnimationAsset()
  ]) {
    for (const object of animation.bundle.objects) {
      const annotated = createKpExponentRadicalSelectorAnnotatedLatex({
        objectId: object.id,
        selectors: object.selectors
      });
      assert.ok(annotated, object.id);
      const structural = object.selectors.filter((selector) =>
        selector.id.endsWith(".exponent-fraction-line") ||
        selector.id.endsWith(".radical-hook") ||
        selector.id.endsWith(".radical-overbar")
      );
      assert.equal(annotated.annotations.length, object.selectors.length - structural.length);
    }
  }
});
