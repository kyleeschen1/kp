import {
  createKpSemanticChangeSet,
  type KpSemanticChangeEndpoint,
  type KpSemanticChangeRecord,
  type KpSemanticChangeSet
} from "../semantic-state/change-set.ts";
import type {
  KpAggregateSemanticSnapshot,
  KpSemanticSlotBinding
} from "../semantic-state/aggregate-snapshot.ts";
import type {
  KpSemanticEntityId,
  KpSemanticSlotId
} from "../semantic-state/identity.ts";
import { pinKpSemanticSlotVersion } from
  "../semantic-state/pinned-recovery.ts";
import type {
  KpSemanticTransactionCommit,
  KpSemanticTransactionJournalOperation
} from "../semantic-state/transaction.ts";
import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap,
  type CorrespondenceMap,
  type SelectorCorrespondenceRecord
} from "./correspondence.ts";
import {
  createKpSemanticDisplayFragment,
  createKpSemanticEntity,
  createKpSemanticEntityRegistry,
  type KpSemanticEntityProvenance,
  type KpSemanticEntityRegistry
} from "./semantic-entity-provenance.ts";
import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageEdge,
  type KpSemanticLineageGraph
} from "./semantic-lineage-graph.ts";

export interface KpSemanticStateEntityDescriptor {
  readonly entityId: KpSemanticEntityId;
  readonly semanticKind: string;
  readonly label: string;
  readonly provenance?: KpSemanticEntityProvenance;
}

export interface KpSemanticStateAuthorityProjection {
  readonly schemaVersion: "kp.semantic-state-authority-projection.v1";
  readonly kind: "semantic-state-authority-projection";
  readonly transactionId: string;
  readonly changeSet: KpSemanticChangeSet;
  readonly sourceRegistry: KpSemanticEntityRegistry;
  readonly targetRegistry: KpSemanticEntityRegistry;
  readonly correspondenceMap: CorrespondenceMap;
  readonly lineageGraph: KpSemanticLineageGraph;
}

export type KpSemanticStateAuthorityProjectionErrorCode =
  | "unsupported-staged-write"
  | "missing-explicit-operation"
  | "ambiguous-slot-history"
  | "missing-entity-descriptor"
  | "unsupported-composition"
  | "invalid-authority-projection";

export class KpSemanticStateAuthorityProjectionError extends Error {
  readonly code: KpSemanticStateAuthorityProjectionErrorCode;

  constructor(
    code: KpSemanticStateAuthorityProjectionErrorCode,
    message: string
  ) {
    super(message);
    this.name = "KpSemanticStateAuthorityProjectionError";
    this.code = code;
  }
}

type BindOperation = Extract<
  KpSemanticTransactionJournalOperation,
  { readonly kind: "bind" }
>;
type CopyOperation = Extract<
  KpSemanticTransactionJournalOperation,
  { readonly kind: "bind-copy" }
>;
type IntroduceOperation = Extract<
  KpSemanticTransactionJournalOperation,
  { readonly kind: "introduce" }
>;
type RemoveOperation = Extract<
  KpSemanticTransactionJournalOperation,
  { readonly kind: "remove" }
>;

export function projectKpSemanticTransactionToExistingAuthority(input: {
  readonly commit: KpSemanticTransactionCommit;
  readonly entityDescriptors: readonly KpSemanticStateEntityDescriptor[];
}): KpSemanticStateAuthorityProjection {
  rejectOpaqueWrites(input.commit);
  const descriptors = indexDescriptors(input.entityDescriptors);
  const changeSet = projectChangeSet(input.commit);
  const sourceRegistry = projectRegistry(
    input.commit,
    input.commit.before,
    descriptors,
    "source"
  );
  const targetRegistry = projectRegistry(
    input.commit,
    input.commit.after,
    descriptors,
    "target"
  );
  const correspondenceMap = projectCorrespondence(input.commit, changeSet);
  const lineageGraph = projectLineage(input.commit);

  return Object.freeze({
    schemaVersion: "kp.semantic-state-authority-projection.v1",
    kind: "semantic-state-authority-projection",
    transactionId: input.commit.transactionId,
    changeSet,
    sourceRegistry,
    targetRegistry,
    correspondenceMap,
    lineageGraph
  });
}

function projectChangeSet(
  commit: KpSemanticTransactionCommit
): KpSemanticChangeSet {
  const beforeBindings = indexBindings(commit.before.bindings);
  const afterBindings = indexBindings(commit.after.bindings);
  const records: KpSemanticChangeRecord[] = [];
  const slots = [
    ...commit.before.requiredSlotIds,
    ...commit.before.optionalSlotIds
  ];

  for (const slotId of slots) {
    const before = beforeBindings.get(slotId);
    const after = afterBindings.get(slotId);
    if (before === undefined && after === undefined) {
      continue;
    }
    if (before !== undefined && after === undefined) {
      requireSingleSlotOperation(commit, "remove", slotId);
      records.push({
        kind: "removed",
        id: changeRecordId("removed", slotId),
        source: endpoint(commit.before, slotId)
      });
      continue;
    }
    if (before === undefined && after !== undefined) {
      requireSingleSlotOperation(commit, "introduce", slotId);
      records.push({
        kind: "introduced",
        id: changeRecordId("introduced", slotId),
        target: endpoint(commit.after, slotId)
      });
      continue;
    }
    if (before === undefined || after === undefined) {
      throw new KpSemanticStateAuthorityProjectionError(
        "invalid-authority-projection",
        `Semantic slot ${slotId} has an impossible projected endpoint state.`
      );
    }
    if (before.entityId === after.entityId) {
      if (before.versionId === after.versionId) {
        records.push({
          kind: "persisted",
          id: changeRecordId("persisted", slotId),
          source: endpoint(commit.before, slotId),
          target: endpoint(commit.after, slotId)
        });
      } else {
        if (!commit.journal.some((entry) =>
          entry.operation.kind === "update" &&
          entry.reboundSlotIds.includes(slotId)
        )) {
          throw missingOperation("update", slotId);
        }
        records.push({
          kind: "revised",
          id: changeRecordId("revised", slotId),
          source: endpoint(commit.before, slotId),
          target: endpoint(commit.after, slotId)
        });
      }
      continue;
    }

    const bind = optionalSingleSlotOperation(commit, "bind", slotId);
    const copy = optionalSingleSlotOperation(commit, "bind-copy", slotId);
    const introduction = optionalSingleSlotOperation(
      commit,
      "introduce",
      slotId
    );
    const identityOperations = [bind, copy, introduction].filter(
      (operation) => operation !== undefined
    );
    if (identityOperations.length !== 1) {
      throw new KpSemanticStateAuthorityProjectionError(
        identityOperations.length === 0
          ? "missing-explicit-operation"
          : "ambiguous-slot-history",
        `Semantic slot ${slotId} requires exactly one explicit bind, bind-copy, or introduce origin for its changed entity.`
      );
    }
    if (bind !== undefined) {
      records.push({
        kind: "bound",
        id: changeRecordId("bound", slotId),
        source: endpoint(commit.before, bind.sourceSlotId),
        replaced: endpoint(commit.before, slotId),
        target: endpoint(commit.after, slotId)
      });
    } else if (copy !== undefined) {
      records.push({
        kind: "copied",
        id: changeRecordId("copied", slotId),
        source: endpoint(commit.before, copy.sourceSlotId),
        replaced: endpoint(commit.before, slotId),
        target: endpoint(commit.after, slotId)
      });
    } else {
      requireSingleSlotOperation(commit, "remove", slotId);
      records.push({
        kind: "removed",
        id: changeRecordId("removed", slotId),
        source: endpoint(commit.before, slotId)
      }, {
        kind: "introduced",
        id: changeRecordId("introduced", slotId),
        target: endpoint(commit.after, slotId)
      });
    }
  }

  return createKpSemanticChangeSet({
    transformationId: commit.transformationId,
    before: commit.before,
    after: commit.after,
    records
  });
}

function projectRegistry(
  commit: KpSemanticTransactionCommit,
  snapshot: KpAggregateSemanticSnapshot,
  descriptors: ReadonlyMap<KpSemanticEntityId, KpSemanticStateEntityDescriptor>,
  side: "source" | "target"
): KpSemanticEntityRegistry {
  const entityIds = uniqueEntityIds(snapshot.bindings);
  const sourceEntityIds = new Set(uniqueEntityIds(commit.before.bindings));
  const entities = entityIds.map((entityId) => {
    const descriptor = descriptors.get(entityId);
    if (side === "source" || sourceEntityIds.has(entityId)) {
      if (descriptor?.provenance === undefined) {
        throw missingDescriptor(entityId, "including explicit provenance");
      }
      return createKpSemanticEntity({
        id: entityId,
        semanticKind: descriptor.semanticKind,
        label: descriptor.label,
        provenance: descriptor.provenance
      });
    }

    const copy = optionalSingleEntityOperation(commit, "bind-copy", entityId);
    if (copy !== undefined) {
      if (!entityIds.includes(copy.copiedFromEntityId)) {
        throw new KpSemanticStateAuthorityProjectionError(
          "unsupported-composition",
          `Copy ${entityId} cannot project through existing lineage authority after its source entity was removed.`
        );
      }
      const sourceDescriptor = descriptors.get(copy.copiedFromEntityId);
      if (sourceDescriptor === undefined) {
        throw missingDescriptor(copy.copiedFromEntityId, "for copied semantics");
      }
      return createKpSemanticEntity({
        id: entityId,
        semanticKind: descriptor?.semanticKind ?? sourceDescriptor.semanticKind,
        label: descriptor?.label ?? sourceDescriptor.label,
        provenance: {
          kind: "inferred",
          sourceEntityIds: [copy.copiedFromEntityId],
          methodId: copy.sourceId
        }
      });
    }

    const introduction = optionalSingleEntityOperation(
      commit,
      "introduce",
      entityId
    );
    if (introduction === undefined || descriptor === undefined) {
      throw missingDescriptor(entityId, "for introduced semantics");
    }
    return createKpSemanticEntity({
      id: entityId,
      semanticKind: descriptor.semanticKind,
      label: descriptor.label,
      provenance: { kind: "authored", sourceId: introduction.sourceId }
    });
  });

  const ordinals = new Map<KpSemanticEntityId, number>();
  const displayFragments = snapshot.bindings.map((binding) => {
    const ordinal = ordinals.get(binding.entityId) ?? 0;
    ordinals.set(binding.entityId, ordinal + 1);
    return createKpSemanticDisplayFragment({
      id: occurrenceId(snapshot, binding.slotId),
      semanticEntityId: binding.entityId,
      fragmentRole: ordinal === 0 ? "primary" : "copy",
      ordinal
    });
  });
  return createKpSemanticEntityRegistry({ entities, displayFragments });
}

function projectCorrespondence(
  commit: KpSemanticTransactionCommit,
  changeSet: KpSemanticChangeSet
): CorrespondenceMap {
  const targetsBySource = new Map<string, string[]>();
  const removals = new Set<string>();
  const introducedTargets = new Set<string>();
  const addTarget = (
    source: KpSemanticChangeEndpoint,
    target: KpSemanticChangeEndpoint
  ) => {
    const sourceId = occurrenceId(commit.before, source.slotId);
    const targets = targetsBySource.get(sourceId) ?? [];
    targets.push(occurrenceId(commit.after, target.slotId));
    targetsBySource.set(sourceId, targets);
  };

  for (const record of changeSet.records) {
    switch (record.kind) {
      case "persisted":
      case "revised":
        addTarget(record.source, record.target);
        break;
      case "copied":
        addTarget(record.source, record.target);
        if (record.replaced !== undefined) {
          removals.add(occurrenceId(commit.before, record.replaced.slotId));
        }
        break;
      case "bound":
        addTarget(record.source, record.target);
        removals.add(occurrenceId(commit.before, record.replaced.slotId));
        break;
      case "introduced":
        introducedTargets.add(occurrenceId(commit.after, record.target.slotId));
        break;
      case "removed":
        removals.add(occurrenceId(commit.before, record.source.slotId));
        break;
      case "derived":
        throw new KpSemanticStateAuthorityProjectionError(
          "unsupported-composition",
          "Executed derived changes are outside the declaration-only foundation."
        );
    }
  }

  const records: SelectorCorrespondenceRecord[] = [];
  const coveredTargets = new Set<string>();
  for (const binding of commit.before.bindings) {
    const sourceId = occurrenceId(commit.before, binding.slotId);
    const targetIds = targetsBySource.get(sourceId) ?? [];
    targetIds.forEach((targetId) => coveredTargets.add(targetId));
    if (targetIds.length > 0) {
      records.push({
        id: `correspondence.${records.length}`,
        relation: targetIds.length > 1
          ? "fan-out"
          : targetSlotFromOccurrence(sourceId) ===
              targetSlotFromOccurrence(targetIds[0]!)
            ? "identity"
            : "role-change",
        sourceSelectorIds: [sourceId],
        targetSelectorIds: targetIds,
        summary: targetIds.length > 1
          ? "One semantic source persists while supplying explicit bound or copied roles."
          : "The semantic source has one explicit target occurrence."
      });
    } else if (removals.has(sourceId)) {
      records.push({
        id: `correspondence.${records.length}`,
        relation: "removal",
        sourceSelectorIds: [sourceId],
        targetSelectorIds: [],
        summary: "The source role has no target occurrence."
      });
    } else {
      throw new KpSemanticStateAuthorityProjectionError(
        "invalid-authority-projection",
        `Source occurrence ${sourceId} has no correspondence lifecycle.`
      );
    }
  }
  for (const binding of commit.after.bindings) {
    const targetId = occurrenceId(commit.after, binding.slotId);
    if (!coveredTargets.has(targetId) && introducedTargets.has(targetId)) {
      coveredTargets.add(targetId);
      records.push({
        id: `correspondence.${records.length}`,
        relation: "introduction",
        sourceSelectorIds: [],
        targetSelectorIds: [targetId],
        summary: "The target role is explicitly introduced."
      });
    }
  }

  const map: CorrespondenceMap = {
    id: `${commit.transformationId}/correspondence`,
    records
  };
  const issues = [
    ...validateCorrespondenceMap(map, {
      sourceSelectorIds: commit.before.bindings.map((binding) =>
        occurrenceId(commit.before, binding.slotId)
      ),
      targetSelectorIds: commit.after.bindings.map((binding) =>
        occurrenceId(commit.after, binding.slotId)
      )
    }),
    ...checkCorrespondenceMapRewindLaw(map)
  ];
  if (issues.length > 0) {
    throw new KpSemanticStateAuthorityProjectionError(
      "invalid-authority-projection",
      issues[0]!.message
    );
  }
  return map;
}

function projectLineage(
  commit: KpSemanticTransactionCommit
): KpSemanticLineageGraph {
  const sourceEntityIds = uniqueEntityIds(commit.before.bindings);
  const targetEntityIds = uniqueEntityIds(commit.after.bindings);
  const targetSet = new Set(targetEntityIds);
  const sourceSet = new Set(sourceEntityIds);
  const edges: KpSemanticLineageEdge[] = sourceEntityIds.map((entityId) =>
    targetSet.has(entityId)
    ? {
      id: `lineage.persist.${edgesafe(entityId)}`,
      relation: "persist" as const,
      sourceEntityIds: [entityId],
      targetEntityIds: [entityId],
      summary: "The semantic entity persists across immutable snapshots."
    }
    : {
      id: `lineage.remove.${edgesafe(entityId)}`,
      relation: "removal" as const,
      sourceEntityIds: [entityId],
      targetEntityIds: [],
      summary: "The semantic entity has no active role in the target snapshot."
    }
  );

  for (const entityId of targetEntityIds) {
    if (sourceSet.has(entityId)) {
      continue;
    }
    const copy = optionalSingleEntityOperation(commit, "bind-copy", entityId);
    if (copy !== undefined) {
      if (!targetSet.has(copy.copiedFromEntityId)) {
        throw new KpSemanticStateAuthorityProjectionError(
          "unsupported-composition",
          `Copy lineage for ${entityId} cannot retire source ${copy.copiedFromEntityId} in the same authority projection.`
        );
      }
      edges.push({
        id: `lineage.copy.${edgesafe(entityId)}`,
        relation: "copy",
        sourceEntityIds: [copy.copiedFromEntityId],
        targetEntityIds: [entityId],
        summary: "A new entity is copied from an explicitly identified source entity."
      });
      continue;
    }
    const introduction = optionalSingleEntityOperation(
      commit,
      "introduce",
      entityId
    );
    if (introduction === undefined) {
      throw new KpSemanticStateAuthorityProjectionError(
        "missing-explicit-operation",
        `Target entity ${entityId} has no explicit copy or introduction origin.`
      );
    }
    edges.push({
      id: `lineage.introduce.${edgesafe(entityId)}`,
      relation: "introduction",
      sourceEntityIds: [],
      targetEntityIds: [entityId],
      summary: "A transaction explicitly introduces the semantic entity."
    });
  }

  return createKpSemanticLineageGraph({
    id: `${commit.transformationId}/lineage`,
    sourceEntityIds,
    targetEntityIds,
    edges
  });
}

function rejectOpaqueWrites(commit: KpSemanticTransactionCommit): void {
  if (commit.journal.some(({ operation }) => operation.kind === "staged-write")) {
    throw new KpSemanticStateAuthorityProjectionError(
      "unsupported-staged-write",
      "Opaque staged writes cannot manufacture semantic provenance or correspondence."
    );
  }
}

function indexDescriptors(
  descriptors: readonly KpSemanticStateEntityDescriptor[]
): ReadonlyMap<KpSemanticEntityId, KpSemanticStateEntityDescriptor> {
  const index = new Map<KpSemanticEntityId, KpSemanticStateEntityDescriptor>();
  for (const descriptor of descriptors) {
    if (index.has(descriptor.entityId)) {
      throw new KpSemanticStateAuthorityProjectionError(
        "invalid-authority-projection",
        `Semantic authority descriptors repeat entity ${descriptor.entityId}.`
      );
    }
    index.set(descriptor.entityId, descriptor);
  }
  return index;
}

function indexBindings(
  bindings: readonly KpSemanticSlotBinding[]
): ReadonlyMap<KpSemanticSlotId, KpSemanticSlotBinding> {
  return new Map(bindings.map((binding) => [binding.slotId, binding] as const));
}

function uniqueEntityIds(
  bindings: readonly KpSemanticSlotBinding[]
): KpSemanticEntityId[] {
  return [...new Set(bindings.map(({ entityId }) => entityId))];
}

function endpoint(
  snapshot: KpAggregateSemanticSnapshot,
  slotId: KpSemanticSlotId
): KpSemanticChangeEndpoint {
  return Object.freeze({
    slotId,
    reference: pinKpSemanticSlotVersion(snapshot, slotId)
  });
}

function occurrenceId(
  snapshot: KpAggregateSemanticSnapshot,
  slotId: KpSemanticSlotId
): string {
  return `${snapshot.id}/occurrence/${slotLocalId(slotId)}`;
}

function targetSlotFromOccurrence(occurrenceIdValue: string): string {
  return occurrenceIdValue.slice(occurrenceIdValue.lastIndexOf("/occurrence/") + 12);
}

function changeRecordId(kind: string, slotId: KpSemanticSlotId): string {
  return `change.${kind}.${slotLocalId(slotId)}`;
}

function slotLocalId(slotId: KpSemanticSlotId): string {
  return slotId.slice(slotId.indexOf("/slot/") + 6);
}

function edgesafe(entityId: KpSemanticEntityId): string {
  return entityId.slice(entityId.indexOf("/entity/") + 8).replaceAll("/", ".");
}

function optionalSingleSlotOperation<
  Kind extends "bind" | "bind-copy" | "introduce" | "remove"
>(
  commit: KpSemanticTransactionCommit,
  kind: Kind,
  slotId: KpSemanticSlotId
): (Kind extends "bind" ? BindOperation
  : Kind extends "bind-copy" ? CopyOperation
    : Kind extends "introduce" ? IntroduceOperation
      : RemoveOperation) | undefined {
  const matches = commit.journal.map(({ operation }) => operation).filter(
    (operation): operation is BindOperation | CopyOperation |
      IntroduceOperation | RemoveOperation => {
      if (operation.kind !== kind) {
        return false;
      }
      return operation.kind === "bind" || operation.kind === "bind-copy"
        ? operation.targetSlotId === slotId
        : operation.slotId === slotId;
    }
  );
  if (matches.length > 1) {
    throw new KpSemanticStateAuthorityProjectionError(
      "ambiguous-slot-history",
      `Semantic slot ${slotId} has more than one explicit ${kind} operation.`
    );
  }
  return matches[0] as (Kind extends "bind" ? BindOperation
    : Kind extends "bind-copy" ? CopyOperation
      : Kind extends "introduce" ? IntroduceOperation
        : RemoveOperation) | undefined;
}

function requireSingleSlotOperation<
  Kind extends "bind" | "bind-copy" | "introduce" | "remove"
>(
  commit: KpSemanticTransactionCommit,
  kind: Kind,
  slotId: KpSemanticSlotId
): NonNullable<ReturnType<typeof optionalSingleSlotOperation<Kind>>> {
  const operation = optionalSingleSlotOperation(commit, kind, slotId);
  if (operation === undefined) {
    throw missingOperation(kind, slotId);
  }
  return operation as NonNullable<ReturnType<
    typeof optionalSingleSlotOperation<Kind>
  >>;
}

function optionalSingleEntityOperation<
  Kind extends "bind-copy" | "introduce"
>(
  commit: KpSemanticTransactionCommit,
  kind: Kind,
  entityId: KpSemanticEntityId
): (Kind extends "bind-copy" ? CopyOperation : IntroduceOperation) | undefined {
  const matches = commit.journal.map(({ operation }) => operation).filter(
    (operation): operation is CopyOperation | IntroduceOperation =>
      operation.kind === kind &&
      (operation.kind === "bind-copy"
        ? operation.newEntityId === entityId
        : operation.newEntityId === entityId)
  );
  if (matches.length > 1) {
    throw new KpSemanticStateAuthorityProjectionError(
      "ambiguous-slot-history",
      `Semantic entity ${entityId} has more than one explicit ${kind} origin.`
    );
  }
  return matches[0] as (Kind extends "bind-copy"
    ? CopyOperation
    : IntroduceOperation) | undefined;
}

function missingOperation(
  kind: string,
  slotId: KpSemanticSlotId
): KpSemanticStateAuthorityProjectionError {
  return new KpSemanticStateAuthorityProjectionError(
    "missing-explicit-operation",
    `Semantic slot ${slotId} changed without an explicit ${kind} operation.`
  );
}

function missingDescriptor(
  entityId: KpSemanticEntityId,
  reason: string
): KpSemanticStateAuthorityProjectionError {
  return new KpSemanticStateAuthorityProjectionError(
    "missing-entity-descriptor",
    `Semantic entity ${entityId} requires an authored descriptor ${reason}.`
  );
}
