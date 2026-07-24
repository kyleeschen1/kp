import assert from "node:assert/strict";
import test from "node:test";

import {
  createDistributionExpansionAnimationAsset,
  createDistributionFactoringAnimationAsset
} from "../src/animation/distribution-adapter.ts";
import { createKpDistributionSelectorAnnotatedLatex } from "../src/editor/distribution-semantic-latex.ts";
import { compileKpSemanticEquationTransitionResult } from "../src/domain-ir/public-api.ts";

test("distribution and factoring compile inverse fan-out and fan-in semantics", () => {
  const cases = [
    [createDistributionExpansionAnimationAsset(), "split"],
    [createDistributionFactoringAnimationAsset(), "merge"]
  ] as const;
  for (const [animation, lifecycle] of cases) {
    const result = compileKpSemanticEquationTransitionResult({
      transformation: animation.transformations[0]!,
      bundle: animation.bundle
    });
    assert.equal(result.status, "semantic", animation.id);
    assert.ok(result.ir?.relations.some((relation) => relation.lifecycle === lifecycle));
  }
});

test("distribution states annotate factors, terms, operators, and delimiters", () => {
  for (const animation of [
    createDistributionExpansionAnimationAsset(),
    createDistributionFactoringAnimationAsset()
  ]) {
    for (const object of animation.bundle.objects) {
      const annotated = createKpDistributionSelectorAnnotatedLatex({
        objectId: object.id,
        selectors: object.selectors
      });
      assert.ok(annotated, object.id);
      assert.deepEqual(
        annotated.annotations.map((annotation) => annotation.selectorId),
        object.selectors.map((selector) => selector.id)
      );
    }
  }
});
