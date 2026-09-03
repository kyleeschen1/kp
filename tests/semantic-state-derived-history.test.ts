import assert from "node:assert/strict";
import test from "node:test";

import { defineKpSemanticStateDerivation } from
  "../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../src/semantic-state/authoring-state-transform.ts";
import { createKpSemanticDerivedValueCache } from
  "../src/semantic-state/derived-cache.ts";
import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";
import {
  createKpSemanticSnapshotRecoveryIndex,
  pinKpAggregateSemanticSnapshot,
  pinKpSemanticSlotVersion,
  recoverKpPinnedSnapshot,
  recoverKpPinnedVersion
} from "../src/semantic-state/pinned-recovery.ts";
import {
  projectKpSemanticTransactionToExistingAuthority,
  type KpSemanticStateAuthorityProjection,
  type KpSemanticStateEntityDescriptor
} from "../src/semantic/semantic-state-authority-adapter.ts";
import type { KpSemanticTransactionCommit } from
  "../src/semantic-state/transaction.ts";

test("direct and cached evaluation add no semantic history or authority", () => {
  const fixture = createHistoryFixture();
  const projection = project(fixture.commit, fixture.descriptors);
  const beforeInventory = exactHistoryInventory(fixture.commit, projection);
  const beforeSnapshots = [fixture.commit.before, fixture.commit.after];

  assert.deepEqual(evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  }), { amount: 4 });
  assert.deepEqual(evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot: fixture.updated,
    target: fixture.handles.refs.total
  }), { amount: 10 });

  const cache = createKpSemanticDerivedValueCache();
  const first = cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });
  assert.equal(cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  }), first);
  assert.deepEqual(cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.updated,
    target: fixture.handles.refs.total
  }), { amount: 10 });

  const afterProjection = project(fixture.commit, fixture.descriptors);
  assert.equal(exactHistoryInventory(fixture.commit, afterProjection), beforeInventory);
  assert.deepEqual(afterProjection, projection);
  assert.equal(fixture.commit.before, beforeSnapshots[0]);
  assert.equal(fixture.commit.after, beforeSnapshots[1]);
  assert.equal(fixture.initial.bindings.some(
    ({ slotId }) => slotId === fixture.handles.refs.total.slotId
  ), false);
  assert.equal(fixture.updated.bindings.some(
    ({ slotId }) => slotId === fixture.handles.refs.total.slotId
  ), false);
  assert.deepEqual(cache.inspect(), {
    schemaVersion: "kp.semantic-derived-cache-stats.v1",
    kind: "semantic-derived-cache-stats",
    status: "active",
    entries: 2,
    hits: 1,
    misses: 2
  });
});

test("pinned recovery is complete without derived evaluation or cache replay", () => {
  const fixture = createHistoryFixture();
  const initialSnapshotReference = pinKpAggregateSemanticSnapshot(
    fixture.initial
  );
  const updatedSnapshotReference = pinKpAggregateSemanticSnapshot(
    fixture.updated
  );
  const initialBaseReference = pinKpSemanticSlotVersion(
    fixture.initial,
    fixture.handles.refs.base.slotId
  );
  const updatedBaseReference = pinKpSemanticSlotVersion(
    fixture.updated,
    fixture.handles.refs.base.slotId
  );
  const index = createKpSemanticSnapshotRecoveryIndex([
    fixture.updated,
    fixture.initial
  ]);

  const initialVersion = recoverKpPinnedVersion(index, initialBaseReference);
  const updatedVersion = recoverKpPinnedVersion(index, updatedBaseReference);
  assert.equal(recoverKpPinnedSnapshot(index, initialSnapshotReference), fixture.initial);
  assert.equal(recoverKpPinnedSnapshot(index, updatedSnapshotReference), fixture.updated);
  assert.deepEqual(initialVersion.value, { amount: 2 });
  assert.deepEqual(updatedVersion.value, { amount: 5 });
  assert.equal(fixture.calls, 0);

  const cache = createKpSemanticDerivedValueCache();
  cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });
  cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.updated,
    target: fixture.handles.refs.total
  });
  const callsAfterEvaluation = fixture.calls;
  cache.dispose();

  const rebuiltIndex = createKpSemanticSnapshotRecoveryIndex([
    fixture.initial,
    fixture.updated
  ]);
  assert.equal(
    recoverKpPinnedSnapshot(rebuiltIndex, initialSnapshotReference),
    fixture.initial
  );
  assert.equal(
    recoverKpPinnedSnapshot(rebuiltIndex, updatedSnapshotReference),
    fixture.updated
  );
  assert.equal(
    recoverKpPinnedVersion(rebuiltIndex, initialBaseReference),
    initialVersion
  );
  assert.equal(
    recoverKpPinnedVersion(rebuiltIndex, updatedBaseReference),
    updatedVersion
  );
  assert.equal(fixture.calls, callsAfterEvaluation);
});

function createHistoryFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.derived-history",
    kpStateGroup({
      base: kpStateValue({ amount: 2 }),
      context: kpStateValue("stable"),
      total: kpStateDerived<{ readonly amount: number }>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  let calls = 0;
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.base],
    compute: ([base]) => {
      calls += 1;
      return { amount: base.amount * 2 };
    }
  });
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [total]
  });
  const update = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "update-base",
    author(state) {
      state.base.update(({ amount }) => ({ amount: amount + 3 }));
    }
  });
  const commit = update.apply(initial, "first").commit;
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [total])
  );
  const descriptors: readonly KpSemanticStateEntityDescriptor[] = compiled.leaves
    .filter((leaf) => leaf.descriptor.kind !== "derived-value")
    .map((leaf) => ({
      entityId: leaf.identities.initialEntityId,
      semanticKind: "history-fixture-value",
      label: leaf.encodedPath,
      provenance: {
        kind: "authored" as const,
        sourceId: leaf.identities.sourceIds.initialValue
      }
    }));
  return {
    compiled,
    handles,
    get calls() { return calls; },
    initial,
    updated: commit.after,
    commit,
    graph,
    descriptors
  };
}

function project(
  commit: KpSemanticTransactionCommit,
  descriptors: readonly KpSemanticStateEntityDescriptor[]
): KpSemanticStateAuthorityProjection {
  return projectKpSemanticTransactionToExistingAuthority({
    commit,
    entityDescriptors: descriptors
  });
}

function exactHistoryInventory(
  commit: KpSemanticTransactionCommit,
  projection: KpSemanticStateAuthorityProjection
): string {
  return JSON.stringify({
    snapshots: [commit.before, commit.after],
    versions: [commit.before, commit.after].map((snapshot) =>
      snapshot.entityStores.map((store) => ({
        entityId: store.entityId,
        versionIds: store.versions.map(({ id }) => id)
      }))
    ),
    journal: commit.journal,
    changeRecords: projection.changeSet.records,
    correspondence: projection.correspondenceMap,
    provenance: {
      source: projection.sourceRegistry,
      target: projection.targetRegistry
    },
    lineage: projection.lineageGraph
  });
}
