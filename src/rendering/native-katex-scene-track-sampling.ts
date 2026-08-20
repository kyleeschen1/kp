import {
  projectKpEquationMotionTrackPaintRect,
  sampleKpEquationMotionTrackOpacityProgress,
  sampleKpEquationMotionTrackRect
} from "./equation-motion-path-planner.ts";
import {
  sampleKpNativeKatexCopyFanOutTrack
} from "./native-katex-copy-fan-out-motion.ts";
import type {
  KpNativeKatexSceneTrackFrame
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexSceneTrack
} from "./native-katex-base-scene-plan.ts";

export function sampleKpNativeKatexSceneTrackFrames(
  tracks: readonly KpNativeKatexSceneTrack[],
  progress: number,
  copyFanOut: boolean
): readonly KpNativeKatexSceneTrackFrame[] {
  if (!Number.isFinite(progress)) {
    throw new Error("Scene track progress must be finite.");
  }
  const bounded = Math.max(0, Math.min(1, progress));
  const eased = smoothstep(bounded);
  return Object.freeze(tracks.map((sceneTrack) => {
    // Fan-out may shape motion, but the compiled semantic schedule owns timing.
    const semanticProgress = sceneTrack.sampleProgress?.(bounded);
    const copySample = copyFanOut
      ? sampleKpNativeKatexCopyFanOutTrack({
          track: sceneTrack,
          tracks,
          progress: semanticProgress ?? bounded
        })
      : undefined;
    const paintProgress = copySample?.[1] ??
      semanticProgress ??
      eased;
    const rect = Object.freeze(
      copySample?.[0] ??
      sampleKpEquationMotionTrackRect(sceneTrack, paintProgress)
    );
    const hasMeasuredPaint =
      sceneTrack.startPaintRect !== undefined &&
      sceneTrack.endPaintRect !== undefined;
    const materialScale = sceneTrack.sampleMaterialScale?.(bounded);
    if (
      materialScale !== undefined &&
      (!Number.isFinite(materialScale) || materialScale <= 0)
    ) {
      throw new Error("Native KaTeX material scale must be finite and positive.");
    }
    const expectedPaintRect = hasMeasuredPaint
      ? projectKpEquationMotionTrackPaintRect(
          sceneTrack,
          rect,
          paintProgress
        )
      : undefined;
    return Object.freeze({
      trackId: sceneTrack.id,
      componentId: sceneTrack.componentId,
      lifecycle: sceneTrack.lifecycle,
      visualAtomId: sceneTrack.visualAtomId,
      paintKind: sceneTrack.paintKind,
      sizingMode: sceneTrack.sizingMode,
      rect,
      ...(sceneTrack.motionMetrics ? { metricProgress: paintProgress } : {}),
      ...(materialScale === undefined ? {} : { materialScale }),
      ...(expectedPaintRect === undefined
        ? {}
        : {
            // The compositor scales paint around the owner center. Collision
            // certification must inspect that same visible ink, not the
            // unscaled native box that the material no longer occupies.
            expectedPaintRect: Object.freeze(materialScale === undefined
              ? expectedPaintRect
              : scaleRectAroundCenter(expectedPaintRect, materialScale))
          }),
      ...(sceneTrack.intentionalContactGroupId === undefined
        ? {}
        : {
            intentionalContactGroupId:
              sceneTrack.intentionalContactGroupId
          }),
      ...(sceneTrack.intentionalForegroundOcclusion === undefined ||
        bounded <
          sceneTrack.intentionalForegroundOcclusion.progressWindow.start ||
        bounded >
          sceneTrack.intentionalForegroundOcclusion.progressWindow.end
        ? {}
        : {
            intentionalForegroundOcclusion:
              sceneTrack.intentionalForegroundOcclusion
          }),
      ...(sceneTrack.verifiedOperationCohortId === undefined
        ? {}
        : {
            verifiedOperationCohortId:
              sceneTrack.verifiedOperationCohortId
          }),
      opacity:
        (sceneTrack.startOpacity +
        (sceneTrack.endOpacity - sceneTrack.startOpacity) *
        (
          copySample?.[2] ??
          (
            sceneTrack.opacityStepAt === undefined
              ? sceneTrack.sampleOpacityProgress?.(bounded)
              : undefined
          ) ??
          sampleKpEquationMotionTrackOpacityProgress(sceneTrack, bounded)
        )) * (sceneTrack.samplePaintPresence?.(bounded) ?? 1)
    });
  }));
}

function scaleRectAroundCenter(
  rect: Readonly<{ left: number; top: number; width: number; height: number }>,
  scale: number
) {
  const width = rect.width * scale;
  const height = rect.height * scale;
  return {
    left: rect.left + (rect.width - width) / 2,
    top: rect.top + (rect.height - height) / 2,
    width,
    height
  };
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}
