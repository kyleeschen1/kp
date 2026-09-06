import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredDistributionModel } from "../src/experiments/authoring-structural/distribution-model.ts";
import { prepareKpAuthoredDistributionOperation, readKpAuthoredDistributionOperation, KpAuthoredDistributionOperationError } from "../src/experiments/authoring-structural/distribution-operation.ts";

test("distribution receipt binds exact state to existing registered operation and authored lifecycle", () => {
  const authored = createKpAuthoredDistributionModel("operation.valid");
  const receipt = prepareKpAuthoredDistributionOperation({ authored, snapshot: authored.model.initial });
  const operation = readKpAuthoredDistributionOperation(receipt);
  assert.equal(operation.operationId, "kp.algebra.distribute-multiplication");
  assert.deepEqual(operation.source, authored.macro.states[0]);
  assert.deepEqual(operation.target, authored.macro.states[1]);
  assert.equal(operation.transformation.id, "fraction-solve.step.distribute");
  assert.equal(operation.transformation.correspondenceMap!.records.filter(r => r.relation === "fan-out").length, 3);
  assert.equal(operation.selection.reference.version.snapshotId, authored.model.initial.id);
  assert.ok(Object.isFrozen(operation.target));
});

test("generic updates and mismatched capability pins cannot become distribution receipts", () => {
  const authored = createKpAuthoredDistributionModel("operation.rejected");
  for (const options of [
    { operationId: "state.update" },
    { operationPacks: [{ packId: "kp.core", version: "1.0.0" }, { packId: "kp.algebra", version: "9.9.9" }] }
  ]) assert.throws(() => prepareKpAuthoredDistributionOperation({ authored, snapshot: authored.model.initial, ...options }),
    error => error instanceof KpAuthoredDistributionOperationError);
  const receipt = prepareKpAuthoredDistributionOperation({ authored, snapshot: authored.model.initial });
  assert.throws(() => readKpAuthoredDistributionOperation({ ...receipt } as never),
    error => error instanceof KpAuthoredDistributionOperationError && error.code === "kp.authoring.structural-receipt-gap");
});

test("caller-modified canonical target cannot borrow an unchanged proof record", () => {
  const authored = createKpAuthoredDistributionModel("operation.forged-target");
  const states = [...authored.macro.states];
  states[1] = { ...states[1]!, verifiedSolution: { numerator: "10", denominator: "1" } };
  assert.throws(() => prepareKpAuthoredDistributionOperation({
    authored: { ...authored, macro: { ...authored.macro, states } }, snapshot: authored.model.initial
  }), error => error instanceof KpAuthoredDistributionOperationError && error.code === "kp.authoring.structural-source-gap");
});
