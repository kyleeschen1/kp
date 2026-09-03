import {
  readKpSemanticSlotBinding,
  readKpSnapshotEntityStore,
  type KpAggregateSemanticSnapshot,
  type KpSemanticSlotBinding
} from "./aggregate-snapshot.ts";
import {
  readKpSemanticEntityVersion,
  type KpPersistentSemanticValue,
  type KpSemanticEntityVersion
} from "./entity-version-store.ts";
import type {
  KpAppliedTransformationId,
  KpSemanticEntityId,
  KpSemanticSlotId,
  KpSemanticStateIdentityScope
} from "./identity.ts";
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
  readonly slotRebindings: readonly KpSemanticSlotBinding[];
}

export interface KpSemanticTransactionJournalEntry {
  readonly sequence: number;
  readonly writeId: string;
  readonly replacedEntityIds: readonly KpSemanticEntityId[];
  readonly reboundSlotIds: readonly KpSemanticSlotId[];
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
  | "duplicate-write";

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
    requireWriteId(write.id);
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
      slotRebindings: write.slotRebindings
    });
    const entry = Object.freeze({
      sequence: this.#journal.length,
      writeId: write.id,
      replacedEntityIds: Object.freeze(
        write.entityStoreReplacements.map(({ entityId }) => entityId)
      ),
      reboundSlotIds: Object.freeze(
        write.slotRebindings.map(({ slotId }) => slotId)
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
