export type KpTimelineEventKind =
  | "annotation"
  | "checkpoint"
  | "focus"
  | "pause";

export interface KpTimelineBeat {
  readonly id: string;
  readonly label: string;
  readonly startMs: number;
  readonly durationMs: number;
  readonly transformationIds?: readonly string[] | undefined;
  readonly selectorIds?: readonly string[] | undefined;
}

export interface KpTimelineEvent {
  readonly id: string;
  readonly kind: KpTimelineEventKind;
  readonly timeMs: number;
  readonly label: string;
  readonly selectorIds?: readonly string[] | undefined;
}

export interface KpTimelineSpec {
  readonly id: string;
  readonly durationMs: number;
  readonly beats: readonly KpTimelineBeat[];
  readonly events: readonly KpTimelineEvent[];
}

export interface CreateKpTimelineSpecInput {
  readonly id: string;
  readonly durationMs: number;
  readonly beats?: readonly KpTimelineBeat[] | undefined;
  readonly events?: readonly KpTimelineEvent[] | undefined;
}

export interface KpTimelineSample {
  readonly timeMs: number;
  readonly progress: number;
  readonly activeBeatIds: readonly string[];
  readonly elapsedEventIds: readonly string[];
}

export interface KpTimelineValidationIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpTimelineSpec(
  input: CreateKpTimelineSpecInput
): KpTimelineSpec {
  assertNonEmpty(input.id, "Timeline id");
  assertPositiveDuration(input.durationMs, `Timeline ${input.id}`);

  return {
    id: input.id,
    durationMs: input.durationMs,
    beats: [...(input.beats ?? [])],
    events: [...(input.events ?? [])]
  };
}

export function sampleKpTimeline(
  timeline: KpTimelineSpec,
  timeMs: number
): KpTimelineSample {
  const clampedTimeMs = clamp(timeMs, 0, timeline.durationMs);

  return {
    timeMs: clampedTimeMs,
    progress: clampedTimeMs / timeline.durationMs,
    activeBeatIds: timeline.beats
      .filter((beat) => beatContainsTime(beat, clampedTimeMs, timeline.durationMs))
      .map((beat) => beat.id),
    elapsedEventIds: timeline.events
      .filter((event) => event.timeMs <= clampedTimeMs)
      .sort((left, right) => left.timeMs - right.timeMs)
      .map((event) => event.id)
  };
}

export function validateKpTimelineSpec(
  timeline: KpTimelineSpec
): readonly KpTimelineValidationIssue[] {
  const issues: KpTimelineValidationIssue[] = [];
  const beatIds = new Set<string>();
  const eventIds = new Set<string>();

  timeline.beats.forEach((beat, index) => {
    if (beatIds.has(beat.id)) {
      issues.push({
        path: `beats[${index}].id`,
        message: `Duplicate timeline beat id: ${beat.id}.`
      });
    } else {
      beatIds.add(beat.id);
    }

    if (!Number.isFinite(beat.startMs) || beat.startMs < 0) {
      issues.push({
        path: `beats[${index}].startMs`,
        message: `Timeline beat ${beat.id} startMs must be non-negative.`
      });
    }

    if (!Number.isFinite(beat.durationMs) || beat.durationMs <= 0) {
      issues.push({
        path: `beats[${index}].durationMs`,
        message: `Timeline beat ${beat.id} durationMs must be positive.`
      });
    } else if (beat.startMs + beat.durationMs > timeline.durationMs) {
      issues.push({
        path: `beats[${index}].durationMs`,
        message: `Timeline beat ${beat.id} must end within timeline duration.`
      });
    }
  });

  timeline.events.forEach((event, index) => {
    if (eventIds.has(event.id)) {
      issues.push({
        path: `events[${index}].id`,
        message: `Duplicate timeline event id: ${event.id}.`
      });
    } else {
      eventIds.add(event.id);
    }

    if (
      !Number.isFinite(event.timeMs) ||
      event.timeMs < 0 ||
      event.timeMs > timeline.durationMs
    ) {
      issues.push({
        path: `events[${index}].timeMs`,
        message: `Timeline event ${event.id} must be within timeline duration.`
      });
    }
  });

  return issues;
}

function beatContainsTime(
  beat: KpTimelineBeat,
  timeMs: number,
  timelineDurationMs: number
): boolean {
  const endMs = beat.startMs + beat.durationMs;

  return (
    timeMs >= beat.startMs &&
    (timeMs < endMs || (timeMs === timelineDurationMs && endMs === timelineDurationMs))
  );
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function assertPositiveDuration(durationMs: number, label: string): void {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error(`${label} durationMs must be positive.`);
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
