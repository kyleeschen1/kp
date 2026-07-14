import {
  compileKpAnimationAssetSemanticRefs,
  sampleKpAnimationAssetPhase,
  type KpAnimationAsset,
  type KpAnimationAssetCompiledRenderTargetRef,
  type KpAnimationAssetTransformationTreeDirection,
  type KpAnimationAssetTreePhaseAnnotationIds
} from "./asset.ts";
import {
  sampleKpAnimationFrameDescriptor,
  type KpAnimationFrameDescriptor
} from "./frame-descriptor.ts";
import { normalizeAnimationProgress } from "./kernel.ts";
import type { KpLawFailure } from "../semantic/asset-laws.ts";
import type {
  SemanticObjectRef,
  SemanticTransformationRef
} from "../semantic/animation.ts";

export interface SampleKpAnimationRuntimeFrameInput {
  readonly id?: string | undefined;
  readonly animation: KpAnimationAsset;
  readonly direction?: KpAnimationAssetTransformationTreeDirection | undefined;
  readonly progress?: number | undefined;
  readonly elapsedMs?: number | undefined;
  readonly beat?: number | undefined;
}

export interface KpAnimationRuntimeFrame {
  readonly id: string;
  readonly kind: "animation-runtime-frame";
  readonly rendererNeutral: true;
  readonly animationId: string;
  readonly title: string;
  readonly clock: KpAnimationRuntimeClock;
  readonly phase: KpAnimationRuntimePhase;
  readonly activeTransformationIds: readonly string[];
  readonly semanticObjectRefs: readonly SemanticObjectRef[];
  readonly transformationRefs: readonly SemanticTransformationRef[];
  readonly activeRenderTargets: readonly KpAnimationRuntimeRenderTargetFrame[];
  readonly frameDescriptor: KpAnimationFrameDescriptor;
  readonly diagnostics: readonly KpLawFailure[];
}

export interface KpAnimationRuntimeClock {
  readonly direction: KpAnimationAssetTransformationTreeDirection;
  readonly progress: number;
  readonly timelineId?: string | undefined;
  readonly durationMs?: number | undefined;
  readonly elapsedMs?: number | undefined;
  readonly beatCount?: number | undefined;
  readonly beat?: number | undefined;
}

export interface KpAnimationRuntimePhase {
  readonly phaseIndex: number;
  readonly phaseId: string;
  readonly nodeIds: readonly string[];
  readonly annotationIdsByPlacement: KpAnimationAssetTreePhaseAnnotationIds;
}

export interface KpAnimationRuntimeRenderTargetFrame
  extends KpAnimationAssetCompiledRenderTargetRef {
  readonly activeTransformationIds: readonly string[];
}

export function sampleKpAnimationRuntimeFrame(
  input: SampleKpAnimationRuntimeFrameInput
): KpAnimationRuntimeFrame {
  const direction = input.direction ?? "forward";
  const progress = runtimeProgress(input);
  const clock = runtimeClock(input.animation, direction, progress);
  const phase = sampleKpAnimationAssetPhase(input.animation, {
    direction,
    progress
  });
  const descriptor = sampleKpAnimationFrameDescriptor({
    id:
      input.id === undefined
        ? undefined
        : `${input.id}.frame`,
    animation: input.animation,
    direction,
    progress
  });
  const refs = compileKpAnimationAssetSemanticRefs(input.animation);
  const activeTransformationIds = [...descriptor.transformationIds];

  return {
    id:
      input.id ??
      `runtime.${input.animation.id}.${direction}.${progress.toFixed(4)}`,
    kind: "animation-runtime-frame",
    rendererNeutral: true,
    animationId: input.animation.id,
    title: input.animation.title,
    clock,
    phase: {
      phaseIndex: phase.phaseIndex,
      phaseId: phase.phaseId,
      nodeIds: [...phase.nodeIds],
      annotationIdsByPlacement: {
        before: [...phase.annotationIdsByPlacement.before],
        during: [...phase.annotationIdsByPlacement.during],
        after: [...phase.annotationIdsByPlacement.after]
      }
    },
    activeTransformationIds,
    semanticObjectRefs: refs.semanticObjectRefs.map((ref) => ({ ...ref })),
    transformationRefs: refs.transformationRefs.map(cloneTransformationRef),
    activeRenderTargets: descriptor.renderTargets
      .map((target) =>
        runtimeRenderTargetFrame(target, activeTransformationIds)
      )
      .filter((target) => target.activeTransformationIds.length > 0),
    frameDescriptor: descriptor,
    diagnostics: descriptor.diagnostics.map((diagnostic) => ({ ...diagnostic }))
  };
}

function runtimeProgress(input: SampleKpAnimationRuntimeFrameInput): number {
  if (input.progress !== undefined) {
    return normalizeAnimationProgress(input.progress);
  }

  const durationMs = input.animation.timeline?.durationMs;
  if (
    input.elapsedMs !== undefined &&
    durationMs !== undefined &&
    Number.isFinite(durationMs) &&
    durationMs > 0
  ) {
    return normalizeAnimationProgress(input.elapsedMs / durationMs);
  }

  const beatCount = input.animation.timeline?.beatCount;
  if (
    input.beat !== undefined &&
    beatCount !== undefined &&
    Number.isFinite(beatCount) &&
    beatCount > 0
  ) {
    return normalizeAnimationProgress(input.beat / beatCount);
  }

  return 0;
}

function runtimeClock(
  animation: KpAnimationAsset,
  direction: KpAnimationAssetTransformationTreeDirection,
  progress: number
): KpAnimationRuntimeClock {
  const timeline = animation.timeline;

  return {
    direction,
    progress,
    ...(timeline?.id === undefined ? {} : { timelineId: timeline.id }),
    ...(timeline?.durationMs === undefined
      ? {}
      : {
          durationMs: timeline.durationMs,
          elapsedMs: roundClockValue(timeline.durationMs * progress)
        }),
    ...(timeline?.beatCount === undefined
      ? {}
      : {
          beatCount: timeline.beatCount,
          beat: roundClockValue(timeline.beatCount * progress)
        })
  };
}

function runtimeRenderTargetFrame(
  target: KpAnimationAssetCompiledRenderTargetRef,
  activeTransformationIds: readonly string[]
): KpAnimationRuntimeRenderTargetFrame {
  const activeTransformationSet = new Set(activeTransformationIds);
  const targetActiveTransformationIds =
    target.transformationIds.length === 0
      ? [...activeTransformationIds]
      : target.transformationIds.filter((id) => activeTransformationSet.has(id));

  return {
    id: target.id,
    kind: target.kind,
    objectIds: [...target.objectIds],
    selectorIds: [...target.selectorIds],
    transformationIds: [...target.transformationIds],
    activeTransformationIds: targetActiveTransformationIds,
    ...(target.timelineId === undefined ? {} : { timelineId: target.timelineId }),
    ...(target.summary === undefined ? {} : { summary: target.summary })
  };
}

function cloneTransformationRef(
  ref: SemanticTransformationRef
): SemanticTransformationRef {
  return {
    ...ref,
    sourceObjectIds: [...ref.sourceObjectIds],
    targetObjectIds: [...ref.targetObjectIds],
    preserves: [...ref.preserves]
  };
}

function roundClockValue(value: number): number {
  const rounded = Number(value.toFixed(3));

  return Object.is(rounded, -0) ? 0 : rounded;
}
