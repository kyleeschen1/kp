import {
  kpCanonicalLogExponentContinuity,
  type KpLogExponentContinuityPlan
} from "./log-exponent-continuity.ts";
import {
  validateKpTransferableSalienceGraph,
  type KpTransferableSalienceGraph
} from "./salience-graph.ts";
import {
  createKpSemanticSalienceState,
  type KpSemanticSalienceState
} from "./semantic-salience-state.ts";
import {
  requireKpLogExponentOperationPresentation
} from "./log-exponent-operation-presentation-registry.ts";

export type KpLogExponentAttentionPhase = "orient" | "act" | "settle";

export interface KpLogExponentSalienceAssignment {
  readonly entityId: string;
  readonly state: KpSemanticSalienceState;
}

export interface KpLogExponentAttentionStage {
  readonly id: string;
  readonly phase: KpLogExponentAttentionPhase;
  readonly assignments: readonly KpLogExponentSalienceAssignment[];
}

export interface KpLogExponentSaliencePlan {
  readonly operationId: string;
  readonly graph: KpTransferableSalienceGraph;
  readonly stages: readonly KpLogExponentAttentionStage[];
}

export function compileKpLogExponentSalience(
  continuity: readonly KpLogExponentContinuityPlan[] =
    kpCanonicalLogExponentContinuity
): readonly KpLogExponentSaliencePlan[] {
  return Object.freeze(continuity.map((plan) => {
    const graph = compileTransferGraph(plan);
    const issues = validateKpTransferableSalienceGraph(graph, plan.lineage);
    if (issues.length > 0) throw new Error(issues[0]!.message);
    const allEntityIds = Object.freeze([
      ...new Set([
        ...plan.lineage.sourceEntityIds,
        ...plan.lineage.targetEntityIds
      ])
    ]);
    const focus = requireKpLogExponentOperationPresentation(
      plan.operationId
    ).focus;
    const stages = Object.freeze([
      stage(`${plan.operationId}.orient`, "orient", focus.orient, focus.orientSecondary, allEntityIds),
      stage(`${plan.operationId}.act`, "act", focus.act, focus.actSecondary, allEntityIds),
      stage(`${plan.operationId}.settle`, "settle", focus.settle, focus.settleSecondary, allEntityIds)
    ]);
    return Object.freeze({ operationId: plan.operationId, graph, stages });
  }));
}

export const kpCanonicalLogExponentSalience =
  compileKpLogExponentSalience();

function compileTransferGraph(
  plan: KpLogExponentContinuityPlan
): KpTransferableSalienceGraph {
  const lineageById = new Map(plan.lineage.edges.map((edge) => [edge.id, edge]));
  const continuants = plan.vocabulary.continuants;
  const nodes = Object.freeze(continuants.flatMap((continuant) => [
    Object.freeze({
      id: `salience.${continuant.id}.source`,
      entityIds: Object.freeze([...continuant.source.selectorIds]),
      role: "source" as const,
      readinessThreshold: 0.58
    }),
    Object.freeze({
      id: `salience.${continuant.id}.target`,
      entityIds: Object.freeze([...continuant.target.selectorIds]),
      role: "target" as const,
      readinessThreshold: 0.72
    })
  ]));
  const edges = Object.freeze(continuants.map((continuant) => {
    const correspondenceId = continuant.identityAuthority.kind === "correspondence"
      ? continuant.identityAuthority.correspondenceRecordId
      : continuant.identityAuthority.bindingId;
    const lineageEdgeId = `lineage.${correspondenceId}`;
    if (!lineageById.has(lineageEdgeId)) {
      throw new Error(`Salience transfer lacks lineage ${lineageEdgeId}.`);
    }
    const isUnknown = correspondenceId.endsWith("unknown-x");
    return Object.freeze({
      id: `salience.${continuant.id}.handoff`,
      sourceNodeId: `salience.${continuant.id}.source`,
      targetNodeId: `salience.${continuant.id}.target`,
      lineageEdgeId,
      targetReadyAt: isUnknown ? 0.62 : 0.7,
      sourceReleaseAt: isUnknown ? 0.86 : 0.9
    });
  }));
  return Object.freeze({
    id: `salience.${plan.operationId}`,
    kind: "transferable-salience-graph" as const,
    nodes,
    edges,
    branchGroups: Object.freeze([])
  });
}

function stage(
  id: string,
  phase: KpLogExponentAttentionPhase,
  primary: readonly string[],
  secondary: readonly string[],
  allEntityIds: readonly string[]
): KpLogExponentAttentionStage {
  const primarySet = new Set(primary);
  const secondarySet = new Set(secondary);
  const unknown = [...primary, ...secondary].find((entityId) =>
    !allEntityIds.includes(entityId)
  );
  if (unknown !== undefined || primary.some((id) => secondarySet.has(id))) {
    throw new Error(`Attention stage ${id} has an unknown or multiply assigned entity ${unknown ?? ""}.`);
  }
  return Object.freeze({
    id,
    phase,
    assignments: Object.freeze(allEntityIds.map((entityId) =>
      Object.freeze({
        entityId,
        state: createKpSemanticSalienceState({
          level: primarySet.has(entityId)
            ? "focus"
            : secondarySet.has(entityId)
              ? "normal"
              : "context",
          identityFamily: "neutral",
          // Presence stays full; paint adapters decide how semantic levels read.
          presence: 1
        })
      })
    ))
  });
}
