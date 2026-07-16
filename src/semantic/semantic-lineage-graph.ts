export type KpSemanticLineageRelation =
  | "persist"
  | "copy"
  | "split"
  | "merge"
  | "introduction"
  | "removal";

export interface KpSemanticLineageEdge {
  readonly id: string;
  readonly relation: KpSemanticLineageRelation;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly summary: string;
}

export interface KpSemanticLineageGraph {
  readonly kind: "semantic-lineage-graph";
  readonly id: string;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly edges: readonly KpSemanticLineageEdge[];
}

export interface KpSemanticLineageIssue {
  readonly code:
    | "lineage.duplicate-id"
    | "lineage.invalid-endpoint"
    | "lineage.invalid-multiplicity"
    | "lineage.incomplete-source"
    | "lineage.incomplete-target"
    | "lineage.ambiguous-target"
    | "lineage.copy-without-persistence"
    | "lineage.cycle";
  readonly path: string;
  readonly message: string;
}

export function createKpSemanticLineageGraph(input: {
  readonly id: string;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly edges: readonly KpSemanticLineageEdge[];
}): KpSemanticLineageGraph {
  const graph: KpSemanticLineageGraph = {
    kind: "semantic-lineage-graph",
    id: input.id,
    sourceEntityIds: [...input.sourceEntityIds],
    targetEntityIds: [...input.targetEntityIds],
    edges: input.edges.map((edge) => ({
      ...edge,
      sourceEntityIds: [...edge.sourceEntityIds],
      targetEntityIds: [...edge.targetEntityIds]
    }))
  };
  const issues = validateKpSemanticLineageGraph(graph);
  if (issues.length > 0) throw new Error(issues[0]!.message);
  return graph;
}

export function validateKpSemanticLineageGraph(
  graph: KpSemanticLineageGraph
): readonly KpSemanticLineageIssue[] {
  const issues: KpSemanticLineageIssue[] = [];
  const sourceIds = collectIds(graph.sourceEntityIds, "sourceEntityIds", issues);
  const targetIds = collectIds(graph.targetEntityIds, "targetEntityIds", issues);
  const edgeIds = new Set<string>();

  graph.edges.forEach((edge, index) => {
    const path = `edges[${index}]`;
    if (edgeIds.has(edge.id)) duplicateIssue(`${path}.id`, `Duplicate lineage edge ${edge.id}.`, issues);
    edgeIds.add(edge.id);
    validateMultiplicity(edge, path, issues);
    edge.sourceEntityIds.forEach((id) => {
      if (!sourceIds.has(id)) endpointIssue(`${path}.sourceEntityIds`, edge.id, id, "source", issues);
    });
    edge.targetEntityIds.forEach((id) => {
      if (!targetIds.has(id)) endpointIssue(`${path}.targetEntityIds`, edge.id, id, "target", issues);
    });
  });

  graph.sourceEntityIds.forEach((id) => {
    if (!graph.edges.some((edge) => edge.sourceEntityIds.includes(id))) {
      issues.push({
        code: "lineage.incomplete-source",
        path: "sourceEntityIds",
        message: `Source entity ${id} has no persistence, descendant, merge, or removal lineage.`
      });
    }
  });
  graph.targetEntityIds.forEach((id) => {
    const incoming = graph.edges.filter((edge) => edge.targetEntityIds.includes(id));
    if (incoming.length === 0) {
      issues.push({
        code: "lineage.incomplete-target",
        path: "targetEntityIds",
        message: `Target entity ${id} has no persistence, origin, merge, or introduction lineage.`
      });
    } else if (incoming.length > 1) {
      issues.push({
        code: "lineage.ambiguous-target",
        path: "targetEntityIds",
        message: `Target entity ${id} has ${incoming.length} competing lineage origins.`
      });
    }
  });

  graph.edges.filter((edge) => edge.relation === "copy").forEach((edge, index) => {
    const sourceId = edge.sourceEntityIds[0];
    if (!graph.edges.some((candidate) =>
      candidate.relation === "persist" && candidate.sourceEntityIds[0] === sourceId
    )) {
      issues.push({
        code: "lineage.copy-without-persistence",
        path: `edges[${index}]`,
        message: `Copy lineage ${edge.id} must preserve source entity ${sourceId}.`
      });
    }
  });

  lineageCycles(graph).forEach((entityId) => {
    issues.push({
      code: "lineage.cycle",
      path: "edges",
      message: `Semantic lineage contains a non-persistence cycle through ${entityId}.`
    });
  });
  return issues;
}

function validateMultiplicity(
  edge: KpSemanticLineageEdge,
  path: string,
  issues: KpSemanticLineageIssue[]
): void {
  const sources = edge.sourceEntityIds.length;
  const targets = edge.targetEntityIds.length;
  const valid = edge.relation === "persist" || edge.relation === "copy"
    ? sources === 1 && targets === 1
    : edge.relation === "split"
      ? sources === 1 && targets >= 2
      : edge.relation === "merge"
        ? sources >= 2 && targets === 1
        : edge.relation === "introduction"
          ? sources === 0 && targets >= 1
          : sources >= 1 && targets === 0;
  if (!valid) {
    issues.push({
      code: "lineage.invalid-multiplicity",
      path,
      message: `Lineage edge ${edge.id} has invalid ${edge.relation} multiplicity ${sources}:${targets}.`
    });
  }
}

function lineageCycles(graph: KpSemanticLineageGraph): readonly string[] {
  const adjacency = new Map<string, Set<string>>();
  graph.edges.filter((edge) => edge.relation !== "persist").forEach((edge) => {
    edge.sourceEntityIds.forEach((sourceId) => {
      const targets = adjacency.get(sourceId) ?? new Set<string>();
      edge.targetEntityIds.forEach((targetId) => targets.add(targetId));
      adjacency.set(sourceId, targets);
    });
  });
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycles = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) {
      cycles.add(id);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    adjacency.get(id)?.forEach(visit);
    visiting.delete(id);
    visited.add(id);
  };
  adjacency.forEach((_targets, id) => visit(id));
  return [...cycles];
}

function collectIds(
  ids: readonly string[],
  path: string,
  issues: KpSemanticLineageIssue[]
): ReadonlySet<string> {
  const unique = new Set<string>();
  ids.forEach((id) => {
    if (unique.has(id)) duplicateIssue(path, `Duplicate lineage endpoint ${id}.`, issues);
    unique.add(id);
  });
  return unique;
}

function duplicateIssue(path: string, message: string, issues: KpSemanticLineageIssue[]): void {
  issues.push({ code: "lineage.duplicate-id", path, message });
}

function endpointIssue(
  path: string,
  edgeId: string,
  id: string,
  side: "source" | "target",
  issues: KpSemanticLineageIssue[]
): void {
  issues.push({
    code: "lineage.invalid-endpoint",
    path,
    message: `Lineage edge ${edgeId} references unknown ${side} entity ${id}.`
  });
}
