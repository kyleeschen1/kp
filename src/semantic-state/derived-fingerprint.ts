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
  resolveKpSemanticConcreteDependency
} from "./derived-evaluator.ts";
import type {
  KpSemanticDerivedGraph,
  KpSemanticDerivedGraphDefinitionInput
} from "./derived-graph.ts";
import type {
  KpSemanticDerivationId,
  KpSemanticEntityId,
  KpSemanticSlotId,
  KpSemanticVersionId
} from "./identity.ts";

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

export function createKpSemanticConcreteDerivationFingerprint(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly target: KpDerivedSemanticStateLeafHandle<unknown>;
}): KpSemanticConcreteDerivationFingerprint {
  const definition = requireDefinition(input);
  const declared = readKpSemanticDerivedBinding(
    input.snapshot,
    definition.target.slotId
  );
  if (!areKpSemanticDerivedBindingsEqual(
    declared,
    definition.definition.declaration
  )) {
    throw new KpSemanticDerivedEvaluationError({
      code: "stale-derived-definition",
      slotId: definition.target.slotId,
      snapshotId: input.snapshot.id,
      path: definition.target.path,
      derivationId: definition.id,
      message: `Cannot fingerprint stale derived definition ${JSON.stringify(definition.id)} against snapshot ${JSON.stringify(input.snapshot.id)}.`
    });
  }
  const dependencies = Object.freeze(definition.dependencies.map(
    ({ dependency }): KpSemanticConcreteDependencyToken => {
      const resolved = resolveKpSemanticConcreteDependency({
        graph: input.graph,
        snapshot: input.snapshot,
        dependency
      });
      return Object.freeze({
        schemaVersion: "kp.semantic-concrete-dependency-token.v1",
        kind: "semantic-concrete-dependency-token",
        slotId: resolved.slotId,
        entityId: resolved.entityId,
        versionId: resolved.versionId,
        key: encodeAuthority([
          resolved.slotId,
          resolved.entityId,
          resolved.versionId
        ])
      });
    }
  ));
  return Object.freeze({
    schemaVersion: "kp.semantic-concrete-derivation-fingerprint.v1",
    kind: "semantic-concrete-derivation-fingerprint",
    derivationId: definition.id,
    targetSlotId: definition.target.slotId,
    dependencies,
    key: encodeAuthority([
      definition.id,
      definition.target.slotId,
      ...dependencies.map(({ key }) => key)
    ])
  });
}

function requireDefinition(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly target: KpDerivedSemanticStateLeafHandle<unknown>;
}): KpSemanticDerivedGraphDefinitionInput {
  if (input.snapshot.namespace !== input.graph.namespace) {
    throw new KpSemanticDerivedEvaluationError({
      code: "foreign-derived-snapshot",
      slotId: input.target.slotId,
      snapshotId: input.snapshot.id,
      path: input.target.path,
      message: `Cannot fingerprint snapshot ${JSON.stringify(input.snapshot.id)} outside graph ${JSON.stringify(input.graph.namespace)}.`
    });
  }
  if (input.target.namespace !== input.graph.namespace) {
    throw new KpSemanticDerivedEvaluationError({
      code: "foreign-derived-target",
      slotId: input.target.slotId,
      snapshotId: input.snapshot.id,
      path: input.target.path,
      message: `Cannot fingerprint target ${JSON.stringify(input.target.path)} outside graph ${JSON.stringify(input.graph.namespace)}.`
    });
  }
  const index = input.graph.evaluationIndex[input.target.slotId];
  const definition = index === undefined
    ? undefined
    : input.graph.evaluationOrder[index];
  if (definition === undefined ||
      definition.target.slotId !== input.target.slotId) {
    throw new KpSemanticDerivedEvaluationError({
      code: "derived-target-not-found",
      slotId: input.target.slotId,
      snapshotId: input.snapshot.id,
      path: input.target.path,
      message: `Derived graph ${JSON.stringify(input.graph.namespace)} has no definition for fingerprint target ${JSON.stringify(input.target.path)}.`
    });
  }
  return definition;
}

function encodeAuthority(parts: readonly string[]): string {
  return parts.map(part => `${part.length}:${part}`).join("");
}
