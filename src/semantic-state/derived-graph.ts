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

export interface KpSemanticDerivedGraph {
  readonly schemaVersion: "kp.semantic-derived-graph.v1";
  readonly kind: "semantic-derived-graph";
  readonly namespace: string;
  readonly input: KpSemanticDerivedGraphInput;
  readonly evaluationOrder:
    readonly KpSemanticDerivedGraphDefinitionInput[];
  readonly evaluationIndex: Readonly<Record<string, number>>;
}

export type KpSemanticDerivedGraphDiagnosticCode =
  | "cross-schema-derived-dependency"
  | "cross-schema-derived-target"
  | "duplicate-derived-definition"
  | "duplicate-derived-dependency"
  | "incompatible-derived-identity"
  | "invalid-derived-target"
  | "missing-derived-definition"
  | "missing-derived-dependency"
  | "missing-derived-compute-capability"
  | "self-derived-dependency"
  | "cyclic-derived-dependency";

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
  readonly cycleSlotIds?: readonly KpSemanticSlotId[];
  readonly cyclePaths?: readonly (readonly string[] | null)[];
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
  const expectationsByTarget = new Map(
    input.expectedDefinitions.map((expected) => [
      expected.target.slotId,
      expected
    ])
  );
  const localSlotPrefix = `kp-state/${input.namespace}/slot/`;
  const localDerivationPrefix =
    `kp-state/${input.namespace}/derivation/`;

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
    if (!hasComputeCapability(definition.definition)) {
      diagnostics.push(createDiagnostic({
        code: "missing-derived-compute-capability",
        derivationId: definition.id,
        sourceId: definition.sourceId,
        target: definition.target,
        message: `Derived schema path ${formatPath(definition.target.path)} has durable dependency data but no definition-local compute capability.`
      }));
    }
    if (definition.target.path === null) {
      diagnostics.push(createDiagnostic({
        code: definition.target.slotId.startsWith(localSlotPrefix)
          ? "invalid-derived-target"
          : "cross-schema-derived-target",
        derivationId: definition.id,
        sourceId: definition.sourceId,
        target: definition.target,
        message: definition.target.slotId.startsWith(localSlotPrefix)
          ? `Derived definition targets undeclared local slot ${JSON.stringify(definition.target.slotId)}.`
          : `Derived definition target ${JSON.stringify(definition.target.slotId)} does not belong to schema ${JSON.stringify(input.namespace)}.`
      }));
    } else if (definition.target.descriptorKind !== "derived-value") {
      diagnostics.push(createDiagnostic({
        code: "invalid-derived-target",
        derivationId: definition.id,
        sourceId: definition.sourceId,
        target: definition.target,
        message: `Semantic state path ${formatPath(definition.target.path)} is ${JSON.stringify(definition.target.descriptorKind)}, not a derived target.`
      }));
    } else {
      const expected = expectationsByTarget.get(definition.target.slotId);
      if (expected !== undefined &&
          (definition.id !== expected.id ||
            !definition.id.startsWith(localDerivationPrefix))) {
        diagnostics.push(createDiagnostic({
          code: "incompatible-derived-identity",
          derivationId: definition.id,
          sourceId: definition.sourceId,
          target: definition.target,
          message: `Derived schema path ${formatPath(definition.target.path)} requires derivation ${JSON.stringify(expected.id)}, not ${JSON.stringify(definition.id)}.`
        }));
      }
    }

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
      } else if (edge.dependency.path === null) {
        diagnostics.push(createDiagnostic({
          code: "cross-schema-derived-dependency",
          derivationId: definition.id,
          sourceId: definition.sourceId,
          target: definition.target,
          dependency: edge.dependency,
          message: `Derived schema path ${formatPath(definition.target.path)} references dependency ${JSON.stringify(edge.dependency.slotId)} outside schema ${JSON.stringify(input.namespace)}.`
        }));
      }
    }
  }

  if (diagnostics.length === 0) {
    diagnostics.push(...detectCycles(input));
  }
  if (diagnostics.length > 0) {
    throw new KpSemanticDerivedGraphValidationError(diagnostics);
  }
  return input;
}

export function compileKpSemanticDerivedGraph(
  input: KpSemanticDerivedGraphInput
): KpSemanticDerivedGraph {
  validateKpSemanticDerivedGraphInput(input);
  const definitions = new Map(input.definitions.map((definition) => [
    definition.target.slotId,
    definition
  ]));
  const visited = new Set<KpSemanticSlotId>();
  const evaluationOrder: KpSemanticDerivedGraphDefinitionInput[] = [];

  const visit = (definition: KpSemanticDerivedGraphDefinitionInput): void => {
    if (visited.has(definition.target.slotId)) return;
    const dependencies = definition.dependencies
      .map(({ dependency }) => definitions.get(dependency.slotId))
      .filter((candidate) => candidate !== undefined)
      .sort((left, right) =>
        left.target.slotId.localeCompare(right.target.slotId)
      );
    for (const dependency of dependencies) visit(dependency);
    visited.add(definition.target.slotId);
    evaluationOrder.push(definition);
  };

  for (const definition of [...input.definitions].sort(
    compareNormalizedDefinitions
  )) visit(definition);

  const evaluationIndex: Record<string, number> = {};
  evaluationOrder.forEach((definition, index) => {
    evaluationIndex[definition.target.slotId] = index;
  });
  return Object.freeze({
    schemaVersion: "kp.semantic-derived-graph.v1",
    kind: "semantic-derived-graph",
    namespace: input.namespace,
    input,
    evaluationOrder: Object.freeze(evaluationOrder),
    evaluationIndex: Object.freeze(evaluationIndex)
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

function compareNormalizedDefinitions(
  left: KpSemanticDerivedGraphDefinitionInput,
  right: KpSemanticDerivedGraphDefinitionInput
): number {
  return left.target.slotId.localeCompare(right.target.slotId) ||
    left.id.localeCompare(right.id) || left.sourceId.localeCompare(
      right.sourceId
    );
}

function createDiagnostic(input: {
  readonly code: KpSemanticDerivedGraphDiagnosticCode;
  readonly derivationId: KpSemanticDerivationId;
  readonly sourceId: string;
  readonly target: KpSemanticDerivedGraphLeafReference;
  readonly dependency?: KpSemanticDerivedGraphLeafReference;
  readonly cycle?: readonly KpSemanticDerivedGraphLeafReference[];
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
    ...(input.cycle === undefined
      ? {}
      : {
          cycleSlotIds: Object.freeze(input.cycle.map(({ slotId }) => slotId)),
          cyclePaths: Object.freeze(input.cycle.map(({ path }) => path))
        }),
    message: input.message
  });
}

function formatPath(path: readonly string[] | null): string {
  return path === null ? "<unresolved>" : JSON.stringify(path);
}

function hasComputeCapability(
  definition: KpSemanticStateDerivationDefinitionSource
): boolean {
  const candidate: unknown = definition;
  return isRecord(candidate) && typeof candidate["compute"] === "function";
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object";
}

function detectCycles(
  input: KpSemanticDerivedGraphInput
): readonly KpSemanticDerivedGraphDiagnostic[] {
  const definitions = new Map(input.definitions.map((definition) => [
    definition.target.slotId,
    definition
  ]));
  const visitState = new Map<KpSemanticSlotId, "visiting" | "complete">();
  const stack: KpSemanticDerivedGraphDefinitionInput[] = [];
  const diagnostics: KpSemanticDerivedGraphDiagnostic[] = [];
  const recordedCycles = new Set<string>();

  const visit = (definition: KpSemanticDerivedGraphDefinitionInput): void => {
    visitState.set(definition.target.slotId, "visiting");
    stack.push(definition);
    const dependencies = definition.dependencies
      .map(({ dependency }) => definitions.get(dependency.slotId))
      .filter((candidate) => candidate !== undefined)
      .sort((left, right) =>
        left.target.slotId.localeCompare(right.target.slotId)
      );
    for (const dependency of dependencies) {
      const state = visitState.get(dependency.target.slotId);
      if (state === "visiting") {
        const start = stack.findIndex(({ target }) =>
          target.slotId === dependency.target.slotId
        );
        const cycle = canonicalizeCycle([
          ...stack.slice(start).map(({ target }) => target),
          dependency.target
        ]);
        const key = cycle.map(({ slotId }) => slotId).join("->");
        if (!recordedCycles.has(key)) {
          recordedCycles.add(key);
          const owner = definitions.get(cycle[0]!.slotId)!;
          diagnostics.push(createDiagnostic({
            code: "cyclic-derived-dependency",
            derivationId: owner.id,
            sourceId: owner.sourceId,
            target: owner.target,
            dependency: cycle[1]!,
            cycle,
            message: `Derived dependency cycle ${cycle.map(({ path }) =>
              formatPath(path)).join(" -> ")} is not evaluable.`
          }));
        }
      } else if (state === undefined) {
        visit(dependency);
      }
    }
    stack.pop();
    visitState.set(definition.target.slotId, "complete");
  };

  for (const definition of input.definitions) {
    if (visitState.get(definition.target.slotId) === undefined) {
      visit(definition);
    }
  }
  return Object.freeze(diagnostics);
}

function canonicalizeCycle(
  closedCycle: readonly KpSemanticDerivedGraphLeafReference[]
): readonly KpSemanticDerivedGraphLeafReference[] {
  const openCycle = closedCycle.slice(0, -1);
  let firstIndex = 0;
  for (let index = 1; index < openCycle.length; index += 1) {
    if (openCycle[index]!.slotId.localeCompare(
      openCycle[firstIndex]!.slotId
    ) < 0) firstIndex = index;
  }
  const rotated = [
    ...openCycle.slice(firstIndex),
    ...openCycle.slice(0, firstIndex)
  ];
  return Object.freeze([...rotated, rotated[0]!]);
}
