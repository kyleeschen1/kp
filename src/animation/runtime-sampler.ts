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
  readonly childAnimations?: readonly KpAnimationAsset[] | undefined;
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
  readonly activeAnnotationIds: readonly string[];
  readonly focusSelectorIds: readonly string[];
  readonly selectorFrames: readonly KpAnimationRuntimeSelectorFrame[];
  readonly semanticObjectRefs: readonly SemanticObjectRef[];
  readonly transformationRefs: readonly SemanticTransformationRef[];
  readonly activeRenderTargets: readonly KpAnimationRuntimeRenderTargetFrame[];
  readonly childFrames: readonly KpAnimationRuntimeChildFrame[];
  readonly frameDescriptor: KpAnimationFrameDescriptor;
  readonly phaseDiagnostics: readonly KpAnimationRuntimeDiagnostic[];
  readonly selectorDiagnostics: readonly KpAnimationRuntimeDiagnostic[];
  readonly childDiagnostics: readonly KpAnimationRuntimeDiagnostic[];
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

export interface KpAnimationRuntimeChildFrame {
  readonly renderTargetId: string;
  readonly animationId: string;
  readonly frame: KpAnimationRuntimeFrame;
}

export interface KpAnimationRuntimeDiagnostic {
  readonly severity: "info" | "warning" | "error";
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export type KpAnimationRuntimeSelectorRole =
  | "source"
  | "target"
  | "correspondence-source"
  | "correspondence-target"
  | "focus";

export interface KpAnimationRuntimeSelectorFrame {
  readonly id: string;
  readonly objectId: string;
  readonly kind: string;
  readonly label?: string | undefined;
  readonly roles: readonly KpAnimationRuntimeSelectorRole[];
  readonly activeTransformationIds: readonly string[];
  readonly annotationIds: readonly string[];
  readonly renderTargetIds: readonly string[];
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
  const activeAnnotationIds = flattenAnnotationIds(
    phase.annotationIdsByPlacement
  );
  const activeAnnotations = input.animation.transformationTree.annotations
    .filter((annotation) => activeAnnotationIds.includes(annotation.id));
  const activeRenderTargets = descriptor.renderTargets
    .map((target) =>
      runtimeRenderTargetFrame(target, activeTransformationIds)
    )
    .filter((target) => target.activeTransformationIds.length > 0);
  const frameId =
    input.id ??
    `runtime.${input.animation.id}.${direction}.${progress.toFixed(4)}`;
  const focusSelectorIds = uniqueStrings(
    activeAnnotations
      .filter((annotation) =>
        annotation.kind === "focus" || annotation.kind === "emphasis"
      )
      .flatMap((annotation) => annotation.selectorIds ?? [])
  );
  const selectorFrames = runtimeSelectorFrames({
    animation: input.animation,
    activeTransformationIds,
    activeAnnotationIds,
    focusSelectorIds,
    activeRenderTargets
  });
  const childFrames = runtimeChildFrames({
    animation: input.animation,
    childAnimations: input.childAnimations ?? [],
    activeRenderTargets,
    direction,
    progress,
    parentFrameId: frameId
  });

  return {
    id: frameId,
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
    activeAnnotationIds,
    focusSelectorIds,
    selectorFrames,
    semanticObjectRefs: refs.semanticObjectRefs.map((ref) => ({ ...ref })),
    transformationRefs: refs.transformationRefs.map(cloneTransformationRef),
    activeRenderTargets,
    childFrames,
    frameDescriptor: descriptor,
    phaseDiagnostics: createPhaseDiagnostics({
      phaseId: phase.phaseId,
      activeTransformationCount: activeTransformationIds.length,
      activeAnnotationCount: activeAnnotationIds.length
    }),
    selectorDiagnostics: createSelectorDiagnostics({
      selectorCount: selectorFrames.length,
      focusSelectorCount: focusSelectorIds.length
    }),
    childDiagnostics: createChildDiagnostics(childFrames.length),
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

function runtimeSelectorFrames(input: {
  readonly animation: KpAnimationAsset;
  readonly activeTransformationIds: readonly string[];
  readonly activeAnnotationIds: readonly string[];
  readonly focusSelectorIds: readonly string[];
  readonly activeRenderTargets: readonly KpAnimationRuntimeRenderTargetFrame[];
}): readonly KpAnimationRuntimeSelectorFrame[] {
  const activeTransformationSet = new Set(input.activeTransformationIds);
  const activeTransformations = input.animation.transformations.filter(
    (transformation) => activeTransformationSet.has(transformation.id)
  );
  const sourceObjectIds = new Set(
    activeTransformations.flatMap((transformation) => transformation.sourceObjectIds)
  );
  const targetObjectIds = new Set(
    activeTransformations.flatMap((transformation) => transformation.targetObjectIds)
  );
  const correspondenceSourceSelectorIds = new Set(
    activeTransformations.flatMap((transformation) =>
      transformation.correspondence.map((correspondence) =>
        correspondence.sourceSelectorId
      )
    )
  );
  const correspondenceTargetSelectorIds = new Set(
    activeTransformations.flatMap((transformation) =>
      transformation.correspondence.map((correspondence) =>
        correspondence.targetSelectorId
      )
    )
  );
  const focusSelectorIds = new Set(input.focusSelectorIds);
  const activeAnnotations = input.animation.transformationTree.annotations
    .filter((annotation) => input.activeAnnotationIds.includes(annotation.id));

  return input.animation.bundle.objects.flatMap((object) => {
    if (!sourceObjectIds.has(object.id) && !targetObjectIds.has(object.id)) {
      return [];
    }

    return object.selectors.map((selector) => {
      const roles = selectorRoles({
        selectorId: selector.id,
        objectId: object.id,
        sourceObjectIds,
        targetObjectIds,
        correspondenceSourceSelectorIds,
        correspondenceTargetSelectorIds,
        focusSelectorIds
      });
      const annotationIds = activeAnnotations
        .filter((annotation) => annotation.selectorIds?.includes(selector.id))
        .map((annotation) => annotation.id);
      const renderTargetIds = input.activeRenderTargets
        .filter((target) =>
          target.objectIds.includes(object.id) ||
          target.selectorIds.includes(selector.id)
        )
        .map((target) => target.id);

      return {
        id: selector.id,
        objectId: selector.objectId,
        kind: selector.kind,
        ...(selector.label === undefined ? {} : { label: selector.label }),
        roles,
        activeTransformationIds: [...input.activeTransformationIds],
        annotationIds,
        renderTargetIds
      };
    });
  });
}

function runtimeChildFrames(input: {
  readonly animation: KpAnimationAsset;
  readonly childAnimations: readonly KpAnimationAsset[];
  readonly activeRenderTargets: readonly KpAnimationRuntimeRenderTargetFrame[];
  readonly direction: KpAnimationAssetTransformationTreeDirection;
  readonly progress: number;
  readonly parentFrameId: string;
}): readonly KpAnimationRuntimeChildFrame[] {
  if (input.childAnimations.length === 0) return [];

  const activeRenderTargetIds = new Set(
    input.activeRenderTargets.map((target) => target.id)
  );
  const childAnimationsById = new Map(
    input.childAnimations.map((animation) => [animation.id, animation])
  );

  return input.animation.renderTargets.flatMap((target) => {
    if (!activeRenderTargetIds.has(target.id)) return [];

    const childAnimationId = target.metadata?.["childAnimationId"];
    if (typeof childAnimationId !== "string") return [];

    const childAnimation = childAnimationsById.get(childAnimationId);
    if (childAnimation === undefined) return [];

    return [{
      renderTargetId: target.id,
      animationId: childAnimation.id,
      frame: sampleKpAnimationRuntimeFrame({
        id: `${input.parentFrameId}.child.${target.id}`,
        animation: childAnimation,
        direction: input.direction,
        progress: input.progress
      })
    }];
  });
}

function selectorRoles(input: {
  readonly selectorId: string;
  readonly objectId: string;
  readonly sourceObjectIds: ReadonlySet<string>;
  readonly targetObjectIds: ReadonlySet<string>;
  readonly correspondenceSourceSelectorIds: ReadonlySet<string>;
  readonly correspondenceTargetSelectorIds: ReadonlySet<string>;
  readonly focusSelectorIds: ReadonlySet<string>;
}): readonly KpAnimationRuntimeSelectorRole[] {
  const roles: KpAnimationRuntimeSelectorRole[] = [];

  if (input.sourceObjectIds.has(input.objectId)) roles.push("source");
  if (input.targetObjectIds.has(input.objectId)) roles.push("target");
  if (input.correspondenceSourceSelectorIds.has(input.selectorId)) {
    roles.push("correspondence-source");
  }
  if (input.correspondenceTargetSelectorIds.has(input.selectorId)) {
    roles.push("correspondence-target");
  }
  if (input.focusSelectorIds.has(input.selectorId)) roles.push("focus");

  return roles;
}

function createChildDiagnostics(
  childFrameCount: number
): readonly KpAnimationRuntimeDiagnostic[] {
  return childFrameCount === 0
    ? []
    : [
        {
          severity: "info",
          code: "runtime.child.frames",
          path: "childFrames",
          message:
            `${childFrameCount} child animation frame(s) sampled from render target metadata.`
        }
      ];
}

function createPhaseDiagnostics(input: {
  readonly phaseId: string;
  readonly activeTransformationCount: number;
  readonly activeAnnotationCount: number;
}): readonly KpAnimationRuntimeDiagnostic[] {
  return [
    {
      severity: "info",
      code: "runtime.phase.active-transformations",
      path: "phase.nodeIds",
      message:
        `Phase ${input.phaseId} activates ${input.activeTransformationCount} transformation(s).`
    },
    {
      severity: "info",
      code: "runtime.phase.annotations",
      path: "phase.annotationIdsByPlacement",
      message:
        `Phase ${input.phaseId} exposes ${input.activeAnnotationCount} annotation(s).`
    }
  ];
}

function createSelectorDiagnostics(input: {
  readonly selectorCount: number;
  readonly focusSelectorCount: number;
}): readonly KpAnimationRuntimeDiagnostic[] {
  return [
    {
      severity: "info",
      code: "runtime.selector.context",
      path: "selectorFrames",
      message:
        `${input.selectorCount} selector(s) are in the active source/target context.`
    },
    {
      severity: "info",
      code: "runtime.selector.focus",
      path: "focusSelectorIds",
      message: `${input.focusSelectorCount} selector(s) are focus-active.`
    }
  ];
}

function flattenAnnotationIds(
  annotationIdsByPlacement: KpAnimationAssetTreePhaseAnnotationIds
): readonly string[] {
  return [
    ...annotationIdsByPlacement.before,
    ...annotationIdsByPlacement.during,
    ...annotationIdsByPlacement.after
  ];
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

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
