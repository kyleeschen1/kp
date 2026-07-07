export type AnimationEasing = "ease-in-out" | "linear";

export interface SaddleDenominatorAnimationIntent {
  id: string;
  type: "animation-intent";
  label: string;
  targetId: string;
  targetType: "surface-3d";
  property: "saddle.denominator";
  from: number;
  to: number;
  durationMs: number;
  easing: AnimationEasing;
}

interface CreateSaddleDenominatorAnimationIntentInput {
  id: string;
  label: string;
  targetId: string;
  fromDenominator: number;
  toDenominator: number;
  durationMs: number;
  easing?: AnimationEasing;
}

export function createSaddleDenominatorAnimationIntent(
  input: CreateSaddleDenominatorAnimationIntentInput
): SaddleDenominatorAnimationIntent {
  return {
    id: input.id,
    type: "animation-intent",
    label: input.label,
    targetId: input.targetId,
    targetType: "surface-3d",
    property: "saddle.denominator",
    from: input.fromDenominator,
    to: input.toDenominator,
    durationMs: input.durationMs,
    easing: input.easing ?? "ease-in-out"
  };
}
