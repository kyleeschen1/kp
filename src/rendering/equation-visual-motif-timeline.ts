import type {
  EasingName,
  EquationMotionPlan
} from "./equation-motion-plan.ts";
import type {
  EquationVisualMotifKind,
  EquationVisualMotifPhaseId
} from "../animation/motifs/visual-motif.ts";
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

export interface KpEquationSemanticTimeline {
  readonly kind: "equation-semantic-timeline";
  readonly timelineId: string;
  readonly beatCount: number;
  readonly visualTimeline: EquationVisualMotifTimeline;
  readonly phases: readonly KpEquationSemanticTimelinePhase[];
  readonly checkpoints: readonly KpEquationSemanticTimelineCheckpoint[];
}

export interface KpEquationSemanticTimelinePhase {
  readonly id: string;
  readonly motifId: string;
  readonly motifKind: EquationVisualMotifKind;
  readonly phaseId: EquationVisualMotifPhaseId;
  readonly start: number;
  readonly end: number;
  readonly summary: string;
}

export interface KpEquationSemanticTimelineCheckpoint {
  readonly id: string;
  readonly progress: number;
  readonly beat: number;
  readonly startingPhaseIds: readonly EquationVisualMotifPhaseId[];
  readonly endingPhaseIds: readonly EquationVisualMotifPhaseId[];
  readonly label: string;
}

export interface KpEquationSemanticTimelineFrame {
  readonly progress: number;
  readonly activePhaseIds: readonly EquationVisualMotifPhaseId[];
  readonly completedPhaseIds: readonly EquationVisualMotifPhaseId[];
  readonly previousCheckpointId: string;
  readonly nextCheckpointId: string;
  readonly visualFrame: EquationVisualMotifTimelineFrame;
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

export function compileKpEquationSemanticTimeline(
  visualTimeline: EquationVisualMotifTimeline
): KpEquationSemanticTimeline {
  const phases = visualTimeline.motifs.flatMap((motif) =>
    motif.phases.map((phase) => ({
      id: `${motif.motifId}.${phase.phaseId}`,
      motifId: motif.motifId,
      motifKind: motif.kind,
      phaseId: phase.phaseId,
      start: phase.start,
      end: phase.end,
      summary: phase.summary
    }))
  );
  const progressValues = [...new Set([
    0,
    ...phases.flatMap((phase) => [phase.start, phase.end]),
    1
  ])].sort((left, right) => left - right);
  const checkpoints = progressValues.map((progress) => {
    const beat = normalizedProgress(progress * visualTimeline.beatCount);
    const startingPhaseIds = uniquePhaseIds(phases
      .filter((phase) => nearlyEqual(phase.start, progress))
      .map((phase) => phase.phaseId));
    const endingPhaseIds = uniquePhaseIds(phases
      .filter((phase) => nearlyEqual(phase.end, progress))
      .map((phase) => phase.phaseId));
    return {
      id: `${visualTimeline.timelineId}.semantic-checkpoint.${String(beat).replace(".", "-")}`,
      progress,
      beat,
      startingPhaseIds,
      endingPhaseIds,
      label: checkpointLabel(beat, startingPhaseIds, endingPhaseIds)
    };
  });
  return {
    kind: "equation-semantic-timeline",
    timelineId: visualTimeline.timelineId,
    beatCount: visualTimeline.beatCount,
    visualTimeline,
    phases,
    checkpoints
  };
}

export function sampleKpEquationSemanticTimeline(
  timeline: KpEquationSemanticTimeline,
  progress: number,
  options: SampleEquationVisualMotifTimelineOptions = {}
): KpEquationSemanticTimelineFrame {
  const visualFrame = sampleEquationVisualMotifTimeline(
    timeline.visualTimeline,
    progress,
    options
  );
  const p = visualFrame.progress;
  const activePhaseIds = uniquePhaseIds(timeline.phases
    .filter((phase) => p >= phase.start && p <= phase.end)
    .map((phase) => phase.phaseId));
  const completedPhaseIds = uniquePhaseIds(timeline.phases
    .filter((phase) => p >= phase.end)
    .map((phase) => phase.phaseId));
  const previous = [...timeline.checkpoints].reverse().find(
    (checkpoint) => checkpoint.progress <= p
  ) ?? timeline.checkpoints[0]!;
  const next = timeline.checkpoints.find(
    (checkpoint) => checkpoint.progress >= p
  ) ?? timeline.checkpoints[timeline.checkpoints.length - 1]!;
  return {
    progress: p,
    activePhaseIds,
    completedPhaseIds,
    previousCheckpointId: previous.id,
    nextCheckpointId: next.id,
    visualFrame
  };
}

export function findKpEquationSemanticTimelineCheckpoint(
  timeline: KpEquationSemanticTimeline,
  checkpointId: string
): KpEquationSemanticTimelineCheckpoint {
  const checkpoint = timeline.checkpoints.find((candidate) => candidate.id === checkpointId);
  if (checkpoint === undefined) {
    throw new Error(`Unknown semantic checkpoint ${checkpointId} in ${timeline.timelineId}.`);
  }
  return checkpoint;
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

function uniquePhaseIds(
  phaseIds: readonly EquationVisualMotifPhaseId[]
): readonly EquationVisualMotifPhaseId[] {
  return [...new Set(phaseIds)];
}

function checkpointLabel(
  beat: number,
  starting: readonly EquationVisualMotifPhaseId[],
  ending: readonly EquationVisualMotifPhaseId[]
): string {
  const events = [
    ...(ending.length === 0 ? [] : [`finish ${ending.join(", ")}`]),
    ...(starting.length === 0 ? [] : [`start ${starting.join(", ")}`])
  ];
  return events.length === 0 ? `Beat ${beat}` : `Beat ${beat}: ${events.join("; ")}`;
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 1e-12;
}
