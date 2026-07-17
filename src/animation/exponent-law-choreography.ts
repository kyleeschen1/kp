export type KpExponentLawChoreographyKind =
  | "peel-one-factor"
  | "absorb-unit-exponent";

export const kpExponentLawChoreographyPhaseIds = [
  "focus-power-role",
  "reserve-product-layout",
  "emit-factor-and-operator",
  "decrement-or-absorb-exponent",
  "settle-native-product",
  "release-power-focus"
] as const;

export type KpExponentLawChoreographyPhaseId =
  typeof kpExponentLawChoreographyPhaseIds[number];

export interface KpExponentLawChoreographyPlan {
  readonly kind: "exponent-law-choreography-plan";
  readonly id: string;
  readonly operationKind: KpExponentLawChoreographyKind;
  readonly focusRecordIds: readonly string[];
  readonly continuantRecordIds: readonly string[];
  readonly emittedRecordIds: readonly string[];
  readonly exitRecordIds: readonly string[];
  readonly phaseIds: readonly KpExponentLawChoreographyPhaseId[];
}

export interface KpExponentLawChoreographyFrame {
  readonly kind: "exponent-law-choreography-frame";
  readonly planId: string;
  readonly operationKind: KpExponentLawChoreographyKind;
  readonly progress: number;
  readonly phases: Readonly<Record<KpExponentLawChoreographyPhaseId, number>>;
  readonly focusStrength: number;
  readonly reflowProgress: number;
  readonly emissionProgress: number;
  readonly exponentChangeProgress: number;
  readonly settlementProgress: number;
  readonly emissions: readonly {
    readonly semanticIndex: number;
    readonly opacity: number;
    readonly scale: number;
    readonly pathProgress: number;
  }[];
}

export function compileKpExponentLawChoreography(input: {
  readonly id: string;
  readonly operationKind: KpExponentLawChoreographyKind;
  readonly focusRecordIds: readonly string[];
  readonly continuantRecordIds: readonly string[];
  readonly emittedRecordIds: readonly string[];
  readonly exitRecordIds: readonly string[];
}): KpExponentLawChoreographyPlan {
  if (input.focusRecordIds.length === 0) {
    throw new Error("Exponent-law choreography requires an explicit focus role.");
  }
  if (input.operationKind === "peel-one-factor" && input.emittedRecordIds.length < 2) {
    throw new Error("Peeling one factor requires base and exponent emission records.");
  }
  if (
    input.operationKind === "absorb-unit-exponent" &&
    (input.continuantRecordIds.length === 0 || input.exitRecordIds.length === 0)
  ) {
    throw new Error("Unit-exponent absorption requires continuants and an exit record.");
  }
  return {
    kind: "exponent-law-choreography-plan",
    id: input.id,
    operationKind: input.operationKind,
    focusRecordIds: [...input.focusRecordIds],
    continuantRecordIds: [...input.continuantRecordIds],
    emittedRecordIds: [...input.emittedRecordIds],
    exitRecordIds: [...input.exitRecordIds],
    phaseIds: [...kpExponentLawChoreographyPhaseIds]
  };
}

export function sampleKpExponentLawChoreography(input: {
  readonly plan: KpExponentLawChoreographyPlan;
  readonly progress: number;
}): KpExponentLawChoreographyFrame {
  const progress = clamp01(input.progress);
  const phases = {
    "focus-power-role": intervalProgress(progress, 0, 0.14),
    "reserve-product-layout": intervalProgress(progress, 0.08, 0.34),
    "emit-factor-and-operator": intervalProgress(progress, 0.2, 0.72),
    "decrement-or-absorb-exponent": intervalProgress(progress, 0.5, 0.8),
    "settle-native-product": intervalProgress(progress, 0.76, 0.96),
    "release-power-focus": intervalProgress(progress, 0.78, 0.96)
  };
  return {
    kind: "exponent-law-choreography-frame",
    planId: input.plan.id,
    operationKind: input.plan.operationKind,
    progress,
    phases,
    focusStrength:
      phases["focus-power-role"] * (1 - phases["release-power-focus"]),
    reflowProgress: phases["reserve-product-layout"],
    emissionProgress: phases["emit-factor-and-operator"],
    exponentChangeProgress: phases["decrement-or-absorb-exponent"],
    settlementProgress: phases["settle-native-product"],
    emissions: [0, 1].map((semanticIndex) => {
      const stagger = semanticIndex * 0.055;
      return {
        semanticIndex,
        opacity: intervalProgress(progress, 0.2 + stagger, 0.38 + stagger),
        scale: interpolate(0.86, 1, intervalProgress(progress, 0.66 + stagger, 0.9 + stagger)),
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
