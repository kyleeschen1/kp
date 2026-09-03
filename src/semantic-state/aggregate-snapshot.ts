import {
  readKpSemanticEntityVersion,
  type KpPersistentSemanticValue,
  type KpSemanticEntityVersionStore
} from "./entity-version-store.ts";
import type {
  KpAggregateSnapshotId,
  KpSemanticEntityId,
  KpSemanticSlotId,
  KpSemanticStateIdentityScope,
  KpSemanticVersionId
} from "./identity.ts";

export type KpAnySemanticEntityVersionStore =
  KpSemanticEntityVersionStore<KpPersistentSemanticValue>;

export interface KpSemanticSlotBinding {
  readonly slotId: KpSemanticSlotId;
  readonly entityId: KpSemanticEntityId;
  readonly versionId: KpSemanticVersionId;
}

export type KpSemanticSlotAbsenceReason = "not-introduced" | "removed";

export interface KpSemanticSlotAbsence {
  readonly schemaVersion: "kp.semantic-slot-absence.v1";
  readonly kind: "semantic-slot-absence";
  readonly slotId: KpSemanticSlotId;
  readonly reason: KpSemanticSlotAbsenceReason;
  readonly sourceId: string;
}

export type KpSemanticSlotAccessErrorCode = "slot-absent" | "slot-present";

export class KpSemanticSlotAccessError extends Error {
  readonly code: KpSemanticSlotAccessErrorCode;
  readonly slotId: KpSemanticSlotId;
  readonly absence?: KpSemanticSlotAbsence;

  constructor(input: {
    readonly code: KpSemanticSlotAccessErrorCode;
    readonly slotId: KpSemanticSlotId;
    readonly message: string;
    readonly absence?: KpSemanticSlotAbsence;
  }) {
    super(input.message);
    this.name = "KpSemanticSlotAccessError";
    this.code = input.code;
    this.slotId = input.slotId;
    if (input.absence !== undefined) {
      this.absence = input.absence;
    }
  }
}

export interface KpAggregateSemanticSnapshot {
  readonly schemaVersion: "kp.aggregate-semantic-snapshot.v1";
  readonly kind: "aggregate-semantic-snapshot";
  readonly id: KpAggregateSnapshotId;
  readonly namespace: string;
  readonly requiredSlotIds: readonly KpSemanticSlotId[];
  readonly optionalSlotIds: readonly KpSemanticSlotId[];
  readonly bindings: readonly KpSemanticSlotBinding[];
  readonly bindingIndex: Readonly<Record<string, number>>;
  readonly absences: readonly KpSemanticSlotAbsence[];
  readonly absenceIndex: Readonly<Record<string, number>>;
  readonly entityStores: readonly KpAnySemanticEntityVersionStore[];
  readonly entityIndex: Readonly<Record<string, number>>;
}

export interface KpCreateAggregateSemanticSnapshotInput {
  readonly identities: KpSemanticStateIdentityScope;
  readonly snapshotId: KpAggregateSnapshotId;
  readonly requiredSlotIds: readonly KpSemanticSlotId[];
  readonly optionalSlotIds?: readonly KpSemanticSlotId[];
  readonly bindings: readonly KpSemanticSlotBinding[];
  readonly absences?: readonly KpSemanticSlotAbsence[];
  readonly entityStores: readonly KpAnySemanticEntityVersionStore[];
}

export function createKpAggregateSemanticSnapshot(
  input: KpCreateAggregateSemanticSnapshotInput
): KpAggregateSemanticSnapshot {
  const snapshotPrefix = `kp-state/${input.identities.namespace}/snapshot/`;
  assertPrefix(input.snapshotId, snapshotPrefix, "Aggregate snapshot id");
  const slotPrefix = `kp-state/${input.identities.namespace}/slot/`;
  const requiredSlotIds = freezeUniqueIds(
    input.requiredSlotIds,
    "required semantic slot"
  );
  const optionalSlotIds = freezeUniqueIds(
    input.optionalSlotIds ?? [],
    "optional semantic slot"
  );
  if (requiredSlotIds.length + optionalSlotIds.length === 0) {
    throw new Error("An aggregate semantic snapshot requires at least one slot.");
  }
  const required = new Set(requiredSlotIds);
  for (const slotId of [...requiredSlotIds, ...optionalSlotIds]) {
    assertPrefix(slotId, slotPrefix, "Declared semantic slot");
    if (required.has(slotId) && optionalSlotIds.includes(slotId)) {
      throw new Error(
        `Aggregate semantic snapshot declares slot ${JSON.stringify(slotId)} as both required and optional.`
      );
    }
  }

  const entityStores = Object.freeze([...input.entityStores]);
  const entityIndex = createEntityIndex(
    entityStores,
    input.identities.namespace
  );
  const bindings = Object.freeze(input.bindings.map((binding) =>
    Object.freeze({ ...binding })
  ));
  const bindingIndex = createBindingIndex(
    bindings,
    requiredSlotIds,
    optionalSlotIds,
    entityStores,
    entityIndex,
    slotPrefix
  );
  const absences = Object.freeze((input.absences ?? []).map((absence) =>
    createKpSemanticSlotAbsence(absence)
  ));
  const absenceIndex = createAbsenceIndex(
    absences,
    requiredSlotIds,
    optionalSlotIds,
    bindingIndex,
    slotPrefix
  );
  validateSlotStateClosure(
    requiredSlotIds,
    optionalSlotIds,
    bindingIndex,
    absenceIndex
  );

  return Object.freeze({
    schemaVersion: "kp.aggregate-semantic-snapshot.v1",
    kind: "aggregate-semantic-snapshot",
    id: input.snapshotId,
    namespace: input.identities.namespace,
    requiredSlotIds,
    optionalSlotIds,
    bindings,
    bindingIndex,
    absences,
    absenceIndex,
    entityStores,
    entityIndex
  });
}

export function readKpSemanticSlotBinding(
  snapshot: KpAggregateSemanticSnapshot,
  slotId: KpSemanticSlotId
): KpSemanticSlotBinding {
  const ordinal = snapshot.bindingIndex[slotId];
  const binding = ordinal === undefined
    ? undefined
    : snapshot.bindings[ordinal];
  if (binding === undefined || binding.slotId !== slotId) {
    const absenceOrdinal = snapshot.absenceIndex[slotId];
    const absence = absenceOrdinal === undefined
      ? undefined
      : snapshot.absences[absenceOrdinal];
    if (absence !== undefined && absence.slotId === slotId) {
      throw new KpSemanticSlotAccessError({
        code: "slot-absent",
        slotId,
        absence,
        message: `Semantic slot ${JSON.stringify(slotId)} is explicitly absent (${absence.reason}) in aggregate snapshot ${JSON.stringify(snapshot.id)}.`
      });
    }
    throw new Error(
      `Semantic slot ${JSON.stringify(slotId)} is not bound in aggregate snapshot ${JSON.stringify(snapshot.id)}.`
    );
  }
  return binding;
}

export function readKpSemanticSlotAbsence(
  snapshot: KpAggregateSemanticSnapshot,
  slotId: KpSemanticSlotId
): KpSemanticSlotAbsence {
  const ordinal = snapshot.absenceIndex[slotId];
  const absence = ordinal === undefined ? undefined : snapshot.absences[ordinal];
  if (absence === undefined || absence.slotId !== slotId) {
    if (snapshot.bindingIndex[slotId] !== undefined) {
      throw new KpSemanticSlotAccessError({
        code: "slot-present",
        slotId,
        message: `Semantic slot ${JSON.stringify(slotId)} is present in aggregate snapshot ${JSON.stringify(snapshot.id)}.`
      });
    }
    throw new Error(
      `Semantic slot ${JSON.stringify(slotId)} has no absence state in aggregate snapshot ${JSON.stringify(snapshot.id)}.`
    );
  }
  return absence;
}

export function createKpSemanticSlotAbsence(input: {
  readonly slotId: KpSemanticSlotId;
  readonly reason: KpSemanticSlotAbsenceReason;
  readonly sourceId: string;
}): KpSemanticSlotAbsence {
  if (input.sourceId.trim().length === 0) {
    throw new Error("A semantic slot absence requires a source id.");
  }
  return Object.freeze({
    schemaVersion: "kp.semantic-slot-absence.v1",
    kind: "semantic-slot-absence",
    slotId: input.slotId,
    reason: input.reason,
    sourceId: input.sourceId
  });
}

export function readKpSnapshotEntityStore(
  snapshot: KpAggregateSemanticSnapshot,
  entityId: KpSemanticEntityId
): KpAnySemanticEntityVersionStore {
  const ordinal = snapshot.entityIndex[entityId];
  const store = ordinal === undefined
    ? undefined
    : snapshot.entityStores[ordinal];
  if (store === undefined || store.entityId !== entityId) {
    throw new Error(
      `Semantic entity ${JSON.stringify(entityId)} is not materialized in aggregate snapshot ${JSON.stringify(snapshot.id)}.`
    );
  }
  return store;
}

function createEntityIndex(
  stores: readonly KpAnySemanticEntityVersionStore[],
  namespace: string
): Readonly<Record<string, number>> {
  const index: Record<string, number> = {};
  stores.forEach((store, ordinal) => {
    if (store.namespace !== namespace) {
      throw new Error(
        `Semantic entity ${JSON.stringify(store.entityId)} belongs to scope ${JSON.stringify(store.namespace)}, not snapshot scope ${JSON.stringify(namespace)}.`
      );
    }
    if (index[store.entityId] !== undefined) {
      throw new Error(
        `Aggregate semantic snapshot contains duplicate entity store ${JSON.stringify(store.entityId)}.`
      );
    }
    index[store.entityId] = ordinal;
  });
  return Object.freeze(index);
}

function createBindingIndex(
  bindings: readonly KpSemanticSlotBinding[],
  requiredSlotIds: readonly KpSemanticSlotId[],
  optionalSlotIds: readonly KpSemanticSlotId[],
  entityStores: readonly KpAnySemanticEntityVersionStore[],
  entityIndex: Readonly<Record<string, number>>,
  slotPrefix: string
): Readonly<Record<string, number>> {
  const declared = new Set([...requiredSlotIds, ...optionalSlotIds]);
  const index: Record<string, number> = {};
  const boundVersionByEntity = new Map<KpSemanticEntityId, KpSemanticVersionId>();

  bindings.forEach((binding, ordinal) => {
    assertPrefix(binding.slotId, slotPrefix, "Semantic binding slot");
    if (!declared.has(binding.slotId)) {
      throw new Error(
        `Semantic binding ${JSON.stringify(binding.slotId)} is not a required snapshot slot or declared optional slot.`
      );
    }
    if (index[binding.slotId] !== undefined) {
      throw new Error(
        `Aggregate semantic snapshot binds slot ${JSON.stringify(binding.slotId)} more than once.`
      );
    }
    const storeOrdinal = entityIndex[binding.entityId];
    const store = storeOrdinal === undefined
      ? undefined
      : entityStores[storeOrdinal];
    if (store === undefined || store.entityId !== binding.entityId) {
      throw new Error(
        `Semantic binding ${JSON.stringify(binding.slotId)} references an unmaterialized entity ${JSON.stringify(binding.entityId)}.`
      );
    }
    readKpSemanticEntityVersion(store, binding.versionId);
    if (binding.versionId !== store.latestVersionId) {
      throw new Error(
        `Semantic binding ${JSON.stringify(binding.slotId)} must reference the materialized latest version of entity ${JSON.stringify(binding.entityId)}.`
      );
    }
    const boundVersion = boundVersionByEntity.get(binding.entityId);
    if (boundVersion !== undefined && boundVersion !== binding.versionId) {
      throw new Error(
        `Active roles sharing entity ${JSON.stringify(binding.entityId)} must share one exact version.`
      );
    }
    boundVersionByEntity.set(binding.entityId, binding.versionId);
    index[binding.slotId] = ordinal;
  });

  return Object.freeze(index);
}

function createAbsenceIndex(
  absences: readonly KpSemanticSlotAbsence[],
  requiredSlotIds: readonly KpSemanticSlotId[],
  optionalSlotIds: readonly KpSemanticSlotId[],
  bindingIndex: Readonly<Record<string, number>>,
  slotPrefix: string
): Readonly<Record<string, number>> {
  const required = new Set(requiredSlotIds);
  const optional = new Set(optionalSlotIds);
  const index: Record<string, number> = {};
  absences.forEach((absence, ordinal) => {
    assertPrefix(absence.slotId, slotPrefix, "Semantic absence slot");
    if (required.has(absence.slotId)) {
      throw new Error(
        `Required semantic slot ${JSON.stringify(absence.slotId)} cannot be absent.`
      );
    }
    if (!optional.has(absence.slotId)) {
      throw new Error(
        `Semantic absence ${JSON.stringify(absence.slotId)} is not a declared optional slot.`
      );
    }
    if (bindingIndex[absence.slotId] !== undefined) {
      throw new Error(
        `Optional semantic slot ${JSON.stringify(absence.slotId)} cannot be both bound and absent.`
      );
    }
    if (index[absence.slotId] !== undefined) {
      throw new Error(
        `Aggregate semantic snapshot marks slot ${JSON.stringify(absence.slotId)} absent more than once.`
      );
    }
    index[absence.slotId] = ordinal;
  });
  return Object.freeze(index);
}

function validateSlotStateClosure(
  requiredSlotIds: readonly KpSemanticSlotId[],
  optionalSlotIds: readonly KpSemanticSlotId[],
  bindingIndex: Readonly<Record<string, number>>,
  absenceIndex: Readonly<Record<string, number>>
): void {
  const missingRequired = requiredSlotIds.filter(
    (slotId) => bindingIndex[slotId] === undefined
  );
  if (missingRequired.length > 0) {
    throw new Error(
      `Aggregate semantic snapshot is incomplete; missing required slots: ${missingRequired.join(", ")}.`
    );
  }
  const missingOptional = optionalSlotIds.filter((slotId) =>
    bindingIndex[slotId] === undefined && absenceIndex[slotId] === undefined
  );
  if (missingOptional.length > 0) {
    throw new Error(
      `Aggregate semantic snapshot is incomplete; missing optional slot state: ${missingOptional.join(", ")}.`
    );
  }
}

function freezeUniqueIds<Id extends string>(
  values: readonly Id[],
  label: string
): readonly Id[] {
  if (new Set(values).size !== values.length) {
    throw new Error(`Aggregate semantic snapshot has a duplicate ${label} id.`);
  }
  return Object.freeze([...values]);
}

function assertPrefix(value: string, prefix: string, label: string): void {
  if (!value.startsWith(prefix)) {
    throw new Error(
      `${label} ${JSON.stringify(value)} does not belong to snapshot scope ${JSON.stringify(prefix.slice(0, -1))}.`
    );
  }
}
