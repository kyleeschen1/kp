import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpSemanticTransactionToExistingAuthority
} from "../src/semantic/semantic-state-authority-adapter.ts";
import type { KpSemanticStateAuthorityProjection } from
  "../src/semantic/semantic-state-authority-adapter.ts";
import {
  compileKpSemanticStateSchema
} from "../src/semantic-state/authoring-schema-compiler.ts";
import {
  createKpSemanticStateHandleSet
} from "../src/semantic-state/authoring-state-handles.ts";
import {
  materializeKpSemanticStateInitialSnapshot
} from "../src/semantic-state/authoring-state-materializer.ts";
import {
  defineKpSemanticStateTransform
} from "../src/semantic-state/authoring-state-transform.ts";
import {
  kpStateGroup,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import {
  pinKpAggregateSemanticSnapshot,
  pinKpSemanticSlotVersion
} from "../src/semantic-state/pinned-recovery.ts";
import type { KpSemanticTransactionCommit } from
  "../src/semantic-state/transaction.ts";

test("the incoming transform surface owns committed endpoints but no samples", () => {
  const fixture = createBaselineFixture();

  assert.deepEqual(Object.keys(fixture.transform), [
    "schemaVersion",
    "kind",
    "id",
    "localId",
    "apply"
  ]);
  assert.deepEqual(Object.keys(fixture.application), [
    "schemaVersion",
    "kind",
    "definitionId",
    "transformationId",
    "commit",
    "before",
    "after"
  ]);
  assert.equal("at" in fixture.transform, false);
  assert.equal("at" in fixture.application, false);
  assert.equal("progress" in fixture.application, false);
  assert.equal(fixture.application.commit.before, fixture.initial);
  assert.deepEqual(fixture.application.before.value.read(), { amount: 2 });
  assert.deepEqual(fixture.application.after.value.read(), { amount: 3 });
});

test("the baseline ledger captures every persistent authority inventory", () => {
  const fixture = createBaselineFixture();
  const projection = projectKpSemanticTransactionToExistingAuthority({
    commit: fixture.application.commit,
    entityDescriptors: [{
      entityId: fixture.compiled.leaves[0]!.identities.initialEntityId,
      semanticKind: "baseline-value",
      label: "Baseline value",
      provenance: {
        kind: "authored",
        sourceId: fixture.compiled.leaves[0]!.identities.sourceIds.initialValue
      }
    }]
  });
  const first = captureKpPersistentSemanticStateInventory({
    commit: fixture.application.commit,
    projection
  });
  const repeated = captureKpPersistentSemanticStateInventory({
    commit: fixture.application.commit,
    projection
  });
  const inventory = JSON.parse(first) as Record<string, unknown>;

  assert.equal(repeated, first);
  assert.deepEqual(Object.keys(inventory), [
    "snapshots",
    "entityVersions",
    "transaction",
    "changeSet",
    "correspondence",
    "provenance",
    "lineage",
    "recovery"
  ]);
  assert.doesNotMatch(first, /sample|progress|transient/iu);
});

function createBaselineFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.state-family-baseline",
    kpStateGroup({ value: kpStateValue({ amount: 2 }) })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const transform = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "increment",
    author(state) {
      state.value.update(({ amount }) => ({ amount: amount + 1 }));
    }
  });
  const application = transform.apply(initial, "baseline");
  return { compiled, initial, transform, application };
}

function captureKpPersistentSemanticStateInventory(input: {
  readonly commit: KpSemanticTransactionCommit;
  readonly projection: KpSemanticStateAuthorityProjection;
}): string {
  const snapshots = [input.commit.before, input.commit.after];
  return JSON.stringify({
    snapshots,
    entityVersions: snapshots.map((snapshot) =>
      snapshot.entityStores.map((store) => ({
        entityId: store.entityId,
        versionIds: store.versions.map((version) => version.id)
      }))
    ),
    transaction: {
      transactionId: input.commit.transactionId,
      transformationId: input.commit.transformationId,
      journal: input.commit.journal
    },
    changeSet: input.projection.changeSet,
    correspondence: input.projection.correspondenceMap,
    provenance: {
      source: input.projection.sourceRegistry,
      target: input.projection.targetRegistry
    },
    lineage: input.projection.lineageGraph,
    recovery: snapshots.map((snapshot) => ({
      snapshot: pinKpAggregateSemanticSnapshot(snapshot),
      versions: snapshot.bindings.map((binding) =>
        pinKpSemanticSlotVersion(snapshot, binding.slotId)
      )
    }))
  });
}
