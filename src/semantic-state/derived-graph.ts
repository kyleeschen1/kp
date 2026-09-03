import type {
  KpCompiledSemanticStateLeaf,
  KpCompiledSemanticStateSchema
} from "./authoring-schema-compiler.ts";
import type {
  KpSemanticStateDerivationDefinitionSource
} from "./authoring-derived-definition.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateLeafDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import type {
  KpSemanticDerivationId,
  KpSemanticSlotId
} from "./identity.ts";

export interface KpSemanticDerivedGraphLeafReference {
  readonly schemaVersion: "kp.semantic-derived-graph-leaf-reference.v1";
  readonly kind: "semantic-derived-graph-leaf-reference";
  readonly slotId: KpSemanticSlotId;
  readonly path: readonly string[] | null;
  readonly encodedPath: string | null;
  readonly descriptorKind: KpSemanticStateLeafDescriptor["kind"] | null;
}

export interface KpSemanticDerivedGraphEdgeInput {
  readonly schemaVersion: "kp.semantic-derived-graph-edge-input.v1";
  readonly kind: "semantic-derived-graph-edge-input";
  readonly id: string;
  readonly derivationId: KpSemanticDerivationId;
  readonly sourceId: string;
  readonly dependencyIndex: number;
  readonly target: KpSemanticDerivedGraphLeafReference;
  readonly dependency: KpSemanticDerivedGraphLeafReference;
}

export interface KpSemanticDerivedGraphDefinitionInput {
  readonly schemaVersion: "kp.semantic-derived-graph-definition-input.v1";
  readonly kind: "semantic-derived-graph-definition-input";
  readonly id: KpSemanticDerivationId;
  readonly sourceId: string;
  readonly definition: KpSemanticStateDerivationDefinitionSource;
  readonly target: KpSemanticDerivedGraphLeafReference;
  readonly dependencies: readonly KpSemanticDerivedGraphEdgeInput[];
}

export interface KpSemanticDerivedGraphInput {
  readonly schemaVersion: "kp.semantic-derived-graph-input.v1";
  readonly kind: "semantic-derived-graph-input";
  readonly namespace: string;
  readonly definitions: readonly KpSemanticDerivedGraphDefinitionInput[];
  readonly edges: readonly KpSemanticDerivedGraphEdgeInput[];
}

export function normalizeKpSemanticDerivedGraphInput<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  compiled: KpCompiledSemanticStateSchema<Root>,
  definitions: readonly KpSemanticStateDerivationDefinitionSource[]
): KpSemanticDerivedGraphInput {
  const references = new Map<KpSemanticSlotId,
    KpSemanticDerivedGraphLeafReference>();
  for (const leaf of compiled.leaves) {
    references.set(leaf.identities.slotId, createLeafReference(leaf));
  }
  const referenceFor = (slotId: KpSemanticSlotId) => {
    const known = references.get(slotId);
    if (known !== undefined) return known;
    const unresolved = createUnresolvedLeafReference(slotId);
    references.set(slotId, unresolved);
    return unresolved;
  };

  // Normalization retains invalid edges so the graph validator can diagnose
  // the whole definition locally before any compute callback becomes reachable.
  const normalizedDefinitions = [...definitions]
    .sort(compareDefinitions)
    .map((definition): KpSemanticDerivedGraphDefinitionInput => {
      const declaration = definition.declaration;
      const target = referenceFor(declaration.slotId);
      const dependencies = Object.freeze(declaration.dependencies.map(
        (dependency, dependencyIndex): KpSemanticDerivedGraphEdgeInput =>
          Object.freeze({
            schemaVersion: "kp.semantic-derived-graph-edge-input.v1",
            kind: "semantic-derived-graph-edge-input",
            id: `${declaration.derivationId}->${dependency.slotId}`,
            derivationId: declaration.derivationId,
            sourceId: declaration.sourceId,
            dependencyIndex,
            target,
            dependency: referenceFor(dependency.slotId)
          })
      ));
      return Object.freeze({
        schemaVersion: "kp.semantic-derived-graph-definition-input.v1",
        kind: "semantic-derived-graph-definition-input",
        id: declaration.derivationId,
        sourceId: declaration.sourceId,
        definition,
        target,
        dependencies
      });
    });

  return Object.freeze({
    schemaVersion: "kp.semantic-derived-graph-input.v1",
    kind: "semantic-derived-graph-input",
    namespace: compiled.namespace,
    definitions: Object.freeze(normalizedDefinitions),
    edges: Object.freeze(normalizedDefinitions.flatMap(
      definition => definition.dependencies
    ))
  });
}

function createLeafReference(
  leaf: KpCompiledSemanticStateLeaf
): KpSemanticDerivedGraphLeafReference {
  return Object.freeze({
    schemaVersion: "kp.semantic-derived-graph-leaf-reference.v1",
    kind: "semantic-derived-graph-leaf-reference",
    slotId: leaf.identities.slotId,
    path: leaf.path,
    encodedPath: leaf.encodedPath,
    descriptorKind: leaf.descriptor.kind
  });
}

function createUnresolvedLeafReference(
  slotId: KpSemanticSlotId
): KpSemanticDerivedGraphLeafReference {
  return Object.freeze({
    schemaVersion: "kp.semantic-derived-graph-leaf-reference.v1",
    kind: "semantic-derived-graph-leaf-reference",
    slotId,
    path: null,
    encodedPath: null,
    descriptorKind: null
  });
}

function compareDefinitions(
  left: KpSemanticStateDerivationDefinitionSource,
  right: KpSemanticStateDerivationDefinitionSource
): number {
  return left.declaration.derivationId.localeCompare(
    right.declaration.derivationId
  ) || left.declaration.slotId.localeCompare(right.declaration.slotId) ||
    left.declaration.sourceId.localeCompare(right.declaration.sourceId);
}
