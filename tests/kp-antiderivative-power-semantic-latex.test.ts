import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAntiderivativePowerSelectorAnnotatedLatex
} from "../src/editor/antiderivative-power-semantic-latex.ts";
import {
  createGeneratedCalculusProblemFixture
} from "../src/semantic/generated-calculus-problem-fixture.ts";

test("antiderivative power LaTeX exposes expansion and settlement roles", () => {
  const fixture = createGeneratedCalculusProblemFixture(
    "generated.calculus.integral.power-rule-quadratic"
  );
  const annotated = fixture.bundle.objects.map((object) =>
    createKpAntiderivativePowerSelectorAnnotatedLatex({
      objectId: object.id,
      selectors: object.selectors
    })
  );
  assert.deepEqual(annotated.map((value) => value?.rawLatex), [
    "\\int 6x^{2}\\,dx",
    "\\frac{6}{2+1}x^{2+1}",
    "2x^{3} + C"
  ]);
  assert.deepEqual(annotated.map((value) =>
    value?.annotations.map((annotation) => annotation.selectorId).sort()
  ), fixture.bundle.objects.map((object) =>
    object.selectors.map((selector) => selector.id).sort()
  ));
});
