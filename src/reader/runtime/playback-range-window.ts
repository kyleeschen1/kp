export interface KpReaderPlaybackRangeWindow {
  readonly id: string;
  readonly start: number;
  readonly end: number;
}

export interface KpReaderPlaybackRangeSample {
  readonly rangeId: string;
  readonly globalProgress: number;
  readonly localProgress: number;
  readonly direction: "forward" | "rewind";
  readonly status: "idle" | "playing" | "paused" | "settled";
  readonly boundary: "before" | "inside" | "after";
  readonly clockClampProgress?: number | undefined;
}

export function defineKpReaderPlaybackRangeWindow(
  input: KpReaderPlaybackRangeWindow
): KpReaderPlaybackRangeWindow {
  if (input.id.trim() === "") {
    throw new Error("Reader playback range id must not be empty.");
  }
  requireUnitProgress(input.start, "start");
  requireUnitProgress(input.end, "end");
  if (input.end <= input.start) {
    throw new Error("Reader playback range end must follow start.");
  }
  return Object.freeze({ ...input });
}

export function projectKpReaderRangeLocalProgress(
  range: KpReaderPlaybackRangeWindow,
  localProgress: number
): number {
  const validated = defineKpReaderPlaybackRangeWindow(range);
  requireUnitProgress(localProgress, "local progress");
  if (localProgress === 0) return validated.start;
  if (localProgress === 1) return validated.end;
  return validated.start +
    (validated.end - validated.start) * localProgress;
}

export function projectKpReaderRangeGlobalProgress(
  range: KpReaderPlaybackRangeWindow,
  globalProgress: number
): number {
  const validated = defineKpReaderPlaybackRangeWindow(range);
  requireUnitProgress(globalProgress, "global progress");
  if (globalProgress <= validated.start) return 0;
  if (globalProgress >= validated.end) return 1;
  return (globalProgress - validated.start) /
    (validated.end - validated.start);
}

/**
 * Range projection observes one external clock; it never advances time. When
 * playback overshoots, clockClampProgress tells the clock owner which exact
 * canonical boundary to seek before rendering another frame.
 */
export function sampleKpReaderPlaybackRange(input: {
  readonly range: KpReaderPlaybackRangeWindow;
  readonly globalProgress: number;
  readonly previousGlobalProgress?: number | undefined;
  readonly status: "idle" | "playing" | "paused";
}): KpReaderPlaybackRangeSample {
  const range = defineKpReaderPlaybackRangeWindow(input.range);
  requireUnitProgress(input.globalProgress, "global progress");
  const previous = input.previousGlobalProgress ?? input.globalProgress;
  requireUnitProgress(previous, "previous global progress");
  const direction = input.globalProgress < previous ? "rewind" : "forward";
  const boundary = input.globalProgress < range.start
    ? "before"
    : input.globalProgress > range.end
      ? "after"
      : "inside";
  const globalProgress = boundary === "before"
    ? range.start
    : boundary === "after"
      ? range.end
      : input.globalProgress;
  const localProgress = projectKpReaderRangeGlobalProgress(
    range,
    globalProgress
  );
  const reachedTerminal = input.status === "playing" && (
    direction === "forward"
      ? input.globalProgress >= range.end
      : input.globalProgress <= range.start
  );
  return Object.freeze({
    rangeId: range.id,
    globalProgress,
    localProgress,
    direction,
    status: reachedTerminal ? "settled" : input.status,
    boundary,
    ...(boundary === "inside"
      ? {}
      : { clockClampProgress: globalProgress })
  });
}

function requireUnitProgress(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`Reader playback range ${label} must be between 0 and 1.`);
  }
}
