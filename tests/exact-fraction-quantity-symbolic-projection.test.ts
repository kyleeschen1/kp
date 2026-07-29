import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExactFractionQuantitySymbolicProjection
} from "../src/rendering/exact-fraction-quantity-symbolic-projection.ts";
import {
  renderSelectorAnnotatedLatexToHtml
} from "../src/rendering/katex-adapter.ts";
import {
  createKpExactFractionQuantityTrace
} from "../src/semantic/exact-fraction-quantity-trace.ts";

test("symbolic projection compiles the five verified native KaTeX endpoints", () => {
  const trace = createKpExactFractionQuantityTrace();
  const projection = createKpExactFractionQuantitySymbolicProjection(trace);

  assert.equal(projection.traceId, trace.id);
  assert.deepEqual(
    projection.endpoints.map(({ stateId }) => stateId),
    trace.states.map(({ id }) => id)
  );
  assert.deepEqual(
    projection.endpoints.map(({ checkpointId }) => checkpointId),
    trace.states.map(({ checkpointId }) => checkpointId)
  );
  assert.deepEqual(
    projection.endpoints.map(({ annotated }) => annotated.rawLatex),
    [
      "\\frac{1}{3}\\;+\\;\\frac{1}{6}",
      "\\frac{2}{6}\\;+\\;\\frac{1}{6}",
      "\\frac{2\\;+\\;1}{6}",
      "\\frac{3}{6}",
      "\\frac{1}{2}"
    ]
  );
});

test("native symbolic endpoints retain MathML and hydratable paint identities", () => {
  const projection = createKpExactFractionQuantitySymbolicProjection();

  for (const endpoint of projection.endpoints) {
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-mathml"/);
    assert.match(
      endpoint.nativeHtmlAndMathml,
      /<math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML"/
    );
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-html" aria-hidden="true"/);
    const motionHtml = renderSelectorAnnotatedLatexToHtml(endpoint.annotated);
    for (const annotation of endpoint.annotated.annotations) {
      assert.ok(
        motionHtml.includes(`data-kp-motion-id="${annotation.motionId}"`),
        annotation.selectorId
      );
    }
    assert.equal(
      (motionHtml.match(/class="frac-line"/gu) ?? []).length,
      endpoint.structuralAnchors.length
    );
  }
});

test("symbolic motion inputs cover every selector and rule exactly once", () => {
  const projection = createKpExactFractionQuantitySymbolicProjection();
  const byState = new Map(
    projection.endpoints.map((endpoint) => [endpoint.stateId, endpoint])
  );

  for (const input of projection.motionInputs) {
    const source = byState.get(input.sourceStateId)!;
    const target = byState.get(input.targetStateId)!;
    assert.deepEqual(
      new Set(input.selectorTransitions.flatMap(({ sourceIds }) => sourceIds)),
      new Set(source.annotated.annotations.map(({ selectorId }) => selectorId))
    );
    assert.deepEqual(
      new Set(input.selectorTransitions.flatMap(({ targetIds }) => targetIds)),
      new Set(target.annotated.annotations.map(({ selectorId }) => selectorId))
    );
    assert.deepEqual(
      new Set(input.structuralTransitions.flatMap(({ sourceIds }) => sourceIds)),
      new Set(source.structuralAnchors.map(({ id }) => id))
    );
    assert.deepEqual(
      new Set(input.structuralTransitions.flatMap(({ targetIds }) => targetIds)),
      new Set(target.structuralAnchors.map(({ id }) => id))
    );
  }
});

test("alignment and addition preserve native fraction structure without fades", () => {
  const projection = createKpExactFractionQuantitySymbolicProjection();
  const alignment = projection.motionInputs[2]!;
  const merge = projection.motionInputs[3]!;

  assert.deepEqual(
    alignment.structuralTransitions.map((entry) => entry.lifecycle),
    ["fusion"]
  );
  assert.deepEqual(
    merge.selectorTransitions.find(
      ({ targetIds }) => targetIds.includes("symbolic.result.numerator")
    ),
    {
      sourceIds: [
        "symbolic.addend.third.numerator",
        "symbolic.operation.add",
        "symbolic.addend.sixth.numerator"
      ],
      targetIds: ["symbolic.result.numerator"],
      lifecycle: "fusion"
    }
  );
  const serialized = JSON.stringify(projection);
  assert.equal(serialized.includes("opacity"), false);
  assert.equal(serialized.includes("fontFamily"), false);
  assert.equal(serialized.includes("translate"), false);
  assert.equal(serialized.includes("sanitize"), false);
});
