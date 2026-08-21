import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-base-scene-plan.ts";
import {
  invalidateKpNativeKatexMotionPath
} from "./native-katex-paint-geometry.ts";
import {
  compileKpNativeKatexInkKnotMetrics
} from "./native-katex-ink-knot-geometry.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  createKpNativeKatexTrackProjection,
  type KpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";

export const kpNativeKatexClosedEvaluationFusionTreatment = Object.freeze({
  bodyGatherWindow: Object.freeze({ start: 0.14, end: 0.5 }),
  bodyCompressionWindow: Object.freeze({ start: 0.28, end: 0.5 }),
  bodyHandoffWindow: Object.freeze({ start: 0.48, end: 0.54 }),
  resultRevealWindow: Object.freeze({ start: 0.52, end: 0.6 }),
  resultExpansionWindow: Object.freeze({ start: 0.52, end: 0.72 }),
  contextSettlementWindow: Object.freeze({ start: 0.1, end: 0.72 })
});

export interface KpNativeKatexClosedEvaluationFusionBinding {
  readonly projection: KpNativeKatexTrackProjection;
  readonly sourceEntityIds: readonly [string, ...string[]];
  readonly targetEntityId: string;
  readonly timingGroupId: string;
  readonly sourceMotionUnitId: string;
  readonly targetMotionUnitId: string;
  readonly intentionalContactGroupId: string;
}

/**
 * Closed evaluation has one visual grammar regardless of the operator: every
 * contributing source ink owner contracts to one measured knot, then the
 * verified result expands from that same locus. Semantic operation authority
 * remains with the caller; this module owns only renderer timing and geometry.
 */
export function createKpNativeKatexClosedEvaluationFusion(input: {
  readonly id: string;
  readonly sourceEntityIds: readonly [string, ...string[]];
  readonly targetEntityId: string;
}): KpNativeKatexClosedEvaluationFusionBinding {
  const sourceEntityIds = Object.freeze([...input.sourceEntityIds]) as readonly [
    string,
    ...string[]
  ];
  const sourceEntitySet = new Set(sourceEntityIds);
  const timingGroupId = `timing.${input.id}.closed-evaluation-fusion`;
  const sourceMotionUnitId = `motion.${input.id}.evaluation-source`;
  const targetMotionUnitId = `motion.${input.id}.evaluation-result`;
  const intentionalContactGroupId = `contact.${input.id}.evaluation-knot`;
  const projection = createKpNativeKatexTrackProjection({
    id: `track-projection.${input.id}.closed-evaluation-fusion`,
    project({ tracks, source, target }) {
      const sourceEntity = entityByAtom(source);
      const targetEntity = entityByAtom(target);
      const sourceTracks = tracks.filter((track) => {
        const entityId = sourceEntity.get(track.sourceAtomId ?? "");
        return entityId !== undefined && sourceEntitySet.has(entityId);
      });
      const resultTracks = tracks.filter((track) =>
        targetEntity.get(track.targetAtomId ?? "") === input.targetEntityId
      );
      const measuredSourceEntityIds = new Set(sourceTracks.map((track) =>
        sourceEntity.get(track.sourceAtomId ?? "")
      ));
      if (sourceEntityIds.some((entityId) =>
        !measuredSourceEntityIds.has(entityId))) {
        throw new Error(
          "Closed evaluation requires measured ink for every source contributor."
        );
      }
      if (resultTracks.length === 0) {
        throw new Error("Closed evaluation requires measured result ink.");
      }
      const knot = compileEvaluationKnot({ sourceTracks, resultTracks });
      return Object.freeze(tracks.map((track) => {
        const from = sourceEntity.get(track.sourceAtomId ?? "");
        const to = targetEntity.get(track.targetAtomId ?? "");
        if (from !== undefined && sourceEntitySet.has(from)) {
          const { endRect, endPaintRect } = relocatePaintToCenter(
            track,
            "source",
            knot.center
          );
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            endRect,
            endPaintRect,
            timingGroupId,
            semanticMotionUnitId: sourceMotionUnitId,
            intentionalContactGroupId,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: sampleWindow(
              kpNativeKatexClosedEvaluationFusionTreatment.bodyGatherWindow
                .start,
              kpNativeKatexClosedEvaluationFusionTreatment.bodyGatherWindow.end
            ),
            sampleOpacityProgress: sampleWindow(
              kpNativeKatexClosedEvaluationFusionTreatment.bodyHandoffWindow
                .start,
              kpNativeKatexClosedEvaluationFusionTreatment.bodyHandoffWindow.end
            ),
            sampleMaterialScale: (progress: number) => lerp(
              1,
              knot.sourceKernelScale,
              smoothstep(
                kpNativeKatexClosedEvaluationFusionTreatment
                  .bodyCompressionWindow.start,
                kpNativeKatexClosedEvaluationFusionTreatment
                  .bodyCompressionWindow.end,
                progress
              )
            )
          }));
        }
        if (to === input.targetEntityId) {
          const { endRect, endPaintRect } = relocatePaintToCenter(
            track,
            "target",
            knot.center
          );
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            startRect: endRect,
            startPaintRect: endPaintRect,
            timingGroupId,
            semanticMotionUnitId: targetMotionUnitId,
            intentionalContactGroupId,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: sampleWindow(
              kpNativeKatexClosedEvaluationFusionTreatment
                .resultExpansionWindow.start,
              kpNativeKatexClosedEvaluationFusionTreatment
                .resultExpansionWindow.end
            ),
            sampleOpacityProgress: sampleWindow(
              kpNativeKatexClosedEvaluationFusionTreatment.resultRevealWindow
                .start,
              kpNativeKatexClosedEvaluationFusionTreatment.resultRevealWindow
                .end
            ),
            sampleMaterialScale: (progress: number) => lerp(
              knot.targetKernelScale,
              1,
              smoothstep(
                kpNativeKatexClosedEvaluationFusionTreatment
                  .resultExpansionWindow.start,
                kpNativeKatexClosedEvaluationFusionTreatment
                  .resultExpansionWindow.end,
                progress
              )
            )
          }));
        }
        return Object.freeze({
          ...track,
          sampleProgress: sampleWindow(
            kpNativeKatexClosedEvaluationFusionTreatment
              .contextSettlementWindow.start,
            kpNativeKatexClosedEvaluationFusionTreatment
              .contextSettlementWindow.end
          )
        });
      }));
    }
  });
  return Object.freeze({
    projection,
    sourceEntityIds,
    targetEntityId: input.targetEntityId,
    timingGroupId,
    sourceMotionUnitId,
    targetMotionUnitId,
    intentionalContactGroupId
  });
}

function compileEvaluationKnot(input: {
  readonly sourceTracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly resultTracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
}) {
  const resultPaintBounds = unionRects(input.resultTracks.map(
    ({ endPaintRect }) => endPaintRect
  ));
  const metrics = compileKpNativeKatexInkKnotMetrics({
    sourceArea: summedRectArea(input.sourceTracks.map(
      ({ startPaintRect }) => startPaintRect
    )),
    targetArea: summedRectArea(input.resultTracks.map(
      ({ endPaintRect }) => endPaintRect
    ))
  });
  return Object.freeze({
    center: Object.freeze({
      x: resultPaintBounds.left + resultPaintBounds.width / 2,
      y: resultPaintBounds.top + resultPaintBounds.height / 2
    }),
    sourceKernelScale: metrics.sourceKernelScale,
    targetKernelScale: metrics.targetKernelScale
  });
}

function relocatePaintToCenter(
  track: KpNativeKatexPaintMeasuredSceneTrack,
  endpoint: "source" | "target",
  center: Readonly<{ x: number; y: number }>
) {
  const rect = endpoint === "source" ? track.startRect : track.endRect;
  const paintRect = endpoint === "source"
    ? track.startPaintRect
    : track.endPaintRect;
  const paintOffsetX = paintRect.left - rect.left;
  const paintOffsetY = paintRect.top - rect.top;
  const relocatedPaintRect = Object.freeze({
    ...paintRect,
    left: center.x - paintRect.width / 2,
    top: center.y - paintRect.height / 2
  });
  return Object.freeze({
    endPaintRect: relocatedPaintRect,
    endRect: Object.freeze({
      ...rect,
      left: relocatedPaintRect.left - paintOffsetX,
      top: relocatedPaintRect.top - paintOffsetY
    })
  });
}

function entityByAtom(scene: KpNativeKatexRenderedSceneObservation) {
  return new Map(scene.atoms.map((atom) => [atom.id, atom.semanticEntityId]));
}

function unionRects(rects: readonly Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>[]) {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return Object.freeze({ left, top, width: right - left, height: bottom - top });
}

function summedRectArea(rects: readonly Readonly<{
  width: number;
  height: number;
}>[]): number {
  return Math.max(1, rects.reduce(
    (area, rect) => area + Math.max(0, rect.width * rect.height),
    0
  ));
}

function sampleWindow(start: number, end: number) {
  return (progress: number): number => smoothstep(start, end, progress);
}

function smoothstep(start: number, end: number, value: number): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  const progress = (value - start) / (end - start);
  return progress * progress * (3 - 2 * progress);
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}
