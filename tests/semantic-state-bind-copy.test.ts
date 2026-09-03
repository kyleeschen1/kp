import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot,
  readKpSnapshotEntityStore
} from "../src/semantic-state/aggregate-snapshot.ts";
import {
  createKpSemanticEntityVersionStore,
  readLatestKpSemanticEntityVersion,
  type KpPersistentSemanticValue
} from "../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../src/semantic-state/identity.ts";
import {
  beginKpSemanticTransaction,
  KpSemanticTransactionError
} from "../src/semantic-state/transaction.ts";

function copyFixture(applicationId = "first") {
  const identities = createKpSemanticStateIdentityScope("test.bind-copy");
  const sourceSlot = identities.slot("market.source");
  const targetSlot = identities.slot("market.target");
  const source = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("source"),
    value: { value: 2, nested: { label: "shared-value" } },
    sourceId: "fixture.source"
  });
  const target = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("target"),
    value: { value: 2, nested: { label: "shared-value" } },
    sourceId: "fixture.target"
  });
  const before = createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [sourceSlot, targetSlot],
    bindings: [
      { slotId: sourceSlot, entityId: source.entityId, versionId: source.latestVersionId },
      { slotId: targetSlot, entityId: target.entityId, versionId: target.latestVersionId }
    ],
    entityStores: [source, target]
  });
  const transformationId = identities.appliedTransformation(
    identities.transformation("copy-entity"),
    applicationId
  );
  return {
    identities,
    sourceSlot,
    targetSlot,
    source,
    target,
    before,
    transformationId
  };
}

function numericValue(value: KpPersistentSemanticValue): number {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a value record.");
  }
  const result = (value as Readonly<Record<string, KpPersistentSemanticValue>>)
    ["value"];
  if (typeof result !== "number") {
    throw new Error("Expected a numeric value.");
  }
  return result;
}

test("bindCopy creates a distinct entity with exact copied-from provenance", () => {
  const fixture = copyFixture();
  const newEntityId = fixture.identities.entity("source-copy");
  const transaction = beginKpSemanticTransaction(fixture);
  transaction.bindCopy(transaction.scope, {
    id: "copy.target",
    sourceId: "lesson.independent-scenario",
    sourceSlotId: fixture.sourceSlot,
    targetSlotId: fixture.targetSlot,
    newEntityId
  });

  const source = transaction.read(transaction.scope, fixture.sourceSlot);
  const copy = transaction.read(transaction.scope, fixture.targetSlot);
  assert.notEqual(copy.binding.entityId, source.binding.entityId);
  assert.equal(copy.binding.entityId, newEntityId);
  assert.deepEqual(copy.version.value, source.version.value);
  assert.notEqual(copy.version.value, source.version.value);
  assert.notEqual(
    (copy.version.value as Readonly<Record<string, KpPersistentSemanticValue>>)["nested"],
    (source.version.value as Readonly<Record<string, KpPersistentSemanticValue>>)["nested"]
  );
  assert.equal(copy.version.ordinal, 0);
  assert.deepEqual(copy.version.provenance, {
    kind: "copied",
    copiedFromEntityId: fixture.source.entityId,
    copiedFromVersionId: fixture.source.latestVersionId,
    transformationId: fixture.transformationId,
    sourceId: "lesson.independent-scenario"
  });

  const commit = transaction.commit(transaction.scope);
  assert.equal(commit.after.entityStores.length, 3);
  assert.deepEqual(commit.journal[0]!.addedEntityIds, [newEntityId]);
  assert.equal(commit.journal[0]!.operation.kind, "bind-copy");
});

test("a source and its copy diverge independently inside one transaction", () => {
  const fixture = copyFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  transaction.bindCopy(transaction.scope, {
    id: "copy.target",
    sourceId: "lesson.independent-scenario",
    sourceSlotId: fixture.sourceSlot,
    targetSlotId: fixture.targetSlot,
    newEntityId: fixture.identities.entity("source-copy")
  });
  transaction.update(transaction.scope, {
    id: "update.source",
    sourceId: "lesson.source-change",
    revisionId: "source-change",
    slotId: fixture.sourceSlot,
    update(previous) {
      return { value: numericValue(previous) + 5 };
    }
  });

  assert.equal(
    numericValue(transaction.read(transaction.scope, fixture.sourceSlot).version.value),
    7
  );
  assert.equal(
    numericValue(transaction.read(transaction.scope, fixture.targetSlot).version.value),
    2
  );

  transaction.update(transaction.scope, {
    id: "update.copy",
    sourceId: "lesson.copy-change",
    revisionId: "copy-change",
    slotId: fixture.targetSlot,
    update(previous) {
      return { value: numericValue(previous) - 1 };
    }
  });
  const commit = transaction.commit(transaction.scope);
  assert.equal(numericValue(commit.after.entityStores[0]!.versions.at(-1)!.value), 7);
  const copiedStore = readKpSnapshotEntityStore(
    commit.after,
    fixture.identities.entity("source-copy")
  );
  assert.equal(numericValue(readLatestKpSemanticEntityVersion(copiedStore).value), 1);
  assert.equal(numericValue(fixture.source.versions[0]!.value), 2);
  assert.equal(fixture.before.entityStores.length, 2);
});

test("copy lineage points to the exact locally revised source version", () => {
  const fixture = copyFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  transaction.update(transaction.scope, {
    id: "update.source",
    sourceId: "lesson.source-change",
    revisionId: "source-change",
    slotId: fixture.sourceSlot,
    update(previous) {
      return { value: numericValue(previous) + 3 };
    }
  });
  const revisedSource = transaction.read(transaction.scope, fixture.sourceSlot);
  transaction.bindCopy(transaction.scope, {
    id: "copy.target",
    sourceId: "lesson.copy-revised-source",
    sourceSlotId: fixture.sourceSlot,
    targetSlotId: fixture.targetSlot,
    newEntityId: fixture.identities.entity("revised-source-copy")
  });
  const copied = transaction.read(transaction.scope, fixture.targetSlot);

  assert.equal(numericValue(copied.version.value), 5);
  assert.equal(copied.version.provenance.kind, "copied");
  if (copied.version.provenance.kind === "copied") {
    assert.equal(
      copied.version.provenance.copiedFromVersionId,
      revisedSource.binding.versionId
    );
  }
});

test("bindCopy rejects reused identities, foreign identities, and foreign scopes", () => {
  const fixture = copyFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  const other = beginKpSemanticTransaction(copyFixture("other"));
  const foreign = createKpSemanticStateIdentityScope("test.foreign-copy");

  assert.throws(
    () => transaction.bindCopy(transaction.scope, {
      id: "copy.existing",
      sourceId: "fixture.existing-id",
      sourceSlotId: fixture.sourceSlot,
      targetSlotId: fixture.targetSlot,
      newEntityId: fixture.source.entityId
    }),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "invalid-copy"
  );
  assert.throws(
    () => transaction.bindCopy(transaction.scope, {
      id: "copy.foreign-entity",
      sourceId: "fixture.foreign-entity",
      sourceSlotId: fixture.sourceSlot,
      targetSlotId: fixture.targetSlot,
      newEntityId: foreign.entity("copy")
    }),
    /does not belong to identity scope/u
  );
  assert.throws(
    () => transaction.bindCopy(other.scope, {
      id: "copy.foreign-scope",
      sourceId: "fixture.foreign-scope",
      sourceSlotId: fixture.sourceSlot,
      targetSlotId: fixture.targetSlot,
      newEntityId: fixture.identities.entity("copy")
    }),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "foreign-scope"
  );
});
