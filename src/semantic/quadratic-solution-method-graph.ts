import type { KpCompletingSquareAuthority } from "./quadratic-completing-square-authority.ts";
import type { KpQuadraticFormulaAuthority } from "./quadratic-formula-authority.ts";

export type KpQuadraticMethodId =
  | "method.quadratic.completing-square"
  | "method.quadratic.formula";

export interface KpQuadraticMethodGraphNode {
  readonly id: string;
  readonly kind: "source-equation" | "method-state" | "solution-set";
  readonly ownerMethodId?: KpQuadraticMethodId;
  readonly authorityRef: string;
}

export interface KpQuadraticMethodGraphEdge {
  readonly id: string;
  readonly methodId: KpQuadraticMethodId;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly operationRef: string;
  readonly relation: "same-solution-set";
}

export interface KpQuadraticMethodPath {
  readonly id: KpQuadraticMethodId;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly edgeIds: readonly string[];
}

export interface KpQuadraticSolutionMethodGraph {
  readonly schemaVersion: "kp.quadratic-solution-method-graph.v1";
  readonly id: "graph.quadratic.canonical.solution-methods";
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly nodes: readonly KpQuadraticMethodGraphNode[];
  readonly edges: readonly KpQuadraticMethodGraphEdge[];
  readonly paths: readonly KpQuadraticMethodPath[];
}

export interface KpQuadraticMethodGraphDiagnostic {
  readonly code:
    | "duplicate-id"
    | "missing-endpoint"
    | "method-ownership"
    | "dependency-gap"
    | "shared-endpoint"
    | "cycle";
  readonly path: string;
  readonly message: string;
}

export function createCanonicalKpQuadraticSolutionMethodGraph(input: {
  readonly completingSquare: KpCompletingSquareAuthority;
  readonly formula: KpQuadraticFormulaAuthority;
}): KpQuadraticSolutionMethodGraph {
  if (input.completingSquare.fixtureId !== input.formula.fixtureId) {
    throw new Error("Quadratic method authorities must share one fixture.");
  }
  if (input.completingSquare.solutionSetId !== input.formula.solutionSetId) {
    throw new Error("Quadratic method authorities must share one exact solution set.");
  }
  const sourceNodeId = `node.${input.completingSquare.fixtureId}`;
  const targetNodeId = `node.${input.completingSquare.solutionSetId}`;
  const completingNodes = input.completingSquare.states.slice(1).map((state) =>
    node(
      `node.${state.id}`,
      "method-state",
      state.id,
      "method.quadratic.completing-square"
    )
  );
  const formulaOutputRefs = input.formula.operations.slice(0, -1).map((operation) =>
    `${operation.id}.output`
  );
  const formulaNodes = formulaOutputRefs.map((ref) =>
    node(`node.${ref}`, "method-state", ref, "method.quadratic.formula")
  );
  const completingNodeIds = completingNodes.map(({ id }) => id);
  const formulaNodeIds = formulaNodes.map(({ id }) => id);
  const completingEdgeRefs = [
    ...input.completingSquare.rewrites.map(({ id }) => id),
    `${input.completingSquare.id}.verify-solution-set`
  ];
  const formulaEdgeRefs = input.formula.operations.map(({ id }) => id);
  const completingEdges = pathEdges(
    "method.quadratic.completing-square",
    [sourceNodeId, ...completingNodeIds, targetNodeId],
    completingEdgeRefs
  );
  const formulaEdges = pathEdges(
    "method.quadratic.formula",
    [sourceNodeId, ...formulaNodeIds, targetNodeId],
    formulaEdgeRefs
  );
  const graph = Object.freeze({
    schemaVersion: "kp.quadratic-solution-method-graph.v1" as const,
    id: "graph.quadratic.canonical.solution-methods" as const,
    sourceNodeId,
    targetNodeId,
    nodes: Object.freeze([
      node(sourceNodeId, "source-equation", input.completingSquare.fixtureId),
      ...completingNodes,
      ...formulaNodes,
      node(targetNodeId, "solution-set", input.completingSquare.solutionSetId)
    ]),
    edges: Object.freeze([...completingEdges, ...formulaEdges]),
    paths: Object.freeze([
      path("method.quadratic.completing-square", sourceNodeId, targetNodeId, completingEdges),
      path("method.quadratic.formula", sourceNodeId, targetNodeId, formulaEdges)
    ])
  });
  const diagnostics = validateKpQuadraticSolutionMethodGraph(graph);
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.map((issue) => issue.message).join(" "));
  }
  return graph;
}

export function validateKpQuadraticSolutionMethodGraph(
  graph: KpQuadraticSolutionMethodGraph
): readonly KpQuadraticMethodGraphDiagnostic[] {
  const diagnostics: KpQuadraticMethodGraphDiagnostic[] = [];
  const nodeIds = collectUnique(graph.nodes.map(({ id }) => id), "nodes", diagnostics);
  collectUnique(graph.edges.map(({ id }) => id), "edges", diagnostics);
  const pathIds = collectUnique(graph.paths.map(({ id }) => id), "paths", diagnostics);
  if (pathIds.size !== 2) {
    diagnostics.push(issue("shared-endpoint", "paths", "Quadratic graph requires exactly two named method paths."));
  }
  graph.edges.forEach((edge, index) => {
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
      diagnostics.push(issue("missing-endpoint", `edges[${index}]`, `Method edge ${edge.id} references a missing node.`));
    }
    const source = graph.nodes.find(({ id }) => id === edge.sourceNodeId);
    const target = graph.nodes.find(({ id }) => id === edge.targetNodeId);
    for (const candidate of [source, target]) {
      if (
        candidate?.kind === "method-state" &&
        candidate.ownerMethodId !== edge.methodId
      ) {
        diagnostics.push(issue("method-ownership", `edges[${index}]`, `Method edge ${edge.id} crosses into another method's state.`));
      }
    }
  });
  graph.paths.forEach((path, pathIndex) => {
    if (
      path.sourceNodeId !== graph.sourceNodeId ||
      path.targetNodeId !== graph.targetNodeId
    ) {
      diagnostics.push(issue("shared-endpoint", `paths[${pathIndex}]`, `Method path ${path.id} must share the graph source and target.`));
    }
    let cursor = path.sourceNodeId;
    path.edgeIds.forEach((edgeId, edgeIndex) => {
      const edge = graph.edges.find((candidate) => candidate.id === edgeId);
      if (
        edge === undefined ||
        edge.methodId !== path.id ||
        edge.sourceNodeId !== cursor
      ) {
        diagnostics.push(issue("dependency-gap", `paths[${pathIndex}].edgeIds[${edgeIndex}]`, `Method path ${path.id} is not a closed ordered dependency chain.`));
        return;
      }
      cursor = edge.targetNodeId;
    });
    if (cursor !== path.targetNodeId) {
      diagnostics.push(issue("dependency-gap", `paths[${pathIndex}].edgeIds`, `Method path ${path.id} does not reach its declared target.`));
    }
  });
  if (containsCycle(graph)) {
    diagnostics.push(issue("cycle", "edges", "Quadratic method graph must be acyclic."));
  }
  return Object.freeze(diagnostics);
}

function pathEdges(
  methodId: KpQuadraticMethodId,
  nodeIds: readonly string[],
  operationRefs: readonly string[]
): readonly KpQuadraticMethodGraphEdge[] {
  if (nodeIds.length !== operationRefs.length + 1) {
    throw new Error(`Method ${methodId} does not have one operation per graph edge.`);
  }
  return Object.freeze(operationRefs.map((operationRef, index) =>
    Object.freeze({
      id: `edge.${methodId}.${index + 1}`,
      methodId,
      sourceNodeId: nodeIds[index]!,
      targetNodeId: nodeIds[index + 1]!,
      operationRef,
      relation: "same-solution-set" as const
    })
  ));
}

function node(
  id: string,
  kind: KpQuadraticMethodGraphNode["kind"],
  authorityRef: string,
  ownerMethodId?: KpQuadraticMethodId
): KpQuadraticMethodGraphNode {
  return Object.freeze({
    id,
    kind,
    authorityRef,
    ...(ownerMethodId === undefined ? {} : { ownerMethodId })
  });
}

function path(
  id: KpQuadraticMethodId,
  sourceNodeId: string,
  targetNodeId: string,
  edges: readonly KpQuadraticMethodGraphEdge[]
): KpQuadraticMethodPath {
  return Object.freeze({
    id,
    sourceNodeId,
    targetNodeId,
    edgeIds: Object.freeze(edges.map(({ id: edgeId }) => edgeId))
  });
}

function collectUnique(
  ids: readonly string[],
  path: string,
  diagnostics: KpQuadraticMethodGraphDiagnostic[]
): Set<string> {
  const values = new Set<string>();
  ids.forEach((id) => {
    if (values.has(id)) {
      diagnostics.push(issue("duplicate-id", path, `Quadratic method graph repeats id ${id}.`));
    }
    values.add(id);
  });
  return values;
}

function containsCycle(graph: KpQuadraticSolutionMethodGraph): boolean {
  const adjacency = new Map<string, string[]>();
  graph.edges.forEach((edge) => {
    adjacency.set(edge.sourceNodeId, [...(adjacency.get(edge.sourceNodeId) ?? []), edge.targetNodeId]);
  });
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    if ((adjacency.get(id) ?? []).some(visit)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return graph.nodes.some(({ id }) => visit(id));
}

function issue(
  code: KpQuadraticMethodGraphDiagnostic["code"],
  path: string,
  message: string
): KpQuadraticMethodGraphDiagnostic {
  return Object.freeze({ code, path, message });
}
