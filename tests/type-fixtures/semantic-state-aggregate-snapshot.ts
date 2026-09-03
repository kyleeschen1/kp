import {
  createKpAggregateSemanticSnapshot
} from "../../src/semantic-state/aggregate-snapshot.ts";
import {
  createKpSemanticEntityVersionStore
} from "../../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../../src/semantic-state/identity.ts";

const identities = createKpSemanticStateIdentityScope("fixture.snapshot");
const supplySlot = identities.slot("market.supply");
const supply = createKpSemanticEntityVersionStore({
  identities,
  entityId: identities.entity("supply"),
  value: { slope: 1 },
  sourceId: "fixture.supply"
});

createKpAggregateSemanticSnapshot({
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

createKpAggregateSemanticSnapshot({
  identities,
  snapshotId: identities.initialSnapshot(),
  // @ts-expect-error An author alias cannot stand in for a contextual slot.
  requiredSlotIds: [identities.alias("s")],
  bindings: [],
  entityStores: []
});

createKpAggregateSemanticSnapshot({
  identities,
  snapshotId: identities.initialSnapshot(),
  requiredSlotIds: [supplySlot],
  bindings: [{
    slotId: supplySlot,
    entityId: supply.entityId,
    // @ts-expect-error Entity identity is distinct from immutable version identity.
    versionId: supply.entityId
  }],
  entityStores: [supply]
});
