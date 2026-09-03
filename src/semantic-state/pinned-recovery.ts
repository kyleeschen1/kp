import {
  readKpSemanticSlotBinding,
  readKpSnapshotEntityStore,
  type KpAggregateSemanticSnapshot,
  type KpAnySemanticEntityVersionStore
} from "./aggregate-snapshot.ts";
import {
  readKpSemanticEntityVersion,
  type KpPersistentSemanticValue,
  type KpSemanticEntityVersion
} from "./entity-version-store.ts";
import type {
  KpAggregateSnapshotId,
  KpSemanticEntityId,
  KpSemanticSlotId,
  KpSemanticVersionId
} from "./identity.ts";

declare const kpPinnedSemanticStateReferenceBrand: unique symbol;

export interface KpPinnedSnapshotReference {
  readonly schemaVersion: "kp.pinned-semantic-state-reference.v1";
  readonly kind: "snapshot";
  readonly snapshotId: KpAggregateSnapshotId;
  readonly [kpPinnedSemanticStateReferenceBrand]: "snapshot";
}

export interface KpPinnedEntityReference {
  readonly schemaVersion: "kp.pinned-semantic-state-reference.v1";
  readonly kind: "entity";
  readonly snapshotId: KpAggregateSnapshotId;
  readonly entityId: KpSemanticEntityId;
  readonly [kpPinnedSemanticStateReferenceBrand]: "entity";
}

export interface KpPinnedVersionReference {
  readonly schemaVersion: "kp.pinned-semantic-state-reference.v1";
  readonly kind: "version";
  readonly snapshotId: KpAggregateSnapshotId;
  readonly entityId: KpSemanticEntityId;
  readonly versionId: KpSemanticVersionId;
  readonly [kpPinnedSemanticStateReferenceBrand]: "version";
}

export interface KpSemanticSnapshotRecoveryIndex {
  readonly schemaVersion: "kp.semantic-snapshot-recovery-index.v1";
  readonly kind: "semantic-snapshot-recovery-index";
  readonly snapshots: readonly KpAggregateSemanticSnapshot[];
  readonly snapshotIndex: Readonly<Record<string, number>>;
}

export type KpSemanticStateRecoveryErrorCode =
  | "snapshot-not-found"
  | "entity-not-found"
  | "version-not-found";

export class KpSemanticStateRecoveryError extends Error {
  readonly code: KpSemanticStateRecoveryErrorCode;

  constructor(code: KpSemanticStateRecoveryErrorCode, message: string) {
    super(message);
    this.name = "KpSemanticStateRecoveryError";
    this.code = code;
  }
}

export function createKpSemanticSnapshotRecoveryIndex(
  snapshots: readonly KpAggregateSemanticSnapshot[]
): KpSemanticSnapshotRecoveryIndex {
  const snapshotIndex: Record<string, number> = {};
  snapshots.forEach((snapshot, ordinal) => {
    if (snapshotIndex[snapshot.id] !== undefined) {
      throw new Error(
        `Semantic recovery index contains duplicate snapshot ${JSON.stringify(snapshot.id)}.`
      );
    }
    snapshotIndex[snapshot.id] = ordinal;
  });
  return Object.freeze({
    schemaVersion: "kp.semantic-snapshot-recovery-index.v1",
    kind: "semantic-snapshot-recovery-index",
    snapshots: Object.freeze([...snapshots]),
    snapshotIndex: Object.freeze(snapshotIndex)
  });
}

export function pinKpAggregateSemanticSnapshot(
  snapshot: KpAggregateSemanticSnapshot
): KpPinnedSnapshotReference {
  return Object.freeze({
    schemaVersion: "kp.pinned-semantic-state-reference.v1",
    kind: "snapshot",
    snapshotId: snapshot.id
  }) as KpPinnedSnapshotReference;
}

export function pinKpSemanticEntity(
  snapshot: KpAggregateSemanticSnapshot,
  entityId: KpSemanticEntityId
): KpPinnedEntityReference {
  readKpSnapshotEntityStore(snapshot, entityId);
  return Object.freeze({
    schemaVersion: "kp.pinned-semantic-state-reference.v1",
    kind: "entity",
    snapshotId: snapshot.id,
    entityId
  }) as KpPinnedEntityReference;
}

export function pinKpSemanticVersion(
  snapshot: KpAggregateSemanticSnapshot,
  entityId: KpSemanticEntityId,
  versionId: KpSemanticVersionId
): KpPinnedVersionReference {
  const store = readKpSnapshotEntityStore(snapshot, entityId);
  readKpSemanticEntityVersion(store, versionId);
  return Object.freeze({
    schemaVersion: "kp.pinned-semantic-state-reference.v1",
    kind: "version",
    snapshotId: snapshot.id,
    entityId,
    versionId
  }) as KpPinnedVersionReference;
}

export function pinKpSemanticSlotVersion(
  snapshot: KpAggregateSemanticSnapshot,
  slotId: KpSemanticSlotId
): KpPinnedVersionReference {
  const binding = readKpSemanticSlotBinding(snapshot, slotId);
  return pinKpSemanticVersion(
    snapshot,
    binding.entityId,
    binding.versionId
  );
}

export function recoverKpPinnedSnapshot(
  index: KpSemanticSnapshotRecoveryIndex,
  reference: KpPinnedSnapshotReference
): KpAggregateSemanticSnapshot {
  return recoverSnapshotById(index, reference.snapshotId);
}

function recoverSnapshotById(
  index: KpSemanticSnapshotRecoveryIndex,
  snapshotId: KpAggregateSnapshotId
): KpAggregateSemanticSnapshot {
  const ordinal = index.snapshotIndex[snapshotId];
  const snapshot = ordinal === undefined ? undefined : index.snapshots[ordinal];
  if (snapshot === undefined || snapshot.id !== snapshotId) {
    throw new KpSemanticStateRecoveryError(
      "snapshot-not-found",
      `Semantic recovery index has no snapshot ${JSON.stringify(snapshotId)}.`
    );
  }
  return snapshot;
}

export function recoverKpPinnedEntity(
  index: KpSemanticSnapshotRecoveryIndex,
  reference: KpPinnedEntityReference
): KpAnySemanticEntityVersionStore {
  const snapshot = recoverSnapshotById(index, reference.snapshotId);
  try {
    return readKpSnapshotEntityStore(snapshot, reference.entityId);
  } catch {
    throw new KpSemanticStateRecoveryError(
      "entity-not-found",
      `Semantic snapshot ${JSON.stringify(reference.snapshotId)} has no entity ${JSON.stringify(reference.entityId)}.`
    );
  }
}

export function recoverKpPinnedVersion(
  index: KpSemanticSnapshotRecoveryIndex,
  reference: KpPinnedVersionReference
): KpSemanticEntityVersion<KpPersistentSemanticValue> {
  const snapshot = recoverSnapshotById(index, reference.snapshotId);
  let store: KpAnySemanticEntityVersionStore;
  try {
    store = readKpSnapshotEntityStore(snapshot, reference.entityId);
  } catch {
    throw new KpSemanticStateRecoveryError(
      "entity-not-found",
      `Semantic snapshot ${JSON.stringify(reference.snapshotId)} has no entity ${JSON.stringify(reference.entityId)}.`
    );
  }
  try {
    return readKpSemanticEntityVersion(store, reference.versionId);
  } catch {
    throw new KpSemanticStateRecoveryError(
      "version-not-found",
      `Semantic snapshot ${JSON.stringify(reference.snapshotId)} entity ${JSON.stringify(reference.entityId)} has no version ${JSON.stringify(reference.versionId)}.`
    );
  }
}
