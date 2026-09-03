import {
  createKpAggregateSemanticSnapshot
} from "../../src/semantic-state/aggregate-snapshot.ts";
import {
  createKpSemanticEntityVersionStore
} from "../../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../../src/semantic-state/identity.ts";
import {
  createKpSemanticSnapshotRecoveryIndex,
  pinKpAggregateSemanticSnapshot,
  pinKpSemanticEntity,
  pinKpSemanticVersion,
  recoverKpPinnedEntity,
  recoverKpPinnedSnapshot,
  recoverKpPinnedVersion
} from "../../src/semantic-state/pinned-recovery.ts";

const identities = createKpSemanticStateIdentityScope("fixture.recovery");
const entity = createKpSemanticEntityVersionStore({
  identities,
  entityId: identities.entity("market"),
  value: { tax: 0 },
  sourceId: "fixture.market"
});
const slotId = identities.slot("market");
const snapshot = createKpAggregateSemanticSnapshot({
  identities,
  snapshotId: identities.initialSnapshot(),
  requiredSlotIds: [slotId],
  bindings: [{
    slotId,
    entityId: entity.entityId,
    versionId: entity.latestVersionId
  }],
  entityStores: [entity]
});
const index = createKpSemanticSnapshotRecoveryIndex([snapshot]);
const snapshotReference = pinKpAggregateSemanticSnapshot(snapshot);
const entityReference = pinKpSemanticEntity(snapshot, entity.entityId);
const versionReference = pinKpSemanticVersion(
  snapshot,
  entity.entityId,
  entity.latestVersionId
);

recoverKpPinnedSnapshot(index, snapshotReference);
recoverKpPinnedEntity(index, entityReference);
recoverKpPinnedVersion(index, versionReference);

// @ts-expect-error An entity reference cannot recover a snapshot.
recoverKpPinnedSnapshot(index, entityReference);
// @ts-expect-error A version reference cannot recover an entity store.
recoverKpPinnedEntity(index, versionReference);
// @ts-expect-error Pinned reference objects cannot be hand-authored from strings.
const forged = { kind: "snapshot", snapshotId: "fixture.snapshot" } satisfies
  typeof snapshotReference;
void forged;
