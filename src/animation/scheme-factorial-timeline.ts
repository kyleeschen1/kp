import type { KpSchemeCheckpointProjection } from
  "../semantic/scheme-factorial-checkpoint-projector.ts";
import type { KpSchemePedagogicalScore } from
  "../semantic/scheme-factorial-pedagogical-score.ts";

export type KpSchemeTimelineMotionKind =
  | "definition-seed"
  | "first-descent"
  | "repeated-descent"
  | "base-case"
  | "return-cascade"
  | "result";

export interface KpSchemeTimelineInterval {
  readonly id: string;
  readonly beatId: string;
  readonly motionKind: KpSchemeTimelineMotionKind;
  readonly fromCheckpointId: string;
  readonly toCheckpointId: string;
  readonly caption: string;
  readonly motion: { readonly start: number; readonly end: number };
  readonly hold: { readonly start: number; readonly end: number };
  readonly seekProgress: number;
}

export interface KpSchemeFactorialTimeline {
  readonly schemaVersion: "kp.scheme-factorial-timeline.v1";
  readonly id: "scheme-factorial.timeline.canonical-v1";
  readonly initialCheckpointId: string;
  readonly initialCaption: string;
  readonly intervals: readonly KpSchemeTimelineInterval[];
  readonly checkpointSeeks: Readonly<Record<string, number>>;
}

export interface KpSchemeFactorialTimelineSample {
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly phase: "motion" | "hold";
  readonly intervalId: string;
  readonly beatId: string;
  readonly motionKind: KpSchemeTimelineMotionKind;
  readonly fromCheckpointId: string;
  readonly toCheckpointId: string;
  readonly settledCheckpointId: string;
  readonly caption: string;
  readonly localProgress: number;
  readonly structuralProgress: number | null;
  readonly bindingProgress: number | null;
  readonly decisionProgress: number | null;
  readonly summaryProgress: number | null;
  readonly returnProgress: number | null;
}

export function compileKpSchemeFactorialTimeline(input: {
  readonly score: KpSchemePedagogicalScore;
  readonly checkpoints: KpSchemeCheckpointProjection;
}): KpSchemeFactorialTimeline {
  if (input.checkpoints.checkpoints.length !== input.score.beats.length + 1) {
    throw new Error("Scheme timeline requires one source checkpoint plus each beat.");
  }
  const raw = input.score.beats.map((beat, index) => {
    const from = input.checkpoints.checkpoints[index]!;
    const to = input.checkpoints.checkpoints[index + 1]!;
    if (to.beatId !== beat.id) {
      throw new Error(`Checkpoint ${to.id} does not settle beat ${beat.id}.`);
    }
    const motionKind = motionKindFor(beat.id);
    const motionUnits = motionKind === "return-cascade" ? 1.8
      : motionKind === "repeated-descent" ? 1.3
        : motionKind === "result" ? 0.55 : 1;
    const holdUnits = beat.hold === "reading" ? 1.15
      : beat.hold === "inspection" ? 0.85 : 0.35;
    return { beat, from, to, motionKind, motionUnits, holdUnits };
  });
  const duration = raw.reduce((sum, item) =>
    sum + item.motionUnits + item.holdUnits, 0);
  let cursor = 0;
  const intervals = raw.map((item) => {
    const motionStart = cursor / duration;
    cursor += item.motionUnits;
    const motionEnd = cursor / duration;
    const holdStart = motionEnd;
    cursor += item.holdUnits;
    const holdEnd = cursor / duration;
    return Object.freeze({
      id: `scheme-factorial.interval.${item.motionKind}`,
      beatId: item.beat.id,
      motionKind: item.motionKind,
      fromCheckpointId: item.from.id,
      toCheckpointId: item.to.id,
      caption: item.beat.caption,
      motion: Object.freeze({
        start: round(motionStart),
        end: round(motionEnd)
      }),
      hold: Object.freeze({
        start: round(holdStart),
        end: round(holdEnd)
      }),
      seekProgress: round((holdStart + holdEnd) / 2)
    });
  });
  const initial = input.checkpoints.checkpoints[0]!;
  const checkpointSeeks = Object.fromEntries([
    [initial.id, 0],
    ...intervals.map((interval) =>
      [interval.toCheckpointId, interval.seekProgress] as const)
  ]);
  return Object.freeze({
    schemaVersion: "kp.scheme-factorial-timeline.v1",
    id: "scheme-factorial.timeline.canonical-v1",
    initialCheckpointId: initial.id,
    initialCaption: initial.caption,
    intervals: Object.freeze(intervals),
    checkpointSeeks: Object.freeze(checkpointSeeks)
  });
}

export function sampleKpSchemeFactorialTimeline(input: {
  readonly timeline: KpSchemeFactorialTimeline;
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
}): KpSchemeFactorialTimelineSample {
  const progress = clamp(input.progress);
  const direction = input.direction ?? "forward";
  // A shared seam belongs to the incoming beat so direct seeks never expose
  // the previous caption with the next beat's initial geometry.
  const interval = input.timeline.intervals.find(({ hold }, index) =>
    progress < hold.end || index === input.timeline.intervals.length - 1) ??
    input.timeline.intervals.at(-1)!;
  const inMotion = progress < interval.motion.end;
  const localProgress = inMotion
    ? range(progress, interval.motion.start, interval.motion.end)
    : 1;
  return Object.freeze({
    progress,
    direction,
    phase: inMotion ? "motion" : "hold",
    intervalId: interval.id,
    beatId: interval.beatId,
    motionKind: interval.motionKind,
    fromCheckpointId: interval.fromCheckpointId,
    toCheckpointId: interval.toCheckpointId,
    settledCheckpointId: inMotion
      ? interval.fromCheckpointId
      : interval.toCheckpointId,
    caption: interval.caption,
    localProgress,
    structuralProgress: structural(interval.motionKind) ? localProgress : null,
    bindingProgress: binding(interval.motionKind) ? localProgress : null,
    decisionProgress: decision(interval.motionKind) ? localProgress : null,
    summaryProgress: interval.motionKind === "repeated-descent"
      ? localProgress : null,
    returnProgress: interval.motionKind === "return-cascade"
      ? localProgress : null
  });
}

export function seekKpSchemeFactorialCheckpoint(
  timeline: KpSchemeFactorialTimeline,
  checkpointId: string
): number {
  const progress = timeline.checkpointSeeks[checkpointId];
  if (progress === undefined) {
    throw new Error(`Unknown Scheme timeline checkpoint ${checkpointId}.`);
  }
  return progress;
}

export function magnetizeKpSchemeFactorialSeek(
  timeline: KpSchemeFactorialTimeline,
  progress: number,
  radius = 0.018
): number {
  const value = clamp(progress);
  if (!Number.isFinite(radius) || radius < 0 || radius > 1) {
    throw new Error("Scheme seek radius must be normalized and nonnegative.");
  }
  const nearest = Object.values(timeline.checkpointSeeks)
    .map((candidate) => ({ candidate, distance: Math.abs(candidate - value) }))
    .sort((left, right) => left.distance - right.distance)[0];
  return nearest !== undefined && nearest.distance <= radius
    ? nearest.candidate
    : value;
}

function motionKindFor(beatId: string): KpSchemeTimelineMotionKind {
  const kind = beatId.split(".").at(-1);
  if (kind === "definition-seed" || kind === "first-descent" ||
      kind === "repeated-descent" || kind === "base-case" ||
      kind === "return-cascade" || kind === "result") return kind;
  throw new Error(`Unknown Scheme score motion ${beatId}.`);
}

function structural(kind: KpSchemeTimelineMotionKind): boolean {
  return kind === "definition-seed" || kind === "first-descent" ||
    kind === "repeated-descent" || kind === "return-cascade";
}

function binding(kind: KpSchemeTimelineMotionKind): boolean {
  return kind === "definition-seed" || kind === "first-descent" ||
    kind === "repeated-descent";
}

function decision(kind: KpSchemeTimelineMotionKind): boolean {
  return kind === "first-descent" || kind === "repeated-descent" ||
    kind === "base-case";
}

function range(value: number, start: number, end: number): number {
  return round(Math.max(0, Math.min(1, (value - start) / (end - start))));
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Scheme timeline progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
