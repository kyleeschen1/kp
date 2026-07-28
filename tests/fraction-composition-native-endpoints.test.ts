import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionAnnotatedEndpoints,
  createKpFractionCompositionSelectorAnnotatedLatex
} from "../src/rendering/fraction-composition-selector-annotated-latex.ts";
import {
  renderSelectorAnnotatedLatexToHtml
} from "../src/rendering/katex-adapter.ts";
import {
  createKpLawfulFractionSolveMacro
} from "../src/semantic/fraction-solve-macro.ts";
import {
  createKpFractionCompositionEndpointSpecs
} from "../src/semantic/fraction-composition-endpoint-spec.ts";

test("fraction composition compiles all certified states into native endpoints", () => {
  const macro = createKpLawfulFractionSolveMacro();
  const endpoints = createKpFractionCompositionAnnotatedEndpoints();

  assert.equal(endpoints.length, 14);
  assert.deepEqual(
    endpoints.map(({ stateId }) => stateId),
    macro.verification.stateIds
  );
  assert.equal(endpoints[0]?.annotated.rawLatex,
    "\\frac{2}{3}\\;(\\;x\\;+\\;6\\;)\\;=\\;10");
  assert.equal(endpoints.at(-1)?.annotated.rawLatex, "x\\;=\\;9");
  assert.equal(
    createKpFractionCompositionSelectorAnnotatedLatex("unknown"),
    undefined
  );
  const endpointSpecs = createKpFractionCompositionEndpointSpecs();
  assert.equal(
    endpointSpecs[0]?.accessibleText,
    "2 divided by 3 times the quantity x plus 6 equals 10"
  );
  assert.equal(endpointSpecs.at(-1)?.accessibleText, "x equals 9");
});

test("every endpoint selector and fraction rule is native and structurally addressable", () => {
  for (const endpoint of createKpFractionCompositionAnnotatedEndpoints()) {
    const selectorIds = endpoint.annotated.annotations.map(({ selectorId }) => selectorId);
    const selectorSet = new Set(selectorIds);
    assert.equal(selectorSet.size, selectorIds.length);
    assert.ok(selectorIds.length >= 3);
    for (const envelope of endpoint.groupEnvelopes) {
      assert.ok(envelope.memberSelectorIds.length > 0, envelope.id);
      assert.ok(
        envelope.memberSelectorIds.every((selectorId) => selectorSet.has(selectorId)),
        envelope.id
      );
    }
    const html = renderSelectorAnnotatedLatexToHtml(endpoint.annotated);
    assert.match(html, /class="katex-html"/);
    for (const annotation of endpoint.annotated.annotations) {
      assert.ok(
        html.includes(`data-kp-motion-id="${annotation.motionId}"`),
        annotation.selectorId
      );
    }
    assert.equal(
      (html.match(/class="frac-line"/g) ?? []).length,
      endpoint.structuralAnchors.length,
      endpoint.stateId
    );
    assert.ok(
      endpoint.structuralAnchors.every(({ id }) => id.endsWith(".fraction-rule"))
    );
  }
});

test("native endpoint compilation does not introduce alternate math or geometry", () => {
  const serialized = JSON.stringify(createKpFractionCompositionAnnotatedEndpoints());

  assert.equal(serialized.includes("translate"), false);
  assert.equal(serialized.includes("scale"), false);
  assert.equal(serialized.includes("leftPx"), false);
  assert.equal(serialized.includes("topPx"), false);
  assert.equal(serialized.includes("opacity"), false);
  assert.equal(serialized.includes("duration"), false);
});

test("implicit coefficients remain native typographic units", () => {
  const endpoints = createKpFractionCompositionAnnotatedEndpoints();
  const normalized = endpoints.find(
    ({ stateId }) => stateId === "fraction-solve.state.normalized"
  );
  const simplified = endpoints.find(
    ({ stateId }) =>
      stateId === "fraction-solve.state.right-product-simplified"
  );

  assert.match(normalized?.annotated.rawLatex ?? "", /\\frac\{2x\}\{3\}/);
  assert.match(simplified?.annotated.rawLatex ?? "", /^2x\\;/);
  assert.doesNotMatch(normalized?.annotated.rawLatex ?? "", /2\\;x/);
  assert.doesNotMatch(simplified?.annotated.rawLatex ?? "", /2\\;x/);
});
