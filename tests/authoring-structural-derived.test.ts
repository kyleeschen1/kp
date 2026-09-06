import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredDistributionModel } from "../src/experiments/authoring-structural/distribution-model.ts";
import { prepareKpAuthoredDistributionOperation } from "../src/experiments/authoring-structural/distribution-operation.ts";
import { applyKpAuthoredDistributionOperation } from "../src/experiments/authoring-structural/distribution-commit.ts";
import { createKpSemanticDerivedValueCache } from "../src/semantic-state/derived-cache.ts";
import { evaluateKpSemanticDerivedValue } from "../src/semantic-state/derived-evaluator.ts";
import { createKpSemanticSnapshotRecoveryIndex, pinKpAggregateSemanticSnapshot, recoverKpPinnedSnapshot } from "../src/semantic-state/pinned-recovery.ts";

test("derived equation reads follow versions and recover history independently of cache lifetime", () => {
  const authored = createKpAuthoredDistributionModel("derived.distribution");
  const { model } = authored;
  const before = model.initial;
  const operation = prepareKpAuthoredDistributionOperation({ authored, snapshot: before });
  const after = applyKpAuthoredDistributionOperation(operation, { before, applicationId: "distribute" }).commit.after;
  const history = createKpSemanticSnapshotRecoveryIndex([before, after]);
  const cache = createKpSemanticDerivedValueCache();
  const input = (snapshot: typeof before) => ({ graph: model.graph, snapshot, target: model.handles.refs.accessibleEquation });
  const initialText = cache.evaluate(input(before));
  const finalText = cache.evaluate(input(after));
  assert.notEqual(initialText, finalText);
  for (const snapshot of [after, before, after, before]) {
    assert.equal(cache.evaluate(input(snapshot)), evaluateKpSemanticDerivedValue(input(snapshot)));
  }
  assert.equal(cache.inspect().entries, 2);
  assert.equal(cache.inspect().hits, 4);
  assert.equal(cache.inspect().misses, 2);
  cache.reset();
  assert.equal(cache.inspect().entries, 0);
  assert.equal(cache.evaluate(input(after)), finalText);
  cache.dispose();
  assert.throws(() => cache.evaluate(input(before)), /disposed/);
  const recovered = recoverKpPinnedSnapshot(history, pinKpAggregateSemanticSnapshot(before));
  assert.equal(recovered, before);
  assert.equal(evaluateKpSemanticDerivedValue(input(recovered)), initialText);
  assert.equal(history.snapshots.length, 2);
});
