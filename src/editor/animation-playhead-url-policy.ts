export const KP_ANIMATION_URL_PLAYHEAD_DECIMAL_PLACES = 2;
export const KP_ANIMATION_URL_REPLACE_MINIMUM_INTERVAL_MS = 250;
const KP_ANIMATION_PLAYHEAD_HISTORY_STATE_KEY = "kpAnimationPlayhead";

export function formatKpAnimationUrlPlayhead(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError("Animation playhead must be between zero and one.");
  }
  const scale = 10 ** KP_ANIMATION_URL_PLAYHEAD_DECIMAL_PLACES;
  return String(Math.round(value * scale) / scale);
}

export interface KpAnimationUrlReplaceScheduler {
  readonly request: (replace: () => void) => void;
  readonly defer: (replace: () => void) => void;
  readonly flush: () => void;
  readonly dispose: () => void;
}

export function writeKpAnimationPlayheadHistoryState(input: {
  readonly currentState: unknown;
  readonly animationId: string;
  readonly progress: number;
}): Readonly<Record<string, unknown>> {
  const animationId = input.animationId.trim();
  if (animationId === "") {
    throw new Error("Animation history state requires an animation ID.");
  }
  formatKpAnimationUrlPlayhead(input.progress);
  const current = isRecord(input.currentState) ? input.currentState : {};
  return Object.freeze({
    ...current,
    [KP_ANIMATION_PLAYHEAD_HISTORY_STATE_KEY]: Object.freeze({
      schemaVersion: "kp.animation-playhead-history.v1",
      animationId,
      progress: input.progress
    })
  });
}

export function readKpAnimationPlayheadHistoryState(input: {
  readonly state: unknown;
  readonly animationId: string;
}): number | undefined {
  if (!isRecord(input.state)) return undefined;
  const candidate = input.state[KP_ANIMATION_PLAYHEAD_HISTORY_STATE_KEY];
  if (
    !isRecord(candidate) ||
    candidate["schemaVersion"] !== "kp.animation-playhead-history.v1" ||
    candidate["animationId"] !== input.animationId ||
    typeof candidate["progress"] !== "number" ||
    !Number.isFinite(candidate["progress"]) ||
    candidate["progress"] < 0 ||
    candidate["progress"] > 1
  ) return undefined;
  return candidate["progress"];
}

/**
 * The animation clock may sample every frame, but browser history is only a
 * shareable address projection. Keeping this scheduler outside the clock
 * prevents Safari's History API quota from becoming a playback constraint.
 */
export function createKpAnimationUrlReplaceScheduler(input: {
  readonly now?: (() => number) | undefined;
  readonly setTimer?: ((callback: () => void, delayMs: number) => number) |
    undefined;
  readonly clearTimer?: ((timerId: number) => void) | undefined;
  readonly minimumIntervalMs?: number | undefined;
} = {}): KpAnimationUrlReplaceScheduler {
  const now = input.now ?? (() => performance.now());
  const setTimer = input.setTimer ?? ((callback, delayMs) =>
    window.setTimeout(callback, delayMs));
  const clearTimer = input.clearTimer ?? ((timerId) =>
    window.clearTimeout(timerId));
  const minimumIntervalMs = input.minimumIntervalMs ??
    KP_ANIMATION_URL_REPLACE_MINIMUM_INTERVAL_MS;
  if (!Number.isFinite(minimumIntervalMs) || minimumIntervalMs <= 0) {
    throw new RangeError("Animation URL replacement interval must be positive.");
  }

  let latestReplace: (() => void) | undefined;
  let timerId: number | undefined;
  let lastCommitAt = Number.NEGATIVE_INFINITY;
  let disposed = false;

  const cancelTimer = (): void => {
    if (timerId === undefined) return;
    clearTimer(timerId);
    timerId = undefined;
  };
  const commit = (): void => {
    cancelTimer();
    const replace = latestReplace;
    latestReplace = undefined;
    if (replace === undefined || disposed) return;
    lastCommitAt = now();
    replace();
  };
  const scheduleTrailingCommit = (): void => {
    if (timerId !== undefined) return;
    const remaining = Math.max(0, minimumIntervalMs - (now() - lastCommitAt));
    timerId = setTimer(commit, remaining);
  };

  return Object.freeze({
    request(replace: () => void): void {
      if (disposed) return;
      latestReplace = replace;
      if (now() - lastCommitAt >= minimumIntervalMs) {
        commit();
      } else {
        scheduleTrailingCommit();
      }
    },
    defer(replace: () => void): void {
      if (disposed) return;
      latestReplace = replace;
      cancelTimer();
    },
    flush(): void {
      if (!disposed) commit();
    },
    dispose(): void {
      disposed = true;
      latestReplace = undefined;
      cancelTimer();
    }
  });
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
