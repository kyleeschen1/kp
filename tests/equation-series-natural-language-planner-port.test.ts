import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpEquationTransformSeries } from
  "../src/authoring/compile-equation-transform-series.ts";
import {
  createKpEquationSeriesPlannerPrompt,
  runKpEquationSeriesNaturalLanguagePlanner,
  validateKpEquationSeriesPlannerRecord
} from "../src/authoring/equation-series-natural-language-planner-port.ts";
import { validateKpEquationTransformSeriesRequest } from
  "../src/authoring/equation-transform-series-request.ts";

test("prompt creation exposes only source states adjacencies and registered operations", () => {
  const request = proposedRequest();
  const prompt = createKpEquationSeriesPlannerPrompt({
    request,
    naturalLanguageIntent: "Wrap x in the natural logarithm."
  });
  assert.equal(prompt.requestId, request.id);
  assert.equal(prompt.adjacencies.length, 1);
  assert.equal(prompt.operations.some(({ operationId }) =>
    operationId === "kp.algebra.wrap-function"
  ), true);
  const governed = prompt.operations.find(({ operationId }) =>
    operationId === "kp.algebra.apply-natural-log-both-sides"
  );
  assert.deepEqual(governed?.roleIds,
    ["lhs", "rhs", "relation", "applied-operation"]);
  assert.equal(governed?.governedRequirements?.operationPin.version, "1.0.0");
  assert.deepEqual(prompt.operations.filter(({ governedRequirements }) =>
    governedRequirements !== undefined).map(({ operationId }) =>
      operationId).sort(), [
    "kp.algebra.add-both-sides",
    "kp.algebra.subtract-both-sides",
    "kp.algebra.multiply-both-sides",
    "kp.algebra.divide-both-sides",
    "kp.algebra.apply-natural-log-both-sides",
    "kp.algebra.divide-both-sides-by-log-base"
  ].sort());
  assert.equal(
    JSON.stringify(prompt).includes("models-propose-operations-kp-verifies"),
    true
  );
  assert.doesNotMatch(
    JSON.stringify(prompt),
    /(?:durationMs|keyframes|geometry|renderer|recipeId|motifId)/u
  );
});

test("one validated proposal record can feed the deterministic compiler", async () => {
  const request = proposedRequest();
  const result = await runKpEquationSeriesNaturalLanguagePlanner({
    request,
    naturalLanguageIntent: "Wrap x in ln.",
    port: {
      id: "planner.fake.deterministic.v1",
      propose: async () => acceptedRecord(request.id)
    }
  });
  assert.equal(result.status, "proposed");
  if (result.status !== "proposed") return;
  const compiled = compileKpEquationTransformSeries({
    value: request,
    proposals: result.record.proposals
  });
  assert.equal(compiled.status, "compiled");
  assert.equal(Object.isFrozen(result.record), true);
});

test("forbidden authority and presentation fields fail closed", () => {
  const request = proposedRequest();
  for (const forbidden of [
    { durationMs: 800 },
    { recipeId: "recipe.equation.function-application.v1" },
    { semanticArguments: { wrapper: "ln" } },
    { latex: "\\ln(x)" },
    { geometry: { x: 20, y: 40 } }
  ]) {
    const result = validateKpEquationSeriesPlannerRecord({
      ...acceptedRecord(request.id),
      proposals: [{
        ...acceptedRecord(request.id).proposals[0],
        ...forbidden
      }]
    }, request);
    assert.equal(result.status, "repair-required");
    if (result.status !== "repair-required") continue;
    assert.ok(result.diagnostics.some(({ code }) =>
      code === "equation-series.planner.field.forbidden"
    ));
  }
});

test("proposal coverage and operation IDs are validated against the request", () => {
  const request = proposedRequest();
  const missing = validateKpEquationSeriesPlannerRecord({
    ...acceptedRecord(request.id),
    proposals: []
  }, request);
  assert.equal(missing.status, "repair-required");
  const unknown = validateKpEquationSeriesPlannerRecord({
    ...acceptedRecord(request.id),
    proposals: [{
      adjacencyId: "adjacency.planner.wrap",
      kind: "single",
      operationId: "operation.equation.fabricated.v1"
    }]
  }, request);
  assert.equal(unknown.status, "repair-required");
  if (unknown.status !== "repair-required") return;
  assert.ok(unknown.diagnostics.some(({ code }) =>
    code === "equation-series.planner.operation.unknown"
  ));
});

test("port errors become recorded diagnostics instead of thrown authority", async () => {
  const request = proposedRequest();
  const result = await runKpEquationSeriesNaturalLanguagePlanner({
    request,
    naturalLanguageIntent: "Wrap x in ln.",
    port: {
      id: "planner.fake.failure.v1",
      propose: async () => { throw new Error("offline"); }
    }
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "equation-series.planner.port.error");
});

test("the model-neutral port imports no provider renderer or application authority", () => {
  const source = readFileSync(new URL(
    "../src/authoring/equation-series-natural-language-planner-port.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(
    source,
    /(?:OpenAI|Anthropic|Gemini|fetch\(|src\/editor|src\/rendering|\.svelte|HTMLElement|SVGElement|requestAnimationFrame)/u
  );
});

function proposedRequest() {
  const result = validateKpEquationTransformSeriesRequest({
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.planner.wrap.v1",
    states: [
      { id: "state.planner.before", latex: "x" },
      { id: "state.planner.after", latex: "\\ln(x)" }
    ],
    adjacencies: [{
      id: "adjacency.planner.wrap",
      fromStateId: "state.planner.before",
      toStateId: "state.planner.after",
      intent: { mode: "proposed", instruction: "Select one operation." }
    }]
  });
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") throw new Error("fixture must validate");
  return result.request;
}

function acceptedRecord(requestId: string) {
  return {
    schemaVersion: "kp.equation-series-planner-record.v1",
    kind: "equation-series-planner-record",
    requestId,
    plannerId: "planner.fake.deterministic.v1",
    status: "proposed",
    proposals: [{
      adjacencyId: "adjacency.planner.wrap",
      kind: "single",
      operationId: "kp.algebra.wrap-function"
    }],
    diagnostics: []
  };
}
