import {
  readKpSemanticSlotBinding,
  readKpSnapshotEntityStore,
  type KpAggregateSemanticSnapshot
} from "./aggregate-snapshot.ts";
import type {
  KpSemanticDerivedGraph,
  KpSemanticDerivedGraphLeafReference
} from "./derived-graph.ts";
import {
  readKpSemanticEntityVersion,
  type KpPersistentSemanticValue
} from "./entity-version-store.ts";
import type {
  KpAggregateSnapshotId,
  KpSemanticEntityId,
  KpSemanticSlotId,
  KpSemanticVersionId
} from "./identity.ts";

export interface KpResolvedSemanticConcreteDependency {
  readonly schemaVersion: "kp.resolved-semantic-concrete-dependency.v1";
  readonly kind: "resolved-semantic-concrete-dependency";
  readonly snapshotId: KpAggregateSnapshotId;
  readonly slotId: KpSemanticSlotId;
  readonly entityId: KpSemanticEntityId;
  readonly versionId: KpSemanticVersionId;
  readonly value: KpPersistentSemanticValue;
}

export type KpSemanticDerivedEvaluationErrorCode =
  | "derived-dependency-not-concrete"
  | "foreign-derived-dependency"
  | "foreign-derived-snapshot";

export class KpSemanticDerivedEvaluationError extends Error {
  readonly code: KpSemanticDerivedEvaluationErrorCode;
  readonly slotId: KpSemanticSlotId;
  readonly snapshotId: KpAggregateSnapshotId;

  constructor(input: {
    readonly code: KpSemanticDerivedEvaluationErrorCode;
    readonly slotId: KpSemanticSlotId;
    readonly snapshotId: KpAggregateSnapshotId;
    readonly message: string;
  }) {
    super(input.message);
    this.name = "KpSemanticDerivedEvaluationError";
    this.code = input.code;
    this.slotId = input.slotId;
    this.snapshotId = input.snapshotId;
  }
}

export function resolveKpSemanticConcreteDependency(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly dependency: KpSemanticDerivedGraphLeafReference;
}): KpResolvedSemanticConcreteDependency {
  if (input.snapshot.namespace !== input.graph.namespace) {
    throw new KpSemanticDerivedEvaluationError({
      code: "foreign-derived-snapshot",
      slotId: input.dependency.slotId,
      snapshotId: input.snapshot.id,
      message: `Derived graph ${JSON.stringify(input.graph.namespace)} cannot resolve dependency ${JSON.stringify(input.dependency.slotId)} from snapshot ${JSON.stringify(input.snapshot.id)} in ${JSON.stringify(input.snapshot.namespace)}.`
    });
  }
  const slotPrefix = `kp-state/${input.graph.namespace}/slot/`;
  if (input.dependency.path === null ||
      !input.dependency.slotId.startsWith(slotPrefix)) {
    throw new KpSemanticDerivedEvaluationError({
      code: "foreign-derived-dependency",
      slotId: input.dependency.slotId,
      snapshotId: input.snapshot.id,
      message: `Dependency ${JSON.stringify(input.dependency.slotId)} is outside derived graph ${JSON.stringify(input.graph.namespace)}.`
    });
  }
  if (input.dependency.descriptorKind === "derived-value") {
    throw new KpSemanticDerivedEvaluationError({
      code: "derived-dependency-not-concrete",
      slotId: input.dependency.slotId,
      snapshotId: input.snapshot.id,
      message: `Dependency ${JSON.stringify(input.dependency.path)} is derived and requires graph evaluation instead of concrete resolution.`
    });
  }

  const binding = readKpSemanticSlotBinding(
    input.snapshot,
    input.dependency.slotId
  );
  const store = readKpSnapshotEntityStore(input.snapshot, binding.entityId);
  const version = readKpSemanticEntityVersion(store, binding.versionId);
  return Object.freeze({
    schemaVersion: "kp.resolved-semantic-concrete-dependency.v1",
    kind: "resolved-semantic-concrete-dependency",
    snapshotId: input.snapshot.id,
    slotId: input.dependency.slotId,
    entityId: binding.entityId,
    versionId: binding.versionId,
    value: version.value
  });
}
