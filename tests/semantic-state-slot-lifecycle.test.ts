import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot,
  createKpSemanticSlotAbsence,
  KpSemanticSlotAccessError,
  readKpSemanticSlotAbsence,
  readKpSemanticSlotBinding,
  type KpAggregateSemanticSnapshot
} from "../src/semantic-state/aggregate-snapshot.ts";
import {
  createKpSemanticEntityVersionStore,
  type KpPersistentSemanticValue
} from "../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope,
  type KpSemanticStateIdentityScope
} from "../src/semantic-state/identity.ts";
import {
  beginKpSemanticTransaction,
  KpSemanticTransactionError
} from "../src/semantic-state/transaction.ts";

function lifecycleFixture(optionalPresent: boolean): {
  readonly identities: KpSemanticStateIdentityScope;
  readonly marketSlot: ReturnType<KpSemanticStateIdentityScope["slot"]>;
  readonly policySlot: ReturnType<KpSemanticStateIdentityScope["slot"]>;
  readonly snapshot: KpAggregateSemanticSnapshot;
} {
  const identities = createKpSemanticStateIdentityScope("test.slot-lifecycle");
  const marketSlot = identities.slot("market");
  const policySlot = identities.slot("market.policy");
  const market = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("market"),
    value: { name: "baseline" },
    sourceId: "fixture.market"
  });
  const policy = optionalPresent
    ? createKpSemanticEntityVersionStore({
      identities,
      entityId: identities.entity("policy"),
      value: { tax: 4 },
      sourceId: "fixture.policy"
    })
    : undefined;
  const snapshot = createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [marketSlot],
    optionalSlotIds: [policySlot],
    bindings: [
      { slotId: marketSlot, entityId: market.entityId, versionId: market.latestVersionId },
      ...(policy === undefined ? [] : [{
        slotId: policySlot,
        entityId: policy.entityId,
        versionId: policy.latestVersionId
      }])
    ],
    absences: policy === undefined ? [createKpSemanticSlotAbsence({
      slotId: policySlot,
      reason: "not-introduced",
      sourceId: "fixture.optional-policy"
    })] : [],
    entityStores: policy === undefined ? [market] : [market, policy]
  });
  return { identities, marketSlot, policySlot, snapshot };
}

function taxValue(value: KpPersistentSemanticValue): number {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a policy record.");
  }
  const tax = (value as Readonly<Record<string, KpPersistentSemanticValue>>)
    ["tax"];
  if (typeof tax !== "number") {
    throw new Error("Expected a numeric tax.");
  }
  return tax;
}

function transformation(fixture: ReturnType<typeof lifecycleFixture>) {
  return fixture.identities.appliedTransformation(
    fixture.identities.transformation("policy-lifecycle"),
    "first"
  );
}

test("optional roles are total as either a binding or typed absence", () => {
  const fixture = lifecycleFixture(false);
  const absence = readKpSemanticSlotAbsence(fixture.snapshot, fixture.policySlot);
  assert.deepEqual(absence, {
    schemaVersion: "kp.semantic-slot-absence.v1",
    kind: "semantic-slot-absence",
    slotId: fixture.policySlot,
    reason: "not-introduced",
    sourceId: "fixture.optional-policy"
  });
  assert.equal(Object.isFrozen(fixture.snapshot.optionalSlotIds), true);
  assert.equal(Object.isFrozen(fixture.snapshot.absences), true);
  assert.equal(Object.isFrozen(absence), true);
  assert.throws(
    () => readKpSemanticSlotBinding(fixture.snapshot, fixture.policySlot),
    (error) => error instanceof KpSemanticSlotAccessError &&
      error.code === "slot-absent" && error.absence === absence
  );
});

test("optional declarations reject missing, double, and required absence states", () => {
  const fixture = lifecycleFixture(false);
  const marketBinding = fixture.snapshot.bindings[0]!;
  const policy = createKpSemanticEntityVersionStore({
    identities: fixture.identities,
    entityId: fixture.identities.entity("policy"),
    value: { tax: 4 },
    sourceId: "fixture.policy"
  });
  const common = {
    identities: fixture.identities,
    snapshotId: fixture.identities.initialSnapshot(),
    requiredSlotIds: [fixture.marketSlot],
    optionalSlotIds: [fixture.policySlot],
    entityStores: [fixture.snapshot.entityStores[0]!, policy]
  } as const;

  assert.throws(
    () => createKpAggregateSemanticSnapshot({
      ...common,
      bindings: [marketBinding],
      absences: []
    }),
    /missing optional slot state/u
  );
  assert.throws(
    () => createKpAggregateSemanticSnapshot({
      ...common,
      bindings: [marketBinding, {
        slotId: fixture.policySlot,
        entityId: policy.entityId,
        versionId: policy.latestVersionId
      }],
      absences: fixture.snapshot.absences
    }),
    /both bound and absent/u
  );
  assert.throws(
    () => createKpAggregateSemanticSnapshot({
      ...common,
      bindings: [marketBinding],
      absences: [createKpSemanticSlotAbsence({
        slotId: fixture.marketSlot,
        reason: "removed",
        sourceId: "fixture.invalid-required-absence"
      })]
    }),
    /Required semantic slot .* cannot be absent/u
  );
});

test("introduce replaces absence with a new entity and reversible metadata", () => {
  const fixture = lifecycleFixture(false);
  const transaction = beginKpSemanticTransaction({
    identities: fixture.identities,
    before: fixture.snapshot,
    transformationId: transformation(fixture)
  });
  const policyEntityId = fixture.identities.entity("introduced-policy");
  transaction.introduce(transaction.scope, {
    id: "introduce.policy",
    sourceId: "lesson.introduce-policy",
    slotId: fixture.policySlot,
    newEntityId: policyEntityId,
    value: { tax: 4 }
  });

  const current = transaction.read(transaction.scope, fixture.policySlot);
  assert.equal(current.binding.entityId, policyEntityId);
  assert.equal(taxValue(current.version.value), 4);
  const commit = transaction.commit(transaction.scope);
  assert.equal(commit.before.absences.length, 1);
  assert.equal(commit.after.absences.length, 0);
  assert.deepEqual(commit.journal[0]!.operation, {
    kind: "introduce",
    sourceId: "lesson.introduce-policy",
    slotId: fixture.policySlot,
    previousAbsenceReason: "not-introduced",
    newEntityId: policyEntityId,
    newVersionId: current.binding.versionId
  });
  assert.deepEqual(commit.journal[0]!.addedEntityIds, [policyEntityId]);
});

test("remove creates tagged absence while preserving exact prior state", () => {
  const fixture = lifecycleFixture(true);
  const priorBinding = readKpSemanticSlotBinding(
    fixture.snapshot,
    fixture.policySlot
  );
  const transaction = beginKpSemanticTransaction({
    identities: fixture.identities,
    before: fixture.snapshot,
    transformationId: transformation(fixture)
  });
  transaction.remove(transaction.scope, {
    id: "remove.policy",
    sourceId: "lesson.remove-policy",
    slotId: fixture.policySlot
  });

  assert.throws(
    () => transaction.read(transaction.scope, fixture.policySlot),
    (error) => error instanceof KpSemanticSlotAccessError &&
      error.code === "slot-absent" && error.absence?.reason === "removed"
  );
  const commit = transaction.commit(transaction.scope);
  assert.equal(commit.before, fixture.snapshot);
  assert.equal(readKpSemanticSlotAbsence(commit.after, fixture.policySlot).reason, "removed");
  assert.equal(commit.after.entityStores.length, commit.before.entityStores.length);
  assert.deepEqual(commit.journal[0]!.operation, {
    kind: "remove",
    sourceId: "lesson.remove-policy",
    slotId: fixture.policySlot,
    removedEntityId: priorBinding.entityId,
    removedVersionId: priorBinding.versionId,
    absenceReason: "removed"
  });
  assert.deepEqual(commit.journal[0]!.absentSlotIds, [fixture.policySlot]);
});

test("required, absent, and undeclared roles cannot be removed", () => {
  const absentFixture = lifecycleFixture(false);
  const absentTransaction = beginKpSemanticTransaction({
    identities: absentFixture.identities,
    before: absentFixture.snapshot,
    transformationId: transformation(absentFixture)
  });
  assert.throws(
    () => absentTransaction.remove(absentTransaction.scope, {
      id: "remove.required",
      sourceId: "fixture.required-removal",
      slotId: absentFixture.marketSlot
    }),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "required-slot-removal"
  );
  assert.throws(
    () => absentTransaction.remove(absentTransaction.scope, {
      id: "remove.absent",
      sourceId: "fixture.absent-removal",
      slotId: absentFixture.policySlot
    }),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "invalid-removal"
  );
  assert.throws(
    () => absentTransaction.remove(absentTransaction.scope, {
      id: "remove.undeclared",
      sourceId: "fixture.undeclared-removal",
      slotId: absentFixture.identities.slot("undeclared")
    }),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "invalid-removal"
  );
});

test("introduction requires absence and a fresh entity identity", () => {
  const presentFixture = lifecycleFixture(true);
  const transaction = beginKpSemanticTransaction({
    identities: presentFixture.identities,
    before: presentFixture.snapshot,
    transformationId: transformation(presentFixture)
  });
  assert.throws(
    () => transaction.introduce(transaction.scope, {
      id: "introduce.present",
      sourceId: "fixture.present-introduction",
      slotId: presentFixture.policySlot,
      newEntityId: presentFixture.identities.entity("new-policy"),
      value: { tax: 5 }
    }),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "invalid-introduction"
  );
  const absentFixture = lifecycleFixture(false);
  const absentTransaction = beginKpSemanticTransaction({
    identities: absentFixture.identities,
    before: absentFixture.snapshot,
    transformationId: transformation(absentFixture)
  });
  assert.throws(
    () => absentTransaction.introduce(absentTransaction.scope, {
      id: "introduce.existing",
      sourceId: "fixture.existing-introduction",
      slotId: absentFixture.policySlot,
      newEntityId: absentFixture.snapshot.entityStores[0]!.entityId,
      value: { tax: 5 }
    }),
    (error) => error instanceof KpSemanticTransactionError &&
      error.code === "invalid-introduction"
  );
});
