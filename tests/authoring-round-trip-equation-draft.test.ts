import assert from "node:assert/strict";
import test from "node:test";
import { createKpEquationSeriesLogarithmBaseDraft as draft, compileKpEquationSeriesLogarithmBaseDraft as compile } from "../src/authoring/equation-series-logarithm-base-draft.ts";
import { isKpVerifiedLogarithmChangeOfBase } from "../src/semantic/logarithm-change-of-base.ts";

test("numeric JSON edits produce distinct verified semantics and bound source identities", () => {
  const input = draft();
  const before = compile(input);
  assert.equal(before.status, "compiled");
  input.states[0]!.latex = "\\log_{10}(100)";
  input.states[1]!.latex = "\\frac{\\ln(100)}{\\ln(10)}";
  const after = compile(input, before);
  assert.equal(after.status, "compiled");
  assert.ok(isKpVerifiedLogarithmChangeOfBase(after.semantic));
  assert.equal(after.semantic.source.base.kind === "number" && after.semantic.source.base.value, 10);
  assert.equal(after.semantic.source.argument.kind === "number" && after.semantic.source.argument.value, 100);
  assert.notEqual(after.semantic.id, before.semantic!.id);
  assert.notDeepEqual(after.active!.request.adjacencies[0]!.intent, before.active!.request.adjacencies[0]!.intent);
  assert.deepEqual(input.adjacencies[0]!.intent.semanticArguments, {});
});

test("invalid operands, mismatched targets and forged evidence retain exact active truth", () => {
  const previous = compile(draft());
  for (const [source, target] of [["\\log_1(7)", "\\frac{\\ln(7)}{\\ln(1)}"], ["\\log_2(0)", "\\frac{\\ln(0)}{\\ln(2)}"], ["\\log_2(9)", "\\frac{\\ln(7)}{\\ln(2)}"], ["\\log_b(x)", "\\frac{\\ln(x)}{\\ln(b)}"]]) {
    const input = draft(); input.states[0]!.latex = source!; input.states[1]!.latex = target!;
    const result = compile(input, previous);
    assert.equal(result.status, "repair-required");
    assert.equal(result.active, previous.active); assert.equal(result.semantic, previous.semantic);
  }
  const forged = draft(); forged.adjacencies[0]!.intent.semanticArguments = { sourcePin: "invented" };
  assert.equal(compile(forged).status, "repair-required");
});

test("held-out numeric author edits bind without proof metadata and preserve narration", () => {
  for (const [base, argument] of [[8, 64], [0.5, 16], [3, 27]]) {
    const input = draft();
    input.states[0]!.latex = `\\log_{${base}}(${argument})`;
    input.states[1]!.latex = `\\frac{\\ln(${argument})}{\\ln(${base})}`;
    input.states[1]!.narration = "Keep this **authored** wording exactly.";
    const compiled = compile(input);
    assert.equal(compiled.status, "compiled");
    assert.equal(compiled.active!.request.states[1]!.narration, input.states[1]!.narration);
    assert.deepEqual(input.adjacencies[0]!.intent.semanticArguments, {});
    const broken = structuredClone(input);
    broken.states[1]!.latex = `\\frac{\\ln(${base})}{\\ln(${argument})}`;
    const rejected = compile(broken, compiled);
    assert.equal(rejected.status, "repair-required");
    assert.equal(rejected.active, compiled.active);
    assert.equal(rejected.semantic, compiled.semantic);
  }
});
