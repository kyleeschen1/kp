import assert from "node:assert/strict";
import test from "node:test";
import { createKpReasoningSource, KpReasoningRepairGap } from "../src/experiments/reusable-reasoning/source.ts";
import { bindKpReasoningEvidence } from "../src/experiments/reusable-reasoning/evidence.ts";
import { bindKpReasoningFormula } from "../src/experiments/reusable-reasoning/formula.ts";

test("formula application binds semantic operands and retains verified lineage and assumptions", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const formula = bindKpReasoningFormula(evidence);
  assert.deepEqual(formula.bindings.map(item => item.entityId), [
    evidence.source.formula.commonFactorId, ...evidence.source.formula.addendIds
  ]);
  assert.equal(formula.lineage, evidence.distribution.normalFormPlan.lineage);
  assert.equal(formula.revisionId, evidence.revisionId);
  assert.equal(formula.assumptions.length, 2);
  assert.equal(formula.bindings[0]!.expression.kind, "quotient");
  assert.equal(Reflect.set(formula.bindings[0]!.expression, "id", "forged"), false);
});

test("formula application rejects wrong law, copied factor and reordered or duplicated operands", () => {
  const source = createKpReasoningSource();
  for (const formula of [
    { ...source.formula, lawId: "invented" },
    { ...source.formula, commonFactorId: "fraction-fan-out.target.factor.x" },
    { ...source.formula, addendIds: [...source.formula.addendIds].reverse() },
    { ...source.formula, addendIds: [source.formula.addendIds[0]!, source.formula.addendIds[0]!] }
  ]) assert.throws(() => bindKpReasoningFormula(bindKpReasoningEvidence({ ...source, formula })), KpReasoningRepairGap);
});

test("formula labels or serialized capability cannot supply semantic authority", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  assert.throws(() => bindKpReasoningFormula({ ...evidence }), KpReasoningRepairGap);
  assert.throws(() => bindKpReasoningEvidence({ ...evidence.source,
    formula: { ...evidence.source.formula, coordinates: [] } }), KpReasoningRepairGap);
});
