import {
  checkKpAnimationAssetReferenceClosure,
  compileKpAnimationAssetSemanticRefs,
  sampleKpAnimationAssetPhase,
  type KpAnimationAsset,
  type KpAnimationAssetCompiledRenderTargetRef,
  type KpAnimationAssetTreePhaseAnnotationIds,
  type KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";
import type { KpLawFailure } from "../semantic/asset-laws.ts";
import {
  createKpSemanticAnimationCompatibilityAsset,
  isKpSemanticAnimationAssetProjection,
  type KpSemanticAnimationAssetProjection
} from "./asset-projections.ts";

export interface KpAnimationFrameDescriptor {
  readonly id: string;
  readonly kind: "animation-frame";
  readonly animationId: string;
  readonly direction: KpAnimationAssetTransformationTreeDirection;
  readonly progress: number;
  readonly timelineId?: string | undefined;
  readonly elapsedMs?: number | undefined;
  readonly beat?: number | undefined;
  readonly phaseIndex: number;
  readonly phaseId: string;
  readonly nodeIds: readonly string[];
  readonly annotationIdsByPlacement: KpAnimationAssetTreePhaseAnnotationIds;
  readonly semanticObjectIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly renderTargets: readonly KpAnimationAssetCompiledRenderTargetRef[];
  readonly diagnostics: readonly KpLawFailure[];
}

export interface CreateKpAnimationFrameDescriptorInput
  extends KpAnimationFrameDescriptor {}

export interface SampleKpAnimationFrameDescriptorInput {
  readonly id?: string | undefined;
  readonly animation: KpAnimationAsset | KpSemanticAnimationAssetProjection;
  readonly direction: KpAnimationAssetTransformationTreeDirection;
  readonly progress: number;
}

export function createKpAnimationFrameDescriptor(
  input: CreateKpAnimationFrameDescriptorInput
): KpAnimationFrameDescriptor {
  return {
    id: input.id,
    kind: "animation-frame",
    animationId: input.animationId,
    direction: input.direction,
    progress: input.progress,
    ...(input.timelineId === undefined ? {} : { timelineId: input.timelineId }),
    ...(input.elapsedMs === undefined ? {} : { elapsedMs: input.elapsedMs }),
    ...(input.beat === undefined ? {} : { beat: input.beat }),
    phaseIndex: input.phaseIndex,
    phaseId: input.phaseId,
    nodeIds: [...input.nodeIds],
    annotationIdsByPlacement: {
      before: [...input.annotationIdsByPlacement.before],
      during: [...input.annotationIdsByPlacement.during],
      after: [...input.annotationIdsByPlacement.after]
    },
    semanticObjectIds: [...input.semanticObjectIds],
    transformationIds: [...input.transformationIds],
    renderTargets: input.renderTargets.map(cloneRenderTargetRef),
    diagnostics: input.diagnostics.map((diagnostic) => ({ ...diagnostic }))
  };
}

export function sampleKpAnimationFrameDescriptor(
  input: SampleKpAnimationFrameDescriptorInput
): KpAnimationFrameDescriptor {
  if (isKpSemanticAnimationAssetProjection(input.animation)) {
    return sampleKpAnimationFrameDescriptor({
      ...input,
      animation: createKpSemanticAnimationCompatibilityAsset(input.animation)
    });
  }
  const phase = sampleKpAnimationAssetPhase(input.animation, {
    direction: input.direction,
    progress: input.progress
  });
  const compiledRefs = compileKpAnimationAssetSemanticRefs(input.animation);
  const referenceClosure = checkKpAnimationAssetReferenceClosure(input.animation);
  const timeline = input.animation.timeline;

  return createKpAnimationFrameDescriptor({
    id:
      input.id ??
      `frame.${input.animation.id}.${input.direction}.${input.progress.toFixed(4)}`,
    kind: "animation-frame",
    animationId: input.animation.id,
    direction: input.direction,
    progress: input.progress,
    ...(timeline === undefined ? {} : { timelineId: timeline.id }),
    ...(timeline?.durationMs === undefined
      ? {}
      : { elapsedMs: timeline.durationMs * input.progress }),
    ...(timeline?.beatCount === undefined
      ? {}
      : { beat: timeline.beatCount * input.progress }),
    phaseIndex: phase.phaseIndex,
    phaseId: phase.phaseId,
    nodeIds: phase.nodeIds,
    annotationIdsByPlacement: phase.annotationIdsByPlacement,
    semanticObjectIds: uniqueStrings(
      compiledRefs.renderTargetRefs.flatMap((target) => target.objectIds)
    ),
    transformationIds: uniqueStrings(phase.nodeIds),
    renderTargets: compiledRefs.renderTargetRefs,
    diagnostics: referenceClosure.failures
  });
}

function cloneRenderTargetRef(
  target: KpAnimationAssetCompiledRenderTargetRef
): KpAnimationAssetCompiledRenderTargetRef {
  return {
    id: target.id,
    kind: target.kind,
    objectIds: [...target.objectIds],
    selectorIds: [...target.selectorIds],
    transformationIds: [...target.transformationIds],
    ...(target.timelineId === undefined ? {} : { timelineId: target.timelineId }),
    ...(target.summary === undefined ? {} : { summary: target.summary })
  };
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
