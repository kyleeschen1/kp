export const kpDistributionChoreographyPhaseIds = [
  "focus-factor",
  "reflow-addends",
  "branch-factor-copies",
  "transit-factor-copies",
  "remove-grouping",
  "settle-products",
  "release-factor-focus"
] as const;

export type KpDistributionChoreographyPhaseId =
  typeof kpDistributionChoreographyPhaseIds[number];

export interface KpDistributionChoreographyPlan {
  readonly kind: "distribution-choreography-plan";
  readonly id: string;
  readonly sourceFactorId: string;
  readonly factorCopyIds: readonly string[];
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
  readonly phaseIds: readonly KpDistributionChoreographyPhaseId[];
  readonly sourceMinimumScale: number;
}

export interface KpDistributionChoreographyFrame {
  readonly kind: "distribution-choreography-frame";
  readonly planId: string;
  readonly progress: number;
  readonly phases: Readonly<Record<KpDistributionChoreographyPhaseId, number>>;
  readonly focusStrength: number;
  readonly addendReflowProgress: number;
  readonly groupingOpacity: number;
  readonly sourceFactor: {
    readonly opacity: number;
    readonly scale: number;
  };
  readonly factorCopies: readonly {
    readonly entityId: string;
    readonly semanticIndex: number;
    readonly opacity: number;
    readonly scale: number;
    readonly pathProgress: number;
  }[];
}

export function compileKpDistributionChoreography(input: {
  readonly id: string;
  readonly sourceFactorId: string;
  readonly factorCopyIds: readonly string[];
  readonly addendPairs: KpDistributionChoreographyPlan["addendPairs"];
  readonly connectorPairs: KpDistributionChoreographyPlan["connectorPairs"];
  readonly groupingArtifactIds: readonly string[];
  readonly sourceMinimumScale?: number | undefined;
}): KpDistributionChoreographyPlan {
  if (input.factorCopyIds.length < 2) {
    throw new Error("Distribution choreography requires at least two factor copies.");
  }
  if (input.addendPairs.length !== input.factorCopyIds.length) {
    throw new Error("Distribution choreography requires one addend pair per factor copy.");
  }
  if (input.connectorPairs.length !== input.addendPairs.length - 1) {
    throw new Error("Distribution choreography requires one connector pair between addends.");
  }
  if (input.groupingArtifactIds.length === 0) {
    throw new Error("Distribution choreography requires explicit grouping artifacts.");
  }
  const sourceMinimumScale = input.sourceMinimumScale ?? 0.82;
  if (!(sourceMinimumScale > 0 && sourceMinimumScale <= 1)) {
    throw new Error("Distribution source minimum scale must be greater than zero and at most one.");
  }
  return {
    kind: "distribution-choreography-plan",
    id: input.id,
    sourceFactorId: input.sourceFactorId,
    factorCopyIds: [...input.factorCopyIds],
    addendPairs: input.addendPairs.map((pair) => ({ ...pair })),
    connectorPairs: input.connectorPairs.map((pair) => ({ ...pair })),
    groupingArtifactIds: [...input.groupingArtifactIds],
    phaseIds: [...kpDistributionChoreographyPhaseIds],
    sourceMinimumScale
  };
}

export function sampleKpDistributionChoreography(input: {
  readonly plan: KpDistributionChoreographyPlan;
  readonly progress: number;
}): KpDistributionChoreographyFrame {
  const progress = clamp01(input.progress);
  const phases = {
    "focus-factor": intervalProgress(progress, 0, 0.12),
    "reflow-addends": intervalProgress(progress, 0.08, 0.78),
    "branch-factor-copies": intervalProgress(progress, 0.22, 0.4),
    "transit-factor-copies": intervalProgress(progress, 0.28, 0.78),
    "remove-grouping": intervalProgress(progress, 0.5, 0.72),
    "settle-products": intervalProgress(progress, 0.72, 0.94),
    "release-factor-focus": intervalProgress(progress, 0.72, 0.9)
  };
  const nativeSettlement = phases["settle-products"];
  // A small preview shift anchors attention; the topology-changing reflow waits
  // until grouping removal makes enough horizontal room for the products.
  const addendReflowProgress =
    0.18 * intervalProgress(progress, 0.08, 0.28) +
    0.82 * intervalProgress(progress, 0.52, 0.78);
  return {
    kind: "distribution-choreography-frame",
    planId: input.plan.id,
    progress,
    phases,
    focusStrength:
      phases["focus-factor"] * (1 - phases["release-factor-focus"]),
    addendReflowProgress,
    groupingOpacity: 1 - phases["remove-grouping"],
    sourceFactor: {
      opacity: 1 - intervalProgress(progress, 0.94, 1),
      scale: interpolate(
        interpolate(
          1,
          input.plan.sourceMinimumScale,
          phases["branch-factor-copies"]
        ),
        1,
        nativeSettlement
      )
    },
    factorCopies: input.plan.factorCopyIds.map((entityId, semanticIndex) => {
      if (semanticIndex === 0) {
        return {
          entityId,
          semanticIndex,
          opacity: intervalProgress(progress, 0.72, 0.9),
          scale: interpolate(input.plan.sourceMinimumScale, 1, nativeSettlement),
          pathProgress: nativeSettlement
        };
      }
      const stagger = (semanticIndex - 1) * 0.04;
      const pathProgress = intervalProgress(progress, 0.28 + stagger, 0.72 + stagger);
      const arrival = intervalProgress(progress, 0.66 + stagger, 0.88 + stagger);
      return {
        entityId,
        semanticIndex,
        opacity: intervalProgress(progress, 0.22 + stagger, 0.38 + stagger),
        scale: interpolate(input.plan.sourceMinimumScale, 1, arrival),
        pathProgress
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

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
