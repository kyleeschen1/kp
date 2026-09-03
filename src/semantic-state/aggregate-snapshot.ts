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

export interface KpAggregateSemanticSnapshot {
  readonly schemaVersion: "kp.aggregate-semantic-snapshot.v1";
  readonly kind: "aggregate-semantic-snapshot";
  readonly id: KpAggregateSnapshotId;
  readonly namespace: string;
  readonly requiredSlotIds: readonly KpSemanticSlotId[];
  readonly bindings: readonly KpSemanticSlotBinding[];
  readonly bindingIndex: Readonly<Record<string, number>>;
  readonly entityStores: readonly KpAnySemanticEntityVersionStore[];
  readonly entityIndex: Readonly<Record<string, number>>;
}

export interface KpCreateAggregateSemanticSnapshotInput {
  readonly identities: KpSemanticStateIdentityScope;
  readonly ordinal: number;
  readonly requiredSlotIds: readonly KpSemanticSlotId[];
  readonly bindings: readonly KpSemanticSlotBinding[];
  readonly entityStores: readonly KpAnySemanticEntityVersionStore[];
}

export function createKpAggregateSemanticSnapshot(
  input: KpCreateAggregateSemanticSnapshotInput
): KpAggregateSemanticSnapshot {
  const snapshotId = input.identities.snapshot(input.ordinal);
  const slotPrefix = `kp-state/${input.identities.namespace}/slot/`;
  const requiredSlotIds = freezeUniqueIds(
    input.requiredSlotIds,
    "required semantic slot"
  );
  if (requiredSlotIds.length === 0) {
    throw new Error("An aggregate semantic snapshot requires at least one slot.");
  }
  for (const slotId of requiredSlotIds) {
    assertPrefix(slotId, slotPrefix, "Required semantic slot");
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
    entityStores,
    entityIndex,
    slotPrefix
  );

  return Object.freeze({
    schemaVersion: "kp.aggregate-semantic-snapshot.v1",
    kind: "aggregate-semantic-snapshot",
    id: snapshotId,
    namespace: input.identities.namespace,
    requiredSlotIds,
    bindings,
    bindingIndex,
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
    throw new Error(
      `Semantic slot ${JSON.stringify(slotId)} is not bound in aggregate snapshot ${JSON.stringify(snapshot.id)}.`
    );
  }
  return binding;
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
  entityStores: readonly KpAnySemanticEntityVersionStore[],
  entityIndex: Readonly<Record<string, number>>,
  slotPrefix: string
): Readonly<Record<string, number>> {
  const required = new Set(requiredSlotIds);
  const index: Record<string, number> = {};

  bindings.forEach((binding, ordinal) => {
    assertPrefix(binding.slotId, slotPrefix, "Semantic binding slot");
    if (!required.has(binding.slotId)) {
      throw new Error(
        `Semantic binding ${JSON.stringify(binding.slotId)} is not a required snapshot slot.`
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
    index[binding.slotId] = ordinal;
  });

  const missing = requiredSlotIds.filter((slotId) => index[slotId] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `Aggregate semantic snapshot is incomplete; missing required slots: ${missing.join(", ")}.`
    );
  }
  return Object.freeze(index);
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
