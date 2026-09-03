import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot
} from "../src/semantic-state/aggregate-snapshot.ts";
import {
  appendKpSemanticEntityVersion,
  createKpSemanticEntityVersionStore
} from "../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../src/semantic-state/identity.ts";
import {
  createKpSemanticSnapshotRecoveryIndex,
  KpSemanticStateRecoveryError,
  pinKpAggregateSemanticSnapshot,
  pinKpSemanticEntity,
  pinKpSemanticSlotVersion,
  pinKpSemanticVersion,
  recoverKpPinnedEntity,
  recoverKpPinnedSnapshot,
  recoverKpPinnedVersion,
  type KpPinnedEntityReference,
  type KpPinnedVersionReference
} from "../src/semantic-state/pinned-recovery.ts";
import {
  createKpSuccessorAggregateSemanticSnapshot
} from "../src/semantic-state/snapshot-evolution.ts";

function recoveryFixture() {
  const identities = createKpSemanticStateIdentityScope("test.market-recovery");
  const supplySlot = identities.slot("market.supply");
  const supply = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("supply"),
    value: { intercept: 2, slope: 1 },
    sourceId: "fixture.supply"
  });
  const initial = createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [supplySlot],
    bindings: [{
      slotId: supplySlot,
      entityId: supply.entityId,
      versionId: supply.latestVersionId
    }],
    entityStores: [supply]
  });
  const addTax = identities.appliedTransformation(
    identities.transformation("add-tax"),
    "first"
  );
  const taxedSupply = appendKpSemanticEntityVersion(supply, {
    value: { intercept: 6, slope: 1 },
    transformationId: addTax,
    revisionId: "supply"
  });
  const taxed = createKpSuccessorAggregateSemanticSnapshot({
    identities,
    parent: initial,
    transformationId: addTax,
    entityStoreReplacements: [{ entityId: supply.entityId, store: taxedSupply }],
    slotRebindings: [{
      slotId: supplySlot,
      entityId: supply.entityId,
      versionId: taxedSupply.latestVersionId
    }]
  });
  return { identities, supplySlot, supply, taxedSupply, initial, taxed };
}

test("pinned handles recover exact values across multiple snapshots", () => {
  const fixture = recoveryFixture();
  const initialReference = pinKpSemanticSlotVersion(
    fixture.initial,
    fixture.supplySlot
  );
  const taxedReference = pinKpSemanticSlotVersion(
    fixture.taxed,
    fixture.supplySlot
  );
  const index = createKpSemanticSnapshotRecoveryIndex([
    fixture.taxed,
    fixture.initial
  ]);

  assert.deepEqual(recoverKpPinnedVersion(index, initialReference).value, {
    intercept: 2,
    slope: 1
  });
  assert.deepEqual(recoverKpPinnedVersion(index, taxedReference).value, {
    intercept: 6,
    slope: 1
  });
  assert.equal(
    recoverKpPinnedSnapshot(index, pinKpAggregateSemanticSnapshot(fixture.initial)),
    fixture.initial
  );
  assert.equal(
    recoverKpPinnedEntity(
      index,
      pinKpSemanticEntity(fixture.taxed, fixture.supply.entityId)
    ),
    fixture.taxedSupply
  );
  assert.equal(Object.isFrozen(initialReference), true);
  assert.equal(Object.isFrozen(index), true);
  assert.equal(Object.isFrozen(index.snapshots), true);
});

test("pinned recovery never follows a newer snapshot implicitly", () => {
  const fixture = recoveryFixture();
  const initialReference = pinKpSemanticVersion(
    fixture.initial,
    fixture.supply.entityId,
    fixture.supply.latestVersionId
  );
  const index = createKpSemanticSnapshotRecoveryIndex([
    fixture.initial,
    fixture.taxed
  ]);

  assert.equal(
    recoverKpPinnedVersion(index, initialReference).id,
    fixture.supply.latestVersionId
  );
  assert.notEqual(
    recoverKpPinnedVersion(index, initialReference).id,
    fixture.taxedSupply.latestVersionId
  );
});

test("missing snapshot, entity, and version diagnostics are typed", () => {
  const fixture = recoveryFixture();
  const empty = createKpSemanticSnapshotRecoveryIndex([]);
  const snapshotReference = pinKpAggregateSemanticSnapshot(fixture.initial);
  assert.throws(
    () => recoverKpPinnedSnapshot(empty, snapshotReference),
    (error) => error instanceof KpSemanticStateRecoveryError &&
      error.code === "snapshot-not-found"
  );

  const validEntity = pinKpSemanticEntity(fixture.initial, fixture.supply.entityId);
  const missingEntity = {
    ...validEntity,
    entityId: fixture.identities.entity("missing")
  } as KpPinnedEntityReference;
  const initialIndex = createKpSemanticSnapshotRecoveryIndex([fixture.initial]);
  assert.throws(
    () => recoverKpPinnedEntity(initialIndex, missingEntity),
    (error) => error instanceof KpSemanticStateRecoveryError &&
      error.code === "entity-not-found"
  );

  const validVersion = pinKpSemanticVersion(
    fixture.initial,
    fixture.supply.entityId,
    fixture.supply.latestVersionId
  );
  const missingVersion = {
    ...validVersion,
    versionId: fixture.taxedSupply.latestVersionId
  } as KpPinnedVersionReference;
  assert.throws(
    () => recoverKpPinnedVersion(initialIndex, missingVersion),
    (error) => error instanceof KpSemanticStateRecoveryError &&
      error.code === "version-not-found"
  );
});

test("recovery index rejects collisions and has no renderer or replay dependency", () => {
  const fixture = recoveryFixture();
  assert.throws(
    () => createKpSemanticSnapshotRecoveryIndex([
      fixture.initial,
      fixture.initial
    ]),
    /duplicate snapshot/u
  );

  const source = readFileSync(
    "src/semantic-state/pinned-recovery.ts",
    "utf8"
  );
  assert.doesNotMatch(
    source,
    /from ["'][^"']*(?:render|editor|runtime|timeline)|\b(?:document|window|requestAnimationFrame)\b/u
  );
  assert.equal(source.includes("globalThis"), false);
});
