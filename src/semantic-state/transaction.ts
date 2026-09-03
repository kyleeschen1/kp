import {
  createKpSemanticSlotAbsence,
  readKpSemanticSlotBinding,
  readKpSemanticSlotAbsence,
  readKpSnapshotEntityStore,
  type KpAggregateSemanticSnapshot,
  type KpSemanticSlotAbsence,
  type KpSemanticSlotAbsenceReason,
  type KpSemanticSlotBinding
} from "./aggregate-snapshot.ts";
import {
  appendKpSemanticEntityVersion,
  createKpCopiedSemanticEntityVersionStore,
  createKpSemanticEntityVersionStore,
  readKpSemanticEntityVersion,
  type KpPersistentSemanticValue,
  type KpSemanticEntityVersion,
  type KpSemanticEntityVersionStore
} from "./entity-version-store.ts";
import type {
  KpAppliedTransformationId,
  KpSemanticEntityId,
  KpSemanticSlotId,
  KpSemanticStateIdentityScope
} from "./identity.ts";
import {
  unsupportedKpSemanticDerivedWrite,
  type KpSemanticDerivedBindingDeclaration
} from "./derived-binding.ts";
import {
  createKpSuccessorAggregateSemanticSnapshot,
  type KpSemanticEntityStoreReplacement
} from "./snapshot-evolution.ts";

declare const kpSemanticTransactionScopeBrand: unique symbol;
const kpSemanticTransactionConstructorAuthority = Symbol(
  "kp.semantic-transaction.constructor"
);

export interface KpSemanticTransactionScope {
  readonly transactionId: string;
  readonly [kpSemanticTransactionScopeBrand]: "semantic-transaction-scope";
}

export interface KpSemanticTransactionRead {
  readonly binding: KpSemanticSlotBinding;
  readonly version: KpSemanticEntityVersion<KpPersistentSemanticValue>;
}

export interface KpSemanticTransactionStagedWrite {
  readonly id: string;
  readonly entityStoreReplacements: readonly KpSemanticEntityStoreReplacement[];
  readonly entityStoreAdditions?: readonly KpSemanticEntityVersionStore<KpPersistentSemanticValue>[];
  readonly slotRebindings: readonly KpSemanticSlotBinding[];
  readonly slotAbsenceReplacements?: readonly KpSemanticSlotAbsence[];
  readonly derivedBindingReplacements?: readonly KpSemanticDerivedBindingDeclaration[];
}

export interface KpSemanticTransactionUpdateInput {
  readonly id: string;
  readonly sourceId: string;
  readonly revisionId: string;
  readonly slotId: KpSemanticSlotId;
  readonly update: (
    previous: KpPersistentSemanticValue
  ) => KpPersistentSemanticValue;
}

export interface KpSemanticTransactionBindInput {
  readonly id: string;
  readonly sourceId: string;
  readonly sourceSlotId: KpSemanticSlotId;
  readonly targetSlotId: KpSemanticSlotId;
}

export interface KpSemanticTransactionBindCopyInput {
  readonly id: string;
  readonly sourceId: string;
  readonly sourceSlotId: KpSemanticSlotId;
  readonly targetSlotId: KpSemanticSlotId;
  readonly newEntityId: KpSemanticEntityId;
}

export interface KpSemanticTransactionIntroduceInput {
  readonly id: string;
  readonly sourceId: string;
  readonly slotId: KpSemanticSlotId;
  readonly newEntityId: KpSemanticEntityId;
  readonly value: KpPersistentSemanticValue;
}

export interface KpSemanticTransactionRemoveInput {
  readonly id: string;
  readonly sourceId: string;
  readonly slotId: KpSemanticSlotId;
}

export interface KpSemanticTransactionDeriveInput {
  readonly id: string;
  readonly sourceId: string;
  readonly declaration: KpSemanticDerivedBindingDeclaration;
}

export type KpSemanticTransactionJournalOperation =
  | {
    readonly kind: "staged-write";
  }
  | {
    readonly kind: "update";
    readonly sourceId: string;
    readonly revisionId: string;
    readonly slotId: KpSemanticSlotId;
    readonly previousVersionId: KpSemanticEntityVersion<KpPersistentSemanticValue>["id"];
    readonly nextVersionId: KpSemanticEntityVersion<KpPersistentSemanticValue>["id"];
  }
  | {
    readonly kind: "bind";
    readonly sourceId: string;
    readonly sourceSlotId: KpSemanticSlotId;
    readonly targetSlotId: KpSemanticSlotId;
    readonly sourceEntityId: KpSemanticEntityId;
    readonly replacedEntityId: KpSemanticEntityId;
    readonly versionId: KpSemanticEntityVersion<KpPersistentSemanticValue>["id"];
  }
  | {
    readonly kind: "bind-copy";
    readonly sourceId: string;
    readonly sourceSlotId: KpSemanticSlotId;
    readonly targetSlotId: KpSemanticSlotId;
    readonly copiedFromEntityId: KpSemanticEntityId;
    readonly copiedFromVersionId: KpSemanticEntityVersion<KpPersistentSemanticValue>["id"];
    readonly replacedEntityId: KpSemanticEntityId;
    readonly newEntityId: KpSemanticEntityId;
    readonly newVersionId: KpSemanticEntityVersion<KpPersistentSemanticValue>["id"];
  }
  | {
    readonly kind: "introduce";
    readonly sourceId: string;
    readonly slotId: KpSemanticSlotId;
    readonly previousAbsenceReason: KpSemanticSlotAbsenceReason;
    readonly newEntityId: KpSemanticEntityId;
    readonly newVersionId: KpSemanticEntityVersion<KpPersistentSemanticValue>["id"];
  }
  | {
    readonly kind: "remove";
    readonly sourceId: string;
    readonly slotId: KpSemanticSlotId;
    readonly removedEntityId: KpSemanticEntityId;
    readonly removedVersionId: KpSemanticEntityVersion<KpPersistentSemanticValue>["id"];
    readonly absenceReason: "removed";
  }
  | {
    readonly kind: "derive";
    readonly sourceId: string;
    readonly slotId: KpSemanticSlotId;
  };

export interface KpSemanticTransactionJournalEntry {
  readonly sequence: number;
  readonly writeId: string;
  readonly operation: KpSemanticTransactionJournalOperation;
  readonly replacedEntityIds: readonly KpSemanticEntityId[];
  readonly addedEntityIds: readonly KpSemanticEntityId[];
  readonly reboundSlotIds: readonly KpSemanticSlotId[];
  readonly absentSlotIds: readonly KpSemanticSlotId[];
}

export interface KpSemanticTransactionCommit {
  readonly schemaVersion: "kp.semantic-transaction-commit.v1";
  readonly kind: "semantic-transaction-commit";
  readonly transactionId: string;
  readonly transformationId: KpAppliedTransformationId;
  readonly before: KpAggregateSemanticSnapshot;
  readonly after: KpAggregateSemanticSnapshot;
  readonly journal: readonly KpSemanticTransactionJournalEntry[];
}

export type KpSemanticTransactionErrorCode =
  | "foreign-scope"
  | "scope-expired"
  | "no-staged-writes"
  | "duplicate-write"
  | "reentrant-operation"
  | "nondeterministic-update"
  | "invalid-bind"
  | "invalid-copy"
  | "invalid-introduction"
  | "invalid-removal"
  | "invalid-derivation"
  | "required-slot-removal";

export class KpSemanticTransactionError extends Error {
  readonly code: KpSemanticTransactionErrorCode;

  constructor(code: KpSemanticTransactionErrorCode, message: string) {
    super(message);
    this.name = "KpSemanticTransactionError";
    this.code = code;
  }
}

export class KpSemanticTransaction {
  readonly schemaVersion = "kp.semantic-transaction.v1" as const;
  readonly kind = "semantic-transaction" as const;
  readonly transactionId: string;
  readonly transformationId: KpAppliedTransformationId;
  readonly beforeSnapshotId: KpAggregateSemanticSnapshot["id"];
  readonly scope: KpSemanticTransactionScope;

  #identities: KpSemanticStateIdentityScope;
  #before: KpAggregateSemanticSnapshot;
  #working: KpAggregateSemanticSnapshot;
  #journal: KpSemanticTransactionJournalEntry[] = [];
  #writeIds = new Set<string>();
  #status: "open" | "committed" | "aborted" = "open";
  #evaluatingUpdate = false;

  constructor(
    authority: typeof kpSemanticTransactionConstructorAuthority,
    input: {
      readonly identities: KpSemanticStateIdentityScope;
      readonly before: KpAggregateSemanticSnapshot;
      readonly transformationId: KpAppliedTransformationId;
    }
  ) {
    if (authority !== kpSemanticTransactionConstructorAuthority) {
      throw new Error("Semantic transactions must begin through their factory.");
    }
    if (input.identities.namespace !== input.before.namespace) {
      throw new Error("Semantic transaction and snapshot scopes must match.");
    }
    const afterId = input.identities.successorSnapshot(input.transformationId);
    if (afterId === input.before.id) {
      throw new Error(
        "Semantic transaction transformation is already committed at the starting snapshot."
      );
    }

    this.transactionId = `${input.transformationId}/transaction`;
    this.transformationId = input.transformationId;
    this.beforeSnapshotId = input.before.id;
    this.scope = Object.freeze({
      transactionId: this.transactionId
    }) as KpSemanticTransactionScope;
    this.#identities = input.identities;
    this.#before = input.before;
    this.#working = input.before;
    Object.freeze(this);
  }

  read(
    scope: KpSemanticTransactionScope,
    slotId: KpSemanticSlotId
  ): KpSemanticTransactionRead {
    this.#assertOpenScope(scope);
    const binding = readKpSemanticSlotBinding(this.#working, slotId);
    const store = readKpSnapshotEntityStore(this.#working, binding.entityId);
    return Object.freeze({
      binding,
      version: readKpSemanticEntityVersion(store, binding.versionId)
    });
  }

  stage(
    scope: KpSemanticTransactionScope,
    write: KpSemanticTransactionStagedWrite
  ): void {
    this.#assertOpenScope(scope);
    this.#stage(write, Object.freeze({ kind: "staged-write" }));
  }

  update(
    scope: KpSemanticTransactionScope,
    input: KpSemanticTransactionUpdateInput
  ): void {
    this.#assertOpenScope(scope);
    requireWriteId(input.id);
    requireWriteId(input.sourceId);
    requireWriteId(input.revisionId);
    this.#assertWritableSlot(input.slotId);

    const previousBinding = readKpSemanticSlotBinding(
      this.#working,
      input.slotId
    );
    const previousStore = readKpSnapshotEntityStore(
      this.#working,
      previousBinding.entityId
    );
    const previousVersion = readKpSemanticEntityVersion(
      previousStore,
      previousBinding.versionId
    );

    this.#evaluatingUpdate = true;
    let firstResult: KpPersistentSemanticValue;
    let secondResult: KpPersistentSemanticValue;
    try {
      firstResult = input.update(previousVersion.value);
      secondResult = input.update(previousVersion.value);
    } finally {
      this.#evaluatingUpdate = false;
    }

    const firstSuccessor = appendKpSemanticEntityVersion(previousStore, {
      value: firstResult,
      transformationId: this.transformationId,
      revisionId: input.revisionId
    });
    const secondSuccessor = appendKpSemanticEntityVersion(previousStore, {
      value: secondResult,
      transformationId: this.transformationId,
      revisionId: input.revisionId
    });
    const firstValue = readKpSemanticEntityVersion(
      firstSuccessor,
      firstSuccessor.latestVersionId
    ).value;
    const secondValue = readKpSemanticEntityVersion(
      secondSuccessor,
      secondSuccessor.latestVersionId
    ).value;
    if (!arePersistentValuesEqual(firstValue, secondValue)) {
      throw new KpSemanticTransactionError(
        "nondeterministic-update",
        `Semantic update ${input.id} produced different results for the same pinned previous value.`
      );
    }

    // Every role already sharing this entity advances together. This makes
    // entity identity, rather than the slot used to address it, authoritative.
    const slotRebindings = this.#working.bindings
      .filter(({ entityId }) => entityId === previousBinding.entityId)
      .map(({ slotId, entityId }) => Object.freeze({
        slotId,
        entityId,
        versionId: firstSuccessor.latestVersionId
      }));
    this.#stage({
      id: input.id,
      entityStoreReplacements: [{
        entityId: firstSuccessor.entityId,
        store: firstSuccessor
      }],
      slotRebindings
    }, Object.freeze({
      kind: "update",
      sourceId: input.sourceId,
      revisionId: input.revisionId,
      slotId: input.slotId,
      previousVersionId: previousVersion.id,
      nextVersionId: firstSuccessor.latestVersionId
    }));
  }

  bind(
    scope: KpSemanticTransactionScope,
    input: KpSemanticTransactionBindInput
  ): void {
    this.#assertOpenScope(scope);
    requireWriteId(input.id);
    requireWriteId(input.sourceId);
    this.#assertWritableSlot(input.targetSlotId);
    if (input.sourceSlotId === input.targetSlotId) {
      throw new KpSemanticTransactionError(
        "invalid-bind",
        `Semantic bind ${input.id} requires distinct source and target roles.`
      );
    }

    const source = readKpSemanticSlotBinding(
      this.#working,
      input.sourceSlotId
    );
    const replaced = readKpSemanticSlotBinding(
      this.#working,
      input.targetSlotId
    );
    if (source.entityId === replaced.entityId) {
      throw new KpSemanticTransactionError(
        "invalid-bind",
        `Semantic bind ${input.id} cannot rebind roles that already share entity ${source.entityId}.`
      );
    }

    this.#stage({
      id: input.id,
      entityStoreReplacements: [],
      slotRebindings: [{
        slotId: input.targetSlotId,
        entityId: source.entityId,
        versionId: source.versionId
      }]
    }, Object.freeze({
      kind: "bind",
      sourceId: input.sourceId,
      sourceSlotId: input.sourceSlotId,
      targetSlotId: input.targetSlotId,
      sourceEntityId: source.entityId,
      replacedEntityId: replaced.entityId,
      versionId: source.versionId
    }));
  }

  bindCopy(
    scope: KpSemanticTransactionScope,
    input: KpSemanticTransactionBindCopyInput
  ): void {
    this.#assertOpenScope(scope);
    requireWriteId(input.id);
    requireWriteId(input.sourceId);
    this.#assertWritableSlot(input.targetSlotId);
    if (input.sourceSlotId === input.targetSlotId) {
      throw new KpSemanticTransactionError(
        "invalid-copy",
        `Semantic copy ${input.id} requires distinct source and target roles.`
      );
    }
    if (this.#working.entityIndex[input.newEntityId] !== undefined) {
      throw new KpSemanticTransactionError(
        "invalid-copy",
        `Semantic copy ${input.id} requires a new entity identity, but ${input.newEntityId} is already materialized.`
      );
    }

    const sourceBinding = readKpSemanticSlotBinding(
      this.#working,
      input.sourceSlotId
    );
    const targetBinding = readKpSemanticSlotBinding(
      this.#working,
      input.targetSlotId
    );
    const sourceStore = readKpSnapshotEntityStore(
      this.#working,
      sourceBinding.entityId
    );
    const sourceVersion = readKpSemanticEntityVersion(
      sourceStore,
      sourceBinding.versionId
    );
    const copiedStore = createKpCopiedSemanticEntityVersionStore({
      identities: this.#identities,
      entityId: input.newEntityId,
      copiedFrom: sourceVersion,
      transformationId: this.transformationId,
      sourceId: input.sourceId
    });

    this.#stage({
      id: input.id,
      entityStoreReplacements: [],
      entityStoreAdditions: [copiedStore],
      slotRebindings: [{
        slotId: input.targetSlotId,
        entityId: copiedStore.entityId,
        versionId: copiedStore.latestVersionId
      }]
    }, Object.freeze({
      kind: "bind-copy",
      sourceId: input.sourceId,
      sourceSlotId: input.sourceSlotId,
      targetSlotId: input.targetSlotId,
      copiedFromEntityId: sourceVersion.entityId,
      copiedFromVersionId: sourceVersion.id,
      replacedEntityId: targetBinding.entityId,
      newEntityId: copiedStore.entityId,
      newVersionId: copiedStore.latestVersionId
    }));
  }

  introduce(
    scope: KpSemanticTransactionScope,
    input: KpSemanticTransactionIntroduceInput
  ): void {
    this.#assertOpenScope(scope);
    requireWriteId(input.id);
    requireWriteId(input.sourceId);
    this.#assertWritableSlot(input.slotId);
    const absenceOrdinal = this.#working.absenceIndex[input.slotId];
    const absence = absenceOrdinal === undefined
      ? undefined
      : this.#working.absences[absenceOrdinal];
    if (absence === undefined || absence.slotId !== input.slotId) {
      throw new KpSemanticTransactionError(
        "invalid-introduction",
        `Semantic introduction ${input.id} requires an explicitly absent optional role.`
      );
    }
    if (this.#working.entityIndex[input.newEntityId] !== undefined) {
      throw new KpSemanticTransactionError(
        "invalid-introduction",
        `Semantic introduction ${input.id} requires a new entity identity, but ${input.newEntityId} is already materialized.`
      );
    }
    const store = createKpSemanticEntityVersionStore({
      identities: this.#identities,
      entityId: input.newEntityId,
      value: input.value,
      sourceId: input.sourceId
    });

    this.#stage({
      id: input.id,
      entityStoreReplacements: [],
      entityStoreAdditions: [store],
      slotRebindings: [{
        slotId: input.slotId,
        entityId: store.entityId,
        versionId: store.latestVersionId
      }]
    }, Object.freeze({
      kind: "introduce",
      sourceId: input.sourceId,
      slotId: input.slotId,
      previousAbsenceReason: absence.reason,
      newEntityId: store.entityId,
      newVersionId: store.latestVersionId
    }));
  }

  remove(
    scope: KpSemanticTransactionScope,
    input: KpSemanticTransactionRemoveInput
  ): void {
    this.#assertOpenScope(scope);
    requireWriteId(input.id);
    requireWriteId(input.sourceId);
    this.#assertWritableSlot(input.slotId);
    if (this.#working.requiredSlotIds.includes(input.slotId)) {
      throw new KpSemanticTransactionError(
        "required-slot-removal",
        `Semantic removal ${input.id} cannot remove required role ${input.slotId}.`
      );
    }
    if (!this.#working.optionalSlotIds.includes(input.slotId)) {
      throw new KpSemanticTransactionError(
        "invalid-removal",
        `Semantic removal ${input.id} requires a declared optional role.`
      );
    }
    if (this.#working.absenceIndex[input.slotId] !== undefined) {
      const absence = readKpSemanticSlotAbsence(this.#working, input.slotId);
      throw new KpSemanticTransactionError(
        "invalid-removal",
        `Semantic removal ${input.id} cannot remove an already absent role (${absence.reason}).`
      );
    }
    const binding = readKpSemanticSlotBinding(this.#working, input.slotId);
    const absence = createKpSemanticSlotAbsence({
      slotId: input.slotId,
      reason: "removed",
      sourceId: input.sourceId
    });

    this.#stage({
      id: input.id,
      entityStoreReplacements: [],
      slotRebindings: [],
      slotAbsenceReplacements: [absence]
    }, Object.freeze({
      kind: "remove",
      sourceId: input.sourceId,
      slotId: input.slotId,
      removedEntityId: binding.entityId,
      removedVersionId: binding.versionId,
      absenceReason: "removed"
    }));
  }

  derive(
    scope: KpSemanticTransactionScope,
    input: KpSemanticTransactionDeriveInput
  ): void {
    this.#assertOpenScope(scope);
    requireWriteId(input.id);
    requireWriteId(input.sourceId);
    const slotId = input.declaration.slotId;
    if (!this.#working.requiredSlotIds.includes(slotId) &&
        !this.#working.optionalSlotIds.includes(slotId)) {
      throw new KpSemanticTransactionError(
        "invalid-derivation",
        `Semantic derivation ${input.id} targets undeclared slot ${slotId}.`
      );
    }
    this.#stage({
      id: input.id,
      entityStoreReplacements: [],
      slotRebindings: [],
      derivedBindingReplacements: [input.declaration]
    }, Object.freeze({
      kind: "derive",
      sourceId: input.sourceId,
      slotId
    }));
  }

  #stage(
    write: KpSemanticTransactionStagedWrite,
    operation: KpSemanticTransactionJournalOperation
  ): void {
    requireWriteId(write.id);
    for (const { slotId } of write.slotRebindings) {
      this.#assertWritableSlot(slotId);
    }
    for (const { slotId } of write.slotAbsenceReplacements ?? []) {
      this.#assertWritableSlot(slotId);
    }
    if (this.#writeIds.has(write.id)) {
      throw new KpSemanticTransactionError(
        "duplicate-write",
        `Semantic transaction ${this.transactionId} repeats staged write ${write.id}.`
      );
    }

    // Construct before mutating local session state so a failed validation
    // leaves both read-your-writes state and the diagnostic journal unchanged.
    const next = createKpSuccessorAggregateSemanticSnapshot({
      identities: this.#identities,
      parent: this.#working,
      transformationId: this.transformationId,
      entityStoreReplacements: write.entityStoreReplacements,
      entityStoreAdditions: write.entityStoreAdditions ?? [],
      slotRebindings: write.slotRebindings,
      slotAbsenceReplacements: write.slotAbsenceReplacements ?? [],
      derivedBindingReplacements: write.derivedBindingReplacements ?? []
    });
    const entry = Object.freeze({
      sequence: this.#journal.length,
      writeId: write.id,
      operation,
      replacedEntityIds: Object.freeze(
        write.entityStoreReplacements.map(({ entityId }) => entityId)
      ),
      addedEntityIds: Object.freeze(
        (write.entityStoreAdditions ?? []).map(({ entityId }) => entityId)
      ),
      reboundSlotIds: Object.freeze(
        write.slotRebindings.map(({ slotId }) => slotId)
      ),
      absentSlotIds: Object.freeze(
        (write.slotAbsenceReplacements ?? []).map(({ slotId }) => slotId)
      )
    });

    this.#working = next;
    this.#journal.push(entry);
    this.#writeIds.add(write.id);
  }

  commit(scope: KpSemanticTransactionScope): KpSemanticTransactionCommit {
    this.#assertOpenScope(scope);
    if (this.#journal.length === 0) {
      throw new KpSemanticTransactionError(
        "no-staged-writes",
        `Semantic transaction ${this.transactionId} has no staged writes.`
      );
    }
    const result = Object.freeze({
      schemaVersion: "kp.semantic-transaction-commit.v1" as const,
      kind: "semantic-transaction-commit" as const,
      transactionId: this.transactionId,
      transformationId: this.transformationId,
      before: this.#before,
      after: this.#working,
      journal: Object.freeze([...this.#journal])
    });
    this.#status = "committed";
    return result;
  }

  abort(scope: KpSemanticTransactionScope): void {
    this.#assertOpenScope(scope);
    this.#status = "aborted";
    this.#journal = [];
    this.#writeIds.clear();
    this.#working = this.#before;
  }

  #assertOpenScope(scope: KpSemanticTransactionScope): void {
    if (this.#evaluatingUpdate) {
      throw new KpSemanticTransactionError(
        "reentrant-operation",
        `Semantic transaction ${this.transactionId} cannot be used from inside an update callback.`
      );
    }
    if (scope !== this.scope) {
      throw new KpSemanticTransactionError(
        "foreign-scope",
        `Semantic transaction ${this.transactionId} rejected a foreign scope token.`
      );
    }
    if (this.#status !== "open") {
      throw new KpSemanticTransactionError(
        "scope-expired",
        `Semantic transaction ${this.transactionId} scope expired after ${this.#status}.`
      );
    }
  }

  #assertWritableSlot(slotId: KpSemanticSlotId): void {
    const ordinal = this.#working.derivedBindingIndex[slotId];
    const declaration = ordinal === undefined
      ? undefined
      : this.#working.derivedBindings[ordinal];
    if (declaration !== undefined && declaration.slotId === slotId) {
      unsupportedKpSemanticDerivedWrite(declaration);
    }
  }
}

export function beginKpSemanticTransaction(input: {
  readonly identities: KpSemanticStateIdentityScope;
  readonly before: KpAggregateSemanticSnapshot;
  readonly transformationId: KpAppliedTransformationId;
}): KpSemanticTransaction {
  return new KpSemanticTransaction(kpSemanticTransactionConstructorAuthority, input);
}

function requireWriteId(value: string): void {
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u.test(value)) {
    throw new Error(
      `Semantic transaction write id ${JSON.stringify(value)} must be lowercase and scoped.`
    );
  }
}

function arePersistentValuesEqual(
  left: KpPersistentSemanticValue,
  right: KpPersistentSemanticValue
): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (left === null || right === null ||
      typeof left !== "object" || typeof right !== "object") {
    return false;
  }
  const leftIsArray = Array.isArray(left);
  if (leftIsArray !== Array.isArray(right)) {
    return false;
  }
  if (leftIsArray) {
    const leftItems = left as readonly KpPersistentSemanticValue[];
    const rightItems = right as readonly KpPersistentSemanticValue[];
    return leftItems.length === rightItems.length && leftItems.every(
      (item, index) => arePersistentValuesEqual(item, rightItems[index]!)
    );
  }

  const leftRecord = left as Readonly<Record<string, KpPersistentSemanticValue>>;
  const rightRecord = right as Readonly<Record<string, KpPersistentSemanticValue>>;
  const leftKeys = Object.getOwnPropertyNames(leftRecord).sort();
  const rightKeys = Object.getOwnPropertyNames(rightRecord).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every(
    (key, index) => key === rightKeys[index] &&
      arePersistentValuesEqual(leftRecord[key]!, rightRecord[key]!)
  );
}
