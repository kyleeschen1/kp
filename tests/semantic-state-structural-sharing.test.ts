import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot,
  readKpSemanticSlotBinding,
  readKpSnapshotEntityStore
} from "../src/semantic-state/aggregate-snapshot.ts";
import {
  appendKpSemanticEntityVersion,
  createKpSemanticEntityVersionStore,
  readKpSemanticEntityVersion
} from "../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../src/semantic-state/identity.ts";
import {
  createKpSuccessorAggregateSemanticSnapshot
} from "../src/semantic-state/snapshot-evolution.ts";

function branchFixture() {
  const identities = createKpSemanticStateIdentityScope("test.market-branches");
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
  const parent = createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [supplySlot, demandSlot],
    bindings: [
      { slotId: supplySlot, entityId: supply.entityId, versionId: supply.latestVersionId },
      { slotId: demandSlot, entityId: demand.entityId, versionId: demand.latestVersionId }
    ],
    entityStores: [supply, demand]
  });
  return { identities, supply, demand, supplySlot, demandSlot, parent };
}

test("successor snapshots reuse unchanged nodes and separate changed nodes", () => {
  const fixture = branchFixture();
  const addTax = fixture.identities.appliedTransformation(
    fixture.identities.transformation("add-tax"),
    "policy-a"
  );
  const taxedSupply = appendKpSemanticEntityVersion(fixture.supply, {
    value: { intercept: 6, slope: 1 },
    transformationId: addTax,
    revisionId: "supply"
  });
  const successor = createKpSuccessorAggregateSemanticSnapshot({
    identities: fixture.identities,
    parent: fixture.parent,
    transformationId: addTax,
    entityStoreReplacements: [{
      entityId: fixture.supply.entityId,
      store: taxedSupply
    }],
    slotRebindings: [{
      slotId: fixture.supplySlot,
      entityId: taxedSupply.entityId,
      versionId: taxedSupply.latestVersionId
    }]
  });

  assert.equal(successor.requiredSlotIds, fixture.parent.requiredSlotIds);
  assert.notEqual(successor.bindings[0], fixture.parent.bindings[0]);
  assert.equal(successor.bindings[1], fixture.parent.bindings[1]);
  assert.notEqual(successor.entityStores[0], fixture.parent.entityStores[0]);
  assert.equal(successor.entityStores[1], fixture.parent.entityStores[1]);
  assert.equal(fixture.parent.entityStores[0], fixture.supply);
  assert.equal(fixture.parent.bindings[0]!.versionId, fixture.supply.latestVersionId);
});

test("branches diverge without leaking and recover deterministically", () => {
  const fixture = branchFixture();
  const addTax = fixture.identities.appliedTransformation(
    fixture.identities.transformation("add-tax"),
    "tax-branch"
  );
  const shiftDemand = fixture.identities.appliedTransformation(
    fixture.identities.transformation("shift-demand"),
    "demand-branch"
  );
  const taxedSupply = appendKpSemanticEntityVersion(fixture.supply, {
    value: { intercept: 6, slope: 1 },
    transformationId: addTax,
    revisionId: "supply"
  });
  const shiftedDemand = appendKpSemanticEntityVersion(fixture.demand, {
    value: { intercept: 16, slope: -1 },
    transformationId: shiftDemand,
    revisionId: "demand"
  });
  const taxBranch = createKpSuccessorAggregateSemanticSnapshot({
    identities: fixture.identities,
    parent: fixture.parent,
    transformationId: addTax,
    entityStoreReplacements: [{ entityId: taxedSupply.entityId, store: taxedSupply }],
    slotRebindings: [{
      slotId: fixture.supplySlot,
      entityId: taxedSupply.entityId,
      versionId: taxedSupply.latestVersionId
    }]
  });
  const demandBranch = createKpSuccessorAggregateSemanticSnapshot({
    identities: fixture.identities,
    parent: fixture.parent,
    transformationId: shiftDemand,
    entityStoreReplacements: [{ entityId: shiftedDemand.entityId, store: shiftedDemand }],
    slotRebindings: [{
      slotId: fixture.demandSlot,
      entityId: shiftedDemand.entityId,
      versionId: shiftedDemand.latestVersionId
    }]
  });

  assert.notEqual(taxBranch.id, demandBranch.id);
  assert.notEqual(taxedSupply.latestVersionId, shiftedDemand.latestVersionId);
  assert.equal(readKpSnapshotEntityStore(taxBranch, fixture.demand.entityId), fixture.demand);
  assert.equal(readKpSnapshotEntityStore(demandBranch, fixture.supply.entityId), fixture.supply);
  const taxBinding = readKpSemanticSlotBinding(taxBranch, fixture.supplySlot);
  const taxValue = readKpSemanticEntityVersion(
    readKpSnapshotEntityStore(taxBranch, taxBinding.entityId),
    taxBinding.versionId
  );
  assert.deepEqual(taxValue.value, { intercept: 6, slope: 1 });
  assert.deepEqual(
    readKpSemanticEntityVersion(fixture.supply, fixture.supply.latestVersionId).value,
    { intercept: 2, slope: 1 }
  );
});

test("equal payloads do not erase an explicit revision", () => {
  const fixture = branchFixture();
  const transformation = fixture.identities.appliedTransformation(
    fixture.identities.transformation("reaffirm-supply"),
    "branch"
  );
  const reaffirmed = appendKpSemanticEntityVersion(fixture.supply, {
    value: { intercept: 2, slope: 1 },
    transformationId: transformation,
    revisionId: "supply"
  });
  const successor = createKpSuccessorAggregateSemanticSnapshot({
    identities: fixture.identities,
    parent: fixture.parent,
    transformationId: transformation,
    entityStoreReplacements: [{ entityId: reaffirmed.entityId, store: reaffirmed }],
    slotRebindings: [{
      slotId: fixture.supplySlot,
      entityId: reaffirmed.entityId,
      versionId: reaffirmed.latestVersionId
    }]
  });

  assert.notEqual(successor.entityStores[0], fixture.parent.entityStores[0]);
  assert.notEqual(
    successor.bindings[0]!.versionId,
    fixture.parent.bindings[0]!.versionId
  );
});

test("the same entity can diverge on two branches without ID collision", () => {
  const fixture = branchFixture();
  const definition = fixture.identities.transformation("add-tax");
  const leftTransformation = fixture.identities.appliedTransformation(
    definition,
    "left-branch"
  );
  const rightTransformation = fixture.identities.appliedTransformation(
    definition,
    "right-branch"
  );
  const leftSupply = appendKpSemanticEntityVersion(fixture.supply, {
    value: { intercept: 4, slope: 1 },
    transformationId: leftTransformation,
    revisionId: "supply"
  });
  const rightSupply = appendKpSemanticEntityVersion(fixture.supply, {
    value: { intercept: 8, slope: 1 },
    transformationId: rightTransformation,
    revisionId: "supply"
  });

  assert.notEqual(leftSupply.latestVersionId, rightSupply.latestVersionId);
  assert.notEqual(
    fixture.identities.successorSnapshot(leftTransformation),
    fixture.identities.successorSnapshot(rightTransformation)
  );
  assert.throws(
    () => appendKpSemanticEntityVersion(leftSupply, {
      value: { intercept: 5, slope: 1 },
      transformationId: leftTransformation,
      revisionId: "supply"
    }),
    /already has revision/u
  );
});

test("successor construction rejects fake ancestry and no-op changes", () => {
  const fixture = branchFixture();
  const transformation = fixture.identities.appliedTransformation(
    fixture.identities.transformation("add-tax"),
    "branch"
  );
  const alternateOrigin = createKpSemanticEntityVersionStore({
    identities: fixture.identities,
    entityId: fixture.supply.entityId,
    value: { intercept: 99, slope: 1 },
    sourceId: "fixture.counterfeit-supply"
  });
  const counterfeit = appendKpSemanticEntityVersion(alternateOrigin, {
    value: { intercept: 6, slope: 1 },
    transformationId: transformation,
    revisionId: "supply"
  });

  assert.throws(
    () => createKpSuccessorAggregateSemanticSnapshot({
      identities: fixture.identities,
      parent: fixture.parent,
      transformationId: transformation,
      entityStoreReplacements: [{ entityId: counterfeit.entityId, store: counterfeit }],
      slotRebindings: []
    }),
    /does not structurally share parent version/u
  );
  assert.throws(
    () => createKpSuccessorAggregateSemanticSnapshot({
      identities: fixture.identities,
      parent: fixture.parent,
      transformationId: transformation,
      entityStoreReplacements: [],
      slotRebindings: []
    }),
    /requires an explicit change/u
  );
  assert.throws(
    () => createKpSuccessorAggregateSemanticSnapshot({
      identities: fixture.identities,
      parent: fixture.parent,
      transformationId: transformation,
      entityStoreReplacements: [],
      slotRebindings: [fixture.parent.bindings[0]!]
    }),
    /must change its entity or version/u
  );
});
