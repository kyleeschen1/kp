import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpDerivativeSumSelectorAnnotatedLatex
} from "../src/editor/derivative-sum-semantic-latex.ts";
import {
  createGeneratedCalculusProblemFixture
} from "../src/semantic/generated-calculus-problem-fixture.ts";

test("derivative sum LaTeX exposes every fan-out and resolution role", () => {
  const fixture = createGeneratedCalculusProblemFixture(
    "generated.calculus.derivative.sum-rule-polynomial"
  );
  const annotated = fixture.bundle.objects.map((object) =>
    createKpDerivativeSumSelectorAnnotatedLatex({
      objectId: object.id,
      selectors: object.selectors
    })
  );

  assert.deepEqual(annotated.map((value) => value?.rawLatex), [
    "\\frac{d}{dx}(x^{3} + 2x)",
    "\\frac{d}{dx}x^{3} + \\frac{d}{dx}2x",
    "3x^{2} + 2"
  ]);
  assert.deepEqual(annotated.map((value) =>
    value?.annotations.map((annotation) => annotation.selectorId).sort()
  ), fixture.bundle.objects.map((object) =>
    object.selectors.map((selector) => selector.id).sort()
  ));
});
