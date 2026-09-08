import assert from "node:assert/strict";
import test from "node:test";
import { createKpReasoningSource, KpReasoningRepairGap } from "../src/experiments/reusable-reasoning/source.ts";
import { bindKpReasoningEvidence } from "../src/experiments/reusable-reasoning/evidence.ts";
import { bindKpReasoningSupport } from "../src/experiments/reusable-reasoning/support.ts";

test("child reason supports exact parent endpoints under explicitly shared assumptions", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const support = bindKpReasoningSupport(evidence);
  assert.equal(support.parentId, evidence.source.parent.id);
  assert.deepEqual(support.source, support.procedure.source);
  assert.deepEqual(support.target, support.procedure.target);
  assert.equal(support.assumptions.length, 2);
  assert.equal(support.editorial.status, "editorial");
});

test("shorter reason cannot claim the unchanged later parent conclusion", () => {
  const source = createKpReasoningSource();
  const shorter = { ...source, reason: { ...source.reason, operationIds: source.reason.operationIds.slice(0, 3) } };
  assert.throws(() => bindKpReasoningSupport(bindKpReasoningEvidence(shorter)), error =>
    error instanceof KpReasoningRepairGap && error.code === "kp.reasoning.parent-conclusion");
  const corrected = { ...shorter, parent: { ...source.parent, targetStateId: "fraction-solve.state.constant-product" } };
  assert.equal(bindKpReasoningSupport(bindKpReasoningEvidence(corrected)).target.id, corrected.parent.targetStateId);
});

test("parent or child cannot drop required assumptions or substitute unknown ones", () => {
  const source = createKpReasoningSource();
  for (const owner of ["parent", "reason"] as const) {
    for (const assumptionIds of [[], ["assumption.real-scalar-x"], ["invented", "assumption.nonzero-denominator"]]) {
      assert.throws(() => bindKpReasoningSupport(bindKpReasoningEvidence({
        ...source, [owner]: { ...source[owner], assumptionIds }
      })), error => error instanceof KpReasoningRepairGap && error.code === "kp.reasoning.assumption-compatibility");
    }
  }
});

test("support never promotes freely authored prose to a mathematical claim", () => {
  const source = createKpReasoningSource();
  const support = bindKpReasoningSupport(bindKpReasoningEvidence({
    ...source, parent: { ...source.parent, statement: "An analogy that still needs editorial review." }
  }));
  assert.equal(support.editorial.status, "editorial");
  assert.equal(support.relation, "same-equation-solutions");
});
