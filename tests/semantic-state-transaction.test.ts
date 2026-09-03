import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

function transactionFixture(applicationId = "first") {
  const identities = createKpSemanticStateIdentityScope("test.transaction");
  const supplySlot = identities.slot("market.supply");
  const demandSlot = identities.slot("market.demand");
  const supply = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("supply"),
    value: { intercept: 2 },
    sourceId: "fixture.supply"
  });
  const demand = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("demand"),
    value: { intercept: 12 },
    sourceId: "fixture.demand"
  });
  const before = createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [supplySlot, demandSlot],
    bindings: [
      { slotId: supplySlot, entityId: supply.entityId, versionId: supply.latestVersionId },
      { slotId: demandSlot, entityId: demand.entityId, versionId: demand.latestVersionId }
    ],
    entityStores: [supply, demand]
  });
  const transformationId = identities.appliedTransformation(
    identities.transformation("market-policy"),
    applicationId
  );
  return {
    identities,
    supplySlot,
    demandSlot,
    supply,
    demand,
    before,
    transformationId
  };
}

function readIntercept(value: KpPersistentSemanticValue): number {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  const intercept = (value as Readonly<Record<string, KpPersistentSemanticValue>>)
    ["intercept"];
  if (typeof intercept !== "number") {
    throw new Error("Expected a numeric intercept in the transaction fixture.");
  }
  return intercept;
}

test("transactions provide scoped read-your-writes and atomic commit", () => {
  const fixture = transactionFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  const revisedSupply = appendKpSemanticEntityVersion(fixture.supply, {
    value: { intercept: 6 },
    transformationId: fixture.transformationId,
    revisionId: "supply"
  });

  assert.equal(
    readIntercept(transaction.read(transaction.scope, fixture.supplySlot).version.value),
    2
  );
  transaction.stage(transaction.scope, {
    id: "write.supply",
    entityStoreReplacements: [{
      entityId: revisedSupply.entityId,
      store: revisedSupply
    }],
    slotRebindings: [{
      slotId: fixture.supplySlot,
      entityId: revisedSupply.entityId,
      versionId: revisedSupply.latestVersionId
    }]
  });
  assert.equal(
    readIntercept(transaction.read(transaction.scope, fixture.supplySlot).version.value),
    6
  );
  assert.equal(fixture.before.bindings[0]!.versionId, fixture.supply.latestVersionId);
  assert.equal("after" in transaction, false);
  assert.equal("working" in transaction, false);

  const commit = transaction.commit(transaction.scope);
  assert.equal(commit.before, fixture.before);
  assert.notEqual(commit.after, fixture.before);
  assert.equal(commit.after.id, fixture.identities.successorSnapshot(fixture.transformationId));
  assert.equal(commit.journal[0]!.writeId, "write.supply");
  assert.equal(Object.isFrozen(commit), true);
  assert.equal(Object.isFrozen(commit.journal), true);
});

test("failed staging leaves the prior scoped view intact", () => {
  const fixture = transactionFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  assert.throws(
    () => transaction.stage(transaction.scope, {
      id: "write.noop",
      entityStoreReplacements: [],
      slotRebindings: [fixture.before.bindings[0]!]
    }),
    /must change its entity or version/u
  );
  assert.equal(
    readIntercept(transaction.read(transaction.scope, fixture.supplySlot).version.value),
    2
  );
  assert.throws(
    () => transaction.commit(transaction.scope),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "no-staged-writes"
  );
});

test("abort discards staged state and expires the scope", () => {
  const fixture = transactionFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  const revisedSupply = appendKpSemanticEntityVersion(fixture.supply, {
    value: { intercept: 6 },
    transformationId: fixture.transformationId,
    revisionId: "supply"
  });
  transaction.stage(transaction.scope, {
    id: "write.supply",
    entityStoreReplacements: [{ entityId: revisedSupply.entityId, store: revisedSupply }],
    slotRebindings: [{
      slotId: fixture.supplySlot,
      entityId: revisedSupply.entityId,
      versionId: revisedSupply.latestVersionId
    }]
  });
  transaction.abort(transaction.scope);

  assert.equal(fixture.before.bindings[0]!.versionId, fixture.supply.latestVersionId);
  assert.throws(
    () => transaction.read(transaction.scope, fixture.supplySlot),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "scope-expired"
  );
  assert.throws(
    () => transaction.commit(transaction.scope),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "scope-expired"
  );
});

test("committed and foreign scopes cannot operate", () => {
  const fixture = transactionFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  const other = beginKpSemanticTransaction(transactionFixture("second"));
  const revisedSupply = appendKpSemanticEntityVersion(fixture.supply, {
    value: { intercept: 6 },
    transformationId: fixture.transformationId,
    revisionId: "supply"
  });

  assert.throws(
    () => transaction.read(other.scope, fixture.supplySlot),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "foreign-scope"
  );
  transaction.stage(transaction.scope, {
    id: "write.supply",
    entityStoreReplacements: [{ entityId: revisedSupply.entityId, store: revisedSupply }],
    slotRebindings: [{
      slotId: fixture.supplySlot,
      entityId: revisedSupply.entityId,
      versionId: revisedSupply.latestVersionId
    }]
  });
  transaction.commit(transaction.scope);
  assert.throws(
    () => transaction.commit(transaction.scope),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "scope-expired"
  );
});

test("journals preserve diagnostics without creating identity authority", () => {
  const source = readFileSync("src/semantic-state/transaction.ts", "utf8");
  assert.equal(source.includes("Proxy"), false);
  assert.equal(source.includes("globalThis"), false);
  assert.doesNotMatch(
    source,
    /from ["'][^"']*(?:render|editor|runtime|timeline)/u
  );
  assert.match(source, /sequence: this\.#journal\.length/u);
  assert.doesNotMatch(source, /version\([^)]*#journal|snapshot\([^)]*#journal/u);
});
