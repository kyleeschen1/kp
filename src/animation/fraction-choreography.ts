export type KpFractionChoreographyKind =
  | "split-factors"
  | "separate-common-factor"
  | "simplify-unit-factor";

export const kpFractionChoreographyPhaseIds = [
  "focus-roles",
  "reflow-continuants",
  "transmit-structure",
  "change-artifacts",
  "settle-native",
  "release-focus"
] as const;

export type KpFractionChoreographyPhaseId =
  typeof kpFractionChoreographyPhaseIds[number];

export interface KpFractionChoreographyPlan {
  readonly kind: "fraction-choreography-plan";
  readonly id: string;
  readonly operationKind: KpFractionChoreographyKind;
  readonly focusRecordIds: readonly string[];
  readonly continuantRecordIds: readonly string[];
  readonly structuralRecordIds: readonly string[];
  readonly artifactRecordIds: readonly string[];
  readonly maximumBranchCount: number;
  readonly phaseIds: readonly KpFractionChoreographyPhaseId[];
}

export interface KpFractionChoreographyFrame {
  readonly kind: "fraction-choreography-frame";
  readonly planId: string;
  readonly operationKind: KpFractionChoreographyKind;
  readonly progress: number;
  readonly phases: Readonly<Record<KpFractionChoreographyPhaseId, number>>;
  readonly focusStrength: number;
  readonly reflowProgress: number;
  readonly structuralProgress: number;
  readonly artifactProgress: number;
  readonly settlementProgress: number;
  readonly branches: readonly {
    readonly semanticIndex: number;
    readonly opacity: number;
    readonly scale: number;
    readonly pathProgress: number;
  }[];
}

export function compileKpFractionChoreography(input: {
  readonly id: string;
  readonly operationKind: KpFractionChoreographyKind;
  readonly focusRecordIds: readonly string[];
  readonly continuantRecordIds: readonly string[];
  readonly structuralRecordIds: readonly string[];
  readonly artifactRecordIds: readonly string[];
  readonly maximumBranchCount: number;
}): KpFractionChoreographyPlan {
  if (input.focusRecordIds.length === 0) {
    throw new Error("Fraction choreography requires explicit focus roles.");
  }
  if (input.continuantRecordIds.length === 0) {
    throw new Error("Fraction choreography requires a persistent continuant.");
  }
  if (input.structuralRecordIds.length === 0) {
    throw new Error("Fraction choreography requires a structural action.");
  }
  if (input.artifactRecordIds.length === 0) {
    throw new Error("Fraction choreography requires an explicit artifact action.");
  }
  if (!Number.isInteger(input.maximumBranchCount) || input.maximumBranchCount < 1) {
    throw new Error("Fraction choreography maximumBranchCount must be a positive integer.");
  }
  return {
    kind: "fraction-choreography-plan",
    id: input.id,
    operationKind: input.operationKind,
    focusRecordIds: [...input.focusRecordIds],
    continuantRecordIds: [...input.continuantRecordIds],
    structuralRecordIds: [...input.structuralRecordIds],
    artifactRecordIds: [...input.artifactRecordIds],
    maximumBranchCount: input.maximumBranchCount,
    phaseIds: [...kpFractionChoreographyPhaseIds]
  };
}

export function sampleKpFractionChoreography(input: {
  readonly plan: KpFractionChoreographyPlan;
  readonly progress: number;
}): KpFractionChoreographyFrame {
  const progress = clamp01(input.progress);
  const phases = {
    "focus-roles": intervalProgress(progress, 0, 0.14),
    "reflow-continuants": intervalProgress(progress, 0.08, 0.38),
    "transmit-structure": intervalProgress(progress, 0.2, 0.76),
    "change-artifacts": intervalProgress(progress, 0.5, 0.78),
    "settle-native": intervalProgress(progress, 0.76, 0.96),
    "release-focus": intervalProgress(progress, 0.78, 0.96)
  };
  return {
    kind: "fraction-choreography-frame",
    planId: input.plan.id,
    operationKind: input.plan.operationKind,
    progress,
    phases,
    focusStrength: phases["focus-roles"] * (1 - phases["release-focus"]),
    reflowProgress: phases["reflow-continuants"],
    structuralProgress: phases["transmit-structure"],
    artifactProgress: phases["change-artifacts"],
    settlementProgress: phases["settle-native"],
    branches: Array.from({ length: input.plan.maximumBranchCount }, (_, semanticIndex) => {
      const stagger = semanticIndex * 0.045;
      return {
        semanticIndex,
        opacity: intervalProgress(progress, 0.18 + stagger, 0.36 + stagger),
        scale: interpolate(0.84, 1, intervalProgress(progress, 0.68 + stagger, 0.9 + stagger)),
        pathProgress: intervalProgress(progress, 0.22 + stagger, 0.72 + stagger)
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
