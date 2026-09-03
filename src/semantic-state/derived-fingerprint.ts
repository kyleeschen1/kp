import {
  readKpSemanticDerivedBinding,
  type KpAggregateSemanticSnapshot
} from "./aggregate-snapshot.ts";
import type {
  KpDerivedSemanticStateLeafHandle
} from "./authoring-state-handles.ts";
import { areKpSemanticDerivedBindingsEqual } from "./derived-binding.ts";
import {
  KpSemanticDerivedEvaluationError,
  resolveKpSemanticConcreteDependency,
  type KpSemanticTransientDependencyToken
} from "./derived-evaluator.ts";
import type {
  KpSemanticDerivedGraph,
  KpSemanticDerivedGraphDefinitionInput,
  KpSemanticDerivedGraphLeafReference
} from "./derived-graph.ts";
import type {
  KpSemanticDerivationId,
  KpSemanticEntityId,
  KpSemanticSlotId,
  KpSemanticVersionId
} from "./identity.ts";
import type { KpSemanticStateReadSource } from
  "./state-family-sample-source.ts";

export interface KpSemanticConcreteDependencyToken {
  readonly schemaVersion: "kp.semantic-concrete-dependency-token.v1";
  readonly kind: "semantic-concrete-dependency-token";
  readonly slotId: KpSemanticSlotId;
  readonly entityId: KpSemanticEntityId;
  readonly versionId: KpSemanticVersionId;
  readonly key: string;
}

export interface KpSemanticConcreteDerivationFingerprint {
  readonly schemaVersion: "kp.semantic-concrete-derivation-fingerprint.v1";
  readonly kind: "semantic-concrete-derivation-fingerprint";
  readonly derivationId: KpSemanticDerivationId;
  readonly targetSlotId: KpSemanticSlotId;
  readonly dependencies: readonly KpSemanticConcreteDependencyToken[];
  readonly key: string;
}

export interface KpSemanticDerivedDependencyToken {
  readonly schemaVersion: "kp.semantic-derived-dependency-token.v1";
  readonly kind: "semantic-derived-dependency-token";
  readonly slotId: KpSemanticSlotId;
  readonly derivationId: KpSemanticDerivationId;
  readonly fingerprint: KpSemanticDerivationFingerprint;
  readonly key: string;
}

export interface KpSemanticTransientDerivationDependencyToken {
  readonly schemaVersion:
    "kp.semantic-transient-derivation-dependency-token.v1";
  readonly kind: "semantic-transient-derivation-dependency-token";
  readonly slotId: KpSemanticSlotId;
  readonly driver: KpSemanticTransientDependencyToken;
  readonly key: string;
}

export type KpSemanticDerivationDependencyToken =
  | KpSemanticConcreteDependencyToken
  | KpSemanticTransientDerivationDependencyToken
  | KpSemanticDerivedDependencyToken;

export interface KpSemanticDerivationFingerprint {
  readonly schemaVersion: "kp.semantic-derivation-fingerprint.v1";
  readonly kind: "semantic-derivation-fingerprint";
  readonly derivationId: KpSemanticDerivationId;
  readonly targetSlotId: KpSemanticSlotId;
  readonly dependencies: readonly KpSemanticDerivationDependencyToken[];
  readonly key: string;
}

export function createKpSemanticConcreteDerivationFingerprint(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly target: KpDerivedSemanticStateLeafHandle<unknown>;
}): KpSemanticConcreteDerivationFingerprint {
  const definition = requireDefinition(input, input.snapshot);
  assertDefinitionAuthority(input.snapshot, definition);
  const dependencies = Object.freeze(definition.dependencies.map(
    ({ dependency }): KpSemanticConcreteDependencyToken =>
      createConcreteToken(input.graph, input.snapshot, dependency)
  ));
  return Object.freeze({
    schemaVersion: "kp.semantic-concrete-derivation-fingerprint.v1",
    kind: "semantic-concrete-derivation-fingerprint",
    derivationId: definition.id,
    targetSlotId: definition.target.slotId,
    dependencies,
    key: encodeAuthority([
      "derivation",
      definition.id,
      definition.target.slotId,
      ...dependencies.map(({ key }) => key)
    ])
  });
}

export function createKpSemanticDerivationFingerprint(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly target: KpDerivedSemanticStateLeafHandle<unknown>;
}): KpSemanticDerivationFingerprint;
export function createKpSemanticDerivationFingerprint(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly source: KpSemanticStateReadSource;
  readonly target: KpDerivedSemanticStateLeafHandle<unknown>;
}): KpSemanticDerivationFingerprint;
export function createKpSemanticDerivationFingerprint(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly target: KpDerivedSemanticStateLeafHandle<unknown>;
} & (
  | { readonly snapshot: KpAggregateSemanticSnapshot }
  | { readonly source: KpSemanticStateReadSource }
)): KpSemanticDerivationFingerprint {
  const snapshot = readAuthoritySnapshot(input);
  const definition = requireDefinition(input, snapshot);
  return createFingerprint(
    input.graph,
    snapshot,
    "source" in input ? input.source : undefined,
    definition,
    new Map()
  );
}

function createFingerprint(
  graph: KpSemanticDerivedGraph,
  snapshot: KpAggregateSemanticSnapshot,
  source: KpSemanticStateReadSource | undefined,
  definition: KpSemanticDerivedGraphDefinitionInput,
  fingerprints: Map<KpSemanticSlotId, KpSemanticDerivationFingerprint>
): KpSemanticDerivationFingerprint {
  const previous = fingerprints.get(definition.target.slotId);
  if (previous !== undefined) return previous;
  assertDefinitionAuthority(snapshot, definition);
  const dependencies = Object.freeze(definition.dependencies.map(
    ({ dependency }): KpSemanticDerivationDependencyToken => {
      if (dependency.descriptorKind !== "derived-value") {
        return createDependencyToken(graph, snapshot, source, dependency);
      }
      const nested = createFingerprint(
        graph,
        snapshot,
        source,
        readDefinition(graph, snapshot, dependency.slotId),
        fingerprints
      );
      return Object.freeze({
        schemaVersion: "kp.semantic-derived-dependency-token.v1",
        kind: "semantic-derived-dependency-token",
        slotId: dependency.slotId,
        derivationId: nested.derivationId,
        fingerprint: nested,
        key: encodeAuthority([
          "derived",
          dependency.slotId,
          nested.derivationId,
          nested.key
        ])
      });
    }
  ));
  const fingerprint: KpSemanticDerivationFingerprint = Object.freeze({
    schemaVersion: "kp.semantic-derivation-fingerprint.v1",
    kind: "semantic-derivation-fingerprint",
    derivationId: definition.id,
    targetSlotId: definition.target.slotId,
    dependencies,
    key: encodeAuthority([
      "derivation",
      definition.id,
      definition.target.slotId,
      ...dependencies.map(({ key }) => key)
    ])
  });
  fingerprints.set(definition.target.slotId, fingerprint);
  return fingerprint;
}

function createDependencyToken(
  graph: KpSemanticDerivedGraph,
  snapshot: KpAggregateSemanticSnapshot,
  source: KpSemanticStateReadSource | undefined,
  dependency: KpSemanticDerivedGraphLeafReference
): KpSemanticConcreteDependencyToken |
  KpSemanticTransientDerivationDependencyToken {
  const resolved = source === undefined
    ? resolveKpSemanticConcreteDependency({ graph, snapshot, dependency })
    : resolveKpSemanticConcreteDependency({ graph, source, dependency });
  if (resolved.kind === "resolved-semantic-concrete-dependency") {
    return createConcreteTokenFromResolution(resolved);
  }
  return createTransientToken(resolved.token);
}

function createConcreteToken(
  graph: KpSemanticDerivedGraph,
  snapshot: KpAggregateSemanticSnapshot,
  dependency: KpSemanticDerivedGraphLeafReference
): KpSemanticConcreteDependencyToken {
  const resolved = resolveKpSemanticConcreteDependency({
    graph,
    snapshot,
    dependency
  });
  return createConcreteTokenFromResolution(resolved);
}

function createConcreteTokenFromResolution(
  resolved: {
    readonly kind: "resolved-semantic-concrete-dependency";
    readonly slotId: KpSemanticSlotId;
    readonly entityId: KpSemanticEntityId;
    readonly versionId: KpSemanticVersionId;
  }
): KpSemanticConcreteDependencyToken {
  return Object.freeze({
    schemaVersion: "kp.semantic-concrete-dependency-token.v1",
    kind: "semantic-concrete-dependency-token",
    slotId: resolved.slotId,
    entityId: resolved.entityId,
    versionId: resolved.versionId,
    key: encodeAuthority([
      "concrete",
      resolved.slotId,
      resolved.entityId,
      resolved.versionId
    ])
  });
}

function createTransientToken(
  driver: KpSemanticTransientDependencyToken
): KpSemanticTransientDerivationDependencyToken {
  return Object.freeze({
    schemaVersion:
      "kp.semantic-transient-derivation-dependency-token.v1",
    kind: "semantic-transient-derivation-dependency-token",
    slotId: driver.slotId,
    driver,
    key: encodeAuthority([
      "transient",
      driver.definitionId,
      driver.transformationId,
      driver.applicationId,
      driver.declarationId,
      driver.slotId,
      driver.beforeEntityId,
      driver.beforeVersionId,
      driver.afterEntityId,
      driver.afterVersionId,
      driver.progress
    ])
  });
}

function assertDefinitionAuthority(
  snapshot: KpAggregateSemanticSnapshot,
  definition: KpSemanticDerivedGraphDefinitionInput
): void {
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
      path: definition.target.path,
      derivationId: definition.id,
      message: `Cannot fingerprint stale derived definition ${JSON.stringify(definition.id)} against snapshot ${JSON.stringify(snapshot.id)}.`
    });
  }
}

function requireDefinition(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly target: KpDerivedSemanticStateLeafHandle<unknown>;
} & (
  | { readonly snapshot: KpAggregateSemanticSnapshot }
  | { readonly source: KpSemanticStateReadSource }
), snapshot: KpAggregateSemanticSnapshot): KpSemanticDerivedGraphDefinitionInput {
  const sourceNamespace = "source" in input
    ? input.source.namespace
    : snapshot.namespace;
  if (sourceNamespace !== input.graph.namespace ||
    snapshot.namespace !== input.graph.namespace) {
    throw new KpSemanticDerivedEvaluationError({
      code: "foreign-derived-snapshot",
      slotId: input.target.slotId,
      snapshotId: snapshot.id,
      path: input.target.path,
      message: `Cannot fingerprint semantic source in ${JSON.stringify(sourceNamespace)} outside graph ${JSON.stringify(input.graph.namespace)}.`
    });
  }
  if (input.target.namespace !== input.graph.namespace) {
    throw new KpSemanticDerivedEvaluationError({
      code: "foreign-derived-target",
      slotId: input.target.slotId,
      snapshotId: snapshot.id,
      path: input.target.path,
      message: `Cannot fingerprint target ${JSON.stringify(input.target.path)} outside graph ${JSON.stringify(input.graph.namespace)}.`
    });
  }
  return readDefinition(input.graph, snapshot, input.target.slotId);
}

function readAuthoritySnapshot(input:
  | { readonly snapshot: KpAggregateSemanticSnapshot }
  | { readonly source: KpSemanticStateReadSource }
): KpAggregateSemanticSnapshot {
  if ("snapshot" in input) return input.snapshot;
  return input.source.kind === "persistent-snapshot"
    ? input.source.snapshot
    : input.source.base.snapshot;
}

function readDefinition(
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
      path: null,
      message: `Derived graph ${JSON.stringify(graph.namespace)} has no definition for fingerprint slot ${JSON.stringify(slotId)}.`
    });
  }
  return definition;
}

function encodeAuthority(parts: readonly string[]): string {
  return parts.map(part => `${part.length}:${part}`).join("");
}
