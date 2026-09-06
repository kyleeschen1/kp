import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredDistributionModel } from "../src/experiments/authoring-structural/distribution-model.ts";
import { prepareKpAuthoredDistributionOperation } from "../src/experiments/authoring-structural/distribution-operation.ts";
import { applyKpAuthoredDistributionOperation } from "../src/experiments/authoring-structural/distribution-commit.ts";
import { createKpSemanticSnapshotRecoveryIndex } from "../src/semantic-state/pinned-recovery.ts";
import { pinKpAuthoredStructuralSelection } from "../src/experiments/authoring-structural/structural-selection.ts";

test("distribution commits one new version with explicit structural lineage and recoverable predecessor", () => {
  const authored = createKpAuthoredDistributionModel("commit.distribution");
  const before = authored.model.initial;
  const original = JSON.stringify(before);
  const receipt = prepareKpAuthoredDistributionOperation({ authored, snapshot: before });
  const result = applyKpAuthoredDistributionOperation(receipt, { before, applicationId: "first" });
  assert.equal(result.source.entityId, result.target.entityId);
  assert.notEqual(result.source.versionId, result.target.versionId);
  assert.equal(result.commit.journal.length, 1);
  assert.equal(result.commit.journal[0]!.operation.kind, "update");
  assert.equal(JSON.stringify(before), original);
  const state = authored.model.handles.pin(result.commit.after).equation.read();
  assert.deepEqual(state, authored.macro.states[1]);
  const selected = pinKpAuthoredStructuralSelection({ model: authored.model, snapshot: result.commit.after,
    side: "left", entityId: state.left.root.id });
  assert.deepEqual(selected.recover(createKpSemanticSnapshotRecoveryIndex([before, result.commit.after])), state.left.root);
  assert.equal(result.operation.transformation.correspondenceMap!.records.filter(r => r.relation === "fan-out").length, 3);
});

test("repeated application is deterministic while stale and forged receipts publish nothing", () => {
  const authored = createKpAuthoredDistributionModel("commit.deterministic");
  const before = authored.model.initial;
  const receipt = prepareKpAuthoredDistributionOperation({ authored, snapshot: before });
  const first = applyKpAuthoredDistributionOperation(receipt, { before, applicationId: "first" });
  assert.deepEqual(applyKpAuthoredDistributionOperation(receipt, { before, applicationId: "first" }), first);
  const original = JSON.stringify(first.commit.after);
  assert.throws(() => applyKpAuthoredDistributionOperation(receipt, { before: first.commit.after, applicationId: "stale" }));
  assert.throws(() => applyKpAuthoredDistributionOperation({ ...receipt } as never, { before, applicationId: "forged" }));
  assert.equal(JSON.stringify(first.commit.after), original);
  assert.deepEqual(authored.model.handles.pin(before).equation.read(), authored.macro.states[0]);
});
