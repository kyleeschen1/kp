import type { KpCanonicalOperationExecutionResult } from "../semantic/transformation-definition-binding.ts";
import {
  validateKpSemanticLineageGraph,
  type KpSemanticLineageRelation
} from "../semantic/semantic-lineage-graph.ts";

export type KpReconciliationLineageKind =
  | "one-to-one"
  | "many-to-one"
  | "one-to-many"
  | "introduction"
  | "removal";

export interface KpReconciliationLineageGroup {
  readonly id: string;
  readonly kind: KpReconciliationLineageKind;
  readonly relation: KpSemanticLineageRelation;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly authority: {
    readonly executionTransformationId: string;
    readonly operationSpecId: string;
    readonly lineageGraphId: string;
    readonly lineageEdgeId: string;
  };
}

export interface KpCanonicalLineageProjection {
  readonly kind: "canonical-lineage-projection";
  readonly id: string;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly groups: readonly KpReconciliationLineageGroup[];
}

/**
 * Projection is intentionally glyph-blind: semantic execution decides which
 * entities may reconcile before a renderer contributes visual observations.
 */
export function projectKpCanonicalExecutionLineage(
  execution: KpCanonicalOperationExecutionResult
): KpCanonicalLineageProjection {
  const issues = validateKpSemanticLineageGraph(execution.lineageGraph);
  if (issues.length > 0) {
    throw new Error(
      `Canonical execution ${execution.transformationId} has invalid lineage: ${issues[0]!.message}`
    );
  }
  if (execution.transformationId.trim().length === 0 || execution.operationSpecId.trim().length === 0) {
    throw new Error("Canonical execution lineage requires transformation and operation spec ids.");
  }

  const sourceEntityIds = uniqueEndpoints(execution.lineageGraph.sourceEntityIds, "source");
  const targetEntityIds = uniqueEndpoints(execution.lineageGraph.targetEntityIds, "target");
  const groups = execution.lineageGraph.edges.map((edge) => ({
    id: `reconcile.${edge.id}`,
    kind: lineageKind(edge.sourceEntityIds.length, edge.targetEntityIds.length),
    relation: edge.relation,
    sourceEntityIds: [...edge.sourceEntityIds],
    targetEntityIds: [...edge.targetEntityIds],
    authority: {
      executionTransformationId: execution.transformationId,
      operationSpecId: execution.operationSpecId,
      lineageGraphId: execution.lineageGraph.id,
      lineageEdgeId: edge.id
    }
  }));

  return Object.freeze({
    kind: "canonical-lineage-projection",
    id: `reconciliation-lineage.${execution.transformationId}`,
    sourceEntityIds: Object.freeze([...sourceEntityIds]),
    targetEntityIds: Object.freeze([...targetEntityIds]),
    groups: Object.freeze(groups.map((group) => Object.freeze({
      ...group,
      sourceEntityIds: Object.freeze(group.sourceEntityIds),
      targetEntityIds: Object.freeze(group.targetEntityIds),
      authority: Object.freeze(group.authority)
    })))
  });
}

function lineageKind(sourceCount: number, targetCount: number): KpReconciliationLineageKind {
  if (sourceCount === 0) return "introduction";
  if (targetCount === 0) return "removal";
  if (sourceCount > 1 && targetCount === 1) return "many-to-one";
  if (sourceCount === 1 && targetCount > 1) return "one-to-many";
  return "one-to-one";
}

function uniqueEndpoints(ids: readonly string[], side: "source" | "target"): readonly string[] {
  const unique = new Set(ids);
  if (unique.size !== ids.length || ids.some((id) => id.trim().length === 0)) {
    throw new Error(`Canonical execution has invalid ${side} entity ids.`);
  }
  return [...ids];
}
