import assert from "node:assert/strict";
import test from "node:test";
import { compileKpEquationSeriesLogarithmBaseText, createKpEquationSeriesLogarithmBaseDraft } from "../src/authoring/equation-series-logarithm-base-draft.ts";
import { createKpEquationSeriesLogarithmBaseExample } from "../src/authoring/equation-series-logarithm-base-example.ts";
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import { runKpEquationTransformSeriesCli } from "../scripts/compile-equation-transform-series.ts";

test("selected numeric CLI agrees with domain compilation and preserves authored narration", async () => {
  const starter = createKpEquationSeriesLogarithmBaseDraft();
  const source = { ...starter, states: starter.states.map((state, index) => ({ ...state,
    latex: index ? "\\frac{\\ln(9)}{\\ln(3)}" : "\\log_3(9)", narration: `Authored step ${index + 1}.` })) };
  const json = JSON.stringify(source), domain = compileKpEquationSeriesLogarithmBaseText(json);
  assert.equal(domain.status, "compiled");
  if (domain.status !== "compiled") return;
  const routed = await checkAuthorTask("equation.logarithm-base", json);
  assert.equal(routed.status, "checked");
  assert.deepEqual(routed.result, { status: "compiled", request: domain.active.request,
    semantic: domain.semantic, checkpointCount: 2 });
  assert.deepEqual(domain.active.request.states.map(state => state.narration), source.states.map(state => state.narration));
});

test("text failures preserve last-valid state and exact domain repair payload", async () => {
  const previous = compileKpEquationSeriesLogarithmBaseText(JSON.stringify(createKpEquationSeriesLogarithmBaseDraft()));
  for (const json of ["{", "{}", "x".repeat(100_001)]) {
    const result = compileKpEquationSeriesLogarithmBaseText(json, previous);
    assert.equal(result.status, "repair-required");
    assert.equal(result.active, previous.active);
    assert.equal(result.semantic, previous.semantic);
    const routed = await checkAuthorTask("equation.logarithm-base", json);
    assert.deepEqual(routed.result, { status: "repair-required", repairs: result.repairs });
  }
});

test("legacy named example remains pinned while the new numeric task supports edits", async () => {
  const reference = createKpEquationSeriesLogarithmBaseExample().value;
  for (const changed of [false, true]) {
    const source = { ...reference, states: reference.states.map((state, index) => ({ ...state,
      latex: changed ? (index ? "\\frac{\\ln(9)}{\\ln(3)}" : "\\log_3(9)") : state.latex })) };
    let output = "";
    const code = await runKpEquationTransformSeriesCli(["--example", "logarithm-change-of-base", "--request", "-"], {
      readFile: async () => { throw new Error("No file read expected"); }, readStdin: async () => JSON.stringify(source), write: text => { output = text; }
    });
    assert.equal(code, changed ? 2 : 0);
    assert.equal(JSON.parse(output).status, changed ? "repair-required" : "compiled");
  }
});
