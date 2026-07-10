export type AnimationEasing = "ease-in-out" | "linear";

export interface SemanticObjectRef {
  readonly objectId: string;
  readonly objectType?: string | undefined;
  readonly selectorId?: string | undefined;
  readonly revisionId?: string | undefined;
}

export type SemanticTransformationPreservation =
  | "identity"
  | "structure"
  | "value"
  | "role"
  | "presentation";

export interface SemanticTransformationRef {
  readonly id: string;
  readonly kind: string;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly preserves: readonly SemanticTransformationPreservation[];
  readonly summary?: string | undefined;
}

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

export function createSemanticObjectRef(
  input: SemanticObjectRef
): SemanticObjectRef {
  return {
    objectId: input.objectId,
    ...(input.objectType === undefined ? {} : { objectType: input.objectType }),
    ...(input.selectorId === undefined ? {} : { selectorId: input.selectorId }),
    ...(input.revisionId === undefined ? {} : { revisionId: input.revisionId })
  };
}

export function createSemanticTransformationRef(
  input: SemanticTransformationRef
): SemanticTransformationRef {
  return {
    id: input.id,
    kind: input.kind,
    sourceObjectIds: [...input.sourceObjectIds],
    targetObjectIds: [...input.targetObjectIds],
    preserves: [...input.preserves],
    ...(input.summary === undefined ? {} : { summary: input.summary })
  };
}
