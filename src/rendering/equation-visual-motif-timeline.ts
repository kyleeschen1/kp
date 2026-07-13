import type {
  EasingName,
  EquationMotionPlan
} from "./equation-motion-plan.ts";
import type {
  EquationVisualMotifKind,
  EquationVisualMotifPhaseId
} from "./visual-motif.ts";
import {
  applyBeatEasing,
  findSemanticBeat,
  type SemanticBeatTimeline
} from "./semantic-beat-compiler.ts";

export interface EquationVisualMotifTimeline {
  readonly timelineId: string;
  readonly beatCount: number;
  readonly motifs: readonly EquationVisualMotifTimelineMotif[];
}

export interface EquationVisualMotifTimelineMotif {
  readonly motifId: string;
  readonly kind: EquationVisualMotifKind;
  readonly correspondenceRecordId: string;
  readonly sourceTokenIds: readonly string[];
  readonly targetTokenIds: readonly string[];
  readonly phases: readonly EquationVisualMotifPhaseTiming[];
}

export interface EquationVisualMotifPhaseTiming {
  readonly phaseId: EquationVisualMotifPhaseId;
  readonly start: number;
  readonly end: number;
  readonly easing: EasingName;
  readonly summary: string;
}

export interface EquationVisualMotifTimelineFrame {
  readonly progress: number;
  readonly motifs: readonly EquationVisualMotifFrameMotif[];
}

export interface EquationVisualMotifFrameMotif {
  readonly motifId: string;
  readonly kind: EquationVisualMotifKind;
  readonly phases: readonly EquationVisualMotifPhaseFrame[];
}

export interface EquationVisualMotifPhaseFrame {
  readonly phaseId: EquationVisualMotifPhaseId;
  readonly progress: number;
  readonly easedProgress: number;
  readonly active: boolean;
}

export type EquationVisualMotifTimelineDirection = "forward" | "rewind";

export interface SampleEquationVisualMotifTimelineOptions {
  readonly direction?: EquationVisualMotifTimelineDirection | undefined;
}

// Boundary adapter: semantic plans name motif phases; renderers sample these
// normalized phase windows without duplicating semantic beat lookup rules.
export function createEquationVisualMotifTimeline(
  plan: EquationMotionPlan,
  timeline: SemanticBeatTimeline
): EquationVisualMotifTimeline {
  return {
    timelineId: timeline.id,
    beatCount: timeline.beatCount,
    motifs: plan.visualMotifs.map((motif) => ({
      motifId: motif.id,
      kind: motif.kind,
      correspondenceRecordId: motif.correspondenceRecordId,
      sourceTokenIds: [...motif.sourceTokenIds],
      targetTokenIds: [...motif.targetTokenIds],
      phases: motif.phaseIds.map((phaseId) =>
        createPhaseTiming(timeline, phaseId)
      )
    }))
  };
}

export function sampleEquationVisualMotifTimeline(
  timeline: EquationVisualMotifTimeline,
  progress: number,
  options: SampleEquationVisualMotifTimelineOptions = {}
): EquationVisualMotifTimelineFrame {
  const frameProgress = timelineProgressForDirection(
    progress,
    options.direction ?? "forward"
  );

  return {
    progress: frameProgress,
    motifs: timeline.motifs.map((motif) => ({
      motifId: motif.motifId,
      kind: motif.kind,
      phases: motif.phases.map((phase) =>
        samplePhaseTiming(phase, frameProgress)
      )
    }))
  };
}

function timelineProgressForDirection(
  progress: number,
  direction: EquationVisualMotifTimelineDirection
): number {
  const clampedProgress = clamp01(progress);

  return direction === "forward"
    ? clampedProgress
    : normalizedProgress(1 - clampedProgress);
}

function createPhaseTiming(
  timeline: SemanticBeatTimeline,
  phaseId: EquationVisualMotifPhaseId
): EquationVisualMotifPhaseTiming {
  const beat = findSemanticBeat(timeline, phaseId);

  return {
    phaseId,
    start: beat.startBeat / timeline.beatCount,
    end: beat.endBeat / timeline.beatCount,
    easing: beat.easing,
    summary: beat.summary
  };
}

function samplePhaseTiming(
  phase: EquationVisualMotifPhaseTiming,
  progress: number
): EquationVisualMotifPhaseFrame {
  const localProgress = localPhaseProgress(phase, progress);

  return {
    phaseId: phase.phaseId,
    progress: localProgress,
    easedProgress: applyBeatEasing(phase.easing, localProgress),
    active: progress >= phase.start && progress <= phase.end
  };
}

function localPhaseProgress(
  phase: EquationVisualMotifPhaseTiming,
  progress: number
): number {
  if (phase.end <= phase.start) {
    return progress >= phase.start ? 1 : 0;
  }

  if (progress <= phase.start) {
    return 0;
  }

  if (progress >= phase.end) {
    return 1;
  }

  return clamp01((progress - phase.start) / (phase.end - phase.start));
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizedProgress(value: number): number {
  return Number(value.toFixed(12));
}
