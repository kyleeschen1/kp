import {
  compileKpCollisionSafeFanInTracks,
  kpMaximumFanInSettlementAspectRatio,
  kpMaximumFanInExcursionInLocalInkHeights,
  kpEquationMotionTrackScale,
  sampleKpEquationMotionTrackPaintRect,
  type KpEquationCollisionTrack,
  type KpEquationMotionStageOccupancy
} from "./equation-motion-path-planner.ts";
import {
  evaluateKpMotionQuality,
  type KpMotionQualityReport
} from "./equation-motion-quality.ts";

export interface KpNativeKatexFanInSettlementDiagnostic {
  readonly progress: number;
  readonly correction: number;
  readonly remainingTravel: number;
  readonly maximumAspectRatio: number;
}

export interface KpNativeKatexFanInMotionQualityReport {
  readonly kind: "native-katex-fan-in-motion-quality-report";
  readonly passed: boolean;
  readonly trackReports: Readonly<Record<string, KpMotionQualityReport>>;
  readonly settlementDiagnostics:
    readonly KpNativeKatexFanInSettlementDiagnostic[];
}

/**
 * Audits finalized measured tracks, not abstract glyph boxes. This is the
 * canonical fail-closed boundary for smooth-but-disproportionate fan-in paths.
 */
export function evaluateKpNativeKatexFanInMotionQuality(
  tracks: readonly KpEquationCollisionTrack[]
): KpNativeKatexFanInMotionQualityReport {
  const localInkScale = Math.max(
    1,
    ...tracks.map(kpEquationMotionTrackScale)
  );
  const trackReports = Object.fromEntries(
    tracks
      .filter(({ lifecycle }) => lifecycle === "merge")
      .map((track) => {
        const start = rectCenter(track.startPaintRect ?? track.startRect);
        const end = rectCenter(track.endPaintRect ?? track.endRect);
        const samples = Array.from({ length: 101 }, (_value, index) => {
          const progress = index / 100;
          const rect = sampleKpEquationMotionTrackPaintRect(
            track,
            smoothstep(progress)
          );
          const center = rectCenter(rect);
          return {
            progress,
            entities: [{
              id: track.id,
              ...center,
              scale: 1,
              opacity: 1,
              salient: true
            }]
          };
        });
        return [
          track.id,
          evaluateKpMotionQuality({
            samples,
            corridors: [{
              entityId: track.id,
              start,
              end,
              maxOrthogonalExcursion:
                localInkScale *
                  kpMaximumFanInExcursionInLocalInkHeights
            }]
          })
        ] as const;
      })
  );
  const settlementDiagnostics = evaluateGroupSettlement(tracks);
  return Object.freeze({
    kind: "native-katex-fan-in-motion-quality-report" as const,
    passed:
      Object.values(trackReports).every((report) => report.passed) &&
      settlementDiagnostics.length === 0,
    trackReports: Object.freeze(trackReports),
    settlementDiagnostics: Object.freeze(settlementDiagnostics)
  });
}

export function compileKpQualityBoundedFanInTracks<
  Track extends KpEquationCollisionTrack
>(
  tracks: readonly Track[],
  stageOccupancy?: KpEquationMotionStageOccupancy
): readonly Track[] {
  const compiled = compileKpCollisionSafeFanInTracks(
    tracks,
    stageOccupancy
  );
  const quality = evaluateKpNativeKatexFanInMotionQuality(compiled);
  if (!quality.passed) {
    const diagnostics = Object.values(quality.trackReports)
      .flatMap((report) => report.diagnostics)
      .filter(({ severity }) => severity === "error")
      .map(({ code, entityIds, measured, budget }) =>
        `${code}:${entityIds.join("+")}:${measured.toFixed(2)}>${budget.toFixed(2)}`
      );
    diagnostics.push(...quality.settlementDiagnostics.map((diagnostic) =>
      "motion.settlement-decoupled:" +
        `${diagnostic.correction.toFixed(2)}>` +
        `${diagnostic.remainingTravel.toFixed(2)}*` +
        diagnostic.maximumAspectRatio
    ));
    throw new Error(
      `Fan-in motion failed its measured quality contract: ${
        diagnostics.join(", ")
      }.`
    );
  }
  return compiled;
}

function evaluateGroupSettlement(
  tracks: readonly KpEquationCollisionTrack[]
): readonly KpNativeKatexFanInSettlementDiagnostic[] {
  const mergeTracks = tracks.filter(({ lifecycle }) => lifecycle === "merge");
  if (mergeTracks.length === 0) return [];
  return Array.from({ length: 101 }, (_value, index) => {
    const progress = index / 100;
    const geometry = mergeTracks.map((track) => {
      const start = rectCenter(track.startPaintRect ?? track.startRect);
      const end = rectCenter(track.endPaintRect ?? track.endRect);
      const current = rectCenter(sampleKpEquationMotionTrackPaintRect(
        track,
        smoothstep(progress)
      ));
      return {
        correction: orthogonalDistance(current, start, end),
        remainingTravel: alongCorridorRemaining(current, start, end)
      };
    });
    return {
      progress,
      correction: Math.max(...geometry.map(({ correction }) => correction)),
      remainingTravel: Math.max(...geometry.map(
        ({ remainingTravel }) => remainingTravel
      )),
      maximumAspectRatio: kpMaximumFanInSettlementAspectRatio
    };
  }).filter(({ correction, remainingTravel, maximumAspectRatio }) =>
    correction > remainingTravel * maximumAspectRatio + 0.75
  );
}

function orthogonalDistance(
  point: { readonly x: number; readonly y: number },
  start: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number }
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  return Math.abs(dx * (start.y - point.y) - (start.x - point.x) * dy) /
    length;
}

function alongCorridorRemaining(
  point: { readonly x: number; readonly y: number },
  start: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number }
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return 0;
  const traveled = Math.max(0, Math.min(
    length,
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / length
  ));
  return length - traveled;
}

function rectCenter(rect: {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}): { readonly x: number; readonly y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}
