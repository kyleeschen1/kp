export const kpInequalityPivotPhaseIds = [
  "focus-negative-cause",
  "scale-both-sides",
  "pivot-relation",
  "settle-native-inequality",
  "release-relation-focus"
] as const;

export type KpInequalityPivotPhaseId = typeof kpInequalityPivotPhaseIds[number];

export interface KpInequalityPivotChoreographyPlan {
  readonly kind: "inequality-pivot-choreography-plan";
  readonly id: string;
  readonly continuantRecordIds: readonly string[];
  readonly sideChangeRecordIds: readonly string[];
  readonly relationRecordId: string;
  readonly phaseIds: readonly KpInequalityPivotPhaseId[];
}

export interface KpInequalityPivotChoreographyFrame {
  readonly kind: "inequality-pivot-choreography-frame";
  readonly planId: string;
  readonly progress: number;
  readonly phases: Readonly<Record<KpInequalityPivotPhaseId, number>>;
  readonly focusStrength: number;
  readonly sideScaleProgress: number;
  readonly relationPivotProgress: number;
  readonly settlementProgress: number;
}

export function compileKpInequalityPivotChoreography(input: {
  readonly id: string;
  readonly continuantRecordIds: readonly string[];
  readonly sideChangeRecordIds: readonly string[];
  readonly relationRecordId: string;
}): KpInequalityPivotChoreographyPlan {
  if (input.continuantRecordIds.length === 0) {
    throw new Error("Inequality pivot requires a persistent operand.");
  }
  if (input.sideChangeRecordIds.length < 2) {
    throw new Error("Inequality pivot requires explicit negative-scaling side changes.");
  }
  if (input.continuantRecordIds.includes(input.relationRecordId)) {
    throw new Error("Inequality relation pivot must be distinct from operand continuants.");
  }
  return {
    kind: "inequality-pivot-choreography-plan",
    id: input.id,
    continuantRecordIds: [...input.continuantRecordIds],
    sideChangeRecordIds: [...input.sideChangeRecordIds],
    relationRecordId: input.relationRecordId,
    phaseIds: [...kpInequalityPivotPhaseIds]
  };
}

export function sampleKpInequalityPivotChoreography(input: {
  readonly plan: KpInequalityPivotChoreographyPlan;
  readonly progress: number;
}): KpInequalityPivotChoreographyFrame {
  const progress = clamp01(input.progress);
  const phases = {
    "focus-negative-cause": intervalProgress(progress, 0, 0.14),
    "scale-both-sides": intervalProgress(progress, 0.1, 0.48),
    "pivot-relation": intervalProgress(progress, 0.44, 0.78),
    "settle-native-inequality": intervalProgress(progress, 0.78, 0.96),
    "release-relation-focus": intervalProgress(progress, 0.8, 0.97)
  };
  return {
    kind: "inequality-pivot-choreography-frame",
    planId: input.plan.id,
    progress,
    phases,
    focusStrength:
      phases["focus-negative-cause"] * (1 - phases["release-relation-focus"]),
    sideScaleProgress: phases["scale-both-sides"],
    relationPivotProgress: phases["pivot-relation"],
    settlementProgress: phases["settle-native-inequality"]
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
