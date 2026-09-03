import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot,
  readKpSemanticSlotBinding,
  readKpSnapshotEntityStore,
  type KpSemanticSlotBinding
} from "../src/semantic-state/aggregate-snapshot.ts";
import {
  createKpSemanticEntityVersionStore
} from "../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../src/semantic-state/identity.ts";

function snapshotFixture() {
  const identities = createKpSemanticStateIdentityScope("test.market-snapshot");
  const supply = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("supply"),
    value: { intercept: 2, slope: 1 },
    sourceId: "fixture.supply"
  });
  const demand = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("demand"),
    value: { intercept: 12, slope: -1 },
    sourceId: "fixture.demand"
  });
  const supplySlot = identities.slot("market.supply");
  const demandSlot = identities.slot("market.demand");
  const bindings: readonly KpSemanticSlotBinding[] = [
    {
      slotId: supplySlot,
      entityId: supply.entityId,
      versionId: supply.latestVersionId
    },
    {
      slotId: demandSlot,
      entityId: demand.entityId,
      versionId: demand.latestVersionId
    }
  ];
  return { identities, supply, demand, supplySlot, demandSlot, bindings };
}

test("aggregate snapshots close every required contextual slot", () => {
  const fixture = snapshotFixture();
  const snapshot = createKpAggregateSemanticSnapshot({
    identities: fixture.identities,
    ordinal: 0,
    requiredSlotIds: [fixture.supplySlot, fixture.demandSlot],
    bindings: fixture.bindings,
    entityStores: [fixture.supply, fixture.demand]
  });

  assert.equal(snapshot.id, "kp-state/test.market-snapshot/snapshot/0");
  assert.equal(
    readKpSemanticSlotBinding(snapshot, fixture.supplySlot).entityId,
    fixture.supply.entityId
  );
  assert.equal(
    readKpSnapshotEntityStore(snapshot, fixture.demand.entityId),
    fixture.demand
  );
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.requiredSlotIds), true);
  assert.equal(Object.isFrozen(snapshot.bindings), true);
  assert.equal(Object.isFrozen(snapshot.bindings[0]), true);
  assert.equal(Object.isFrozen(snapshot.entityStores), true);
});

test("role naming is independent from aliases and entity identity", () => {
  const fixture = snapshotFixture();
  const alternateRole = fixture.identities.slot("comparison.original-supply");
  const authorAlias = fixture.identities.alias("s");
  const snapshot = createKpAggregateSemanticSnapshot({
    identities: fixture.identities,
    ordinal: 0,
    requiredSlotIds: [fixture.supplySlot, alternateRole],
    bindings: [
      fixture.bindings[0]!,
      {
        slotId: alternateRole,
        entityId: fixture.supply.entityId,
        versionId: fixture.supply.latestVersionId
      }
    ],
    entityStores: [fixture.supply]
  });

  assert.notEqual(fixture.supplySlot, fixture.supply.entityId);
  assert.notEqual(authorAlias, fixture.supplySlot);
  assert.equal(snapshot.bindings[0]!.entityId, snapshot.bindings[1]!.entityId);
  assert.equal(JSON.stringify(snapshot).includes(authorAlias), false);
});

test("incomplete, duplicate, and extra bindings cannot commit", () => {
  const fixture = snapshotFixture();
  const input = {
    identities: fixture.identities,
    ordinal: 0,
    requiredSlotIds: [fixture.supplySlot, fixture.demandSlot],
    entityStores: [fixture.supply, fixture.demand]
  } as const;

  assert.throws(
    () => createKpAggregateSemanticSnapshot({
      ...input,
      bindings: [fixture.bindings[0]!]
    }),
    /incomplete; missing required slots/u
  );
  assert.throws(
    () => createKpAggregateSemanticSnapshot({
      ...input,
      bindings: [fixture.bindings[0]!, fixture.bindings[0]!]
    }),
    /binds slot .* more than once/u
  );
  assert.throws(
    () => createKpAggregateSemanticSnapshot({
      ...input,
      requiredSlotIds: [fixture.supplySlot],
      bindings: fixture.bindings
    }),
    /is not a required snapshot slot/u
  );
});

test("bindings reject foreign scopes, missing entities, and missing versions", () => {
  const fixture = snapshotFixture();
  const foreign = createKpSemanticStateIdentityScope("test.foreign-snapshot");
  const commonInput = {
    identities: fixture.identities,
    ordinal: 0,
    requiredSlotIds: [fixture.supplySlot],
    entityStores: [fixture.supply]
  } as const;

  assert.throws(
    () => createKpAggregateSemanticSnapshot({
      ...commonInput,
      requiredSlotIds: [foreign.slot("market.supply")],
      bindings: [{
        ...fixture.bindings[0]!,
        slotId: foreign.slot("market.supply")
      }]
    }),
    /does not belong to snapshot scope/u
  );
  assert.throws(
    () => createKpAggregateSemanticSnapshot({
      ...commonInput,
      bindings: [{
        slotId: fixture.supplySlot,
        entityId: fixture.demand.entityId,
        versionId: fixture.demand.latestVersionId
      }]
    }),
    /unmaterialized entity/u
  );
  assert.throws(
    () => createKpAggregateSemanticSnapshot({
      ...commonInput,
      bindings: [{
        ...fixture.bindings[0]!,
        versionId: fixture.identities.version(fixture.supply.entityId, 9)
      }]
    }),
    /does not belong to entity/u
  );
});
