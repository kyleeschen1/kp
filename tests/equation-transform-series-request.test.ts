import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateKpEquationTransformSeriesRequest } from
  "../src/authoring/equation-transform-series-request.ts";

test("ordered LaTeX states accept explicit and proposed adjacency intents", () => {
  const input = canonicalRequest();
  const result = validateKpEquationTransformSeriesRequest(input);
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.deepEqual(result.request.states.map(({ id, narration }) => ({
    id,
    narration
  })), [{
    id: "state.log-product.source",
    narration: "Begin with one logarithm around a product."
  }, {
    id: "state.log-product.binary",
    narration: undefined
  }, {
    id: "state.log-product.expanded",
    narration: "The factors retain order as separate arguments."
  }]);
  assert.deepEqual(result.request.adjacencies.map(({ intent }) => intent.mode), [
    "explicit",
    "proposed"
  ]);
  assert.equal(Object.isFrozen(result.request), true);
  assert.equal(Object.isFrozen(result.request.states), true);
  assert.equal(Object.isFrozen(result.request.adjacencies[0]?.intent), true);
  assert.deepEqual(JSON.parse(JSON.stringify(result.request)), result.request);
  assert.equal(Object.isFrozen(input.states), false);
});

test("adjacencies must cover neighboring states exactly once and in order", () => {
  const input = canonicalRequest();
  const result = validateKpEquationTransformSeriesRequest({
    ...input,
    adjacencies: [{
      ...input.adjacencies[0],
      fromStateId: "state.log-product.binary",
      toStateId: "state.log-product.source"
    }]
  });
  assert.deepEqual(
    result.status === "repair-required"
      ? result.diagnostics.map(({ code }) => code)
      : [],
    ["equation-series.adjacency.count", "equation-series.adjacency.order"]
  );
});

test("duplicate IDs and invalid native notation are typed repairs", () => {
  const input = canonicalRequest();
  const duplicate = validateKpEquationTransformSeriesRequest({
    ...input,
    states: [
      input.states[0],
      { ...input.states[1], id: input.states[0]!.id },
      input.states[2]
    ]
  });
  assert.ok(duplicate.status === "repair-required" &&
    duplicate.diagnostics.some(({ code }) =>
      code === "equation-series.id.duplicate"
    ));
  const invalid = validateKpEquationTransformSeriesRequest({
    ...input,
    states: [input.states[0], { ...input.states[1], latex: " " }, input.states[2]]
  });
  assert.ok(invalid.status === "repair-required");
  if (invalid.status !== "repair-required") return;
  assert.ok(invalid.diagnostics.some(({ code }) =>
    code === "equation-series.value.invalid"
  ));
  assert.ok(invalid.diagnostics.some(({ code }) =>
    code === "equation-series.adjacency.order"
  ));
});

test("presentation instructions are rejected even inside semantic arguments", () => {
  const input = canonicalRequest();
  const result = validateKpEquationTransformSeriesRequest({
    ...input,
    adjacencies: [{
      ...input.adjacencies[0],
      intent: {
        ...input.adjacencies[0]!.intent,
        semanticArguments: {
          factorIds: ["x", "y"],
          durationMs: 500,
          renderer: "svg"
        }
      }
    }, input.adjacencies[1]]
  });
  assert.deepEqual(
    result.status === "repair-required"
      ? result.diagnostics.filter(({ code }) =>
          code === "equation-series.field.forbidden"
        ).map(({ path }) => path)
      : [],
    [
      "$.adjacencies[0].intent.semanticArguments.durationMs",
      "$.adjacencies[0].intent.semanticArguments.renderer"
    ]
  );
});

test("the request layer owns no parser renderer clock or DOM", () => {
  const source = readFileSync(new URL(
    "../src/authoring/equation-transform-series-request.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /^import /mu);
  assert.doesNotMatch(
    source,
    /(?:HTMLElement|SVGElement|WebGL|requestAnimationFrame|setTimeout)/u
  );
});

function canonicalRequest() {
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.log-product.example.v1",
    states: [{
      id: "state.log-product.source",
      latex: "\\ln(xy)",
      narration: "Begin with one logarithm around a product."
    }, {
      id: "state.log-product.binary",
      latex: "\\ln(x)+\\ln(y)"
    }, {
      id: "state.log-product.expanded",
      latex: "\\ln(x)+\\ln(y)+\\ln(z)",
      narration: "The factors retain order as separate arguments."
    }],
    adjacencies: [{
      id: "adjacency.log-product.decompose",
      fromStateId: "state.log-product.source",
      toStateId: "state.log-product.binary",
      intent: {
        mode: "explicit",
        operationId: "operation.equation.log-product-decomposition.v1",
        semanticArguments: { factorIds: ["x", "y"] }
      }
    }, {
      id: "adjacency.log-product.extend",
      fromStateId: "state.log-product.binary",
      toStateId: "state.log-product.expanded",
      intent: {
        mode: "proposed",
        instruction: "Preserve order while adding the third factor."
      }
    }]
  };
}
