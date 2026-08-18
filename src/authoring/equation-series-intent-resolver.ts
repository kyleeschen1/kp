import {
  segmentKpEquationSeriesAdjacencies,
  type KpEquationSeriesAdjacencyAnalysis,
  type KpEquationSeriesSegment,
  type KpEquationSeriesSegmentationRepair
} from "./equation-series-adjacency-segmentation.ts";
import {
  kpEquationSeriesOperationRegistry,
  type KpEquationSeriesOperationDeclaration,
  type KpEquationSeriesOperationRegistry
} from "./equation-series-operation-declarations.ts";
import type { KpEquationTransformSeriesRequest } from
  "./equation-transform-series-request.ts";

export type KpEquationSeriesIntentProposal =
  | Readonly<{
      adjacencyId: string;
      kind: "single";
      operationId: string;
    }>
  | Readonly<{
      adjacencyId: string;
      kind: "sequence";
      operationIds: readonly [string, string, ...string[]];
    }>
  | Readonly<{
      adjacencyId: string;
      kind: "alternatives";
      operationIds: readonly [string, string, ...string[]];
    }>;

export interface KpResolvedEquationSeriesAdjacencyPlan
  extends KpEquationSeriesSegment {
  readonly declaration: KpEquationSeriesOperationDeclaration;
}

export type KpEquationSeriesIntentResolutionResult =
  | Readonly<{
      status: "resolved";
      analyses: readonly KpEquationSeriesAdjacencyAnalysis[];
      plans: readonly KpResolvedEquationSeriesAdjacencyPlan[];
      repairs: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      analyses: readonly KpEquationSeriesAdjacencyAnalysis[];
      repairs: readonly KpEquationSeriesSegmentationRepair[];
    }>;

/** Resolve semantic IDs from declarations; never derive a law from glyphs. */
export function resolveKpEquationSeriesIntents(input: {
  readonly request: KpEquationTransformSeriesRequest;
  readonly proposals?: readonly KpEquationSeriesIntentProposal[] | undefined;
  readonly registry?: KpEquationSeriesOperationRegistry | undefined;
}): KpEquationSeriesIntentResolutionResult {
  const registry = input.registry ?? kpEquationSeriesOperationRegistry;
  const proposals = input.proposals ?? [];
  const analyses = input.request.adjacencies.map((adjacency, index) => {
    if (adjacency.intent.mode === "explicit") {
      return analyzeSingle(
        adjacency.id,
        adjacency.intent.operationId,
        registry
      );
    }
    const proposal = proposals[index];
    if (proposal === undefined || proposal.adjacencyId !== adjacency.id) {
      return unresolved(
        adjacency.id,
        "Proposed intent requires ordered planner evidence for this adjacency."
      );
    }
    return analyzeProposal(proposal, registry);
  });
  const segmented = segmentKpEquationSeriesAdjacencies(
    input.request,
    analyses
  );
  if (segmented.status === "repair-required") return deepFreeze({
    status: "repair-required" as const,
    analyses,
    repairs: segmented.repairs
  });
  const plans = segmented.segments.map((segment) => ({
    ...segment,
    declaration: registry.byId[segment.operationId]!
  }));
  return deepFreeze({
    status: "resolved" as const,
    analyses,
    plans,
    repairs: [] as []
  });
}

function analyzeProposal(
  proposal: KpEquationSeriesIntentProposal,
  registry: KpEquationSeriesOperationRegistry
): KpEquationSeriesAdjacencyAnalysis {
  if (proposal.kind === "single") {
    return analyzeSingle(proposal.adjacencyId, proposal.operationId, registry);
  }
  const unknown = proposal.operationIds.filter((id) => registry.byId[id] === undefined);
  if (unknown.length > 0) return unresolved(
    proposal.adjacencyId,
    `Unregistered operation declarations: ${unknown.join(", ")}.`
  );
  return proposal.kind === "sequence"
    ? Object.freeze({
        adjacencyId: proposal.adjacencyId,
        status: "compound-operation" as const,
        operationIds: Object.freeze([...proposal.operationIds]) as
          readonly [string, string, ...string[]]
      })
    : Object.freeze({
        adjacencyId: proposal.adjacencyId,
        status: "ambiguous" as const,
        candidateOperationIds: Object.freeze([...proposal.operationIds]) as
          readonly [string, string, ...string[]]
      });
}

function analyzeSingle(
  adjacencyId: string,
  operationId: string,
  registry: KpEquationSeriesOperationRegistry
): KpEquationSeriesAdjacencyAnalysis {
  return registry.byId[operationId] === undefined
    ? unresolved(
        adjacencyId,
        `No registered equation operation declaration owns ${operationId}.`
      )
    : Object.freeze({
        adjacencyId,
        status: "single-operation" as const,
        operationId
      });
}

function unresolved(
  adjacencyId: string,
  reason: string
): KpEquationSeriesAdjacencyAnalysis {
  return Object.freeze({
    adjacencyId,
    status: "unresolved" as const,
    reason
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
