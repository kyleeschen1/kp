import {
  validateKpSemanticLineageGraph,
  type KpSemanticLineageEdge,
  type KpSemanticLineageGraph
} from "../semantic/semantic-lineage-graph.ts";

export type KpFissionFusionMode = "fission" | "fusion";

export const kpFissionFusionPhaseIds = [
  "focus-material",
  "approach-junction",
  "transfer-ownership",
  "transit-material",
  "recognize-targets",
  "settle-targets"
] as const;

export type KpFissionFusionPhaseId = typeof kpFissionFusionPhaseIds[number];

export interface KpFissionFusionBranchPlan {
  readonly id: string;
  readonly semanticRank: number;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly pathId: string;
}

export interface KpFissionFusionPlan {
  readonly kind: "fission-fusion-plan";
  readonly id: string;
  readonly mode: KpFissionFusionMode;
  readonly lineageGraphId: string;
  readonly lineageEdgeId: string;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly semanticOrder: readonly string[];
  readonly branches: readonly KpFissionFusionBranchPlan[];
  readonly phaseIds: readonly KpFissionFusionPhaseId[];
  readonly transferEvent: {
    readonly id: string;
    readonly kind: "shared-birth" | "shared-fusion";
    readonly progress: number;
  };
  readonly microStaggerSpan: number;
  readonly junctionScale: number;
  readonly reverseInterpretation: "fuse-descendants" | "split-origin";
  readonly reverseOfPlanId?: string | undefined;
}

export interface KpFissionFusionOwnershipFrame {
  readonly kind: "exclusive-material-ownership";
  readonly ownerSide: "sources" | "targets";
  readonly ownerEntityIds: readonly string[];
  readonly pendingEntityIds: readonly string[];
  readonly retiredEntityIds: readonly string[];
  readonly transferEventId: string;
  readonly transferOccurred: boolean;
}

export interface KpFissionFusionEntityFrame {
  readonly entityId: string;
  readonly semanticRank: number;
  readonly opacity: 0 | 1;
  readonly scale: number;
  readonly junctionProgress: number;
  readonly pathProgress: number;
  readonly ownsMaterial: boolean;
  readonly recognizable: boolean;
}

export interface KpFissionFusionFrame {
  readonly kind: "fission-fusion-frame";
  readonly planId: string;
  readonly mode: KpFissionFusionMode;
  readonly progress: number;
  readonly phases: Readonly<Record<KpFissionFusionPhaseId, number>>;
  readonly ownership: KpFissionFusionOwnershipFrame;
  readonly sources: readonly KpFissionFusionEntityFrame[];
  readonly targets: readonly KpFissionFusionEntityFrame[];
  readonly allRequiredSourcesReady: boolean;
  readonly targetRecognizable: boolean;
  readonly settled: boolean;
}

export interface KpFissionFusionLawIssue {
  readonly code:
    | "fission-fusion.invalid-mode"
    | "fission-fusion.invalid-forward-endpoints"
    | "fission-fusion.invalid-reverse-endpoints"
    | "fission-fusion.nonexclusive-ownership"
    | "fission-fusion.premature-fusion"
    | "fission-fusion.unshared-transfer";
  readonly message: string;
}

export function compileKpFissionFusionPlan(input: {
  readonly id: string;
  readonly mode: KpFissionFusionMode;
  readonly lineageGraph: KpSemanticLineageGraph;
  readonly lineageEdgeId?: string | undefined;
  readonly semanticOrder?: readonly string[] | undefined;
  readonly microStaggerSpan?: number | undefined;
  readonly junctionScale?: number | undefined;
}): KpFissionFusionPlan {
  const issues = validateKpSemanticLineageGraph(input.lineageGraph);
  if (issues.length > 0) {
    throw new Error(`Cannot compile fission/fusion: ${issues[0]!.message}`);
  }
  const relation = input.mode === "fission" ? "split" : "merge";
  const candidates = input.lineageGraph.edges.filter((edge) => edge.relation === relation);
  const edge = input.lineageEdgeId === undefined
    ? candidates.length === 1 ? candidates[0] : undefined
    : candidates.find((candidate) => candidate.id === input.lineageEdgeId);
  if (edge === undefined) {
    throw new Error(
      `Fission/fusion ${input.id} requires one explicit ${relation} lineage edge.`
    );
  }
  const semanticEntities = input.mode === "fission"
    ? edge.targetEntityIds
    : edge.sourceEntityIds;
  const semanticOrder = input.semanticOrder ?? semanticEntities;
  requireExactOrder(semanticOrder, semanticEntities, input.id);
  const microStaggerSpan = input.microStaggerSpan ?? 0.08;
  if (!Number.isFinite(microStaggerSpan) || microStaggerSpan < 0 || microStaggerSpan > 0.12) {
    throw new Error("Fission/fusion microStaggerSpan must be between zero and 0.12.");
  }
  const junctionScale = input.junctionScale ?? 0.72;
  if (!Number.isFinite(junctionScale) || junctionScale <= 0 || junctionScale > 1) {
    throw new Error("Fission/fusion junctionScale must be greater than zero and at most one.");
  }
  return planFromEdge({
    id: input.id,
    mode: input.mode,
    lineageGraphId: input.lineageGraph.id,
    edge,
    semanticOrder,
    microStaggerSpan,
    junctionScale
  });
}

/**
 * The reverse is a separately planned semantic operation. Keeping the same
 * semantic order makes fusion causally legible instead of merely replaying the
 * later fission branch first.
 */
export function reverseKpFissionFusionPlan(input: {
  readonly id: string;
  readonly plan: KpFissionFusionPlan;
  readonly semanticOrder?: readonly string[] | undefined;
}): KpFissionFusionPlan {
  const mode: KpFissionFusionMode = input.plan.mode === "fission" ? "fusion" : "fission";
  const sourceEntityIds = [...input.plan.targetEntityIds];
  const targetEntityIds = [...input.plan.sourceEntityIds];
  const semanticEntities = mode === "fission" ? targetEntityIds : sourceEntityIds;
  const semanticOrder = input.semanticOrder ?? semanticEntities;
  requireExactOrder(semanticOrder, semanticEntities, input.id);
  const edge: KpSemanticLineageEdge = {
    id: `${input.plan.lineageEdgeId}.reverse`,
    relation: mode === "fission" ? "split" : "merge",
    sourceEntityIds,
    targetEntityIds,
    summary: `Explicit ${mode} reverse of ${input.plan.id}.`
  };
  return {
    ...planFromEdge({
      id: input.id,
      mode,
      lineageGraphId: `${input.plan.lineageGraphId}.reverse`,
      edge,
      semanticOrder,
      microStaggerSpan: input.plan.microStaggerSpan,
      junctionScale: input.plan.junctionScale
    }),
    reverseOfPlanId: input.plan.id
  };
}

export function sampleKpFissionFusion(input: {
  readonly plan: KpFissionFusionPlan;
  readonly progress: number;
}): KpFissionFusionFrame {
  const progress = clamp01(input.progress);
  const transferOccurred = progress >= input.plan.transferEvent.progress;
  const rankByEntityId = new Map(
    input.plan.semanticOrder.map((entityId, rank) => [entityId, rank] as const)
  );
  const phases = phaseProgress(input.plan, progress);
  const sources = input.plan.sourceEntityIds.map((entityId) => {
    const semanticRank = input.plan.mode === "fusion"
      ? rankByEntityId.get(entityId) ?? 0
      : 0;
    const rankOffset = staggerOffset(
      semanticRank,
      input.plan.semanticOrder.length,
      input.plan.microStaggerSpan
    );
    const junctionProgress = input.plan.mode === "fusion"
      ? easeInOut(interval(progress, 0.12 + rankOffset, 0.5 + rankOffset))
      : easeInOut(interval(progress, 0.12, input.plan.transferEvent.progress));
    return entityFrame({
      entityId,
      semanticRank,
      visible: !transferOccurred,
      ownsMaterial: !transferOccurred,
      scale: interpolate(1, input.plan.junctionScale, junctionProgress),
      junctionProgress,
      pathProgress: junctionProgress,
      recognizable: !transferOccurred
    });
  });
  const allRequiredSourcesReady = sources.every((source) => source.junctionProgress >= 1);
  const targets = input.plan.targetEntityIds.map((entityId) => {
    const semanticRank = input.plan.mode === "fission"
      ? rankByEntityId.get(entityId) ?? 0
      : 0;
    const rankOffset = staggerOffset(
      semanticRank,
      input.plan.semanticOrder.length,
      input.plan.microStaggerSpan
    );
    const pathProgress = !transferOccurred
      ? 0
      : input.plan.mode === "fission"
        ? easeInOut(interval(
            progress,
            input.plan.transferEvent.progress + rankOffset,
            0.8 + rankOffset
          ))
        : easeInOut(interval(progress, input.plan.transferEvent.progress, 0.88));
    return entityFrame({
      entityId,
      semanticRank,
      visible: transferOccurred,
      ownsMaterial: transferOccurred,
      scale: interpolate(input.plan.junctionScale, 1, pathProgress),
      junctionProgress: transferOccurred ? 1 : 0,
      pathProgress,
      recognizable: transferOccurred && pathProgress >= 0.72
    });
  });
  const targetRecognizable = targets.every((target) => target.recognizable);
  const settled = targets.every((target) => target.pathProgress >= 1);
  const ownerEntityIds = transferOccurred
    ? input.plan.targetEntityIds
    : input.plan.sourceEntityIds;
  return {
    kind: "fission-fusion-frame",
    planId: input.plan.id,
    mode: input.plan.mode,
    progress,
    phases,
    ownership: {
      kind: "exclusive-material-ownership",
      ownerSide: transferOccurred ? "targets" : "sources",
      ownerEntityIds: [...ownerEntityIds],
      pendingEntityIds: [...(transferOccurred ? [] : input.plan.targetEntityIds)],
      retiredEntityIds: [...(transferOccurred ? input.plan.sourceEntityIds : [])],
      transferEventId: input.plan.transferEvent.id,
      transferOccurred
    },
    sources,
    targets,
    allRequiredSourcesReady,
    targetRecognizable,
    settled
  };
}

export function evaluateKpFissionFusionLaws(input: {
  readonly plan: KpFissionFusionPlan;
  readonly reversePlan: KpFissionFusionPlan;
}): readonly KpFissionFusionLawIssue[] {
  const issues: KpFissionFusionLawIssue[] = [];
  const start = sampleKpFissionFusion({ plan: input.plan, progress: 0 });
  const end = sampleKpFissionFusion({ plan: input.plan, progress: 1 });
  const reverseStart = sampleKpFissionFusion({ plan: input.reversePlan, progress: 0 });
  const reverseEnd = sampleKpFissionFusion({ plan: input.reversePlan, progress: 1 });
  if (input.plan.mode === input.reversePlan.mode) {
    issues.push({
      code: "fission-fusion.invalid-mode",
      message: "Fission/fusion reverse plan must use the opposite semantic mode."
    });
  }
  if (!sameIds(start.ownership.ownerEntityIds, input.plan.sourceEntityIds) ||
      !sameIds(end.ownership.ownerEntityIds, input.plan.targetEntityIds)) {
    issues.push({
      code: "fission-fusion.invalid-forward-endpoints",
      message: "Forward ownership must move wholly from sources to targets."
    });
  }
  if (!sameIds(reverseStart.ownership.ownerEntityIds, input.plan.targetEntityIds) ||
      !sameIds(reverseEnd.ownership.ownerEntityIds, input.plan.sourceEntityIds)) {
    issues.push({
      code: "fission-fusion.invalid-reverse-endpoints",
      message: "Reverse ownership must restore the original source material."
    });
  }
  for (let index = 0; index <= 100; index += 1) {
    const frame = sampleKpFissionFusion({ plan: input.plan, progress: index / 100 });
    const visibleOwners = [...frame.sources, ...frame.targets].filter(
      (entity) => entity.ownsMaterial
    ).map((entity) => entity.entityId);
    if (!sameIds(visibleOwners, frame.ownership.ownerEntityIds)) {
      issues.push({
        code: "fission-fusion.nonexclusive-ownership",
        message: `Frame ${index} has visual owners that disagree with semantic ownership.`
      });
      break;
    }
    if (input.plan.mode === "fusion" && frame.ownership.transferOccurred &&
        !frame.allRequiredSourcesReady) {
      issues.push({
        code: "fission-fusion.premature-fusion",
        message: "Fusion transferred ownership before every origin reached the junction."
      });
      break;
    }
    const targetOwnershipStates = frame.targets.map((target) => target.ownsMaterial);
    if (targetOwnershipStates.some(Boolean) && !targetOwnershipStates.every(Boolean)) {
      issues.push({
        code: "fission-fusion.unshared-transfer",
        message: "Fission/fusion targets must receive ownership in one shared event."
      });
      break;
    }
  }
  return issues;
}

function planFromEdge(input: {
  readonly id: string;
  readonly mode: KpFissionFusionMode;
  readonly lineageGraphId: string;
  readonly edge: KpSemanticLineageEdge;
  readonly semanticOrder: readonly string[];
  readonly microStaggerSpan: number;
  readonly junctionScale: number;
}): KpFissionFusionPlan {
  const sourceEntityIds = [...input.edge.sourceEntityIds];
  const targetEntityIds = [...input.edge.targetEntityIds];
  const transferProgress = input.mode === "fission"
    ? 0.36
    : 0.52 + input.microStaggerSpan;
  const branches = input.semanticOrder.map((entityId, semanticRank) => ({
    id: `${input.id}.branch.${semanticRank}`,
    semanticRank,
    sourceEntityId: input.mode === "fission" ? sourceEntityIds[0]! : entityId,
    targetEntityId: input.mode === "fission" ? entityId : targetEntityIds[0]!,
    pathId: `${input.id}.path.${input.edge.id}.${entityId}`
  }));
  return {
    kind: "fission-fusion-plan",
    id: input.id,
    mode: input.mode,
    lineageGraphId: input.lineageGraphId,
    lineageEdgeId: input.edge.id,
    sourceEntityIds,
    targetEntityIds,
    semanticOrder: [...input.semanticOrder],
    branches,
    phaseIds: [...kpFissionFusionPhaseIds],
    transferEvent: {
      id: `${input.id}.${input.mode === "fission" ? "birth" : "fusion"}`,
      kind: input.mode === "fission" ? "shared-birth" : "shared-fusion",
      progress: transferProgress
    },
    microStaggerSpan: input.microStaggerSpan,
    junctionScale: input.junctionScale,
    reverseInterpretation: input.mode === "fission" ? "fuse-descendants" : "split-origin"
  };
}

function phaseProgress(
  plan: KpFissionFusionPlan,
  progress: number
): Readonly<Record<KpFissionFusionPhaseId, number>> {
  const transfer = progress >= plan.transferEvent.progress ? 1 : 0;
  return {
    "focus-material": easeInOut(interval(progress, 0, 0.16)),
    "approach-junction": easeInOut(interval(progress, 0.12, plan.transferEvent.progress)),
    "transfer-ownership": transfer,
    "transit-material": transfer
      ? easeInOut(interval(progress, plan.transferEvent.progress, 0.88))
      : 0,
    "recognize-targets": easeInOut(interval(progress, 0.72, 0.94)),
    "settle-targets": easeInOut(interval(progress, 0.9, 1))
  };
}

function entityFrame(input: {
  readonly entityId: string;
  readonly semanticRank: number;
  readonly visible: boolean;
  readonly ownsMaterial: boolean;
  readonly scale: number;
  readonly junctionProgress: number;
  readonly pathProgress: number;
  readonly recognizable: boolean;
}): KpFissionFusionEntityFrame {
  return {
    entityId: input.entityId,
    semanticRank: input.semanticRank,
    opacity: input.visible ? 1 : 0,
    scale: round(input.scale),
    junctionProgress: round(input.junctionProgress),
    pathProgress: round(input.pathProgress),
    ownsMaterial: input.ownsMaterial,
    recognizable: input.recognizable
  };
}

function requireExactOrder(
  order: readonly string[],
  entities: readonly string[],
  planId: string
): void {
  if (order.length !== entities.length || !sameIds(order, entities)) {
    throw new Error(
      `Fission/fusion ${planId} semanticOrder must name every staggered entity exactly once.`
    );
  }
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((id) => right.includes(id)) &&
    new Set(left).size === left.length &&
    new Set(right).size === right.length;
}

function staggerOffset(rank: number, count: number, span: number): number {
  return count <= 1 ? 0 : rank / (count - 1) * span;
}

function interval(value: number, start: number, end: number): number {
  return clamp01((value - start) / (end - start));
}

function easeInOut(value: number): number {
  return value * value * (3 - 2 * value);
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function round(value: number): number {
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}
