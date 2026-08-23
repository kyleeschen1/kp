import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpDerivativePowerSelectorAnnotatedLatex
} from "../src/editor/derivative-power-semantic-latex.ts";
import {
  createGeneratedCalculusProblemFixture
} from "../src/semantic/generated-calculus-problem-fixture.ts";

test("derivative power LaTeX exposes all semantic roles without changing notation", () => {
  const fixture = createGeneratedCalculusProblemFixture(
    "generated.calculus.derivative.power-rule-x-cubed"
  );
  const annotated = fixture.bundle.objects.map((object) =>
    createKpDerivativePowerSelectorAnnotatedLatex({
      objectId: object.id,
      selectors: object.selectors
    })
  );

  assert.deepEqual(annotated.map((value) => value?.rawLatex), [
    "\\frac{d}{dx}x^{3}",
    "3x^{3-1}",
    "3x^{2}"
  ]);
  assert.deepEqual(annotated.map((value) =>
    value?.annotations.map((annotation) => annotation.selectorId)
  ), fixture.bundle.objects.map((object) =>
    object.selectors.map((selector) => selector.id)
  ));
});
