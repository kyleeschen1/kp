import {
  createKpReaderClockSample,
  type KpReaderClockListener,
  type KpReaderClockSample,
  type KpReaderPlaybackClock
} from "./playback-clock.ts";

export type KpReaderTimelinePlaybackStatus =
  "idle" | "playing" | "paused";

export interface KpReaderTimelinePlaybackScheduler {
  readonly now: () => number;
  readonly request: (callback: (nowMs: number) => void) => number;
  readonly cancel: (handle: number) => void;
}

export interface KpReaderTimelinePlaybackClock
  extends KpReaderPlaybackClock {
  readonly durationMs: number;
  getStatus(): KpReaderTimelinePlaybackStatus;
  seek(progress: number): KpReaderClockSample;
  play(input: {
    readonly direction: "forward" | "rewind";
    readonly stopAt: number;
  }): void;
  pause(): KpReaderClockSample;
}

/**
 * One full-timeline clock can serve any named range. Callers choose an exact
 * global stop; range projection remains separate and never rescales time.
 */
export function createKpReaderTimelinePlaybackClock(input: {
  readonly id: string;
  readonly durationMs: number;
  readonly initialProgress?: number | undefined;
  readonly scheduler?: KpReaderTimelinePlaybackScheduler | undefined;
  readonly ownerWindow?: Window | undefined;
}): KpReaderTimelinePlaybackClock {
  if (input.id.trim() === "") {
    throw new Error("Reader timeline clock id must not be empty.");
  }
  if (!Number.isFinite(input.durationMs) || input.durationMs <= 0) {
    throw new Error("Reader timeline clock duration must be positive.");
  }
  const scheduler = input.scheduler ?? browserScheduler(
    input.ownerWindow ?? window
  );
  const listeners = new Set<KpReaderClockListener>();
  let sequence = 0;
  let snapshot = createKpReaderClockSample({
    source: "initial",
    progress: boundedProgress(input.initialProgress ?? 0),
    settled: true
  });
  let status: KpReaderTimelinePlaybackStatus = "idle";
  let direction: "forward" | "rewind" = "forward";
  let stopAt = snapshot.progress;
  let previousNowMs = scheduler.now();
  let frameHandle: number | undefined;
  let disposed = false;

  const publish = (next: KpReaderClockSample): KpReaderClockSample => {
    snapshot = next;
    for (const listener of listeners) listener(snapshot);
    return snapshot;
  };
  const cancelFrame = (): void => {
    if (frameHandle === undefined) return;
    scheduler.cancel(frameHandle);
    frameHandle = undefined;
  };
  const requestFrame = (): void => {
    if (frameHandle !== undefined || status !== "playing") return;
    frameHandle = scheduler.request(tick);
  };
  const tick = (nowMs: number): void => {
    frameHandle = undefined;
    if (disposed || status !== "playing") return;
    const elapsedMs = Math.max(0, nowMs - previousNowMs);
    previousNowMs = nowMs;
    const delta = elapsedMs / input.durationMs *
      (direction === "forward" ? 1 : -1);
    const candidate = boundedProgress(snapshot.progress + delta);
    const reachedStop = direction === "forward"
      ? candidate >= stopAt
      : candidate <= stopAt;
    const progress = reachedStop ? stopAt : candidate;
    sequence += 1;
    if (reachedStop) status = "paused";
    publish(createKpReaderClockSample({
      source: "autoplay",
      progress,
      previousProgress: snapshot.progress,
      sequence,
      settled: reachedStop
    }));
    if (!reachedStop) requestFrame();
  };
  const assertLive = (): void => {
    if (disposed) throw new Error("Reader timeline clock is disposed.");
  };

  return Object.freeze({
    id: input.id,
    source: "autoplay" as const,
    durationMs: input.durationMs,
    getSnapshot: () => snapshot,
    getStatus: () => status,
    subscribe(listener: KpReaderClockListener) {
      assertLive();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    seek(progress: number) {
      assertLive();
      cancelFrame();
      status = "paused";
      sequence += 1;
      return publish(createKpReaderClockSample({
        source: "controls",
        progress: boundedProgress(progress),
        previousProgress: snapshot.progress,
        sequence,
        settled: true
      }));
    },
    play(next: {
      readonly direction: "forward" | "rewind";
      readonly stopAt: number;
    }) {
      assertLive();
      const target = boundedProgress(next.stopAt);
      if (
        (next.direction === "forward" && target < snapshot.progress) ||
        (next.direction === "rewind" && target > snapshot.progress)
      ) {
        throw new Error("Reader timeline stop must follow playback direction.");
      }
      direction = next.direction;
      stopAt = target;
      if (stopAt === snapshot.progress) {
        status = "paused";
        sequence += 1;
        publish(createKpReaderClockSample({
          source: "autoplay",
          progress: stopAt,
          previousProgress: snapshot.progress,
          sequence,
          settled: true
        }));
        return;
      }
      status = "playing";
      previousNowMs = scheduler.now();
      requestFrame();
    },
    pause() {
      assertLive();
      cancelFrame();
      status = "paused";
      return snapshot;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelFrame();
      listeners.clear();
    }
  });
}

function browserScheduler(
  ownerWindow: Window
): KpReaderTimelinePlaybackScheduler {
  return Object.freeze({
    now: () => ownerWindow.performance.now(),
    request: (callback: (nowMs: number) => void) =>
      ownerWindow.requestAnimationFrame(callback),
    cancel: (handle: number) => ownerWindow.cancelAnimationFrame(handle)
  });
}

function boundedProgress(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("Reader timeline clock progress must be between 0 and 1.");
  }
  return value;
}
