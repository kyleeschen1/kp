import {
  type KpFissionFusionFrame,
  type KpFissionFusionPlan
} from "./fission-fusion.ts";
import {
  kpFissionFusionCapability,
  type KpFissionFusionCapability
} from "./fission-fusion-capability.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";

export const kpFactoringChoreographyPhaseIds = [
  "focus-factor-copies",
  "preview-compaction",
  "collect-factor-copies",
  "introduce-grouping",
  "compact-addends",
  "settle-common-factor",
  "release-factor-focus"
] as const;

export type KpFactoringChoreographyPhaseId =
  typeof kpFactoringChoreographyPhaseIds[number];

export interface KpFactoringChoreographyPlan {
  readonly kind: "factoring-choreography-plan";
  readonly id: string;
  readonly factorCopyIds: readonly string[];
  readonly commonFactorId: string;
  readonly addendPairs: readonly {
    readonly sourceId: string;
    readonly targetId: string;
    readonly semanticIndex: number;
  }[];
  readonly connectorPairs: readonly {
    readonly sourceId: string;
    readonly targetId: string;
    readonly semanticIndex: number;
  }[];
  readonly groupingArtifactIds: readonly string[];
  readonly phaseIds: readonly KpFactoringChoreographyPhaseId[];
  readonly factorMinimumScale: number;
  readonly synchronization: "simultaneous";
  readonly fusionPlan: KpFissionFusionPlan;
}

export interface KpFactoringChoreographyFrame {
  readonly kind: "factoring-choreography-frame";
  readonly planId: string;
  readonly progress: number;
  readonly phases: Readonly<Record<KpFactoringChoreographyPhaseId, number>>;
  readonly focusStrength: number;
  readonly addendCompactionProgress: number;
  readonly groupingOpacity: number;
  readonly fusion: KpFissionFusionFrame;
  readonly commonFactor: { readonly opacity: number; readonly scale: number };
  readonly factorCopies: readonly {
    readonly entityId: string;
    readonly semanticIndex: number;
    readonly opacity: number;
    readonly scale: number;
    readonly pathProgress: number;
  }[];
}

export interface KpFactoringChoreographyDependencies {
  readonly fissionFusion: KpFissionFusionCapability;
}

const defaultDependencies: KpFactoringChoreographyDependencies =
  Object.freeze({ fissionFusion: kpFissionFusionCapability });

/**
 * The factor transfer is the canonical lineage core shared by full factoring
 * presentations and renderers that already have grouping structure in place.
 */
export function compileKpFactoringFusionPlan(input: {
  readonly id: string;
  readonly factorCopyIds: readonly string[];
  readonly commonFactorId: string;
  readonly factorMinimumScale?: number | undefined;
}, dependencies: KpFactoringChoreographyDependencies = defaultDependencies):
KpFissionFusionPlan {
  if (input.factorCopyIds.length < 2) {
    throw new Error("Factoring fusion requires at least two factor copies.");
  }
  const factorMinimumScale = input.factorMinimumScale ?? 0.82;
  if (!(factorMinimumScale > 0 && factorMinimumScale <= 1)) {
    throw new Error(
      "Factoring factorMinimumScale must be greater than zero and at most one."
    );
  }
  return dependencies.fissionFusion.compile({
    id: `${input.id}.factor-fusion`,
    mode: "fusion",
    lineageGraph: createKpSemanticLineageGraph({
      id: `${input.id}.factor-lineage`,
      sourceEntityIds: [...input.factorCopyIds],
      targetEntityIds: [input.commonFactorId],
      edges: [{
        id: `${input.id}.factor-merge`,
        relation: "merge",
        sourceEntityIds: [...input.factorCopyIds],
        targetEntityIds: [input.commonFactorId],
        summary: "Repeated factors fuse into one common factor."
      }]
    }),
    semanticOrder: input.factorCopyIds,
    // Common-factor extraction is one many-to-one semantic event. Staggering
    // identical contributors makes lineage appear sequential when it is not.
    microStaggerSpan: 0,
    junctionScale: factorMinimumScale
  });
}

export function sampleKpFactoringAddendCompactionProgress(
  progress: number
): number {
  const bounded = clamp01(progress);
  return 0.18 * intervalProgress(bounded, 0.08, 0.28) +
    0.82 * intervalProgress(bounded, 0.52, 0.78);
}

export function compileKpFactoringChoreography(input: {
  readonly id: string;
  readonly factorCopyIds: readonly string[];
  readonly commonFactorId: string;
  readonly addendPairs: KpFactoringChoreographyPlan["addendPairs"];
  readonly connectorPairs: KpFactoringChoreographyPlan["connectorPairs"];
  readonly groupingArtifactIds: readonly string[];
  readonly factorMinimumScale?: number | undefined;
}, dependencies: KpFactoringChoreographyDependencies = defaultDependencies):
KpFactoringChoreographyPlan {
  if (input.factorCopyIds.length < 2) {
    throw new Error("Factoring choreography requires at least two factor copies.");
  }
  if (input.addendPairs.length !== input.factorCopyIds.length) {
    throw new Error("Factoring choreography requires one addend pair per factor copy.");
  }
  if (input.connectorPairs.length !== input.addendPairs.length - 1) {
    throw new Error("Factoring choreography requires one connector pair between addends.");
  }
  if (input.groupingArtifactIds.length === 0) {
    throw new Error("Factoring choreography requires explicit target grouping artifacts.");
  }
  const factorMinimumScale = input.factorMinimumScale ?? 0.82;
  if (!(factorMinimumScale > 0 && factorMinimumScale <= 1)) {
    throw new Error("Factoring factorMinimumScale must be greater than zero and at most one.");
  }
  const fusionPlan = compileKpFactoringFusionPlan({
    id: input.id,
    factorCopyIds: input.factorCopyIds,
    commonFactorId: input.commonFactorId,
    factorMinimumScale
  }, dependencies);
  return {
    kind: "factoring-choreography-plan",
    id: input.id,
    factorCopyIds: [...input.factorCopyIds],
    commonFactorId: input.commonFactorId,
    addendPairs: input.addendPairs.map((pair) => ({ ...pair })),
    connectorPairs: input.connectorPairs.map((pair) => ({ ...pair })),
    groupingArtifactIds: [...input.groupingArtifactIds],
    phaseIds: [...kpFactoringChoreographyPhaseIds],
    factorMinimumScale,
    synchronization: "simultaneous",
    fusionPlan
  };
}

export function sampleKpFactoringChoreography(input: {
  readonly plan: KpFactoringChoreographyPlan;
  readonly progress: number;
}, dependencies: KpFactoringChoreographyDependencies = defaultDependencies):
KpFactoringChoreographyFrame {
  const progress = clamp01(input.progress);
  const fusion = dependencies.fissionFusion.sample({
    plan: input.plan.fusionPlan,
    progress
  });
  const phases = {
    "focus-factor-copies": intervalProgress(progress, 0, 0.12),
    "preview-compaction": intervalProgress(progress, 0.08, 0.28),
    "collect-factor-copies": fusion.phases["approach-junction"],
    "introduce-grouping": intervalProgress(progress, 0.5, 0.72),
    "compact-addends": intervalProgress(progress, 0.08, 0.78),
    "settle-common-factor": fusion.phases["transit-material"],
    "release-factor-focus": intervalProgress(progress, 0.72, 0.9)
  };
  const addendCompactionProgress =
    sampleKpFactoringAddendCompactionProgress(progress);
  return {
    kind: "factoring-choreography-frame",
    planId: input.plan.id,
    progress,
    phases,
    focusStrength:
      phases["focus-factor-copies"] * (1 - phases["release-factor-focus"]),
    addendCompactionProgress,
    groupingOpacity: phases["introduce-grouping"],
    fusion,
    commonFactor: {
      opacity: fusion.targets[0]!.opacity,
      scale: fusion.targets[0]!.scale
    },
    factorCopies: input.plan.factorCopyIds.map((entityId, semanticIndex) => {
      const material = fusion.sources.find((source) => source.entityId === entityId);
      if (material === undefined) {
        throw new Error(`Missing factoring source ${entityId}.`);
      }
      return {
        entityId,
        semanticIndex,
        opacity: material.opacity,
        scale: material.scale,
        pathProgress: material.junctionProgress
      };
    })
  };
}

function intervalProgress(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  const local = (progress - start) / (end - start);
  return local * local * (3 - 2 * local);
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
