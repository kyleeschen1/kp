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

export interface KpSemanticDerivedGraphDefinitionExpectation {
  readonly schemaVersion: "kp.semantic-derived-graph-definition-expectation.v1";
  readonly kind: "semantic-derived-graph-definition-expectation";
  readonly id: KpSemanticDerivationId;
  readonly sourceId: string;
  readonly target: KpSemanticDerivedGraphLeafReference;
}

export interface KpSemanticDerivedGraphInput {
  readonly schemaVersion: "kp.semantic-derived-graph-input.v1";
  readonly kind: "semantic-derived-graph-input";
  readonly namespace: string;
  readonly expectedDefinitions:
    readonly KpSemanticDerivedGraphDefinitionExpectation[];
  readonly definitions: readonly KpSemanticDerivedGraphDefinitionInput[];
  readonly edges: readonly KpSemanticDerivedGraphEdgeInput[];
}

export type KpSemanticDerivedGraphDiagnosticCode =
  | "duplicate-derived-definition"
  | "duplicate-derived-dependency"
  | "missing-derived-definition"
  | "missing-derived-dependency"
  | "self-derived-dependency";

export interface KpSemanticDerivedGraphDiagnostic {
  readonly schemaVersion: "kp.semantic-derived-graph-diagnostic.v1";
  readonly kind: "semantic-derived-graph-diagnostic";
  readonly code: KpSemanticDerivedGraphDiagnosticCode;
  readonly derivationId: KpSemanticDerivationId;
  readonly sourceId: string;
  readonly targetSlotId: KpSemanticSlotId;
  readonly dependencySlotId?: KpSemanticSlotId;
  readonly targetPath: readonly string[] | null;
  readonly dependencyPath: readonly string[] | null;
  readonly message: string;
}

export class KpSemanticDerivedGraphValidationError extends Error {
  readonly diagnostics: readonly KpSemanticDerivedGraphDiagnostic[];

  constructor(diagnostics: readonly KpSemanticDerivedGraphDiagnostic[]) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.name = "KpSemanticDerivedGraphValidationError";
    this.diagnostics = Object.freeze([...diagnostics]);
  }
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
  const expectedDefinitions = Object.freeze(compiled.leaves
    .filter(({ descriptor }) => descriptor.kind === "derived-value")
    .map((leaf): KpSemanticDerivedGraphDefinitionExpectation =>
      Object.freeze({
        schemaVersion:
          "kp.semantic-derived-graph-definition-expectation.v1",
        kind: "semantic-derived-graph-definition-expectation",
        id: leaf.identities.derivationId,
        sourceId: leaf.identities.sourceIds.derivation,
        target: referenceFor(leaf.identities.slotId)
      })));

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
    expectedDefinitions,
    definitions: Object.freeze(normalizedDefinitions),
    edges: Object.freeze(normalizedDefinitions.flatMap(
      definition => definition.dependencies
    ))
  });
}

export function validateKpSemanticDerivedGraphInput(
  input: KpSemanticDerivedGraphInput
): KpSemanticDerivedGraphInput {
  const diagnostics: KpSemanticDerivedGraphDiagnostic[] = [];
  const definitionsByTarget = new Map<
    KpSemanticSlotId,
    KpSemanticDerivedGraphDefinitionInput
  >();
  const localSlotPrefix = `kp-state/${input.namespace}/slot/`;

  for (const expected of input.expectedDefinitions) {
    if (!input.definitions.some(({ target }) =>
      target.slotId === expected.target.slotId
    )) {
      diagnostics.push(createDiagnostic({
        code: "missing-derived-definition",
        derivationId: expected.id,
        sourceId: expected.sourceId,
        target: expected.target,
        message: `Derived schema path ${formatPath(expected.target.path)} has no definition.`
      }));
    }
  }

  for (const definition of input.definitions) {
    const previous = definitionsByTarget.get(definition.target.slotId);
    if (previous !== undefined) {
      diagnostics.push(createDiagnostic({
        code: "duplicate-derived-definition",
        derivationId: definition.id,
        sourceId: definition.sourceId,
        target: definition.target,
        message: `Derived schema path ${formatPath(definition.target.path)} has more than one definition.`
      }));
    } else {
      definitionsByTarget.set(definition.target.slotId, definition);
    }

    if (definition.dependencies.length === 0) {
      diagnostics.push(createDiagnostic({
        code: "missing-derived-dependency",
        derivationId: definition.id,
        sourceId: definition.sourceId,
        target: definition.target,
        message: `Derived schema path ${formatPath(definition.target.path)} requires at least one dependency.`
      }));
      continue;
    }

    const dependencies = new Set<KpSemanticSlotId>();
    for (const edge of definition.dependencies) {
      if (edge.dependency.slotId === definition.target.slotId) {
        diagnostics.push(createDiagnostic({
          code: "self-derived-dependency",
          derivationId: definition.id,
          sourceId: definition.sourceId,
          target: definition.target,
          dependency: edge.dependency,
          message: `Derived schema path ${formatPath(definition.target.path)} cannot depend on itself.`
        }));
      }
      if (dependencies.has(edge.dependency.slotId)) {
        diagnostics.push(createDiagnostic({
          code: "duplicate-derived-dependency",
          derivationId: definition.id,
          sourceId: definition.sourceId,
          target: definition.target,
          dependency: edge.dependency,
          message: `Derived schema path ${formatPath(definition.target.path)} repeats dependency ${formatPath(edge.dependency.path)}.`
        }));
      } else {
        dependencies.add(edge.dependency.slotId);
      }
      if (edge.dependency.path === null &&
          edge.dependency.slotId.startsWith(localSlotPrefix)) {
        diagnostics.push(createDiagnostic({
          code: "missing-derived-dependency",
          derivationId: definition.id,
          sourceId: definition.sourceId,
          target: definition.target,
          dependency: edge.dependency,
          message: `Derived schema path ${formatPath(definition.target.path)} references undeclared local dependency ${JSON.stringify(edge.dependency.slotId)}.`
        }));
      }
    }
  }

  if (diagnostics.length > 0) {
    throw new KpSemanticDerivedGraphValidationError(diagnostics);
  }
  return input;
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

function createDiagnostic(input: {
  readonly code: KpSemanticDerivedGraphDiagnosticCode;
  readonly derivationId: KpSemanticDerivationId;
  readonly sourceId: string;
  readonly target: KpSemanticDerivedGraphLeafReference;
  readonly dependency?: KpSemanticDerivedGraphLeafReference;
  readonly message: string;
}): KpSemanticDerivedGraphDiagnostic {
  return Object.freeze({
    schemaVersion: "kp.semantic-derived-graph-diagnostic.v1",
    kind: "semantic-derived-graph-diagnostic",
    code: input.code,
    derivationId: input.derivationId,
    sourceId: input.sourceId,
    targetSlotId: input.target.slotId,
    ...(input.dependency === undefined
      ? {}
      : { dependencySlotId: input.dependency.slotId }),
    targetPath: input.target.path,
    dependencyPath: input.dependency?.path ?? null,
    message: input.message
  });
}

function formatPath(path: readonly string[] | null): string {
  return path === null ? "<unresolved>" : JSON.stringify(path);
}
