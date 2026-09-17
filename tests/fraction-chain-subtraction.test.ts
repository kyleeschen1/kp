import assert from "node:assert/strict";
import test from "node:test";
import source from "../examples/algebra/fraction-chain-subtraction.json" with { type: "json" };
import { compileFractionChain } from "../src/authoring/fraction-chain-compilation.ts";
import { resolveFractionAdditionPresentation } from "../src/authoring/fraction-addition-presentation.ts";
import { compileKpCommonDenominatorPressurePresentationPlan } from "../src/animation/common-denominator-pressure-presentation-plan.ts";
import { createKpCommonDenominatorPressureNativeEndpoints } from "../src/rendering/common-denominator-pressure-native-endpoints.ts";

test("subtraction binds right-hand scaling, ordered numerator difference and exact reduction", () => {
  const result = compileFractionChain(source);
  assert.equal(result.status, "compiled", JSON.stringify(result, (_, value) => typeof value === "bigint" ? String(value) : value));
  const alignment = result.compilation.steps[0];
  assert.equal(alignment?.kind, "align");
  if (alignment?.kind !== "align") throw new Error("Missing alignment");
  assert.equal(alignment.authority.operator, "-");
  assert.deepEqual(alignment.authority.exactTotal, { numerator: 1n, denominator: 2n });
  const plan = compileKpCommonDenominatorPressurePresentationPlan(alignment.authority);
  assert.equal(plan.equivalence.focus.position, "second-term");
  assert.equal(plan.companion, undefined);
  const endpoints = createKpCommonDenominatorPressureNativeEndpoints(plan);
  assert.equal(endpoints[0].annotated.rawLatex, source.states[0]!.latex);
  assert.equal(endpoints[3].annotated.rawLatex, source.states[1]!.latex);
  assert.match(endpoints[1].annotated.rawLatex, /^\\frac\{5\}\{6\}-\\frac\{2\}\{2\}\\cdot/);
  const presentation = resolveFractionAdditionPresentation(result.compilation, 1);
  assert.equal(presentation.evaluation.transformations[0]!.transformType, "simplifyConstantDifference");
  assert.ok(presentation.evaluation.bundle.objects[0]!.selectors.some(s => s.label === "-"));
  const mergeValue = presentation.merge.bundle.objects[0]!.value;
  assert.ok(typeof mergeValue === "object" && mergeValue !== null && "latex" in mergeValue);
  assert.match(String(mergeValue.latex), /5 - 2/);
});

test("subtraction rejects lost signs, reordered operands and false reduction", () => {
  for (const [index, latex] of [[1, "5/6+2/6"], [1, "2/6-5/6"], [2, "7/6"], [2, "-3/6"], [3, "1/3"]] as const) {
    const changed = structuredClone(source); changed.states[index]!.latex = latex;
    assert.equal(compileFractionChain(changed).status, "repair-required");
  }
});
