import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAntiderivativePowerSelectorAnnotatedLatex
} from "../src/editor/antiderivative-power-semantic-latex.ts";
import {
  createGeneratedCalculusProblemFixture
} from "../src/semantic/generated-calculus-problem-fixture.ts";
import {
  renderLatexToHtml,
  renderSelectorAnnotatedLatexToHtml
} from "../src/rendering/katex-adapter.ts";

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
    "\\int x^{2}\\,dx",
    "\\frac{x^{2+1}}{2+1} + C",
    "\\frac{x^{3}}{3} + C"
  ]);
  assert.deepEqual(annotated.map((value) =>
    value?.annotations.map((annotation) => annotation.selectorId).sort()
  ), fixture.bundle.objects.map((object) =>
    object.selectors.map((selector) => selector.id).sort()
  ));
  assert.deepEqual(annotated.map((value) => value?.rawLatex),
    fixture.bundle.objects.map((object) =>
      String((object.value as { readonly latex: string }).latex)
    ));

  const rendered = annotated.map((value) =>
    renderSelectorAnnotatedLatexToHtml(value!)
  );
  assert.match(rendered[0]!, /data-kp-antiderivative-integrand-scope=/u);
  assert.match(rendered[0]!, /data-kp-antiderivative-differential-binding=/u);
  assert.doesNotMatch(rendered[0]!, /data-kp-antiderivative-exact-quotient=/u);
  for (const html of rendered.slice(1)) {
    assert.match(html, /data-kp-antiderivative-exact-quotient=/u);
    assert.match(html, /data-kp-antiderivative-integration-constant=/u);
  }
  assert.ok(annotated.every((value) => /class="katex-mathml"/u.test(
    renderLatexToHtml(value?.rawLatex ?? "", { output: "htmlAndMathml" })
  )));
});
