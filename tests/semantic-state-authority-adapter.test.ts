import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot,
  createKpSemanticSlotAbsence
} from "../src/semantic-state/aggregate-snapshot.ts";
import {
  appendKpSemanticEntityVersion,
  createKpSemanticEntityVersionStore,
  type KpPersistentSemanticValue
} from "../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope,
  type KpSemanticEntityId,
  type KpSemanticSlotId
} from "../src/semantic-state/identity.ts";
import {
  createKpSemanticSnapshotRecoveryIndex,
  pinKpSemanticSlotVersion,
  recoverKpPinnedVersion
} from "../src/semantic-state/pinned-recovery.ts";
import {
  beginKpSemanticTransaction,
  type KpSemanticTransactionCommit
} from "../src/semantic-state/transaction.ts";
import {
  projectKpSemanticTransactionToExistingAuthority,
  KpSemanticStateAuthorityProjectionError,
  type KpSemanticStateEntityDescriptor
} from "../src/semantic/semantic-state-authority-adapter.ts";
import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap
} from "../src/semantic/correspondence.ts";

function authorityFixture() {
  const identities = createKpSemanticStateIdentityScope("test.authority-bridge");
  const slots = {
    stable: identities.slot("market.stable"),
    revised: identities.slot("market.revised"),
    source: identities.slot("market.source"),
    bindTarget: identities.slot("market.bind-target"),
    copyTarget: identities.slot("market.copy-target"),
    introduced: identities.slot("market.introduced"),
    removed: identities.slot("market.removed")
  } as const;
  const makeStore = (localId: string, value: number) =>
    createKpSemanticEntityVersionStore({
      identities,
      entityId: identities.entity(localId),
      value: { value },
      sourceId: `fixture.${localId}`
    });
  const stores = {
    stable: makeStore("stable", 1),
    revised: makeStore("revised", 2),
    source: makeStore("source", 3),
    bindTarget: makeStore("bind-target", 4),
    copyTarget: makeStore("copy-target", 3),
    removed: makeStore("removed", 5)
  } as const;
  const requiredSlotIds = [
    slots.stable,
    slots.revised,
    slots.source,
    slots.bindTarget,
    slots.copyTarget
  ];
  const optionalSlotIds = [slots.introduced, slots.removed];
  const before = createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds,
    optionalSlotIds,
    bindings: [
      binding(slots.stable, stores.stable.entityId, stores.stable.latestVersionId),
      binding(slots.revised, stores.revised.entityId, stores.revised.latestVersionId),
      binding(slots.source, stores.source.entityId, stores.source.latestVersionId),
      binding(slots.bindTarget, stores.bindTarget.entityId, stores.bindTarget.latestVersionId),
      binding(slots.copyTarget, stores.copyTarget.entityId, stores.copyTarget.latestVersionId),
      binding(slots.removed, stores.removed.entityId, stores.removed.latestVersionId)
    ],
    absences: [createKpSemanticSlotAbsence({
      slotId: slots.introduced,
      reason: "not-introduced",
      sourceId: "fixture.introduced"
    })],
    entityStores: Object.values(stores)
  });
  const transformationId = identities.appliedTransformation(
    identities.transformation("market-policy"),
    "first"
  );
  const transaction = beginKpSemanticTransaction({
    identities,
    before,
    transformationId
  });
  transaction.update(transaction.scope, {
    id: "update.revised",
    sourceId: "lesson.revise-market",
    revisionId: "revised",
    slotId: slots.revised,
    update(previous) {
      return { value: numericValue(previous) + 10 };
    }
  });
  transaction.bind(transaction.scope, {
    id: "bind.market-role",
    sourceId: "lesson.bind-market-role",
    sourceSlotId: slots.source,
    targetSlotId: slots.bindTarget
  });
  transaction.update(transaction.scope, {
    id: "update.source",
    sourceId: "lesson.revise-shared-source",
    revisionId: "source",
    slotId: slots.source,
    update(previous) {
      return { value: numericValue(previous) + 1 };
    }
  });
  const copiedEntityId = identities.entity("source-copy");
  transaction.bindCopy(transaction.scope, {
    id: "copy.market-role",
    sourceId: "lesson.copy-market-role",
    sourceSlotId: slots.source,
    targetSlotId: slots.copyTarget,
    newEntityId: copiedEntityId
  });
  const introducedEntityId = identities.entity("introduced");
  transaction.introduce(transaction.scope, {
    id: "introduce.market-role",
    sourceId: "lesson.introduce-market-role",
    slotId: slots.introduced,
    newEntityId: introducedEntityId,
    value: { value: 8 }
  });
  transaction.remove(transaction.scope, {
    id: "remove.market-role",
    sourceId: "lesson.remove-market-role",
    slotId: slots.removed
  });
  const commit = transaction.commit(transaction.scope);
  const descriptors: KpSemanticStateEntityDescriptor[] = [
    ...Object.entries(stores).map(([name, store]) => ({
      entityId: store.entityId,
      semanticKind: "market-component",
      label: name,
      provenance: { kind: "authored" as const, sourceId: `fixture.${name}` }
    })),
    {
      entityId: introducedEntityId,
      semanticKind: "policy-component",
      label: "introduced"
    }
  ];
  return {
    identities,
    slots,
    stores,
    before,
    commit,
    descriptors,
    copiedEntityId,
    introducedEntityId
  };
}

function binding(
  slotId: KpSemanticSlotId,
  entityId: KpSemanticEntityId,
  versionId: ReturnType<ReturnType<typeof createKpSemanticStateIdentityScope>["initialVersion"]>
) {
  return { slotId, entityId, versionId };
}

function numericValue(value: KpPersistentSemanticValue): number {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a numeric fixture record.");
  }
  const result = (value as Readonly<Record<string, KpPersistentSemanticValue>>)
    ["value"];
  if (typeof result !== "number") {
    throw new Error("Expected a numeric fixture value.");
  }
  return result;
}

test("transaction commits project through existing provenance and correspondence authority", () => {
  const fixture = authorityFixture();
  const projection = projectKpSemanticTransactionToExistingAuthority({
    commit: fixture.commit,
    entityDescriptors: fixture.descriptors
  });

  assert.deepEqual(projection.changeSet.records.map(({ kind }) => kind), [
    "persisted",
    "revised",
    "revised",
    "bound",
    "copied",
    "introduced",
    "removed"
  ]);
  const copied = projection.changeSet.records.find(
    (record) => record.kind === "copied"
  );
  assert.equal(copied?.kind, "copied");
  if (copied?.kind === "copied") {
    assert.equal(copied.replaced?.slotId, fixture.slots.copyTarget);
    assert.equal(copied.target.reference.entityId, fixture.copiedEntityId);
  }
  assert.deepEqual(
    validateCorrespondenceMap(projection.correspondenceMap, {
      sourceSelectorIds: projection.sourceRegistry.displayFragments.map(({ id }) => id),
      targetSelectorIds: projection.targetRegistry.displayFragments.map(({ id }) => id)
    }),
    []
  );
  assert.deepEqual(checkCorrespondenceMapRewindLaw(projection.correspondenceMap), []);
  assert.ok(projection.correspondenceMap.records.some(
    (record) => record.relation === "fan-out" &&
      record.targetSelectorIds.length === 3
  ));
});

test("copy and introduction reuse canonical entity provenance contracts", () => {
  const fixture = authorityFixture();
  const projection = projectKpSemanticTransactionToExistingAuthority({
    commit: fixture.commit,
    entityDescriptors: fixture.descriptors
  });
  const copied = projection.targetRegistry.entities.find(
    ({ id }) => id === fixture.copiedEntityId
  );
  const introduced = projection.targetRegistry.entities.find(
    ({ id }) => id === fixture.introducedEntityId
  );
  assert.deepEqual(copied?.provenance, {
    kind: "inferred",
    sourceEntityIds: [fixture.stores.source.entityId],
    methodId: "lesson.copy-market-role"
  });
  assert.deepEqual(introduced?.provenance, {
    kind: "authored",
    sourceId: "lesson.introduce-market-role"
  });
  assert.equal(copied?.semanticKind, "market-component");
  assert.equal(copied?.label, "source");
});

test("lineage covers persistence, replacement removal, copy, and introduction", () => {
  const fixture = authorityFixture();
  const projection = projectKpSemanticTransactionToExistingAuthority({
    commit: fixture.commit,
    entityDescriptors: fixture.descriptors
  });
  assert.deepEqual(
    new Set(projection.lineageGraph.edges.map(({ relation }) => relation)),
    new Set(["persist", "removal", "copy", "introduction"])
  );
  assert.ok(projection.lineageGraph.edges.some((edge) =>
    edge.relation === "copy" &&
    edge.sourceEntityIds[0] === fixture.stores.source.entityId &&
    edge.targetEntityIds[0] === fixture.copiedEntityId
  ));
});

test("projection ignores journal sequence as semantic identity authority", () => {
  const fixture = authorityFixture();
  const reordered: KpSemanticTransactionCommit = Object.freeze({
    ...fixture.commit,
    journal: Object.freeze([...fixture.commit.journal].reverse())
  });
  const canonical = projectKpSemanticTransactionToExistingAuthority({
    commit: fixture.commit,
    entityDescriptors: fixture.descriptors
  });
  const projected = projectKpSemanticTransactionToExistingAuthority({
    commit: reordered,
    entityDescriptors: fixture.descriptors
  });

  assert.deepEqual(projected.changeSet, canonical.changeSet);
  assert.deepEqual(projected.correspondenceMap, canonical.correspondenceMap);
  assert.deepEqual(projected.lineageGraph, canonical.lineageGraph);
});

test("projected snapshots retain exact direct historical recovery", () => {
  const fixture = authorityFixture();
  const index = createKpSemanticSnapshotRecoveryIndex([
    fixture.commit.before,
    fixture.commit.after
  ]);
  const beforeReference = pinKpSemanticSlotVersion(
    fixture.commit.before,
    fixture.slots.source
  );
  const afterReference = pinKpSemanticSlotVersion(
    fixture.commit.after,
    fixture.slots.source
  );
  assert.equal(numericValue(recoverKpPinnedVersion(index, beforeReference).value), 3);
  assert.equal(numericValue(recoverKpPinnedVersion(index, afterReference).value), 4);
  assert.notEqual(beforeReference.versionId, afterReference.versionId);
});

test("the adapter fails closed on opaque writes and missing semantic metadata", () => {
  const fixture = authorityFixture();
  assert.throws(
    () => projectKpSemanticTransactionToExistingAuthority({
      commit: fixture.commit,
      entityDescriptors: fixture.descriptors.filter(
        ({ entityId }) => entityId !== fixture.stores.stable.entityId
      )
    }),
    (error) => error instanceof KpSemanticStateAuthorityProjectionError &&
      error.code === "missing-entity-descriptor"
  );

  const identities = createKpSemanticStateIdentityScope("test.opaque-bridge");
  const slotId = identities.slot("value");
  const store = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("value"),
    value: { value: 1 },
    sourceId: "fixture.value"
  });
  const before = createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [slotId],
    bindings: [binding(slotId, store.entityId, store.latestVersionId)],
    entityStores: [store]
  });
  const transformationId = identities.appliedTransformation(
    identities.transformation("opaque"),
    "first"
  );
  const revised = appendKpSemanticEntityVersion(store, {
    value: { value: 2 },
    transformationId,
    revisionId: "value"
  });
  const transaction = beginKpSemanticTransaction({ identities, before, transformationId });
  transaction.stage(transaction.scope, {
    id: "stage.opaque",
    entityStoreReplacements: [{ entityId: revised.entityId, store: revised }],
    slotRebindings: [binding(slotId, revised.entityId, revised.latestVersionId)]
  });
  const opaqueCommit = transaction.commit(transaction.scope);
  assert.throws(
    () => projectKpSemanticTransactionToExistingAuthority({
      commit: opaqueCommit,
      entityDescriptors: [{
        entityId: store.entityId,
        semanticKind: "value",
        label: "value",
        provenance: { kind: "authored", sourceId: "fixture.value" }
      }]
    }),
    (error) => error instanceof KpSemanticStateAuthorityProjectionError &&
      error.code === "unsupported-staged-write"
  );
});

test("the authority bridge never inspects values, renderers, or journal ordinals", () => {
  const source = readFileSync(
    "src/semantic/semantic-state-authority-adapter.ts",
    "utf8"
  );
  assert.doesNotMatch(source, /\.value\b|\.sequence\b|glyph|renderer|domNode|geometry/u);
});
