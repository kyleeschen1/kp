import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot,
  type KpAggregateSemanticSnapshot
} from "../src/semantic-state/aggregate-snapshot.ts";
import {
  createKpSemanticChangeSet,
  type KpSemanticChangeEndpoint,
  type KpSemanticChangeRecord
} from "../src/semantic-state/change-set.ts";
import {
  appendKpSemanticEntityVersion,
  createKpSemanticEntityVersionStore,
  type KpPersistentSemanticValue,
  type KpSemanticEntityVersionStore
} from "../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope,
  type KpSemanticSlotId
} from "../src/semantic-state/identity.ts";
import { pinKpSemanticSlotVersion } from
  "../src/semantic-state/pinned-recovery.ts";

function changeFixture() {
  const identities = createKpSemanticStateIdentityScope("test.change-set");
  const transformationId = identities.appliedTransformation(
    identities.transformation("market-policy"),
    "first"
  );
  const makeStore = (id: string, marker: string) =>
    createKpSemanticEntityVersionStore({
      identities,
      entityId: identities.entity(id),
      value: { marker },
      sourceId: `fixture.${id}`
    });
  const stable = makeStore("stable", "same");
  const supply = makeStore("supply", "before");
  const revisedSupply = appendKpSemanticEntityVersion(supply, {
    value: { marker: "after" },
    transformationId,
    revisionId: "supply"
  });
  const removed = makeStore("removed", "old");
  const template = makeStore("template", "equal-copy-value");
  const shared = makeStore("shared", "shared");
  const replaced = makeStore("replaced", "replaced");
  const dependency = makeStore("dependency", "input");
  const introduced = makeStore("introduced", "new");
  const copied = makeStore("copied", "equal-copy-value");
  const derived = makeStore("derived", "output");
  const slots = {
    stable: identities.slot("market.stable"),
    supply: identities.slot("market.supply"),
    removed: identities.slot("market.removed"),
    template: identities.slot("market.template"),
    shared: identities.slot("market.shared"),
    bindTarget: identities.slot("market.bound"),
    dependency: identities.slot("market.dependency"),
    introduced: identities.slot("market.introduced"),
    copied: identities.slot("market.copied"),
    derived: identities.slot("market.derived")
  } as const;
  const beforeEntries = [
    [slots.stable, stable],
    [slots.supply, supply],
    [slots.removed, removed],
    [slots.template, template],
    [slots.shared, shared],
    [slots.bindTarget, replaced],
    [slots.dependency, dependency]
  ] as const;
  const afterEntries = [
    [slots.stable, stable],
    [slots.supply, revisedSupply],
    [slots.introduced, introduced],
    [slots.copied, copied],
    [slots.shared, shared],
    [slots.bindTarget, shared],
    [slots.derived, derived]
  ] as const;
  const before = snapshot(
    identities.initialSnapshot(),
    beforeEntries
  );
  const after = snapshot(
    identities.successorSnapshot(transformationId),
    afterEntries
  );
  const endpoint = (
    state: KpAggregateSemanticSnapshot,
    slotId: KpSemanticSlotId
  ): KpSemanticChangeEndpoint => ({
    slotId,
    reference: pinKpSemanticSlotVersion(state, slotId)
  });
  const records: readonly KpSemanticChangeRecord[] = [
    { kind: "persisted", id: "change.stable", source: endpoint(before, slots.stable), target: endpoint(after, slots.stable) },
    { kind: "revised", id: "change.supply", source: endpoint(before, slots.supply), target: endpoint(after, slots.supply) },
    { kind: "introduced", id: "change.introduced", target: endpoint(after, slots.introduced) },
    { kind: "removed", id: "change.removed", source: endpoint(before, slots.removed) },
    { kind: "copied", id: "change.copied", source: endpoint(before, slots.template), target: endpoint(after, slots.copied) },
    { kind: "bound", id: "change.bound", source: endpoint(before, slots.shared), replaced: endpoint(before, slots.bindTarget), target: endpoint(after, slots.bindTarget) },
    { kind: "derived", id: "change.derived", derivationId: "derivation.output", sources: [endpoint(before, slots.dependency)], target: endpoint(after, slots.derived) }
  ];
  return { identities, transformationId, before, after, slots, endpoint, records };
}

test("change sets validate and freeze all seven explicit dispositions", () => {
  const fixture = changeFixture();
  const changeSet = createKpSemanticChangeSet(fixture);

  assert.deepEqual(changeSet.records.map(({ kind }) => kind), [
    "persisted",
    "revised",
    "introduced",
    "removed",
    "copied",
    "bound",
    "derived"
  ]);
  assert.equal(changeSet.beforeSnapshotId, fixture.before.id);
  assert.equal(changeSet.afterSnapshotId, fixture.after.id);
  assert.equal(Object.isFrozen(changeSet), true);
  assert.equal(Object.isFrozen(changeSet.records), true);
  assert.ok(changeSet.records.every(Object.isFrozen));
});

test("identity laws reject impossible persisted revised copied and bound claims", () => {
  const fixture = changeFixture();
  const stableSource = fixture.endpoint(fixture.before, fixture.slots.stable);
  const stableTarget = fixture.endpoint(fixture.after, fixture.slots.stable);
  const revisedTarget = fixture.endpoint(fixture.after, fixture.slots.supply);

  assert.throws(() => createKpSemanticChangeSet({
    ...fixture,
    records: [{ kind: "persisted", id: "invalid.persisted", source: stableSource, target: revisedTarget }]
  }), /retain contextual slot identity/u);
  assert.throws(() => createKpSemanticChangeSet({
    ...fixture,
    records: [{ kind: "revised", id: "invalid.revised", source: stableSource, target: stableTarget }]
  }), /distinct target version/u);
  assert.throws(() => createKpSemanticChangeSet({
    ...fixture,
    records: [{ kind: "copied", id: "invalid.copied", source: stableSource, target: stableTarget }]
  }), /distinct target entity/u);
  assert.throws(() => createKpSemanticChangeSet({
    ...fixture,
    records: [{
      kind: "bound",
      id: "invalid.bound",
      source: fixture.endpoint(fixture.before, fixture.slots.shared),
      replaced: fixture.endpoint(fixture.before, fixture.slots.bindTarget),
      target: fixture.endpoint(fixture.after, fixture.slots.derived)
    }]
  }), /retain contextual slot identity/u);
});

test("change sets reject missing derivation sources and crossed snapshots", () => {
  const fixture = changeFixture();
  assert.throws(() => createKpSemanticChangeSet({
    ...fixture,
    records: [{
      kind: "derived",
      id: "invalid.derived",
      derivationId: "derivation.empty",
      sources: [],
      target: fixture.endpoint(fixture.after, fixture.slots.derived)
    }]
  }), /requires source dependencies/u);
  assert.throws(() => createKpSemanticChangeSet({
    ...fixture,
    records: [{
      kind: "removed",
      id: "invalid.snapshot",
      source: fixture.endpoint(fixture.after, fixture.slots.stable)
    }]
  }), /must reference snapshot/u);
});

test("duplicate record and target ownership fails before correspondence", () => {
  const fixture = changeFixture();
  assert.throws(() => createKpSemanticChangeSet({
    ...fixture,
    records: [fixture.records[0]!, { ...fixture.records[0]! }]
  }), /repeats record/u);
  assert.throws(() => createKpSemanticChangeSet({
    ...fixture,
    records: [
      fixture.records[0]!,
      { ...fixture.records[0]!, id: "change.stable-again" }
    ]
  }), /assigns target slot .* more than once/u);
});

test("dispositions are reference-defined and inspect no value or visual equality", () => {
  const source = readFileSync("src/semantic-state/change-set.ts", "utf8");
  assert.doesNotMatch(source, /\.value\b|glyph|renderer|domNode|geometry/u);
});

function snapshot(
  snapshotId: ReturnType<ReturnType<typeof createKpSemanticStateIdentityScope>["initialSnapshot"]>,
  entries: readonly (readonly [
    KpSemanticSlotId,
    KpSemanticEntityVersionStore<KpPersistentSemanticValue>
  ])[]
): KpAggregateSemanticSnapshot {
  const identities = createKpSemanticStateIdentityScope("test.change-set");
  const entityStores = [
    ...new Map(entries.map(([, store]) => [store.entityId, store])).values()
  ];
  return createKpAggregateSemanticSnapshot({
    identities,
    snapshotId,
    requiredSlotIds: entries.map(([slotId]) => slotId),
    bindings: entries.map(([slotId, store]) => ({
      slotId,
      entityId: store.entityId,
      versionId: store.latestVersionId
    })),
    entityStores
  });
}
