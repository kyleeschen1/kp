import {
  createKpAggregateSemanticSnapshot,
  readKpSemanticSlotBinding,
  type KpAggregateSemanticSnapshot,
  type KpAnySemanticEntityVersionStore,
  type KpSemanticSlotAbsence,
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
  readonly entityStoreAdditions?: readonly KpAnySemanticEntityVersionStore[];
  readonly slotRebindings: readonly KpSemanticSlotBinding[];
  readonly slotAbsenceReplacements?: readonly KpSemanticSlotAbsence[];
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
    (input.entityStoreAdditions?.length ?? 0) === 0 &&
    input.slotRebindings.length === 0 &&
    (input.slotAbsenceReplacements?.length ?? 0) === 0
  ) {
    throw new Error("A semantic successor snapshot requires an explicit change.");
  }

  const replacements = indexReplacements(input);
  const additions = validateAdditions(input);
  const nextStores = Object.freeze([
    ...input.parent.entityStores.map((store) =>
      replacements.get(store.entityId)?.store ?? store
    ),
    ...additions
  ]);
  const rebindings = indexRebindings(input);
  const absenceReplacements = indexAbsenceReplacements(input, rebindings);
  const priorBindings = new Map(
    input.parent.bindings.map((binding) => [binding.slotId, binding] as const)
  );
  const proposedBindings = [
    ...input.parent.requiredSlotIds,
    ...input.parent.optionalSlotIds
  ].flatMap((slotId) => {
    if (absenceReplacements.has(slotId)) {
      return [];
    }
    const binding = rebindings.get(slotId) ?? priorBindings.get(slotId);
    return binding === undefined ? [] : [binding];
  });
  const priorAbsences = new Map(
    input.parent.absences.map((absence) => [absence.slotId, absence] as const)
  );
  const proposedAbsences = input.parent.optionalSlotIds.flatMap((slotId) => {
    if (rebindings.has(slotId)) {
      return [];
    }
    const absence = absenceReplacements.get(slotId) ?? priorAbsences.get(slotId);
    return absence === undefined ? [] : [absence];
  });
  const validated = createKpAggregateSemanticSnapshot({
    identities: input.identities,
    snapshotId: input.identities.successorSnapshot(input.transformationId),
    requiredSlotIds: input.parent.requiredSlotIds,
    optionalSlotIds: input.parent.optionalSlotIds,
    bindings: proposedBindings,
    absences: proposedAbsences,
    entityStores: nextStores
  });

  // Unchanged nodes are reused because the caller declared no change for their
  // identity. Equality of payloads is never consulted to decide sharing.
  const bindings = Object.freeze(validated.bindings.map((binding) =>
    rebindings.has(binding.slotId)
      ? binding
      : priorBindings.get(binding.slotId) ?? binding
  ));
  const absences = Object.freeze(validated.absences.map((absence) =>
    absenceReplacements.has(absence.slotId)
      ? absence
      : priorAbsences.get(absence.slotId) ?? absence
  ));

  return Object.freeze({
    ...validated,
    requiredSlotIds: input.parent.requiredSlotIds,
    optionalSlotIds: input.parent.optionalSlotIds,
    bindings,
    absences,
    entityStores: nextStores
  });
}

function validateAdditions(
  input: KpCreateSuccessorAggregateSemanticSnapshotInput
): readonly KpAnySemanticEntityVersionStore[] {
  const additions = input.entityStoreAdditions ?? [];
  const addedIds = new Set<KpSemanticEntityId>();
  for (const store of additions) {
    if (store.namespace !== input.identities.namespace) {
      throw new Error(
        `Semantic successor cannot add entity ${JSON.stringify(store.entityId)} from another scope.`
      );
    }
    if (input.parent.entityIndex[store.entityId] !== undefined) {
      throw new Error(
        `Semantic successor cannot add already materialized entity ${JSON.stringify(store.entityId)}.`
      );
    }
    if (addedIds.has(store.entityId)) {
      throw new Error(
        `Semantic successor adds entity ${JSON.stringify(store.entityId)} more than once.`
      );
    }
    addedIds.add(store.entityId);
  }
  return additions;
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
    const previousOrdinal = input.parent.bindingIndex[binding.slotId];
    const previous = previousOrdinal === undefined
      ? undefined
      : input.parent.bindings[previousOrdinal];
    if (previous === undefined &&
        input.parent.absenceIndex[binding.slotId] === undefined) {
      readKpSemanticSlotBinding(input.parent, binding.slotId);
    }
    if (previous !== undefined &&
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

function indexAbsenceReplacements(
  input: KpCreateSuccessorAggregateSemanticSnapshotInput,
  rebindings: ReadonlyMap<KpSemanticSlotId, KpSemanticSlotBinding>
): ReadonlyMap<KpSemanticSlotId, KpSemanticSlotAbsence> {
  const replacements = new Map<KpSemanticSlotId, KpSemanticSlotAbsence>();
  const optional = new Set(input.parent.optionalSlotIds);
  for (const absence of input.slotAbsenceReplacements ?? []) {
    if (!optional.has(absence.slotId)) {
      throw new Error(
        `Semantic successor can mark only a declared optional slot absent: ${JSON.stringify(absence.slotId)}.`
      );
    }
    if (rebindings.has(absence.slotId)) {
      throw new Error(
        `Semantic successor cannot bind and mark slot ${JSON.stringify(absence.slotId)} absent in one staged write.`
      );
    }
    if (replacements.has(absence.slotId)) {
      throw new Error(
        `Semantic successor replaces absence for slot ${JSON.stringify(absence.slotId)} more than once.`
      );
    }
    const previousOrdinal = input.parent.absenceIndex[absence.slotId];
    const previous = previousOrdinal === undefined
      ? undefined
      : input.parent.absences[previousOrdinal];
    if (previous !== undefined && previous.reason === absence.reason &&
        previous.sourceId === absence.sourceId) {
      throw new Error(
        `Semantic successor absence for ${JSON.stringify(absence.slotId)} must change its explicit state.`
      );
    }
    replacements.set(absence.slotId, absence);
  }
  return replacements;
}
