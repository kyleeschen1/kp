export type KpConceptRoomPlaybackSeekSource = "playback" | "scrub" | "step" | "replay";

export interface KpConceptRoomPlaybackController {
  readonly playing: boolean;
  play(): void;
  pause(): void;
  replay(): void;
  previous(): void;
  next(): void;
  scrub(timePermille: number): void;
  dispose(): void;
}

export interface KpConceptRoomFrameDriver {
  request(callback: FrameRequestCallback): number;
  cancel(requestId: number): void;
}

export function createConceptRoomPlaybackController(input: {
  readonly checkpointTimes: readonly number[];
  readonly durationMs: number;
  readonly getTimePermille: () => number;
  readonly onSeek: (timePermille: number, source: KpConceptRoomPlaybackSeekSource) => void;
  readonly onPlayingChange: (playing: boolean) => void;
  readonly frameDriver?: KpConceptRoomFrameDriver;
}): KpConceptRoomPlaybackController {
  requireTimeline(input.checkpointTimes, input.durationMs);
  const frames = input.frameDriver ?? browserFrameDriver();
  let isPlaying = false;
  let disposed = false;
  let requestId: number | undefined;
  let startTime: number | undefined;
  let startPermille = 0;

  function pause(): void {
    if (!isPlaying) return;
    isPlaying = false;
    startTime = undefined;
    if (requestId !== undefined) frames.cancel(requestId);
    requestId = undefined;
    input.onPlayingChange(false);
  }

  function play(): void {
    if (disposed || isPlaying) return;
    if (input.getTimePermille() >= 1000) input.onSeek(0, "replay");
    startPermille = input.getTimePermille();
    startTime = undefined;
    isPlaying = true;
    input.onPlayingChange(true);
    requestId = frames.request(tick);
  }

  function tick(now: number): void {
    if (!isPlaying || disposed) return;
    startTime ??= now;
    const elapsed = now - startTime;
    const next = Math.min(1000, Math.round(startPermille + elapsed * 1000 / input.durationMs));
    input.onSeek(next, "playback");
    if (next >= 1000) pause();
    else requestId = frames.request(tick);
  }

  function seekCheckpoint(direction: -1 | 1): void {
    pause();
    const current = input.getTimePermille();
    const nextTime = direction < 0
      ? [...input.checkpointTimes].reverse().find((time) => time < current)
      : input.checkpointTimes.find((time) => time > current);
    input.onSeek(nextTime ?? (direction < 0 ? 0 : 1000), "step");
  }

  return {
    get playing() { return isPlaying; },
    play,
    pause,
    replay() {
      if (disposed) return;
      pause();
      input.onSeek(0, "replay");
      play();
    },
    previous: () => seekCheckpoint(-1),
    next: () => seekCheckpoint(1),
    scrub(timePermille) {
      if (disposed) return;
      pause();
      input.onSeek(clampTime(timePermille), "scrub");
    },
    dispose() {
      if (disposed) return;
      pause();
      disposed = true;
    }
  };
}

function requireTimeline(checkpointTimes: readonly number[], durationMs: number): void {
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new TypeError("Playback duration must be positive.");
  if (checkpointTimes.length === 0 || checkpointTimes[0] !== 0 || checkpointTimes.at(-1) !== 1000 ||
    checkpointTimes.some((time, index) => !Number.isInteger(time) || time < 0 || time > 1000 ||
      (index > 0 && time <= checkpointTimes[index - 1]!))) {
    throw new TypeError("Playback checkpoints must increase from 0 to 1000.");
  }
}

function clampTime(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1000, Math.round(value)));
}

function browserFrameDriver(): KpConceptRoomFrameDriver {
  return {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (requestId) => cancelAnimationFrame(requestId)
  };
}
