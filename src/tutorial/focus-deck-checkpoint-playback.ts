import type { KpReaderTimelinePlaybackClock } from "../reader/runtime/timeline-playback-clock.ts";
import { navigateKpFocusDeckPlayback } from "./focus-deck-playback.ts";
import { createKpFocusDeckCheckpointMap, resolveKpFocusDeckGestureTarget } from "./focus-deck-beat-navigation.ts";

/** Shared travel authority also supports edge-local clocks (tax), without
 * flattening their domain-specific timing into a synthetic global timeline. */
export function createKpFocusDeckTravelPlayback(input: {
  last: number; position(): number; pause(): void;
  update(position: number): void; settle(position: number, animate: boolean): void;
  resolveTarget?(sample: { origin: number; position: number; velocity: number; peakDisplacement: number; peakVelocity: number }): number;
}) {
  let disposed = false, active: object | undefined;
  const cancel = () => { active = undefined; };
  return Object.freeze({
    cancel,
    begin(now: number) {
      if (disposed) throw new Error("Focus Card playback is disposed.");
      if (!Number.isFinite(now)) throw new Error("Focus Card input time must be finite.");
      input.pause();
      const token = {}; active = token;
      const origin = Math.round(input.position());
      let at = now, previous = input.position(), velocity = 0;
      let peakDisplacement = 0, peakVelocity = 0, samples = 0;
      return {
        update(step: number, time: number) {
          if (disposed || active !== token) return;
          if (!Number.isFinite(step) || !Number.isFinite(time) || time < at) throw new Error("Focus Card samples must be finite and time monotonic.");
          const bounded = Math.max(0, Math.min(input.last, step));
          velocity = time > at && time - at <= 100 ? (bounded - previous) / (time - at) : 0;
          if (Math.abs(bounded - origin) > Math.abs(peakDisplacement)) peakDisplacement = bounded - origin;
          // Native peak-velocity evidence needs two observed offsets, not an
          // assumed motion interval between pointer contact and the first sample.
          if (samples++ > 0 && Math.abs(velocity) > Math.abs(peakVelocity)) peakVelocity = velocity;
          previous = bounded; at = time; input.update(bounded);
        },
        finish(time: number, animate = true) {
          if (disposed || active !== token) return;
          if (!Number.isFinite(time) || time < at) throw new Error("Focus Card release time must be monotonic.");
          const position = input.position(), freshVelocity = time - at <= 100 ? velocity : 0;
          const target = input.resolveTarget
            ? input.resolveTarget({ origin, position, velocity: freshVelocity, peakDisplacement, peakVelocity })
            : resolveKpFocusDeckGestureTarget(origin, position, freshVelocity, input.last);
          cancel(); input.settle(target, animate);
        },
        cancel() { if (active === token) cancel(); }
      };
    },
    dispose() { cancel(); disposed = true; }
  });
}

/** Domains supply verified stops, not another gesture policy. */
export function createKpFocusDeckCheckpointPlayback(clock: KpReaderTimelinePlaybackClock, checkpoints: readonly number[]) {
  const { last, positionAt, progressAt } = createKpFocusDeckCheckpointMap(checkpoints);
  let disposed = false;
  const position = () => positionAt(clock.getSnapshot().progress);
  const seek = (step: number, animate = false, settle = false) => {
    if (disposed) throw new Error("Focus Card playback is disposed.");
    const target = progressAt(step); travel.cancel();
    navigateKpFocusDeckPlayback(clock, settle
      ? { kind: "settle-gesture", target, motion: animate ? "full" : "reduced", durationMs: Math.max(160, Math.min(380, Math.abs(target - clock.getSnapshot().progress) * clock.durationMs)) }
      : { kind: "play-transition", target, motion: animate ? "full" : "reduced" });
  };
  const travel = createKpFocusDeckTravelPlayback({ last, position, pause: () => clock.pause(),
    update: step => clock.seek(progressAt(step)), settle: (step, animate) => seek(step, animate, true) });
  return Object.freeze({ last, position, seek, cancel: travel.cancel, begin: travel.begin,
    dispose() { travel.dispose(); disposed = true; }
  });
}
