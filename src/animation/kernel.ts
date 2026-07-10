import type {
  SemanticObjectRef,
  SemanticTransformationRef
} from "../semantic/animation.ts";

export interface KpAnimationMotionPlan {
  readonly id: string;
  readonly kind: string;
  readonly sourceObjectRefs: readonly SemanticObjectRef[];
  readonly targetObjectRefs: readonly SemanticObjectRef[];
  readonly transformationRefs: readonly SemanticTransformationRef[];
  readonly rendererNeutral: true;
  readonly summary?: string | undefined;
}

export interface CreateKpAnimationMotionPlanInput {
  readonly id: string;
  readonly kind: string;
  readonly sourceObjectRefs: readonly SemanticObjectRef[];
  readonly targetObjectRefs: readonly SemanticObjectRef[];
  readonly transformationRefs: readonly SemanticTransformationRef[];
  readonly summary?: string | undefined;
}

export interface KpSampledAnimationFrame {
  readonly progress: number;
  readonly planId?: string | undefined;
  readonly timelineId?: string | undefined;
}

export interface KpAnimationSampler<
  TFrame extends KpSampledAnimationFrame = KpSampledAnimationFrame
> {
  sample(progress: number): TFrame;
}

export interface KpAnimationRenderer<
  TFrame extends KpSampledAnimationFrame = KpSampledAnimationFrame
> {
  render(frame: TFrame): void;
}

export interface KpAnimationStepOptions {
  readonly steps: number;
}

export interface KpAnimationProgressPlayer {
  setProgress(nextProgress: number): void;
  playTo(targetProgress: number, options: KpAnimationStepOptions): void;
  rewindTo(targetProgress: number, options: KpAnimationStepOptions): void;
  getProgress(): number;
}

export interface AnimationStepProgressInput {
  readonly startProgress: number;
  readonly targetProgress: number;
  readonly steps: number;
  readonly label?: string | undefined;
}

export function createKpAnimationMotionPlan(
  input: CreateKpAnimationMotionPlanInput
): KpAnimationMotionPlan {
  return {
    id: input.id,
    kind: input.kind,
    sourceObjectRefs: input.sourceObjectRefs.map((ref) => ({ ...ref })),
    targetObjectRefs: input.targetObjectRefs.map((ref) => ({ ...ref })),
    transformationRefs: input.transformationRefs.map((ref) => ({
      ...ref,
      sourceObjectIds: [...ref.sourceObjectIds],
      targetObjectIds: [...ref.targetObjectIds],
      preserves: [...ref.preserves]
    })),
    rendererNeutral: true,
    ...(input.summary === undefined ? {} : { summary: input.summary })
  };
}

export function animationStepProgresses(
  input: AnimationStepProgressInput
): readonly number[] {
  assertPositiveAnimationSteps(input.steps, input.label);

  const startProgress = normalizeAnimationProgress(input.startProgress);
  const targetProgress = normalizeAnimationProgress(input.targetProgress);
  const delta = targetProgress - startProgress;

  return Array.from({ length: input.steps }, (_, index) => {
    const step = index + 1;

    if (step === input.steps) {
      return targetProgress;
    }

    return normalizeAnimationProgress(
      startProgress + (delta * step) / input.steps
    );
  });
}

export function normalizeAnimationProgress(progress: number): number {
  if (Number.isNaN(progress)) {
    return 0;
  }

  return Math.min(1, Math.max(0, progress));
}

export function assertPositiveAnimationSteps(
  steps: number,
  label = "Animation"
): void {
  if (!Number.isInteger(steps) || steps <= 0) {
    throw new Error(`${label} steps must be a positive integer.`);
  }
}
