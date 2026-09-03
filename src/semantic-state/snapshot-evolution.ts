import {
  createKpAggregateSemanticSnapshot,
  readKpSemanticSlotBinding,
  type KpAggregateSemanticSnapshot,
  type KpAnySemanticEntityVersionStore,
  type KpSemanticSlotBinding
} from "./aggregate-snapshot.ts";
import type {
  KpAppliedTransformationId,
  KpSemanticEntityId,
  KpSemanticSlotId,
  KpSemanticStateIdentityScope
} from "./identity.ts";

export interface KpSemanticEntityStoreReplacement {
  readonly entityId: KpSemanticEntityId;
  readonly store: KpAnySemanticEntityVersionStore;
}

export interface KpCreateSuccessorAggregateSemanticSnapshotInput {
  readonly identities: KpSemanticStateIdentityScope;
  readonly parent: KpAggregateSemanticSnapshot;
  readonly transformationId: KpAppliedTransformationId;
  readonly entityStoreReplacements: readonly KpSemanticEntityStoreReplacement[];
  readonly slotRebindings: readonly KpSemanticSlotBinding[];
}

export function createKpSuccessorAggregateSemanticSnapshot(
  input: KpCreateSuccessorAggregateSemanticSnapshotInput
): KpAggregateSemanticSnapshot {
  if (input.parent.namespace !== input.identities.namespace) {
    throw new Error(
      `Parent snapshot ${JSON.stringify(input.parent.id)} belongs to scope ${JSON.stringify(input.parent.namespace)}, not ${JSON.stringify(input.identities.namespace)}.`
    );
  }
  if (
    input.entityStoreReplacements.length === 0 &&
    input.slotRebindings.length === 0
  ) {
    throw new Error("A semantic successor snapshot requires an explicit change.");
  }

  const replacements = indexReplacements(input);
  const nextStores = Object.freeze(input.parent.entityStores.map((store) =>
    replacements.get(store.entityId)?.store ?? store
  ));
  const rebindings = indexRebindings(input);
  const proposedBindings = input.parent.bindings.map((binding) =>
    rebindings.get(binding.slotId) ?? binding
  );
  const validated = createKpAggregateSemanticSnapshot({
    identities: input.identities,
    snapshotId: input.identities.successorSnapshot(input.transformationId),
    requiredSlotIds: input.parent.requiredSlotIds,
    bindings: proposedBindings,
    entityStores: nextStores
  });

  // Unchanged nodes are reused because the caller declared no change for their
  // identity. Equality of payloads is never consulted to decide sharing.
  const bindings = Object.freeze(input.parent.bindings.map((binding, index) =>
    rebindings.has(binding.slotId)
      ? validated.bindings[index]!
      : binding
  ));

  return Object.freeze({
    ...validated,
    requiredSlotIds: input.parent.requiredSlotIds,
    bindings,
    entityStores: nextStores
  });
}

function indexReplacements(
  input: KpCreateSuccessorAggregateSemanticSnapshotInput
): ReadonlyMap<KpSemanticEntityId, KpSemanticEntityStoreReplacement> {
  const replacements = new Map<
    KpSemanticEntityId,
    KpSemanticEntityStoreReplacement
  >();
  for (const replacement of input.entityStoreReplacements) {
    if (replacements.has(replacement.entityId)) {
      throw new Error(
        `Semantic successor replaces entity ${JSON.stringify(replacement.entityId)} more than once.`
      );
    }
    const parentOrdinal = input.parent.entityIndex[replacement.entityId];
    const parentStore = parentOrdinal === undefined
      ? undefined
      : input.parent.entityStores[parentOrdinal];
    if (parentStore === undefined || parentStore.entityId !== replacement.entityId) {
      throw new Error(
        `Semantic successor cannot replace unknown entity ${JSON.stringify(replacement.entityId)}.`
      );
    }
    validateStoreSuccession(parentStore, replacement.store);
    replacements.set(replacement.entityId, replacement);
  }
  return replacements;
}

function validateStoreSuccession(
  parent: KpAnySemanticEntityVersionStore,
  successor: KpAnySemanticEntityVersionStore
): void {
  if (successor.entityId !== parent.entityId ||
      successor.namespace !== parent.namespace) {
    throw new Error(
      `Semantic store replacement must preserve entity ${JSON.stringify(parent.entityId)} and its scope.`
    );
  }
  if (successor.versions.length <= parent.versions.length) {
    throw new Error(
      `Semantic store replacement for ${JSON.stringify(parent.entityId)} must add an immutable version.`
    );
  }
  for (let index = 0; index < parent.versions.length; index += 1) {
    // Reference sharing proves this materialized store actually descends from
    // the parent. Semantic identity itself remains the explicit branded IDs.
    if (successor.versions[index] !== parent.versions[index]) {
      throw new Error(
        `Semantic store replacement for ${JSON.stringify(parent.entityId)} does not structurally share parent version ${index}.`
      );
    }
  }
}

function indexRebindings(
  input: KpCreateSuccessorAggregateSemanticSnapshotInput
): ReadonlyMap<KpSemanticSlotId, KpSemanticSlotBinding> {
  const rebindings = new Map<KpSemanticSlotId, KpSemanticSlotBinding>();
  for (const binding of input.slotRebindings) {
    if (rebindings.has(binding.slotId)) {
      throw new Error(
        `Semantic successor rebinds slot ${JSON.stringify(binding.slotId)} more than once.`
      );
    }
    const previous = readKpSemanticSlotBinding(input.parent, binding.slotId);
    if (
      previous.entityId === binding.entityId &&
      previous.versionId === binding.versionId
    ) {
      throw new Error(
        `Semantic successor rebind for ${JSON.stringify(binding.slotId)} must change its entity or version.`
      );
    }
    rebindings.set(binding.slotId, binding);
  }
  return rebindings;
}
