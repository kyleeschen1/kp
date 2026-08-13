const verifiedCodeSettlementPlan = Symbol("kp.verified-code-settlement-plan");
const kpCodeSettlementMilestoneOrder = Object.freeze([
  "travel",
  "arrival",
  "recognition",
  "ownershipHandoff",
  "withdrawal"
] as const);

export interface KpCodeSettlementMilestones {
  readonly travel: number;
  readonly arrival: number;
  readonly recognition: number;
  readonly ownershipHandoff: number;
  readonly withdrawal: number;
}

export interface KpCodeSettlementPlanDraft<
  PaintOwnerId extends string = string,
  NativeOwnerId extends string = string
> {
  readonly id: string;
  readonly sourcePaintOwnerId: PaintOwnerId;
  readonly targetPaintOwnerId: PaintOwnerId;
  readonly sourceNativeOwnerId: NativeOwnerId;
  readonly targetNativeOwnerId: NativeOwnerId;
  readonly milestones: KpCodeSettlementMilestones;
}

export interface KpVerifiedCodeSettlementPlan<
  PaintOwnerId extends string = string,
  NativeOwnerId extends string = string
> extends KpCodeSettlementPlanDraft<PaintOwnerId, NativeOwnerId> {
  readonly [verifiedCodeSettlementPlan]: true;
}

export type KpCodeSettlementPhase =
  | "source"
  | "travel"
  | "arrival"
  | "recognition"
  | "ownership-handoff"
  | "withdrawal";

export interface KpCodeSettlementSample<
  PaintOwnerId extends string = string,
  NativeOwnerId extends string = string
> {
  readonly progress: number;
  readonly phase: KpCodeSettlementPhase;
  readonly destination: "pending" | "reached";
  readonly recognition: "pending" | "complete";
  readonly transit: "absent" | "moving" | "arrived" | "withdrawn";
  readonly paintOwner: "source-native" | "transit" | "target-native";
  readonly paintOwnerId: PaintOwnerId;
  readonly accessibleNativeOwnerId: NativeOwnerId;
}

/**
 * Numeric timing remains authored by each caller. The shared law owns only
 * causal order, so renderers cannot hand native paint off before material has
 * arrived and been recognized.
 */
export function mintKpCodeSettlementPlan<
  PaintOwnerId extends string,
  NativeOwnerId extends string
>(
  draft: KpCodeSettlementPlanDraft<PaintOwnerId, NativeOwnerId>
): KpVerifiedCodeSettlementPlan<PaintOwnerId, NativeOwnerId> {
  assertText(draft.id, "id");
  assertText(draft.sourcePaintOwnerId, "sourcePaintOwnerId");
  assertText(draft.targetPaintOwnerId, "targetPaintOwnerId");
  assertText(draft.sourceNativeOwnerId, "sourceNativeOwnerId");
  assertText(draft.targetNativeOwnerId, "targetNativeOwnerId");
  if (draft.sourcePaintOwnerId === draft.targetPaintOwnerId) {
    throw new Error(`Code settlement ${draft.id} requires distinct paint owners.`);
  }

  const entries = kpCodeSettlementMilestoneOrder.map((name) =>
    [name, draft.milestones[name]] as const
  );
  for (const [name, progress] of entries) {
    if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
      throw new Error(`Code settlement ${draft.id} milestone ${name} must be within [0, 1].`);
    }
  }
  for (let index = 1; index < entries.length; index += 1) {
    const previous = entries[index - 1]!;
    const current = entries[index]!;
    if (current[1] <= previous[1]) {
      throw new Error(
        `Code settlement ${draft.id} requires ${previous[0]} before ${current[0]}.`
      );
    }
  }

  return Object.freeze({
    ...draft,
    milestones: Object.freeze({ ...draft.milestones }),
    [verifiedCodeSettlementPlan]: true as const
  });
}

export function assertKpVerifiedCodeSettlementPlan<
  PaintOwnerId extends string,
  NativeOwnerId extends string
>(
  plan: KpVerifiedCodeSettlementPlan<PaintOwnerId, NativeOwnerId>
): void {
  if (plan[verifiedCodeSettlementPlan] !== true) {
    throw new Error("Code settlement plans must be minted by the shared validator.");
  }
}

/** Pure direct sampling makes seek, rewind, and interruption equivalent. */
export function sampleKpCodeSettlement<
  PaintOwnerId extends string,
  NativeOwnerId extends string
>(input: {
  readonly plan: KpVerifiedCodeSettlementPlan<PaintOwnerId, NativeOwnerId>;
  readonly progress: number;
}): KpCodeSettlementSample<PaintOwnerId, NativeOwnerId> {
  assertKpVerifiedCodeSettlementPlan(input.plan);
  const progress = clamp(input.progress);
  const { milestones } = input.plan;
  const phase = phaseAt(milestones, progress);
  const arrived = progress >= milestones.arrival;
  const recognized = progress >= milestones.recognition;
  const handedOff = progress >= milestones.ownershipHandoff;
  const withdrawn = progress >= milestones.withdrawal;

  return Object.freeze({
    progress,
    phase,
    destination: arrived ? "reached" : "pending",
    recognition: recognized ? "complete" : "pending",
    transit: withdrawn
      ? "withdrawn"
      : arrived
        ? "arrived"
        : progress >= milestones.travel
          ? "moving"
          : "absent",
    paintOwner: handedOff
      ? "target-native"
      : progress >= milestones.travel
        ? "transit"
        : "source-native",
    paintOwnerId: handedOff
      ? input.plan.targetPaintOwnerId
      : input.plan.sourcePaintOwnerId,
    accessibleNativeOwnerId: handedOff
      ? input.plan.targetNativeOwnerId
      : input.plan.sourceNativeOwnerId
  });
}

function phaseAt(
  milestones: KpCodeSettlementMilestones,
  progress: number
): KpCodeSettlementPhase {
  if (progress >= milestones.withdrawal) return "withdrawal";
  if (progress >= milestones.ownershipHandoff) return "ownership-handoff";
  if (progress >= milestones.recognition) return "recognition";
  if (progress >= milestones.arrival) return "arrival";
  if (progress >= milestones.travel) return "travel";
  return "source";
}

function assertText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`Code settlement ${label} must be non-empty.`);
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
