import {
  projectKpEquationMotionTrackPaintRect,
  sampleKpEquationMotionTrackOpacityProgress,
  sampleKpEquationMotionTrackRect
} from "./equation-motion-path-planner.ts";
import {
  sampleKpNativeKatexCopyFanOutTrack
} from "./native-katex-copy-fan-out-motion.ts";
import type {
  KpNativeKatexSceneTrack,
  KpNativeKatexSceneTrackFrame
} from "./native-katex-scene-compositor.ts";

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
    const copySample = copyFanOut
      ? sampleKpNativeKatexCopyFanOutTrack({
          track: sceneTrack,
          tracks,
          progress: bounded
        })
      : undefined;
    const paintProgress = copySample?.[1] ??
      sceneTrack.sampleProgress?.(bounded) ??
      eased;
    const rect = Object.freeze(
      copySample?.[0] ??
      sampleKpEquationMotionTrackRect(sceneTrack, paintProgress)
    );
    const hasMeasuredPaint =
      sceneTrack.startPaintRect !== undefined &&
      sceneTrack.endPaintRect !== undefined;
    return Object.freeze({
      trackId: sceneTrack.id,
      componentId: sceneTrack.componentId,
      lifecycle: sceneTrack.lifecycle,
      visualAtomId: sceneTrack.visualAtomId,
      paintKind: sceneTrack.paintKind,
      sizingMode: sceneTrack.sizingMode,
      rect,
      ...(hasMeasuredPaint
        ? {
            expectedPaintRect: Object.freeze(
              projectKpEquationMotionTrackPaintRect(
                sceneTrack,
                rect,
                paintProgress
              )
            )
          }
        : {}),
      ...(sceneTrack.intentionalContactGroupId === undefined
        ? {}
        : {
            intentionalContactGroupId:
              sceneTrack.intentionalContactGroupId
          }),
      ...(sceneTrack.verifiedOperationCohortId === undefined
        ? {}
        : {
            verifiedOperationCohortId:
              sceneTrack.verifiedOperationCohortId
          }),
      opacity:
        sceneTrack.startOpacity +
        (sceneTrack.endOpacity - sceneTrack.startOpacity) *
        (
          copySample?.[2] ??
          (
            sceneTrack.opacityStepAt === undefined
              ? sceneTrack.sampleOpacityProgress?.(bounded)
              : undefined
          ) ??
          sampleKpEquationMotionTrackOpacityProgress(sceneTrack, bounded)
        )
    });
  }));
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}
