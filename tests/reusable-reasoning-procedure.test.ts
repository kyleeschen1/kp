import assert from "node:assert/strict";
import test from "node:test";
import { semanticTransformationLeafRefs } from "../src/semantic/transformation-composition.ts";
import { createKpReasoningSource, KpReasoningRepairGap } from "../src/experiments/reusable-reasoning/source.ts";
import { bindKpReasoningEvidence } from "../src/experiments/reusable-reasoning/evidence.ts";
import { composeKpReasoningProcedure } from "../src/experiments/reusable-reasoning/procedure.ts";

test("nested procedure reuses the existing tree and preserves every verified handoff", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const procedure = composeKpReasoningProcedure(evidence);
  assert.deepEqual(semanticTransformationLeafRefs(procedure.tree.root).map(item => item.id), evidence.source.reason.operationIds);
  assert.equal(procedure.tree.root.kind, "sequence");
  assert.equal(procedure.checkpoints.length, 5);
  for (let i = 1; i < procedure.operations.length; i++) {
    assert.deepEqual(procedure.operations[i - 1]!.target, procedure.operations[i]!.source);
  }
  assert.equal(procedure.source.id, evidence.source.parent.sourceStateId);
  assert.equal(procedure.target.id, evidence.source.parent.targetStateId);
  assert.ok(Object.isFrozen(procedure.tree.root));
});

test("procedure rejects reordering, missing intermediate state and unrelated later solving", () => {
  const source = createKpReasoningSource();
  const operations = source.reason.operationIds;
  for (const operationIds of [
    [...operations].reverse(), [operations[0]!, operations[2]!],
    ["fraction-solve.step.subtract-four"]
  ]) assert.throws(() => composeKpReasoningProcedure(bindKpReasoningEvidence({
    ...source, reason: { ...source.reason, operationIds }
  })), KpReasoningRepairGap);
});

test("bounded detail selection retains a verified prefix rather than inventing shortcuts", () => {
  const source = createKpReasoningSource();
  for (const count of [1, 2, 3, 4]) {
    const evidence = bindKpReasoningEvidence({ ...source,
      reason: { ...source.reason, operationIds: source.reason.operationIds.slice(0, count) } });
    const procedure = composeKpReasoningProcedure(evidence);
    assert.equal(procedure.target.id, evidence.states[count]!.stateId);
    assert.equal(procedure.operations.length, count);
    assert.equal(procedure.checkpoints.length, count + 1);
  }
});
