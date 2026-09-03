import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot
} from "../src/semantic-state/aggregate-snapshot.ts";
import {
  appendKpSemanticEntityVersion,
  createKpSemanticEntityVersionStore,
  type KpPersistentSemanticValue
} from "../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../src/semantic-state/identity.ts";
import {
  beginKpSemanticTransaction,
  KpSemanticTransactionError
} from "../src/semantic-state/transaction.ts";

function bindFixture(applicationId = "first") {
  const identities = createKpSemanticStateIdentityScope("test.bind");
  const sourceSlot = identities.slot("market.source");
  const targetSlot = identities.slot("market.target");
  const source = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("source"),
    value: { value: 2 },
    sourceId: "fixture.source"
  });
  const target = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("target"),
    value: { value: 9 },
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
    identities.transformation("share-entity"),
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

test("bind makes two roles share one exact entity and version", () => {
  const fixture = bindFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  transaction.bind(transaction.scope, {
    id: "bind.target",
    sourceId: "lesson.shared-market-role",
    sourceSlotId: fixture.sourceSlot,
    targetSlotId: fixture.targetSlot
  });

  const source = transaction.read(transaction.scope, fixture.sourceSlot);
  const target = transaction.read(transaction.scope, fixture.targetSlot);
  assert.equal(target.binding.entityId, source.binding.entityId);
  assert.equal(target.binding.versionId, source.binding.versionId);
  assert.equal(target.version, source.version);
  assert.equal(numericValue(target.version.value), 2);

  const commit = transaction.commit(transaction.scope);
  assert.equal(commit.after.entityStores.length, 2);
  assert.deepEqual(commit.journal[0]!.replacedEntityIds, []);
  assert.deepEqual(commit.journal[0]!.operation, {
    kind: "bind",
    sourceId: "lesson.shared-market-role",
    sourceSlotId: fixture.sourceSlot,
    targetSlotId: fixture.targetSlot,
    sourceEntityId: fixture.source.entityId,
    replacedEntityId: fixture.target.entityId,
    versionId: fixture.source.latestVersionId
  });
});

test("updating through either alias advances both roles locally", () => {
  const fixture = bindFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  transaction.bind(transaction.scope, {
    id: "bind.target",
    sourceId: "lesson.shared-market-role",
    sourceSlotId: fixture.sourceSlot,
    targetSlotId: fixture.targetSlot
  });
  transaction.update(transaction.scope, {
    id: "update.through-target",
    sourceId: "lesson.alias-update",
    revisionId: "shared-revision",
    slotId: fixture.targetSlot,
    update(previous) {
      return { value: numericValue(previous) + 5 };
    }
  });

  const source = transaction.read(transaction.scope, fixture.sourceSlot);
  const target = transaction.read(transaction.scope, fixture.targetSlot);
  assert.equal(source.binding.entityId, target.binding.entityId);
  assert.equal(source.binding.versionId, target.binding.versionId);
  assert.equal(numericValue(source.version.value), 7);
  assert.equal(numericValue(target.version.value), 7);

  const commit = transaction.commit(transaction.scope);
  assert.deepEqual(commit.journal.map(({ sequence }) => sequence), [0, 1]);
  assert.deepEqual(commit.journal[1]!.reboundSlotIds, [
    fixture.sourceSlot,
    fixture.targetSlot
  ]);
});

test("binding and alias updates never mutate the previous snapshot", () => {
  const fixture = bindFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  transaction.bind(transaction.scope, {
    id: "bind.target",
    sourceId: "lesson.shared-market-role",
    sourceSlotId: fixture.sourceSlot,
    targetSlotId: fixture.targetSlot
  });
  transaction.update(transaction.scope, {
    id: "update.source",
    sourceId: "lesson.source-update",
    revisionId: "source-revision",
    slotId: fixture.sourceSlot,
    update(previous) {
      return { value: numericValue(previous) + 1 };
    }
  });
  const commit = transaction.commit(transaction.scope);

  assert.equal(commit.before, fixture.before);
  assert.equal(commit.before.bindings[0]!.entityId, fixture.source.entityId);
  assert.equal(commit.before.bindings[0]!.versionId, fixture.source.latestVersionId);
  assert.equal(commit.before.bindings[1]!.entityId, fixture.target.entityId);
  assert.equal(commit.before.bindings[1]!.versionId, fixture.target.latestVersionId);
  assert.equal(numericValue(fixture.source.versions[0]!.value), 2);
  assert.equal(numericValue(fixture.target.versions[0]!.value), 9);
});

test("bind rejects foreign capabilities, self-bind, and an existing alias", () => {
  const fixture = bindFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  const other = beginKpSemanticTransaction(bindFixture("other"));
  const bind = () => transaction.bind(transaction.scope, {
    id: "bind.target",
    sourceId: "lesson.shared-market-role",
    sourceSlotId: fixture.sourceSlot,
    targetSlotId: fixture.targetSlot
  });

  assert.throws(
    () => transaction.bind(other.scope, {
      id: "bind.foreign",
      sourceId: "fixture.foreign-scope",
      sourceSlotId: fixture.sourceSlot,
      targetSlotId: fixture.targetSlot
    }),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "foreign-scope"
  );
  assert.throws(
    () => transaction.bind(transaction.scope, {
      id: "bind.self",
      sourceId: "fixture.self-bind",
      sourceSlotId: fixture.sourceSlot,
      targetSlotId: fixture.sourceSlot
    }),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "invalid-bind"
  );
  bind();
  assert.throws(
    bind,
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "invalid-bind"
  );
});

test("a snapshot cannot expose one active entity at conflicting versions", () => {
  const fixture = bindFixture();
  const revised = appendKpSemanticEntityVersion(fixture.source, {
    value: { value: 3 },
    transformationId: fixture.transformationId,
    revisionId: "source"
  });

  assert.throws(
    () => createKpAggregateSemanticSnapshot({
      identities: fixture.identities,
      snapshotId: fixture.identities.successorSnapshot(fixture.transformationId),
      requiredSlotIds: [fixture.sourceSlot, fixture.targetSlot],
      bindings: [
        {
          slotId: fixture.sourceSlot,
          entityId: revised.entityId,
          versionId: revised.latestVersionId
        },
        {
          slotId: fixture.targetSlot,
          entityId: revised.entityId,
          versionId: fixture.source.latestVersionId
        }
      ],
      entityStores: [revised]
    }),
    /materialized latest version|share one exact version/u
  );
});
