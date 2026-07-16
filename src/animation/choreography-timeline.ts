import type {
  KpChoreographyEnvelopePhaseId,
  KpChoreographyPlan
} from "./choreography-plan.ts";

export interface KpChoreographyTimelinePhase {
  readonly phaseId: KpChoreographyEnvelopePhaseId;
  readonly start: number;
  readonly end: number;
  readonly readinessAt: number;
  readonly recognitionAt?: number | undefined;
  readonly noOp: boolean;
}

export interface KpChoreographyTimelineCheckpoint {
  readonly id: string;
  readonly phaseId: KpChoreographyEnvelopePhaseId;
  readonly progress: number;
  readonly stable: boolean;
}

export interface KpChoreographyTimeline {
  readonly id: string;
  readonly kind: "choreography-timeline";
  readonly sharedTimelineRefId: string;
  readonly phases: readonly KpChoreographyTimelinePhase[];
  readonly checkpoints: readonly KpChoreographyTimelineCheckpoint[];
  readonly attentionBridge?: {
    readonly start: number;
    readonly end: number;
    readonly targetId: string;
  } | undefined;
}

export interface KpChoreographyTimelineFrame {
  readonly direction: "forward" | "rewind";
  readonly requestedProgress: number;
  readonly semanticProgress: number;
  readonly activePhaseIds: readonly KpChoreographyEnvelopePhaseId[];
  readonly completedPhaseIds: readonly KpChoreographyEnvelopePhaseId[];
  readonly phaseProgress: Readonly<
    Partial<Record<KpChoreographyEnvelopePhaseId, number>>
  >;
  readonly previousCheckpointId: string;
  readonly nextCheckpointId: string;
  readonly attentionBridgeActive: boolean;
}

export function compileKpChoreographyTimeline(input: {
  readonly id: string;
  readonly plan: KpChoreographyPlan;
  readonly focusReadinessThreshold?: number | undefined;
  readonly recognitionDwell?: number | undefined;
  readonly governedOverlapFraction?: number | undefined;
  readonly phaseWeights?: Readonly<
    Partial<Record<KpChoreographyEnvelopePhaseId, number>>
  > | undefined;
  readonly attentionBridgeTargetId?: string | undefined;
}): KpChoreographyTimeline {
  const focusReadiness = unit(
    input.focusReadinessThreshold ?? 0.62,
    "focus readiness threshold"
  );
  const recognitionDwell = unit(
    input.recognitionDwell ?? 0.35,
    "recognition dwell"
  );
  const overlapFraction = unit(
    input.governedOverlapFraction ?? 0.16,
    "governed overlap fraction"
  );
  const defaults: Record<KpChoreographyEnvelopePhaseId, number> = {
    orient: 0.14,
    reflow: 0.22,
    act: 0.34,
    settle: 0.2,
    release: 0.1
  };
  const weights = input.plan.phases.map((phase) =>
    phase.mode === "no-op"
      ? 0
      : nonNegative(input.phaseWeights?.[phase.id] ?? defaults[phase.id], `${phase.id} weight`)
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) throw new Error("Choreography timeline requires an active phase.");
  const windows: Array<{ phaseId: KpChoreographyEnvelopePhaseId; start: number; end: number; noOp: boolean }> = [];
  let cursor = 0;
  input.plan.phases.forEach((phase, index) => {
    const duration = weights[index]! / total;
    windows.push({
      phaseId: phase.id,
      start: cursor,
      end: cursor + duration,
      noOp: phase.mode === "no-op"
    });
    cursor += duration;
  });

  if (hasGovernedReflowActOverlap(input.plan)) {
    const reflow = windows.find((window) => window.phaseId === "reflow")!;
    const actIndex = windows.findIndex((window) => window.phaseId === "act");
    const overlap = Math.min(
      reflow.end - reflow.start,
      windows[actIndex]!.end - windows[actIndex]!.start
    ) * overlapFraction;
    for (let index = actIndex; index < windows.length; index += 1) {
      windows[index]!.start -= overlap;
      windows[index]!.end -= overlap;
    }
    const scale = 1 / windows[windows.length - 1]!.end;
    windows.forEach((window) => {
      window.start *= scale;
      window.end *= scale;
    });
  }

  const phases = windows.map((window) => {
    const duration = window.end - window.start;
    const recognitionAt =
      window.phaseId === "settle"
        ? window.end - duration * recognitionDwell
        : undefined;
    return {
      ...window,
      readinessAt:
        window.phaseId === "orient"
          ? window.start + duration * focusReadiness
          : window.phaseId === "settle"
            ? recognitionAt!
            : window.start,
      ...(recognitionAt === undefined ? {} : { recognitionAt })
    };
  });
  const checkpoints = input.plan.checkpoints.map((checkpoint) => {
    const phase = phases.find((candidate) => candidate.phaseId === checkpoint.phaseId)!;
    const progress =
      checkpoint.kind === "focus-ready"
        ? phases.find((candidate) => candidate.phaseId === "orient")!.readinessAt
        : checkpoint.kind === "space-reserved"
          ? phases.find((candidate) => candidate.phaseId === "reflow")!.start
          : checkpoint.kind === "recognition"
            ? phases.find((candidate) => candidate.phaseId === "settle")!.recognitionAt!
            : phase.end;
    return {
      id: checkpoint.id,
      phaseId: checkpoint.phaseId,
      progress: round(progress),
      stable: checkpoint.stable
    };
  }).sort((left, right) => left.progress - right.progress);
  const settle = phases.find((phase) => phase.phaseId === "settle")!;
  const release = phases.find((phase) => phase.phaseId === "release")!;
  return {
    id: input.id,
    kind: "choreography-timeline",
    sharedTimelineRefId: input.plan.timelineRefId,
    phases: phases.map(roundPhase),
    checkpoints,
    ...(input.attentionBridgeTargetId === undefined
      ? {}
      : {
          attentionBridge: {
            start: round(settle.recognitionAt!),
            end: round(release.start + (release.end - release.start) * 0.45),
            targetId: input.attentionBridgeTargetId
          }
        })
  };
}

export function sampleKpChoreographyTimeline(input: {
  readonly timeline: KpChoreographyTimeline;
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
}): KpChoreographyTimelineFrame {
  const direction = input.direction ?? "forward";
  const requestedProgress = clamp(input.progress);
  const semanticProgress =
    direction === "forward" ? requestedProgress : round(1 - requestedProgress);
  const active = input.timeline.phases.filter((phase) =>
    phase.noOp
      ? nearlyEqual(semanticProgress, phase.start)
      : semanticProgress >= phase.start && semanticProgress <= phase.end
  );
  const completed = input.timeline.phases.filter(
    (phase) => semanticProgress >= phase.end
  );
  const phaseProgress = Object.fromEntries(active.map((phase) => [
    phase.phaseId,
    phase.end <= phase.start
      ? 1
      : clamp((semanticProgress - phase.start) / (phase.end - phase.start))
  ]));
  const previous = [...input.timeline.checkpoints].reverse().find(
    (checkpoint) => checkpoint.progress <= semanticProgress
  ) ?? input.timeline.checkpoints[0]!;
  const next = input.timeline.checkpoints.find(
    (checkpoint) => checkpoint.progress >= semanticProgress
  ) ?? input.timeline.checkpoints[input.timeline.checkpoints.length - 1]!;
  return {
    direction,
    requestedProgress,
    semanticProgress,
    activePhaseIds: active.map((phase) => phase.phaseId),
    completedPhaseIds: completed.map((phase) => phase.phaseId),
    phaseProgress,
    previousCheckpointId: previous.id,
    nextCheckpointId: next.id,
    attentionBridgeActive:
      input.timeline.attentionBridge !== undefined &&
      semanticProgress >= input.timeline.attentionBridge.start &&
      semanticProgress <= input.timeline.attentionBridge.end
  };
}

function hasGovernedReflowActOverlap(plan: KpChoreographyPlan): boolean {
  return plan.activities.some((activity) => {
    if (activity.phaseId !== "act" || activity.governedOverlap === undefined) {
      return false;
    }
    return plan.activities.some(
      (candidate) =>
        candidate.id === activity.governedOverlap?.withActivityId &&
        candidate.phaseId === "reflow"
    );
  });
}

function roundPhase(
  phase: KpChoreographyTimelinePhase
): KpChoreographyTimelinePhase {
  return {
    ...phase,
    start: round(phase.start),
    end: round(phase.end),
    readinessAt: round(phase.readinessAt),
    ...(phase.recognitionAt === undefined
      ? {}
      : { recognitionAt: round(phase.recognitionAt) })
  };
}

function unit(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be normalized between 0 and 1.`);
  }
  return value;
}

function nonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be nonnegative.`);
  }
  return value;
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Timeline progress must be finite.");
  return Math.min(1, Math.max(0, value));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-9;
}
