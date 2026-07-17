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
}

export interface KpFactoringChoreographyFrame {
  readonly kind: "factoring-choreography-frame";
  readonly planId: string;
  readonly progress: number;
  readonly phases: Readonly<Record<KpFactoringChoreographyPhaseId, number>>;
  readonly focusStrength: number;
  readonly addendCompactionProgress: number;
  readonly groupingOpacity: number;
  readonly commonFactor: { readonly opacity: number; readonly scale: number };
  readonly factorCopies: readonly {
    readonly entityId: string;
    readonly semanticIndex: number;
    readonly opacity: number;
    readonly scale: number;
    readonly pathProgress: number;
  }[];
}

export function compileKpFactoringChoreography(input: {
  readonly id: string;
  readonly factorCopyIds: readonly string[];
  readonly commonFactorId: string;
  readonly addendPairs: KpFactoringChoreographyPlan["addendPairs"];
  readonly connectorPairs: KpFactoringChoreographyPlan["connectorPairs"];
  readonly groupingArtifactIds: readonly string[];
  readonly factorMinimumScale?: number | undefined;
}): KpFactoringChoreographyPlan {
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
  return {
    kind: "factoring-choreography-plan",
    id: input.id,
    factorCopyIds: [...input.factorCopyIds],
    commonFactorId: input.commonFactorId,
    addendPairs: input.addendPairs.map((pair) => ({ ...pair })),
    connectorPairs: input.connectorPairs.map((pair) => ({ ...pair })),
    groupingArtifactIds: [...input.groupingArtifactIds],
    phaseIds: [...kpFactoringChoreographyPhaseIds],
    factorMinimumScale
  };
}

export function sampleKpFactoringChoreography(input: {
  readonly plan: KpFactoringChoreographyPlan;
  readonly progress: number;
}): KpFactoringChoreographyFrame {
  const progress = clamp01(input.progress);
  const phases = {
    "focus-factor-copies": intervalProgress(progress, 0, 0.12),
    "preview-compaction": intervalProgress(progress, 0.08, 0.28),
    "collect-factor-copies": intervalProgress(progress, 0.28, 0.78),
    "introduce-grouping": intervalProgress(progress, 0.5, 0.72),
    "compact-addends": intervalProgress(progress, 0.08, 0.78),
    "settle-common-factor": intervalProgress(progress, 0.72, 0.94),
    "release-factor-focus": intervalProgress(progress, 0.72, 0.9)
  };
  const addendCompactionProgress =
    0.18 * phases["preview-compaction"] +
    0.82 * intervalProgress(progress, 0.52, 0.78);
  const settlement = phases["settle-common-factor"];
  return {
    kind: "factoring-choreography-frame",
    planId: input.plan.id,
    progress,
    phases,
    focusStrength:
      phases["focus-factor-copies"] * (1 - phases["release-factor-focus"]),
    addendCompactionProgress,
    groupingOpacity: phases["introduce-grouping"],
    commonFactor: {
      opacity: intervalProgress(progress, 0.72, 0.9),
      scale: interpolate(input.plan.factorMinimumScale, 1, settlement)
    },
    factorCopies: input.plan.factorCopyIds.map((entityId, semanticIndex) => {
      const stagger = Math.max(0, semanticIndex - 1) * 0.04;
      const collecting = semanticIndex === 0
        ? addendCompactionProgress
        : intervalProgress(progress, 0.28 + stagger, 0.72 + stagger);
      return {
        entityId,
        semanticIndex,
        opacity: semanticIndex === 0
          ? 1 - intervalProgress(progress, 0.94, 1)
          : 1 - intervalProgress(collecting, 0.45, 1),
        scale: interpolate(
          interpolate(1, input.plan.factorMinimumScale, phases["collect-factor-copies"]),
          1,
          settlement
        ),
        pathProgress: collecting
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
