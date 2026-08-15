import {
  kpCanonicalLogExponentChoreography,
  type KpLogExponentChoreography
} from "./log-exponent-choreography.ts";
import {
  compileKpChoreographyTimeline,
  sampleKpChoreographyTimeline,
  type KpChoreographyTimeline,
  type KpChoreographyTimelineFrame
} from "./choreography-timeline.ts";
import { kpCanonicalLogExponentInterpolationProgram } from "./log-exponent-interpolation-obligations.ts";

export interface KpLogExponentOperationWindow {
  readonly operationId: string;
  readonly start: number;
  readonly end: number;
  readonly timeline: KpChoreographyTimeline;
}

export interface KpLogExponentSequenceTimeline {
  readonly schemaVersion: "kp.log-exponent-sequence-timeline.v1";
  readonly id: "timeline.animation.algebra.log-exponent.solve-two-power-x";
  readonly clockId: "clock.animation.algebra.log-exponent.solve-two-power-x";
  readonly windows: readonly KpLogExponentOperationWindow[];
}

export interface KpLogExponentObligationFrame {
  readonly obligationId: string;
  readonly progress: number;
  readonly complete: boolean;
}

export interface KpLogExponentSequenceFrame {
  readonly direction: "forward" | "rewind";
  readonly requestedProgress: number;
  readonly semanticProgress: number;
  readonly operationIndex: number;
  readonly operationId: string;
  readonly localProgress: number;
  readonly timeline: KpChoreographyTimelineFrame;
  readonly attentionStageId: string;
  readonly obligationFrames: readonly KpLogExponentObligationFrame[];
}

export function compileKpLogExponentSequenceTimeline(
  choreographies: readonly KpLogExponentChoreography[] =
    kpCanonicalLogExponentChoreography
): KpLogExponentSequenceTimeline {
  if (choreographies.length !== 3) {
    throw new Error("Canonical log-exponent timing requires exactly three operation windows.");
  }
  const weights = [0.28, 0.42, 0.3] as const;
  let cursor = 0;
  const windows = Object.freeze(choreographies.map((choreography, index) => {
    const start = cursor;
    const end = index === choreographies.length - 1
      ? 1
      : round(cursor + weights[index]!);
    cursor = end;
    return Object.freeze({
      operationId: choreography.operationId,
      start,
      end,
      timeline: compileKpChoreographyTimeline({
        id: `timeline.${choreography.operationId}.semantic`,
        plan: choreography.plan,
        focusReadinessThreshold: 0.62,
        recognitionDwell: 0.5,
        phaseWeights: phaseWeights(index)
      })
    });
  }));
  assertContiguous(windows);
  return Object.freeze({
    schemaVersion: "kp.log-exponent-sequence-timeline.v1" as const,
    id: "timeline.animation.algebra.log-exponent.solve-two-power-x" as const,
    clockId: "clock.animation.algebra.log-exponent.solve-two-power-x" as const,
    windows
  });
}

export function sampleKpLogExponentSequenceFrame(input: {
  readonly timeline?: KpLogExponentSequenceTimeline | undefined;
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
  readonly reducedMotion?: boolean | undefined;
}): KpLogExponentSequenceFrame {
  const timeline = input.timeline ?? kpCanonicalLogExponentSequenceTimeline;
  const direction = input.direction ?? "forward";
  const requestedProgress = clamp(input.progress);
  const semanticProgress = round(
    direction === "forward" ? requestedProgress : 1 - requestedProgress
  );
  const operationIndex = timeline.windows.findIndex((window, index) =>
    semanticProgress < window.end || index === timeline.windows.length - 1
  );
  const window = timeline.windows[operationIndex]!;
  const localProgress = window.end === window.start
    ? 1
    : round((semanticProgress - window.start) / (window.end - window.start));
  const frame = sampleKpChoreographyTimeline({
    timeline: window.timeline,
    progress: clamp(localProgress),
    direction: "forward"
  });
  const activePhase = frame.activePhaseIds.at(-1);
  const attentionPhase = activePhase === "act"
    ? "act"
    : activePhase === "settle" || activePhase === "release"
      ? "settle"
      : "orient";
  const actProgress = operationActProgress(frame, window.timeline);
  const obligationProgress = input.reducedMotion === true
    ? (actProgress > 0 ? 1 : 0)
    : actProgress;
  const obligationFrames = Object.freeze(
    kpCanonicalLogExponentInterpolationProgram.obligations
      .filter(({ operationId }) => operationId === window.operationId)
      .map(({ id }) => Object.freeze({
        obligationId: id,
        progress: obligationProgress,
        complete: obligationProgress >= 1
      }))
  );
  return Object.freeze({
    direction,
    requestedProgress,
    semanticProgress,
    operationIndex,
    operationId: window.operationId,
    localProgress: clamp(localProgress),
    timeline: frame,
    attentionStageId: `${window.operationId}.${attentionPhase}`,
    obligationFrames
  });
}

export const kpCanonicalLogExponentSequenceTimeline =
  compileKpLogExponentSequenceTimeline();

function phaseWeights(index: number) {
  switch (index) {
    case 0:
      return Object.freeze({ orient: 0.14, reflow: 0.16, act: 0.3, settle: 0.28, release: 0.12 });
    case 1:
      return Object.freeze({ orient: 0.12, reflow: 0.18, act: 0.42, settle: 0.2, release: 0.08 });
    case 2:
      return Object.freeze({ orient: 0.12, reflow: 0.18, act: 0.34, settle: 0.26, release: 0.1 });
    default:
      throw new Error(`Unknown log-exponent operation timing index ${index}.`);
  }
}

function operationActProgress(
  frame: KpChoreographyTimelineFrame,
  timeline: KpChoreographyTimeline
): number {
  if (frame.completedPhaseIds.includes("act")) return 1;
  if (frame.activePhaseIds.includes("act")) {
    return clamp(frame.phaseProgress.act ?? 0);
  }
  const act = timeline.phases.find(({ phaseId }) => phaseId === "act")!;
  return frame.semanticProgress >= act.end ? 1 : 0;
}

function assertContiguous(windows: readonly KpLogExponentOperationWindow[]): void {
  if (windows[0]?.start !== 0 || windows.at(-1)?.end !== 1) {
    throw new Error("Log-exponent operation windows must span the complete host clock.");
  }
  windows.forEach((window, index) => {
    if (index > 0 && windows[index - 1]!.end !== window.start) {
      throw new Error("Log-exponent operation windows must be contiguous and nonoverlapping.");
    }
  });
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Log-exponent progress must be finite.");
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
