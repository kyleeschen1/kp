import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredDistributionModel } from "../src/experiments/authoring-structural/distribution-model.ts";
import { pinKpAuthoredStructuralSelection, KpAuthoredStructuralSelectionError } from "../src/experiments/authoring-structural/structural-selection.ts";
import { createKpSemanticSnapshotRecoveryIndex } from "../src/semantic-state/pinned-recovery.ts";
import { beginKpSemanticTransaction } from "../src/semantic-state/transaction.ts";

test("structural subtree pins recover their original version without replay", () => {
  const { model, macro } = createKpAuthoredDistributionModel("selection.history");
  const pin = pinKpAuthoredStructuralSelection({ model, snapshot: model.initial,
    side: "left", entityId: macro.states[0]!.left.root.id });
  const identities = model.compiled.identityScope;
  const transaction = beginKpSemanticTransaction({ identities, before: model.initial,
    transformationId: identities.appliedTransformation(identities.transformation("test-noop"), "next") });
  transaction.update(transaction.scope, { id: "test-noop", sourceId: "test-noop", revisionId: "1",
    slotId: model.handles.refs.equation.slotId, update: previous => previous });
  const after = transaction.commit(transaction.scope).after;
  const history = createKpSemanticSnapshotRecoveryIndex([model.initial, after]);
  assert.deepEqual(pin.recover(history), macro.states[0]!.left.root);
  assert.throws(() => pin.assertCurrent(after), error =>
    error instanceof KpAuthoredStructuralSelectionError && error.code === "kp.authoring.structural-stale-selection");
  assert.deepEqual(pin.assertCurrent(model.initial), macro.states[0]!.left.root);
  assert.ok(Object.isFrozen(pin.reference));
});

test("foreign snapshots and missing structural entities fail with typed gaps", () => {
  const first = createKpAuthoredDistributionModel("selection.first");
  const second = createKpAuthoredDistributionModel("selection.second");
  assert.throws(() => pinKpAuthoredStructuralSelection({ model: first.model,
    snapshot: second.model.initial, side: "left", entityId: first.macro.states[0]!.left.root.id }),
    error => error instanceof KpAuthoredStructuralSelectionError && error.code === "kp.authoring.structural-foreign-model");
  assert.throws(() => pinKpAuthoredStructuralSelection({ model: first.model,
    snapshot: first.model.initial, side: "right", entityId: first.macro.states[0]!.left.root.id }),
    error => error instanceof KpAuthoredStructuralSelectionError && error.code === "kp.authoring.structural-selection-gap");
});
