import {
  KpSemanticSlotAccessError,
  readKpSemanticDerivedBinding,
  readKpSemanticSlotBinding,
  readKpSnapshotEntityStore,
  type KpAggregateSemanticSnapshot,
  type KpSemanticSlotBinding
} from "./aggregate-snapshot.ts";
import type {
  KpDerivedSemanticStateLeafHandle
} from "./authoring-state-handles.ts";
import {
  areKpSemanticDerivedBindingsEqual
} from "./derived-binding.ts";
import type {
  KpSemanticDerivedGraph,
  KpSemanticDerivedGraphDefinitionInput,
  KpSemanticDerivedGraphLeafReference
} from "./derived-graph.ts";
import {
  readKpSemanticEntityVersion,
  requireAndFreezeKpPersistentSemanticValue,
  type KpPersistentSemanticValue
} from "./entity-version-store.ts";
import type {
  KpAggregateSnapshotId,
  KpAppliedTransformationId,
  KpSemanticDerivationId,
  KpSemanticEntityId,
  KpSemanticSlotId,
  KpSemanticVersionId,
  KpTransformationDefinitionId
} from "./identity.ts";
import {
  encodeKpSemanticProgress,
  type KpSemanticProgressEncoding
} from "./semantic-progress.ts";
import type {
  KpEphemeralSemanticStateReadSource,
  KpPersistentSemanticStateReadSource,
  KpSemanticStateReadSource
} from "./state-family-sample-source.ts";

export interface KpResolvedSemanticConcreteDependency {
  readonly schemaVersion: "kp.resolved-semantic-concrete-dependency.v1";
  readonly kind: "resolved-semantic-concrete-dependency";
  readonly snapshotId: KpAggregateSnapshotId;
  readonly slotId: KpSemanticSlotId;
  readonly entityId: KpSemanticEntityId;
  readonly versionId: KpSemanticVersionId;
  readonly value: KpPersistentSemanticValue;
}

export interface KpSemanticTransientDependencyToken {
  readonly schemaVersion: "kp.semantic-transient-dependency-token.v1";
  readonly kind: "semantic-transient-dependency-token";
  readonly definitionId: KpTransformationDefinitionId;
  readonly transformationId: KpAppliedTransformationId;
  readonly applicationId: string;
  readonly declarationId: string;
  readonly slotId: KpSemanticSlotId;
  readonly beforeEntityId: KpSemanticEntityId;
  readonly beforeVersionId: KpSemanticVersionId;
  readonly afterEntityId: KpSemanticEntityId;
  readonly afterVersionId: KpSemanticVersionId;
  readonly progress: KpSemanticProgressEncoding;
}

export interface KpResolvedSemanticTransientDependency {
  readonly schemaVersion: "kp.resolved-semantic-transient-dependency.v1";
  readonly kind: "resolved-semantic-transient-dependency";
  readonly baseSnapshotId: KpAggregateSnapshotId;
  readonly slotId: KpSemanticSlotId;
  readonly token: KpSemanticTransientDependencyToken;
  readonly value: KpPersistentSemanticValue;
}

export type KpResolvedSemanticDependency =
  | KpResolvedSemanticConcreteDependency
  | KpResolvedSemanticTransientDependency;

export interface KpSemanticDerivedEvaluationMemo {
  read(slotId: KpSemanticSlotId): KpPersistentSemanticValue | undefined;
  write(slotId: KpSemanticSlotId, value: KpPersistentSemanticValue): void;
}

export type KpSemanticDerivedEvaluationErrorCode =
  | "derived-compute-failed"
  | "derived-dependency-absent"
  | "derived-dependency-not-concrete"
  | "derived-dependency-removed"
  | "derived-target-not-found"
  | "foreign-derived-dependency"
  | "foreign-derived-snapshot"
  | "foreign-derived-target"
  | "invalid-derived-result"
  | "stale-derived-definition";

export class KpSemanticDerivedEvaluationError extends Error {
  readonly code: KpSemanticDerivedEvaluationErrorCode;
  readonly slotId: KpSemanticSlotId;
  readonly snapshotId: KpAggregateSnapshotId;
  readonly path: readonly string[] | null;
  readonly derivationId: KpSemanticDerivationId | undefined;
  override readonly cause: unknown;

  constructor(input: {
    readonly code: KpSemanticDerivedEvaluationErrorCode;
    readonly slotId: KpSemanticSlotId;
    readonly snapshotId: KpAggregateSnapshotId;
    readonly path?: readonly string[] | null;
    readonly derivationId?: KpSemanticDerivationId;
    readonly cause?: unknown;
    readonly message: string;
  }) {
    super(input.message);
    this.name = "KpSemanticDerivedEvaluationError";
    this.code = input.code;
    this.slotId = input.slotId;
    this.snapshotId = input.snapshotId;
    this.path = input.path ?? null;
    this.derivationId = input.derivationId;
    this.cause = input.cause;
  }
}

export function resolveKpSemanticConcreteDependency(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly dependency: KpSemanticDerivedGraphLeafReference;
}): KpResolvedSemanticConcreteDependency;
export function resolveKpSemanticConcreteDependency(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly source: KpPersistentSemanticStateReadSource;
  readonly dependency: KpSemanticDerivedGraphLeafReference;
}): KpResolvedSemanticConcreteDependency;
export function resolveKpSemanticConcreteDependency(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly source: KpEphemeralSemanticStateReadSource;
  readonly dependency: KpSemanticDerivedGraphLeafReference;
}): KpResolvedSemanticDependency;
export function resolveKpSemanticConcreteDependency(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly source: KpSemanticStateReadSource;
  readonly dependency: KpSemanticDerivedGraphLeafReference;
}): KpResolvedSemanticDependency;
export function resolveKpSemanticConcreteDependency(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly dependency: KpSemanticDerivedGraphLeafReference;
} & (
  | { readonly snapshot: KpAggregateSemanticSnapshot }
  | { readonly source: KpSemanticStateReadSource }
)): KpResolvedSemanticDependency {
  const source = "source" in input ? input.source : undefined;
  const snapshot = "snapshot" in input
    ? input.snapshot
    : input.source.kind === "persistent-snapshot"
      ? input.source.snapshot
      : input.source.base.snapshot;
  const sourceNamespace = source?.namespace ?? snapshot.namespace;
  if (sourceNamespace !== input.graph.namespace ||
    snapshot.namespace !== input.graph.namespace) {
    throw new KpSemanticDerivedEvaluationError({
      code: "foreign-derived-snapshot",
      slotId: input.dependency.slotId,
      snapshotId: snapshot.id,
      message: `Derived graph ${JSON.stringify(input.graph.namespace)} cannot resolve dependency ${JSON.stringify(input.dependency.slotId)} from semantic source in ${JSON.stringify(sourceNamespace)}.`
    });
  }
  const slotPrefix = `kp-state/${input.graph.namespace}/slot/`;
  if (input.dependency.path === null ||
      !input.dependency.slotId.startsWith(slotPrefix)) {
    throw new KpSemanticDerivedEvaluationError({
      code: "foreign-derived-dependency",
      slotId: input.dependency.slotId,
      snapshotId: snapshot.id,
      message: `Dependency ${JSON.stringify(input.dependency.slotId)} is outside derived graph ${JSON.stringify(input.graph.namespace)}.`
    });
  }
  if (input.dependency.descriptorKind === "derived-value") {
    throw new KpSemanticDerivedEvaluationError({
      code: "derived-dependency-not-concrete",
      slotId: input.dependency.slotId,
      snapshotId: snapshot.id,
      message: `Dependency ${JSON.stringify(input.dependency.path)} is derived and requires graph evaluation instead of concrete resolution.`
    });
  }

  if (source?.kind === "ephemeral-driver-overlay") {
    const transient = resolveTransientDependency(source, input.dependency);
    if (transient !== undefined) return transient;
  }

  let binding: KpSemanticSlotBinding;
  try {
    binding = readKpSemanticSlotBinding(
      snapshot,
      input.dependency.slotId
    );
  } catch (cause) {
    if (cause instanceof KpSemanticSlotAccessError &&
        cause.code === "slot-absent") {
      const removed = cause.absence?.reason === "removed";
      throw new KpSemanticDerivedEvaluationError({
        code: removed
          ? "derived-dependency-removed"
          : "derived-dependency-absent",
        slotId: input.dependency.slotId,
        snapshotId: snapshot.id,
        path: input.dependency.path,
        cause,
        message: `Derived dependency ${JSON.stringify(input.dependency.path)} is ${removed ? "removed" : "not introduced"} in snapshot ${JSON.stringify(snapshot.id)}.`
      });
    }
    throw cause;
  }
  const store = readKpSnapshotEntityStore(snapshot, binding.entityId);
  const version = readKpSemanticEntityVersion(store, binding.versionId);
  return Object.freeze({
    schemaVersion: "kp.resolved-semantic-concrete-dependency.v1",
    kind: "resolved-semantic-concrete-dependency",
    snapshotId: snapshot.id,
    slotId: input.dependency.slotId,
    entityId: binding.entityId,
    versionId: binding.versionId,
    value: version.value
  });
}

function resolveTransientDependency(
  source: KpEphemeralSemanticStateReadSource,
  dependency: KpSemanticDerivedGraphLeafReference
): KpResolvedSemanticTransientDependency | undefined {
  const ordinal = source.driverIndex[dependency.slotId];
  const driver = ordinal === undefined ? undefined : source.drivers[ordinal];
  if (driver === undefined || driver.targetSlotId !== dependency.slotId) {
    return undefined;
  }
  return Object.freeze({
    schemaVersion: "kp.resolved-semantic-transient-dependency.v1",
    kind: "resolved-semantic-transient-dependency",
    baseSnapshotId: source.base.snapshot.id,
    slotId: dependency.slotId,
    token: Object.freeze({
      schemaVersion: "kp.semantic-transient-dependency-token.v1",
      kind: "semantic-transient-dependency-token",
      definitionId: source.application.definitionId,
      transformationId: source.application.transformationId,
      applicationId: source.application.applicationId,
      declarationId: driver.declarationId,
      slotId: dependency.slotId,
      beforeEntityId: driver.endpoints.before.entityId,
      beforeVersionId: driver.endpoints.before.versionId,
      afterEntityId: driver.endpoints.after.entityId,
      afterVersionId: driver.endpoints.after.versionId,
      progress: encodeKpSemanticProgress(source.progress)
    }),
    value: driver.value
  });
}

export function evaluateKpSemanticDerivedValue<const Result>(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly target: KpDerivedSemanticStateLeafHandle<Result>;
}): Result;
export function evaluateKpSemanticDerivedValue(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly target: KpDerivedSemanticStateLeafHandle<unknown>;
}): unknown {
  return evaluateKpSemanticDerivedValueWithMemo({
    ...input,
    memo: createRequestMemo()
  });
}

export function evaluateKpSemanticDerivedValueWithMemo<const Result>(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly target: KpDerivedSemanticStateLeafHandle<Result>;
  readonly memo: KpSemanticDerivedEvaluationMemo;
}): Result;
export function evaluateKpSemanticDerivedValueWithMemo(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly target: KpDerivedSemanticStateLeafHandle<unknown>;
  readonly memo: KpSemanticDerivedEvaluationMemo;
}): unknown {
  if (input.snapshot.namespace !== input.graph.namespace) {
    throw new KpSemanticDerivedEvaluationError({
      code: "foreign-derived-snapshot",
      slotId: input.target.slotId,
      snapshotId: input.snapshot.id,
      message: `Derived graph ${JSON.stringify(input.graph.namespace)} cannot evaluate snapshot ${JSON.stringify(input.snapshot.id)} in ${JSON.stringify(input.snapshot.namespace)}.`
    });
  }
  if (input.target.namespace !== input.graph.namespace) {
    throw new KpSemanticDerivedEvaluationError({
      code: "foreign-derived-target",
      slotId: input.target.slotId,
      snapshotId: input.snapshot.id,
      message: `Derived target ${JSON.stringify(input.target.path)} belongs to ${JSON.stringify(input.target.namespace)}, not graph ${JSON.stringify(input.graph.namespace)}.`
    });
  }
  const definition = readGraphDefinition(
    input.graph,
    input.snapshot,
    input.target.slotId
  );
  return evaluateGraphDefinition(
    input.graph,
    input.snapshot,
    definition,
    input.memo
  );
}

function evaluateGraphDefinition(
  graph: KpSemanticDerivedGraph,
  snapshot: KpAggregateSemanticSnapshot,
  definition: KpSemanticDerivedGraphDefinitionInput,
  memo: KpSemanticDerivedEvaluationMemo
): KpPersistentSemanticValue {
  const declared = readKpSemanticDerivedBinding(
    snapshot,
    definition.target.slotId
  );
  if (!areKpSemanticDerivedBindingsEqual(
    declared,
    definition.definition.declaration
  )) {
    throw new KpSemanticDerivedEvaluationError({
      code: "stale-derived-definition",
      slotId: definition.target.slotId,
      snapshotId: snapshot.id,
      message: `Derived definition ${JSON.stringify(definition.id)} does not match snapshot ${JSON.stringify(snapshot.id)} authority for ${JSON.stringify(definition.target.path)}.`
    });
  }
  const previous = memo.read(definition.target.slotId);
  if (previous !== undefined) return previous;
  const values: readonly unknown[] = Object.freeze(
    definition.dependencies.map(({ dependency }): unknown =>
      dependency.descriptorKind === "derived-value"
        ? evaluateGraphDefinition(
            graph,
            snapshot,
            readGraphDefinition(graph, snapshot, dependency.slotId),
            memo
          )
        : resolveKpSemanticConcreteDependency({
            graph,
            snapshot,
            dependency
          }).value
    )
  );
  const capability = requireComputeCapability(definition, snapshot);

  // Graph validation proves the existential callback matches its declared
  // dependency tuple; Reflect.apply keeps that erasure inside this boundary.
  let computed: unknown;
  try {
    computed = Reflect.apply(capability.compute, undefined, [values]);
  } catch (cause) {
    throw new KpSemanticDerivedEvaluationError({
      code: "derived-compute-failed",
      slotId: definition.target.slotId,
      snapshotId: snapshot.id,
      path: definition.target.path,
      derivationId: definition.id,
      cause,
      message: `Compute failed for derived path ${JSON.stringify(definition.target.path)} in snapshot ${JSON.stringify(snapshot.id)}.`
    });
  }
  let value: KpPersistentSemanticValue;
  try {
    value = requireAndFreezeKpPersistentSemanticValue(computed);
  } catch (cause) {
    throw new KpSemanticDerivedEvaluationError({
      code: "invalid-derived-result",
      slotId: definition.target.slotId,
      snapshotId: snapshot.id,
      path: definition.target.path,
      derivationId: definition.id,
      cause,
      message: `Compute returned a non-persistent value for derived path ${JSON.stringify(definition.target.path)} in snapshot ${JSON.stringify(snapshot.id)}.`
    });
  }
  // Memo lifetime is explicit: ordinary reads use a request-local table while
  // caller caches map each slot to its already validated fingerprint.
  memo.write(definition.target.slotId, value);
  return value;
}

function createRequestMemo(): KpSemanticDerivedEvaluationMemo {
  const values = new Map<KpSemanticSlotId, KpPersistentSemanticValue>();
  return Object.freeze({
    read(slotId: KpSemanticSlotId) {
      return values.get(slotId);
    },
    write(slotId: KpSemanticSlotId, value: KpPersistentSemanticValue) {
      values.set(slotId, value);
    }
  });
}

function readGraphDefinition(
  graph: KpSemanticDerivedGraph,
  snapshot: KpAggregateSemanticSnapshot,
  slotId: KpSemanticSlotId
): KpSemanticDerivedGraphDefinitionInput {
  const index = graph.evaluationIndex[slotId];
  const definition = index === undefined
    ? undefined
    : graph.evaluationOrder[index];
  if (definition === undefined || definition.target.slotId !== slotId) {
    throw new KpSemanticDerivedEvaluationError({
      code: "derived-target-not-found",
      slotId,
      snapshotId: snapshot.id,
      message: `Derived graph ${JSON.stringify(graph.namespace)} has no evaluated definition for ${JSON.stringify(slotId)}.`
    });
  }
  return definition;
}

interface KpUnknownSemanticComputeCapability {
  compute(values: never): unknown;
}

function requireComputeCapability(
  definition: KpSemanticDerivedGraphDefinitionInput,
  snapshot: KpAggregateSemanticSnapshot
): KpUnknownSemanticComputeCapability {
  const candidate: unknown = definition.definition;
  if (hasComputeCapability(candidate)) {
    return candidate;
  }
  throw new KpSemanticDerivedEvaluationError({
    code: "derived-target-not-found",
    slotId: definition.target.slotId,
    snapshotId: snapshot.id,
    message: `Derived graph definition ${JSON.stringify(definition.id)} has no compute capability.`
  });
}

function hasComputeCapability(
  value: unknown
): value is KpUnknownSemanticComputeCapability {
  return isRecord(value) && typeof value["compute"] === "function";
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object";
}
