import type {
  KpSemanticLineageGraph,
  KpSemanticLineageRelation
} from "../semantic/semantic-lineage-graph.ts";

export interface KpSalienceNode {
  readonly id: string;
  readonly entityIds: readonly string[];
  readonly role: "source" | "travelling" | "target" | "reunification";
  readonly readinessThreshold: number;
}

export interface KpSalienceTransferEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly lineageEdgeId: string;
  readonly targetReadyAt: number;
  readonly sourceReleaseAt: number;
  readonly branchGroupId?: string | undefined;
  readonly branchWeight?: number | undefined;
}

export interface KpSalienceBranchGroup {
  readonly id: string;
  readonly edgeIds: readonly string[];
  readonly reunificationNodeId: string;
  readonly reunifyAt: number;
}

export interface KpTransferableSalienceGraph {
  readonly id: string;
  readonly kind: "transferable-salience-graph";
  readonly nodes: readonly KpSalienceNode[];
  readonly edges: readonly KpSalienceTransferEdge[];
  readonly branchGroups: readonly KpSalienceBranchGroup[];
}

export interface KpSalienceGraphIssue {
  readonly path: string;
  readonly message: string;
}

export interface KpSalienceSample {
  readonly progress: number;
  readonly nodeWeights: Readonly<Record<string, number>>;
  readonly explanatoryEntityIds: readonly string[];
}

export function validateKpTransferableSalienceGraph(
  graph: KpTransferableSalienceGraph,
  lineage: KpSemanticLineageGraph
): readonly KpSalienceGraphIssue[] {
  const issues: KpSalienceGraphIssue[] = [];
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const lineageEdges = new Map(lineage.edges.map((edge) => [edge.id, edge]));
  const edges = new Map(graph.edges.map((edge) => [edge.id, edge]));

  graph.nodes.forEach((node, index) => {
    requireUnit(node.readinessThreshold, `nodes[${index}].readinessThreshold`, issues);
    if (node.entityIds.length === 0) {
      issues.push({ path: `nodes[${index}].entityIds`, message: "Salience nodes require semantic entities." });
    }
  });
  graph.edges.forEach((edge, index) => {
    const path = `edges[${index}]`;
    if (!nodes.has(edge.sourceNodeId)) issue(`${path}.sourceNodeId`, `Unknown salience node ${edge.sourceNodeId}.`, issues);
    if (!nodes.has(edge.targetNodeId)) issue(`${path}.targetNodeId`, `Unknown salience node ${edge.targetNodeId}.`, issues);
    if (!lineageEdges.has(edge.lineageEdgeId)) issue(`${path}.lineageEdgeId`, `Unknown lineage edge ${edge.lineageEdgeId}.`, issues);
    requireUnit(edge.targetReadyAt, `${path}.targetReadyAt`, issues);
    requireUnit(edge.sourceReleaseAt, `${path}.sourceReleaseAt`, issues);
    if (edge.targetReadyAt > edge.sourceReleaseAt) {
      issue(path, `Salience handoff ${edge.id} releases its source before the target is ready.`, issues);
    }
  });

  graph.branchGroups.forEach((group, index) => {
    const path = `branchGroups[${index}]`;
    const members = group.edgeIds.map((id) => edges.get(id));
    if (!nodes.has(group.reunificationNodeId)) {
      issue(`${path}.reunificationNodeId`, `Unknown reunification node ${group.reunificationNodeId}.`, issues);
    }
    requireUnit(group.reunifyAt, `${path}.reunifyAt`, issues);
    if (members.some((edge) => edge === undefined) || members.length < 2) {
      issue(`${path}.edgeIds`, `Salience branch ${group.id} requires at least two valid edges.`, issues);
      return;
    }
    const branchEdges = members.filter((edge): edge is KpSalienceTransferEdge => edge !== undefined);
    const weight = branchEdges.reduce((sum, edge) => sum + (edge.branchWeight ?? 0), 0);
    if (Math.abs(weight - 1) > 1e-9) {
      issue(`${path}.edgeIds`, `Salience branch ${group.id} weights must sum to 1.`, issues);
    }
    branchEdges.forEach((edge) => {
      const relation = lineageEdges.get(edge.lineageEdgeId)?.relation;
      if (edge.branchGroupId !== group.id || !branchingRelation(relation)) {
        issue(`${path}.edgeIds`, `Salience branch ${group.id} must follow authored split or copy lineage.`, issues);
      }
    });
  });
  return issues;
}

export function sampleKpTransferableSalienceGraph(
  graph: KpTransferableSalienceGraph,
  progress: number
): KpSalienceSample {
  const p = clamp(progress);
  const weights = new Map(graph.nodes.map((node) => [node.id, 0]));
  graph.edges.forEach((edge) => {
    const branchWeight = edge.branchWeight ?? 1;
    const targetWeight = ramp(p, edge.targetReadyAt) * branchWeight;
    const sourceWeight = (1 - ramp(p, edge.sourceReleaseAt)) * branchWeight;
    weights.set(edge.sourceNodeId, Math.max(weights.get(edge.sourceNodeId) ?? 0, sourceWeight));
    weights.set(edge.targetNodeId, Math.max(weights.get(edge.targetNodeId) ?? 0, targetWeight));
  });
  graph.branchGroups.forEach((group) => {
    const reunionProgress = windowRamp(p, group.reunifyAt, 1);
    weights.set(
      group.reunificationNodeId,
      Math.max(weights.get(group.reunificationNodeId) ?? 0, reunionProgress)
    );
    group.edgeIds.forEach((edgeId) => {
      const targetNodeId = graph.edges.find((edge) => edge.id === edgeId)?.targetNodeId;
      if (targetNodeId === undefined) return;
      weights.set(
        targetNodeId,
        (weights.get(targetNodeId) ?? 0) * (1 - reunionProgress)
      );
    });
  });
  const nodeWeights = Object.fromEntries(
    [...weights].map(([id, weight]) => [id, round(weight)])
  );
  const explanatoryEntityIds = graph.nodes
    .filter((node) => (nodeWeights[node.id] ?? 0) > 0)
    .flatMap((node) => node.entityIds);
  return {
    progress: p,
    nodeWeights,
    explanatoryEntityIds: [...new Set(explanatoryEntityIds)]
  };
}

function branchingRelation(
  relation: KpSemanticLineageRelation | undefined
): boolean {
  return relation === "split" || relation === "copy";
}

function requireUnit(value: number, path: string, issues: KpSalienceGraphIssue[]): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    issue(path, "Expected a normalized value between 0 and 1.", issues);
  }
}

function issue(path: string, message: string, issues: KpSalienceGraphIssue[]): void {
  issues.push({ path, message });
}

function ramp(progress: number, threshold: number): number {
  if (threshold <= 0) return 1;
  return clamp(progress / threshold);
}

function windowRamp(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp((progress - start) / (end - start));
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
