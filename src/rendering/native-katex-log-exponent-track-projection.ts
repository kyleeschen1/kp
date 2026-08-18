import {
  createKpClosedDispatchRegistry,
  requireKpClosedDispatchEntry
} from "../domain-ir/equation-extension-registry.ts";
import type {
  KpCompiledLogExponentOperation
} from "../semantic/log-exponent-transformation-compiler.ts";
import type {
  KpLogExponentOperationKind
} from "../semantic/log-exponent-operation-dispatch.ts";
import {
  planKpEquationMotionPathBetweenPoints
} from "./equation-motion-path-planner.ts";
import {
  invalidateKpNativeKatexMotionPath
} from "./native-katex-paint-geometry.ts";
import {
  createKpNativeKatexTrackProjection,
  type KpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-scene-compositor.ts";

export const kpNativeKatexLogExponentExtractionProfile = Object.freeze({
  residualReflowWindow: Object.freeze({ start: 0.42, end: 0.72 }),
  foregroundOcclusionWindow: Object.freeze({ start: 0.5, end: 0.94 }),
  exponentDepartureClearanceInLocalInkHeights: 1.75
});

interface KpLogExponentTrackProjectionDispatchEntry {
  readonly id: KpLogExponentOperationKind;
  readonly create: (
    operation: KpCompiledLogExponentOperation
  ) => KpNativeKatexTrackProjection | undefined;
}

const kpLogExponentTrackProjectionDispatch =
  createKpClosedDispatchRegistry<
    KpLogExponentOperationKind,
    KpLogExponentTrackProjectionDispatchEntry
  >("log-exponent measured track projection", [
    entry("apply-natural-log-both-sides", () => undefined),
    entry("extract-log-power-exponent", createExtractionProjection),
    entry("divide-both-sides-by-log-base", () => undefined)
  ]);

export function createKpLogExponentTrackProjection(
  operation: KpCompiledLogExponentOperation
): KpNativeKatexTrackProjection | undefined {
  return requireKpClosedDispatchEntry(
    kpLogExponentTrackProjectionDispatch,
    operation.operation.kind
  ).create(operation);
}

function createExtractionProjection(
  operation: KpCompiledLogExponentOperation
): KpNativeKatexTrackProjection {
  return createKpNativeKatexTrackProjection({
    id: `track-projection.${operation.transformation.id}.exponent-clears-residual`,
    project({ tracks, source, target }) {
      const sourceEntities = new Map(source.atoms.map((atom) => [
        atom.id,
        atom.semanticEntityId
      ]));
      const targetEntities = new Map(target.atoms.map((atom) => [
        atom.id,
        atom.semanticEntityId
      ]));
      const semanticPair = (track: KpNativeKatexPaintMeasuredSceneTrack) => [
        sourceEntities.get(track.sourceAtomId ?? ""),
        targetEntities.get(track.targetAtomId ?? "")
      ] as const;
      const exponentTrack = tracks.find((track) => {
        const [sourceEntityId, targetEntityId] = semanticPair(track);
        return sourceEntityId === "logged.exponent" &&
          targetEntityId === "extracted.coefficient";
      });
      const logOperatorTrack = tracks.find((track) => {
        const [sourceEntityId, targetEntityId] = semanticPair(track);
        return sourceEntityId === "logged.left.log.operator" &&
          targetEntityId === "extracted.left.log.operator";
      });
      if (exponentTrack === undefined || logOperatorTrack === undefined) {
        throw new Error(
          "Log-exponent extraction requires measured exponent and log-operator paint."
        );
      }
      const occlusionId =
        `foreground-occlusion.${operation.transformation.id}.exponent-through-log`;
      const withForegroundOcclusion = (
        track: KpNativeKatexPaintMeasuredSceneTrack
      ): KpNativeKatexPaintMeasuredSceneTrack => {
        if (track.id !== exponentTrack.id && track.id !== logOperatorTrack.id) {
          return track;
        }
        return Object.freeze({
          ...track,
          intentionalForegroundOcclusion: Object.freeze({
            id: occlusionId,
            role: track.id === exponentTrack.id ? "occluder" : "occluded",
            counterpartTrackId:
              track.id === exponentTrack.id
                ? logOperatorTrack.id
                : exponentTrack.id,
            progressWindow:
              kpNativeKatexLogExponentExtractionProfile
                .foregroundOcclusionWindow
          })
        });
      };
      let exponentTrackCount = 0;
      const projected = tracks.map((track) => {
        if (track.lifecycle !== "persist") return track;
        const sourceEntityId = sourceEntities.get(track.sourceAtomId ?? "");
        const targetEntityId = targetEntities.get(track.targetAtomId ?? "");
        if (
          sourceEntityId !== "logged.exponent" ||
          targetEntityId !== "extracted.coefficient"
        ) {
          const continuousTrack = useSingleOperationProgress(track);
          const start = track.startPaintRect ?? track.startRect;
          const end = track.endPaintRect ?? track.endRect;
          return withForegroundOcclusion(Object.freeze({
            ...continuousTrack,
            motionPath: planKpEquationMotionPathBetweenPoints({
              id: `operation-path.${operation.transformation.id}.${track.id}.direct-context`,
              relationRecordId: track.semanticContinuantId ?? track.id,
              start: center(start),
              end: center(end),
              variants: ["direct"]
            }).selected,
            motionPathSampling: "planned-curve" as const,
            // The enclosure retires before its contents reflow, but this is
            // still one continuous transit rather than a second settlement.
            sampleProgress: sampleWindow(
              kpNativeKatexLogExponentExtractionProfile.residualReflowWindow
            )
          }));
        }
        exponentTrackCount += 1;
        const start = track.startPaintRect ?? track.startRect;
        const end = track.endPaintRect ?? track.endRect;
        const localInkHeight = Math.max(start.height, end.height, 1);
        const motionPath = planKpEquationMotionPathBetweenPoints({
          id: `operation-path.${operation.transformation.id}.${track.id}.through-log-operator`,
          relationRecordId: "correspondence.extract-exponent.unknown-x",
          start: center(start),
          end: center(end),
          variants: ["arc-above"],
          clearance:
            localInkHeight *
              kpNativeKatexLogExponentExtractionProfile
              .exponentDepartureClearanceInLocalInkHeights
        }).selected;
        return withForegroundOcclusion(Object.freeze({
          ...useSingleOperationProgress(track),
          motionPath,
          // The exponent deliberately crosses the named log operator instead
          // of inventing a high clearance lane above the equation.
          motionPathSampling: "foreground-diagonal-role-transfer" as const,
          // The role-transfer sampler owns its easing; stacking the generic
          // scene smoothstep would concentrate travel into a visible lurch.
          sampleProgress: identityProgress
        }));
      });
      if (exponentTrackCount === 0) {
        throw new Error(
          "Log-exponent extraction requires measured x continuant paint."
        );
      }
      return Object.freeze(projected);
    }
  });
}

function useSingleOperationProgress(
  track: KpNativeKatexPaintMeasuredSceneTrack
): KpNativeKatexPaintMeasuredSceneTrack {
  const withoutPath = invalidateKpNativeKatexMotionPath(track);
  const {
    sampleProgress: _sampleProgress,
    motionProgressRange: _motionProgressRange,
    ...continuous
  } = withoutPath;
  // The host act progress is the sole positional clock. Structural presence
  // may remain staged, but continuants cannot acquire a second piecewise move.
  return Object.freeze(continuous) as KpNativeKatexPaintMeasuredSceneTrack;
}

function entry(
  id: KpLogExponentOperationKind,
  create: KpLogExponentTrackProjectionDispatchEntry["create"]
): KpLogExponentTrackProjectionDispatchEntry {
  return Object.freeze({ id, create });
}

function sampleWindow(
  window: { readonly start: number; readonly end: number }
): (progress: number) => number {
  return (progress) => {
    if (progress <= window.start) return 0;
    if (progress >= window.end) return 1;
    const local = (progress - window.start) / (window.end - window.start);
    return local * local * (3 - 2 * local);
  };
}

function identityProgress(progress: number): number {
  return progress;
}

function center(rect: {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}): { readonly x: number; readonly y: number } {
  return Object.freeze({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  });
}
