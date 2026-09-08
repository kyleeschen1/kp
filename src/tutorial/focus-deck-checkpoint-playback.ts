import type { KpReaderTimelinePlaybackClock } from "../reader/runtime/timeline-playback-clock.ts";
import { navigateKpFocusDeckPlayback } from "./focus-deck-playback.ts";
import { createKpFocusDeckCheckpointMap, resolveKpFocusDeckGestureTarget } from "./focus-deck-beat-navigation.ts";

/** Extracted from the accepted code caller. Domains supply stops, not another
 * gesture policy; interruption revokes the one active travel capability. */
export function createKpFocusDeckCheckpointPlayback(clock: KpReaderTimelinePlaybackClock, checkpoints: readonly number[]) {
  const { last, positionAt, progressAt } = createKpFocusDeckCheckpointMap(checkpoints);
  let disposed = false, active: object | undefined;
  const live = () => { if (disposed) throw new Error("Focus Card playback is disposed."); };
  const position = () => positionAt(clock.getSnapshot().progress);
  const cancel = () => { active = undefined; };
  const seek = (step: number, animate = false, settle = false) => {
    live(); const target = progressAt(step); cancel();
    navigateKpFocusDeckPlayback(clock, settle
      ? { kind: "settle-gesture", target, motion: animate ? "full" : "reduced", durationMs: Math.max(160, Math.min(380, Math.abs(target - clock.getSnapshot().progress) * clock.durationMs)) }
      : { kind: "play-transition", target, motion: animate ? "full" : "reduced" });
  };
  return Object.freeze({ last, position, seek, cancel,
    begin(now: number) {
      live(); if (!Number.isFinite(now)) throw new Error("Focus Card input time must be finite."); clock.pause();
      const token = {}; active = token;
      const origin = Math.round(position());
      let at = now, previous = position(), velocity = 0;
      return {
        update(step: number, time: number) {
          if (disposed || active !== token) return;
          if (!Number.isFinite(step) || !Number.isFinite(time) || time < at) throw new Error("Focus Card samples must be finite and time monotonic.");
          const bounded = Math.max(0, Math.min(last, step));
          const progress = progressAt(bounded);
          velocity = time > at && time - at <= 100 ? (bounded - previous) / (time - at) : 0;
          previous = bounded; at = time; clock.seek(progress);
        },
        finish(time: number, animate = true) {
          if (disposed || active !== token) return;
          if (!Number.isFinite(time) || time < at) throw new Error("Focus Card release time must be monotonic.");
          seek(resolveKpFocusDeckGestureTarget(origin, position(), time - at <= 100 ? velocity : 0, last), animate, true);
        },
        cancel() { if (active === token) active = undefined; }
      };
    },
    dispose() { cancel(); disposed = true; }
  });
}
