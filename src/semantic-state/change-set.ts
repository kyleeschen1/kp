import {
  readKpSemanticSlotBinding,
  type KpAggregateSemanticSnapshot
} from "./aggregate-snapshot.ts";
import {
  createKpSemanticStateIdentityScope,
  type KpAppliedTransformationId,
  type KpSemanticSlotId
} from "./identity.ts";
import type { KpPinnedVersionReference } from "./pinned-recovery.ts";

export interface KpSemanticChangeEndpoint {
  readonly slotId: KpSemanticSlotId;
  readonly reference: KpPinnedVersionReference;
}

interface KpSemanticChangeRecordBase {
  readonly id: string;
}

export interface KpPersistedSemanticChange
  extends KpSemanticChangeRecordBase {
  readonly kind: "persisted";
  readonly source: KpSemanticChangeEndpoint;
  readonly target: KpSemanticChangeEndpoint;
}

export interface KpRevisedSemanticChange extends KpSemanticChangeRecordBase {
  readonly kind: "revised";
  readonly source: KpSemanticChangeEndpoint;
  readonly target: KpSemanticChangeEndpoint;
}

export interface KpIntroducedSemanticChange
  extends KpSemanticChangeRecordBase {
  readonly kind: "introduced";
  readonly target: KpSemanticChangeEndpoint;
}

export interface KpRemovedSemanticChange extends KpSemanticChangeRecordBase {
  readonly kind: "removed";
  readonly source: KpSemanticChangeEndpoint;
}

export interface KpCopiedSemanticChange extends KpSemanticChangeRecordBase {
  readonly kind: "copied";
  readonly source: KpSemanticChangeEndpoint;
  readonly target: KpSemanticChangeEndpoint;
}

export interface KpBoundSemanticChange extends KpSemanticChangeRecordBase {
  readonly kind: "bound";
  readonly source: KpSemanticChangeEndpoint;
  readonly replaced: KpSemanticChangeEndpoint;
  readonly target: KpSemanticChangeEndpoint;
}

export interface KpDerivedSemanticChange extends KpSemanticChangeRecordBase {
  readonly kind: "derived";
  readonly derivationId: string;
  readonly sources: readonly KpSemanticChangeEndpoint[];
  readonly target: KpSemanticChangeEndpoint;
}

export type KpSemanticChangeRecord =
  | KpPersistedSemanticChange
  | KpRevisedSemanticChange
  | KpIntroducedSemanticChange
  | KpRemovedSemanticChange
  | KpCopiedSemanticChange
  | KpBoundSemanticChange
  | KpDerivedSemanticChange;

export interface KpSemanticChangeSet {
  readonly schemaVersion: "kp.semantic-change-set.v1";
  readonly kind: "semantic-change-set";
  readonly id: string;
  readonly transformationId: KpAppliedTransformationId;
  readonly beforeSnapshotId: KpAggregateSemanticSnapshot["id"];
  readonly afterSnapshotId: KpAggregateSemanticSnapshot["id"];
  readonly records: readonly KpSemanticChangeRecord[];
}

export function createKpSemanticChangeSet(input: {
  readonly transformationId: KpAppliedTransformationId;
  readonly before: KpAggregateSemanticSnapshot;
  readonly after: KpAggregateSemanticSnapshot;
  readonly records: readonly KpSemanticChangeRecord[];
}): KpSemanticChangeSet {
  if (input.before.namespace !== input.after.namespace) {
    throw new Error("Semantic change-set snapshots must share one identity scope.");
  }
  if (input.before.id === input.after.id) {
    throw new Error("Semantic change set requires distinct before and after snapshots.");
  }
  const identities = createKpSemanticStateIdentityScope(input.before.namespace);
  if (identities.successorSnapshot(input.transformationId) !== input.after.id) {
    throw new Error(
      "Semantic change-set transformation must own the after snapshot identity."
    );
  }
  if (input.records.length === 0) {
    throw new Error("Semantic change set requires at least one explicit record.");
  }

  const recordIds = new Set<string>();
  const targetSlots = new Set<KpSemanticSlotId>();
  const records = input.records.map((record) => {
    requireRecordId(record.id);
    if (recordIds.has(record.id)) {
      throw new Error(`Semantic change set repeats record ${record.id}.`);
    }
    recordIds.add(record.id);
    validateRecord(record, input.before, input.after);
    for (const target of recordTargets(record)) {
      if (targetSlots.has(target.slotId)) {
        throw new Error(
          `Semantic change set assigns target slot ${JSON.stringify(target.slotId)} more than once.`
        );
      }
      targetSlots.add(target.slotId);
    }
    return freezeRecord(record);
  });

  return Object.freeze({
    schemaVersion: "kp.semantic-change-set.v1",
    kind: "semantic-change-set",
    id: `${input.transformationId}/changes`,
    transformationId: input.transformationId,
    beforeSnapshotId: input.before.id,
    afterSnapshotId: input.after.id,
    records: Object.freeze(records)
  });
}

function validateRecord(
  record: KpSemanticChangeRecord,
  before: KpAggregateSemanticSnapshot,
  after: KpAggregateSemanticSnapshot
): void {
  switch (record.kind) {
    case "persisted":
      validateEndpoint(record.source, before, `${record.id} source`);
      validateEndpoint(record.target, after, `${record.id} target`);
      requireSameSlot(record.source, record.target, record.id);
      if (
        record.source.reference.entityId !== record.target.reference.entityId ||
        record.source.reference.versionId !== record.target.reference.versionId
      ) {
        throw new Error(
          `Persisted change ${record.id} must retain exact entity and version identity.`
        );
      }
      return;
    case "revised":
      validateEndpoint(record.source, before, `${record.id} source`);
      validateEndpoint(record.target, after, `${record.id} target`);
      requireSameSlot(record.source, record.target, record.id);
      if (record.source.reference.entityId !== record.target.reference.entityId) {
        throw new Error(
          `Revised change ${record.id} must retain entity identity.`
        );
      }
      if (record.source.reference.versionId === record.target.reference.versionId) {
        throw new Error(
          `Revised change ${record.id} must name a distinct target version.`
        );
      }
      return;
    case "introduced":
      validateEndpoint(record.target, after, `${record.id} target`);
      return;
    case "removed":
      validateEndpoint(record.source, before, `${record.id} source`);
      return;
    case "copied":
      validateEndpoint(record.source, before, `${record.id} source`);
      validateEndpoint(record.target, after, `${record.id} target`);
      if (record.source.reference.entityId === record.target.reference.entityId) {
        throw new Error(
          `Copied change ${record.id} requires a distinct target entity.`
        );
      }
      return;
    case "bound":
      validateEndpoint(record.source, before, `${record.id} source`);
      validateEndpoint(record.replaced, before, `${record.id} replaced`);
      validateEndpoint(record.target, after, `${record.id} target`);
      requireSameSlot(record.replaced, record.target, record.id);
      if (record.source.slotId === record.replaced.slotId) {
        throw new Error(`Bound change ${record.id} requires two distinct roles.`);
      }
      if (record.source.reference.entityId !== record.target.reference.entityId) {
        throw new Error(
          `Bound change ${record.id} target must share its source entity.`
        );
      }
      if (record.replaced.reference.entityId === record.target.reference.entityId) {
        throw new Error(
          `Bound change ${record.id} must replace a previously distinct entity.`
        );
      }
      return;
    case "derived":
      requireRecordId(record.derivationId);
      if (record.sources.length === 0) {
        throw new Error(`Derived change ${record.id} requires source dependencies.`);
      }
      record.sources.forEach((source, index) =>
        validateEndpoint(source, before, `${record.id} source ${index}`)
      );
      validateEndpoint(record.target, after, `${record.id} target`);
      if (record.sources.some(({ reference }) =>
        reference.entityId === record.target.reference.entityId
      )) {
        throw new Error(
          `Derived change ${record.id} requires a distinct target entity.`
        );
      }
      return;
  }
}

function validateEndpoint(
  endpoint: KpSemanticChangeEndpoint,
  snapshot: KpAggregateSemanticSnapshot,
  label: string
): void {
  if (endpoint.reference.snapshotId !== snapshot.id) {
    throw new Error(`${label} must reference snapshot ${snapshot.id}.`);
  }
  const binding = readKpSemanticSlotBinding(snapshot, endpoint.slotId);
  if (
    binding.entityId !== endpoint.reference.entityId ||
    binding.versionId !== endpoint.reference.versionId
  ) {
    throw new Error(`${label} does not match its exact snapshot slot binding.`);
  }
}

function requireSameSlot(
  source: KpSemanticChangeEndpoint,
  target: KpSemanticChangeEndpoint,
  recordId: string
): void {
  if (source.slotId !== target.slotId) {
    throw new Error(
      `Semantic change ${recordId} must retain contextual slot identity.`
    );
  }
}

function recordTargets(
  record: KpSemanticChangeRecord
): readonly KpSemanticChangeEndpoint[] {
  switch (record.kind) {
    case "removed":
      return [];
    case "persisted":
    case "revised":
    case "introduced":
    case "copied":
    case "bound":
    case "derived":
      return [record.target];
  }
}

function freezeRecord(record: KpSemanticChangeRecord): KpSemanticChangeRecord {
  switch (record.kind) {
    case "derived":
      return Object.freeze({
        ...record,
        sources: Object.freeze(record.sources.map(freezeEndpoint)),
        target: freezeEndpoint(record.target)
      });
    case "bound":
      return Object.freeze({
        ...record,
        source: freezeEndpoint(record.source),
        replaced: freezeEndpoint(record.replaced),
        target: freezeEndpoint(record.target)
      });
    case "persisted":
    case "revised":
    case "copied":
      return Object.freeze({
        ...record,
        source: freezeEndpoint(record.source),
        target: freezeEndpoint(record.target)
      });
    case "introduced":
      return Object.freeze({ ...record, target: freezeEndpoint(record.target) });
    case "removed":
      return Object.freeze({ ...record, source: freezeEndpoint(record.source) });
  }
}

function freezeEndpoint(
  endpoint: KpSemanticChangeEndpoint
): KpSemanticChangeEndpoint {
  return Object.freeze({ ...endpoint });
}

function requireRecordId(value: string): void {
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u.test(value)) {
    throw new Error(
      `Semantic change identifier ${JSON.stringify(value)} must be lowercase and scoped.`
    );
  }
}
