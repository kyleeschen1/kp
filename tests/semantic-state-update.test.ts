import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot
} from "../src/semantic-state/aggregate-snapshot.ts";
import {
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

function updateFixture() {
  const identities = createKpSemanticStateIdentityScope("test.update");
  const marketSlot = identities.slot("market");
  const market = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("market"),
    value: { tax: 0, name: "baseline" },
    sourceId: "fixture.market"
  });
  const before = createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [marketSlot],
    bindings: [{
      slotId: marketSlot,
      entityId: market.entityId,
      versionId: market.latestVersionId
    }],
    entityStores: [market]
  });
  const transformationId = identities.appliedTransformation(
    identities.transformation("add-tax"),
    "first"
  );
  return { identities, marketSlot, market, before, transformationId };
}

function marketValue(value: KpPersistentSemanticValue): {
  readonly tax: number;
  readonly name: string;
} {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a market record.");
  }
  const record = value as Readonly<Record<string, KpPersistentSemanticValue>>;
  const tax = record["tax"];
  const name = record["name"];
  if (typeof tax !== "number" || typeof name !== "string") {
    throw new Error("Expected the market fixture fields.");
  }
  return { tax, name };
}

test("update creates a same-entity successor from the pinned previous value", () => {
  const fixture = updateFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  let callbackInput: KpPersistentSemanticValue | undefined;

  transaction.update(transaction.scope, {
    id: "update.tax",
    sourceId: "lesson.tax-policy",
    revisionId: "market-tax",
    slotId: fixture.marketSlot,
    update(previous) {
      callbackInput ??= previous;
      const market = marketValue(previous);
      return { ...market, tax: market.tax + 4 };
    }
  });

  assert.equal(callbackInput, fixture.market.versions[0]!.value);
  assert.deepEqual(marketValue(callbackInput), { tax: 0, name: "baseline" });
  assert.deepEqual(
    marketValue(transaction.read(transaction.scope, fixture.marketSlot).version.value),
    { tax: 4, name: "baseline" }
  );

  const commit = transaction.commit(transaction.scope);
  const beforeBinding = commit.before.bindings[0]!;
  const afterBinding = commit.after.bindings[0]!;
  assert.equal(afterBinding.entityId, beforeBinding.entityId);
  assert.notEqual(afterBinding.versionId, beforeBinding.versionId);
  assert.equal(commit.journal[0]!.operation.kind, "update");
  assert.deepEqual(commit.journal[0]!.operation, {
    kind: "update",
    sourceId: "lesson.tax-policy",
    revisionId: "market-tax",
    slotId: fixture.marketSlot,
    previousVersionId: fixture.market.latestVersionId,
    nextVersionId: afterBinding.versionId
  });
});

test("ordered updates each receive the latest immutable local version", () => {
  const fixture = updateFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  const seenTaxes: number[] = [];

  for (const [id, revisionId, increment] of [
    ["update.first", "first", 2],
    ["update.second", "second", 3]
  ] as const) {
    transaction.update(transaction.scope, {
      id,
      sourceId: "lesson.tax-sequence",
      revisionId,
      slotId: fixture.marketSlot,
      update(previous) {
        const market = marketValue(previous);
        seenTaxes.push(market.tax);
        return { ...market, tax: market.tax + increment };
      }
    });
  }

  assert.deepEqual(seenTaxes, [0, 0, 2, 2]);
  assert.equal(
    marketValue(transaction.read(transaction.scope, fixture.marketSlot).version.value).tax,
    5
  );
  const commit = transaction.commit(transaction.scope);
  assert.deepEqual(commit.journal.map(({ sequence }) => sequence), [0, 1]);
  const firstOperation = commit.journal[0]!.operation;
  const secondOperation = commit.journal[1]!.operation;
  assert.equal(firstOperation.kind, "update");
  assert.equal(secondOperation.kind, "update");
  if (firstOperation.kind === "update" && secondOperation.kind === "update") {
    assert.equal(secondOperation.previousVersionId, firstOperation.nextVersionId);
  }
});

test("repeated applications are deterministic without using order as identity", () => {
  const leftFixture = updateFixture();
  const rightFixture = updateFixture();
  const left = beginKpSemanticTransaction(leftFixture);
  const right = beginKpSemanticTransaction(rightFixture);
  const operation = {
    id: "update.tax",
    sourceId: "lesson.tax-policy",
    revisionId: "market-tax",
    slotId: leftFixture.marketSlot,
    update(previous: KpPersistentSemanticValue) {
      const market = marketValue(previous);
      return { name: market.name, tax: market.tax + 4 };
    }
  } as const;

  left.update(left.scope, operation);
  right.update(right.scope, operation);
  const leftCommit = left.commit(left.scope);
  const rightCommit = right.commit(right.scope);

  assert.equal(leftCommit.after.id, rightCommit.after.id);
  assert.equal(
    leftCommit.after.bindings[0]!.versionId,
    rightCommit.after.bindings[0]!.versionId
  );
  assert.deepEqual(
    leftCommit.after.entityStores[0]!.versions.at(-1)!.value,
    rightCommit.after.entityStores[0]!.versions.at(-1)!.value
  );
});

test("ambient-output nondeterminism fails without staging a partial update", () => {
  const fixture = updateFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  let ambientCounter = 0;

  assert.throws(
    () => transaction.update(transaction.scope, {
      id: "update.ambient",
      sourceId: "fixture.ambient-counter",
      revisionId: "ambient",
      slotId: fixture.marketSlot,
      update(previous) {
        const market = marketValue(previous);
        ambientCounter += 1;
        return { ...market, tax: ambientCounter };
      }
    }),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "nondeterministic-update"
  );
  assert.equal(
    marketValue(transaction.read(transaction.scope, fixture.marketSlot).version.value).tax,
    0
  );
  assert.throws(
    () => transaction.commit(transaction.scope),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "no-staged-writes"
  );
});

test("callbacks cannot mutate prior values or reenter transaction effects", () => {
  const fixture = updateFixture();
  const transaction = beginKpSemanticTransaction(fixture);

  assert.throws(
    () => transaction.update(transaction.scope, {
      id: "update.mutation",
      sourceId: "fixture.invalid-mutation",
      revisionId: "mutation",
      slotId: fixture.marketSlot,
      update(previous) {
        (previous as Record<string, KpPersistentSemanticValue>)["tax"] = 9;
        return previous;
      }
    }),
    TypeError
  );
  assert.throws(
    () => transaction.update(transaction.scope, {
      id: "update.reentrant",
      sourceId: "fixture.invalid-reentrant",
      revisionId: "reentrant",
      slotId: fixture.marketSlot,
      update(previous) {
        transaction.commit(transaction.scope);
        return previous;
      }
    }),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "reentrant-operation"
  );
  assert.equal(
    marketValue(transaction.read(transaction.scope, fixture.marketSlot).version.value).tax,
    0
  );
});

test("an equal-value update still records a distinct declared revision", () => {
  const fixture = updateFixture();
  const transaction = beginKpSemanticTransaction(fixture);
  transaction.update(transaction.scope, {
    id: "update.reaffirm",
    sourceId: "lesson.reaffirm-market",
    revisionId: "reaffirmed",
    slotId: fixture.marketSlot,
    update(previous) {
      return previous;
    }
  });
  const commit = transaction.commit(transaction.scope);
  assert.notEqual(
    commit.before.bindings[0]!.versionId,
    commit.after.bindings[0]!.versionId
  );
  assert.deepEqual(
    commit.before.entityStores[0]!.versions[0]!.value,
    commit.after.entityStores[0]!.versions.at(-1)!.value
  );
});
