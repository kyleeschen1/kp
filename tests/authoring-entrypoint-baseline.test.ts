import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { compileKpEquationSeriesLogarithmBaseDraft, createKpEquationSeriesLogarithmBaseDraft } from "../src/authoring/equation-series-logarithm-base-draft.ts";

test("R4A retained urn task derives one-seventh from the existing probability owner", () => {
  const result = checkBayesDraft(readFileSync(new URL("../content/authoring/r4a-urn-prior.bayes.json", import.meta.url), "utf8"));
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  assert.equal(result.draft.tree.query.value.numerator, 1n);
  assert.equal(result.draft.tree.query.value.denominator, 7n);
  assert.equal(result.draft.trace.states.length, 7);
  assert.equal(result.draft.teaching.detailLevel, "key-steps");
});

test("R4A numeric equation task retains compiler-owned binding and rejects reversed quotient", () => {
  const starter = createKpEquationSeriesLogarithmBaseDraft();
  const source = { ...starter, states: starter.states.map((state, index) => ({ ...state,
    latex: index === 0 ? "\\log_3(9)" : "\\frac{\\ln(9)}{\\ln(3)}" })) };
  const result = compileKpEquationSeriesLogarithmBaseDraft(source);
  assert.equal(result.status, "compiled");
  const base = result.semantic?.source.base, argument = result.semantic?.source.argument;
  assert.equal(base?.kind, "number");
  assert.equal(argument?.kind, "number");
  if (base?.kind !== "number" || argument?.kind !== "number") return;
  assert.equal(base.value, 3);
  assert.equal(argument.value, 9);
  const invalid = compileKpEquationSeriesLogarithmBaseDraft({ ...source,
    states: source.states.map((state, index) => index === 1 ? { ...state, latex: "\\frac{\\ln(3)}{\\ln(9)}" } : state)
  }, result);
  assert.equal(invalid.status, "repair-required");
  assert.equal(invalid.active, result.active);
});
