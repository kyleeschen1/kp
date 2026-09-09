import assert from "node:assert/strict";
import test from "node:test";
import { compileKpEquationSeriesLogarithmBaseDraft, createKpEquationSeriesLogarithmBaseDraft } from "../src/authoring/equation-series-logarithm-base-draft.ts";

const draft = (source: string, target: string) => {
  const starter = createKpEquationSeriesLogarithmBaseDraft();
  return { ...starter, states: starter.states.map((state, index) => ({ ...state, latex: index ? target : source })) };
};

test("numeric success carries complete candidate and verified endpoints", () => {
  for (const [base, argument] of [[2, 7], [3, 9], [10, 100]] as const) {
    const result = compileKpEquationSeriesLogarithmBaseDraft(draft(`\\log_{${base}}(${argument})`, `\\frac{\\ln(${argument})}{\\ln(${base})}`));
    assert.equal(result.status, "compiled");
    if (result.status !== "compiled") return;
    assert.equal(result.active.request.states.length, 2);
    assert.equal(result.semantic.source.base.kind, "number");
    if (result.semantic.source.base.kind === "number") assert.equal(result.semantic.source.base.value, base);
  }
});

test("invalid domains, symbolic operands and wrong endpoints retain last complete candidate", () => {
  const previous = compileKpEquationSeriesLogarithmBaseDraft(createKpEquationSeriesLogarithmBaseDraft());
  assert.equal(previous.status, "compiled");
  for (const [source, target] of [["\\log_1(9)", "\\frac{\\ln(9)}{\\ln(1)}"],
    ["\\log_3(0)", "\\frac{\\ln(0)}{\\ln(3)}"], ["\\log_b(9)", "\\frac{\\ln(9)}{\\ln(b)}"],
    ["\\log_3(9)", "\\frac{\\ln(3)}{\\ln(9)}"]]) {
    const result = compileKpEquationSeriesLogarithmBaseDraft(draft(source!, target!), previous);
    assert.equal(result.status, "repair-required");
    assert.ok(result.repairs.length);
    assert.equal(result.active, previous.active);
    assert.equal(result.semantic, previous.semantic);
  }
});
