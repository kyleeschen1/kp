import {
  validateKpSemanticLineageGraph,
  type KpSemanticLineageGraph
} from "../semantic/semantic-lineage-graph.ts";

export const kpCopyFanOutPhaseIds = [
  "contract-source",
  "branch-descendants",
  "transit-descendants",
  "arrive-descendants",
  "settle-descendants"
] as const;

export type KpCopyFanOutPhaseId = typeof kpCopyFanOutPhaseIds[number];

export interface KpCopyFanOutDescendantPlan {
  readonly entityId: string;
  readonly lineageEdgeId: string;
  readonly pathId: string;
  readonly branchIndex: number;
}

export interface KpCopyFanOutChoreographyPlan {
  readonly kind: "copy-fan-out-choreography-plan";
  readonly id: string;
  readonly lineageGraphId: string;
  readonly sourceEntityId: string;
  readonly persistentTargetEntityId?: string | undefined;
  readonly phaseIds: readonly KpCopyFanOutPhaseId[];
  readonly sourceMinimumScale: number;
  readonly descendants: readonly KpCopyFanOutDescendantPlan[];
}

export interface KpCopyFanOutChoreographyFrame {
  readonly kind: "copy-fan-out-choreography-frame";
  readonly planId: string;
  readonly direction: "forward" | "rewind";
  readonly progress: number;
  readonly semanticProgress: number;
  readonly phases: Readonly<Record<KpCopyFanOutPhaseId, number>>;
  readonly source: {
    readonly entityId: string;
    readonly opacity: 1;
    readonly scale: number;
  };
  readonly descendants: readonly {
    readonly entityId: string;
    readonly lineageEdgeId: string;
    readonly pathId: string;
    readonly branchIndex: number;
    readonly opacity: number;
    readonly scale: number;
    readonly pathProgress: number;
  }[];
}

export function compileKpCopyFanOutChoreography(input: {
  readonly id: string;
  readonly lineageGraph: KpSemanticLineageGraph;
  readonly sourceEntityId: string;
  readonly sourceMinimumScale?: number | undefined;
}): KpCopyFanOutChoreographyPlan {
  const issues = validateKpSemanticLineageGraph(input.lineageGraph);
  if (issues.length > 0) {
    throw new Error(`Cannot compile copy/fan-out choreography: ${issues[0]!.message}`);
  }
  if (!input.lineageGraph.sourceEntityIds.includes(input.sourceEntityId)) {
    throw new Error(`Copy/fan-out source ${input.sourceEntityId} is not in lineage graph ${input.lineageGraph.id}.`);
  }
  const sourceMinimumScale = input.sourceMinimumScale ?? 0.68;
  if (!(sourceMinimumScale > 0 && sourceMinimumScale <= 1)) {
    throw new Error("Copy/fan-out sourceMinimumScale must be greater than zero and at most one.");
  }

  const descendantEntries = input.lineageGraph.edges.flatMap((edge) => {
    if (
      !edge.sourceEntityIds.includes(input.sourceEntityId) ||
      (edge.relation !== "copy" && edge.relation !== "split")
    ) {
      return [];
    }
    return edge.targetEntityIds.map((entityId) => ({
      entityId,
      lineageEdgeId: edge.id
    }));
  });
  if (descendantEntries.length === 0) {
    throw new Error(`Lineage source ${input.sourceEntityId} has no copy or split descendants.`);
  }

  const persistentTargetEntityId = input.lineageGraph.edges.find(
    (edge) => edge.relation === "persist" && edge.sourceEntityIds[0] === input.sourceEntityId
  )?.targetEntityIds[0];

  return {
    kind: "copy-fan-out-choreography-plan",
    id: input.id,
    lineageGraphId: input.lineageGraph.id,
    sourceEntityId: input.sourceEntityId,
    ...(persistentTargetEntityId === undefined ? {} : { persistentTargetEntityId }),
    phaseIds: [...kpCopyFanOutPhaseIds],
    sourceMinimumScale,
    descendants: descendantEntries.map((descendant, branchIndex) => ({
      ...descendant,
      pathId: `${input.id}.path.${descendant.lineageEdgeId}.${descendant.entityId}`,
      branchIndex
    }))
  };
}

export function sampleKpCopyFanOutChoreography(input: {
  readonly plan: KpCopyFanOutChoreographyPlan;
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
}): KpCopyFanOutChoreographyFrame {
  const progress = clamp01(input.progress);
  const direction = input.direction ?? "forward";
  const semanticProgress = direction === "forward" ? progress : 1 - progress;
  const phases = {
    "contract-source": intervalProgress(semanticProgress, 0, 0.2),
    "branch-descendants": intervalProgress(semanticProgress, 0.2, 0.36),
    "transit-descendants": intervalProgress(semanticProgress, 0.34, 0.78),
    "arrive-descendants": intervalProgress(semanticProgress, 0.72, 0.92),
    "settle-descendants": intervalProgress(semanticProgress, 0.9, 1)
  };
  const sourceScale = interpolate(
    1,
    input.plan.sourceMinimumScale,
    phases["contract-source"]
  );

  return {
    kind: "copy-fan-out-choreography-frame",
    planId: input.plan.id,
    direction,
    progress,
    semanticProgress,
    phases,
    // Fan-out preserves its source; a composed eliminate operation may remove
    // it only after every descendant has arrived.
    source: {
      entityId: input.plan.sourceEntityId,
      opacity: 1,
      scale: sourceScale
    },
    descendants: input.plan.descendants.map((descendant) => ({
      ...descendant,
      opacity: phases["branch-descendants"],
      scale: interpolate(
        input.plan.sourceMinimumScale,
        1,
        phases["arrive-descendants"]
      ),
      pathProgress: phases["transit-descendants"]
    }))
  };
}

function intervalProgress(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  const local = (progress - start) / (end - start);
  return local * local * (3 - 2 * local);
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
