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
  createKpNativeKatexTrackProjection,
  type KpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";

export const kpNativeKatexLogExponentExtractionProfile = Object.freeze({
  exponentDepartureWindow: Object.freeze({ start: 0.04, end: 0.3 }),
  exponentSettlementWindow: Object.freeze({ start: 0.7, end: 0.88 }),
  contextReflowWindow: Object.freeze({ start: 0.4, end: 0.64 }),
  exponentClearanceInLocalInkHeights: 6
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
      let exponentTrackCount = 0;
      const projected = tracks.map((track) => {
        if (track.lifecycle !== "persist") return track;
        const sourceEntityId = sourceEntities.get(track.sourceAtomId ?? "");
        const targetEntityId = targetEntities.get(track.targetAtomId ?? "");
        if (
          sourceEntityId !== "logged.exponent" ||
          targetEntityId !== "extracted.coefficient"
        ) {
          const start = track.startPaintRect ?? track.startRect;
          const end = track.endPaintRect ?? track.endRect;
          return Object.freeze({
            ...track,
            motionPath: planKpEquationMotionPathBetweenPoints({
              id: `operation-path.${operation.transformation.id}.${track.id}.direct-context`,
              relationRecordId: track.semanticContinuantId ?? track.id,
              start: center(start),
              end: center(end),
              variants: ["direct"]
            }).selected,
            motionPathSampling: "planned-curve" as const,
            sampleProgress: sampleWindow(
              kpNativeKatexLogExponentExtractionProfile.contextReflowWindow
            )
          });
        }
        exponentTrackCount += 1;
        const sampleProgress = sampleDepartureHoldSettlement({
          departure:
            kpNativeKatexLogExponentExtractionProfile.exponentDepartureWindow,
          settlement:
            kpNativeKatexLogExponentExtractionProfile.exponentSettlementWindow
        });
        const start = track.startPaintRect ?? track.startRect;
        const end = track.endPaintRect ?? track.endRect;
        const localInkHeight = Math.max(start.height, end.height, 1);
        const motionPath = planKpEquationMotionPathBetweenPoints({
          id: `operation-path.${operation.transformation.id}.${track.id}.above-residual`,
          relationRecordId: "correspondence.extract-exponent.unknown-x",
          start: center(start),
          end: center(end),
          variants: ["arc-above"],
          clearance:
            localInkHeight *
            kpNativeKatexLogExponentExtractionProfile
              .exponentClearanceInLocalInkHeights
        }).selected;
        return Object.freeze({
          ...track,
          motionPath,
          motionPathSampling: "planned-curve" as const,
          sampleProgress
        });
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

function sampleDepartureHoldSettlement(input: {
  readonly departure: { readonly start: number; readonly end: number };
  readonly settlement: { readonly start: number; readonly end: number };
}): (progress: number) => number {
  const depart = sampleWindow(input.departure);
  const settle = sampleWindow(input.settlement);
  return (progress) => progress < input.settlement.start
    ? depart(progress) * 0.5
    : 0.5 + settle(progress) * 0.5;
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
