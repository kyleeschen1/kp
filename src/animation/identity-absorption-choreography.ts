export type KpIdentityAbsorptionChoreographyKind =
  | "absorb-additive-zero"
  | "absorb-multiplicative-one";

export const kpIdentityAbsorptionChoreographyPhaseIds = [
  "focus-identity-bundle",
  "reflow-continuants",
  "fold-operator",
  "absorb-identity",
  "settle-native-expression",
  "release-identity-focus"
] as const;

export type KpIdentityAbsorptionChoreographyPhaseId =
  typeof kpIdentityAbsorptionChoreographyPhaseIds[number];

export interface KpIdentityAbsorptionChoreographyPlan {
  readonly kind: "identity-absorption-choreography-plan";
  readonly id: string;
  readonly operationKind: KpIdentityAbsorptionChoreographyKind;
  readonly continuantRecordIds: readonly string[];
  readonly operatorRecordId: string;
  readonly identityRecordId: string;
  readonly anchorRecordId: string;
  readonly phaseIds: readonly KpIdentityAbsorptionChoreographyPhaseId[];
}

export interface KpIdentityAbsorptionChoreographyFrame {
  readonly kind: "identity-absorption-choreography-frame";
  readonly planId: string;
  readonly operationKind: KpIdentityAbsorptionChoreographyKind;
  readonly progress: number;
  readonly phases: Readonly<Record<KpIdentityAbsorptionChoreographyPhaseId, number>>;
  readonly focusStrength: number;
  readonly reflowProgress: number;
  readonly operatorFoldProgress: number;
  readonly identityAbsorptionProgress: number;
  readonly settlementProgress: number;
}

export function compileKpIdentityAbsorptionChoreography(input: {
  readonly id: string;
  readonly operationKind: KpIdentityAbsorptionChoreographyKind;
  readonly continuantRecordIds: readonly string[];
  readonly operatorRecordId: string;
  readonly identityRecordId: string;
  readonly anchorRecordId: string;
}): KpIdentityAbsorptionChoreographyPlan {
  if (input.continuantRecordIds.length === 0) {
    throw new Error("Identity absorption requires persistent continuants.");
  }
  if (input.operatorRecordId === input.identityRecordId) {
    throw new Error("Identity absorption requires distinct operator and identity records.");
  }
  if (!input.continuantRecordIds.includes(input.anchorRecordId)) {
    throw new Error("Identity absorption anchor must be a persistent continuant.");
  }
  return {
    kind: "identity-absorption-choreography-plan",
    id: input.id,
    operationKind: input.operationKind,
    continuantRecordIds: [...input.continuantRecordIds],
    operatorRecordId: input.operatorRecordId,
    identityRecordId: input.identityRecordId,
    anchorRecordId: input.anchorRecordId,
    phaseIds: [...kpIdentityAbsorptionChoreographyPhaseIds]
  };
}

export function sampleKpIdentityAbsorptionChoreography(input: {
  readonly plan: KpIdentityAbsorptionChoreographyPlan;
  readonly progress: number;
}): KpIdentityAbsorptionChoreographyFrame {
  const progress = clamp01(input.progress);
  const phases = {
    "focus-identity-bundle": intervalProgress(progress, 0, 0.14),
    "reflow-continuants": intervalProgress(progress, 0.08, 0.4),
    "fold-operator": intervalProgress(progress, 0.24, 0.52),
    "absorb-identity": intervalProgress(progress, 0.48, 0.8),
    "settle-native-expression": intervalProgress(progress, 0.76, 0.96),
    "release-identity-focus": intervalProgress(progress, 0.8, 0.97)
  };
  return {
    kind: "identity-absorption-choreography-frame",
    planId: input.plan.id,
    operationKind: input.plan.operationKind,
    progress,
    phases,
    focusStrength:
      phases["focus-identity-bundle"] * (1 - phases["release-identity-focus"]),
    reflowProgress: phases["reflow-continuants"],
    operatorFoldProgress: phases["fold-operator"],
    identityAbsorptionProgress: phases["absorb-identity"],
    settlementProgress: phases["settle-native-expression"]
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
