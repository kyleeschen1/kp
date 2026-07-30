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

  for (const endpoint of [
    ...projection.endpoints,
    ...projection.transientEndpoints
  ]) {
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
    [...projection.endpoints, ...projection.transientEndpoints].map(
      (endpoint) => [endpoint.stateId, endpoint]
    )
  );

  for (const input of projection.motionInputs) {
    for (const segment of input.segments) {
      const source = byState.get(segment.sourceStateId)!;
      const target = byState.get(segment.targetStateId)!;
      assert.deepEqual(
        new Set(segment.selectorTransitions.flatMap(
          ({ sourceIds }) => sourceIds
        )),
        new Set(source.annotated.annotations.map(
          ({ selectorId }) => selectorId
        ))
      );
      assert.deepEqual(
        new Set(segment.selectorTransitions.flatMap(
          ({ targetIds }) => targetIds
        )),
        new Set(target.annotated.annotations.map(
          ({ selectorId }) => selectorId
        ))
      );
      assert.deepEqual(
        new Set(segment.structuralTransitions.flatMap(
          ({ sourceIds }) => sourceIds
        )),
        new Set(source.structuralAnchors.map(({ id }) => id))
      );
      assert.deepEqual(
        new Set(segment.structuralTransitions.flatMap(
          ({ targetIds }) => targetIds
        )),
        new Set(target.structuralAnchors.map(({ id }) => id))
      );
    }
  }
});

test("common-denominator refinement visibly multiplies by certified two over two", () => {
  const projection = createKpExactFractionQuantitySymbolicProjection();
  const factor = projection.transientEndpoints[0]!;
  const refinement = projection.motionInputs[1]!;

  assert.equal(
    factor.annotated.rawLatex,
    "\\frac{1\\,\\times\\,2}{3\\,\\times\\,2}\\;+\\;\\frac{1}{6}"
  );
  assert.equal(refinement.segments.length, 2);
  assert.deepEqual(
    refinement.segments.flatMap(({ selectorTransitions }) =>
      selectorTransitions.map(({ lifecycle }) => lifecycle)
    ).filter((lifecycle) => lifecycle !== "persist"),
    ["fission", "fission", "fusion", "fusion"]
  );
});

test("alignment and addition preserve native fraction structure without fades", () => {
  const projection = createKpExactFractionQuantitySymbolicProjection();
  const alignment = projection.motionInputs[2]!.segments[0]!;
  const merge = projection.motionInputs[3]!.segments[0]!;

  assert.deepEqual(
    alignment.structuralTransitions.map((entry) => entry.lifecycle),
    ["fusion"]
  );
  assert.ok(
    alignment.successorSyntheses[0]?.sourceAnnotations
      .filter(({ contribution }) => contribution === "material-input")
      .every((annotation) => !("pathFamily" in annotation))
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
  assert.ok(projection.motionInputs.flatMap(({ segments }) => segments)
    .flatMap(({ successorSyntheses }) => successorSyntheses)
    .every(({ motif }) =>
      motif === "successor-synthesis" || motif === "operation-evaluation"
    ));
  assert.equal(serialized.includes("paintPolicy"), false);
  assert.equal(serialized.includes("opacity"), false);
  assert.equal(serialized.includes("fontFamily"), false);
  assert.equal(serialized.includes("translate"), false);
  assert.equal(serialized.includes("sanitize"), false);
});

test("three sixths executes one typed division evaluation without cancellation", () => {
  const projection = createKpExactFractionQuantitySymbolicProjection();
  const recognition = projection.motionInputs[4]!;

  assert.equal(projection.transientEndpoints.length, 1);
  assert.deepEqual(
    recognition.segments.map(({ id }) => id),
    ["beat.exact-fraction.recognize-half.evaluate-division"]
  );
  assert.deepEqual(
    recognition.segments.map(({ selectorTransitions }) =>
      selectorTransitions.filter(({ lifecycle }) => lifecycle !== "persist")
        .map(({ lifecycle }) => lifecycle)
    ),
    [["fusion"]]
  );
  const binding = recognition.segments[0]?.successorSyntheses[0];
  assert.equal(binding?.motif, "operation-evaluation");
  assert.equal(binding?.authority.operationId, "kp.arithmetic.divide");
  assert.equal(
    binding?.sourceAnnotations.some(({ selectorIds }) =>
      selectorIds.includes("symbolic.sum.fraction-rule")
    ),
    true
  );
  assert.equal(
    binding?.targetAnnotations.some(({ selectorIds }) =>
      selectorIds.includes("symbolic.recognized.fraction-rule")
    ),
    true
  );
  assert.equal(JSON.stringify(recognition).includes("opacity"), false);
});
