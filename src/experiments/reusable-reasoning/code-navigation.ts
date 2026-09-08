import type { KpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { navigateKpFocusDeckPlayback } from "../../tutorial/focus-deck-playback.ts";
import { reasoningGestureTarget } from "./gesture.ts";
import { captureCodeReasoningReturn, restoreCodeReasoningReturn, type KpCodeReasoningEvidence } from "./code-evidence.ts";

export function createCodeReasoningNavigator(evidence: KpCodeReasoningEvidence, clock: KpReaderTimelinePlaybackClock) {
  const checkpoints = evidence.context.steps.map(step => step.timelineProgress);
  const last = checkpoints.length - 1;
  let view: { kind: "parent" } | { kind: "reason"; returnTo: ReturnType<typeof captureCodeReasoningReturn> } = { kind: "parent" };
  let disposed = false, active: object | undefined;
  const live = () => { if (disposed) throw new Error("Code reasoning navigator is disposed."); };
  const position = () => {
    const progress = clock.getSnapshot().progress;
    let lower = 0;
    for (let index = 1; index < checkpoints.length; index++) if (checkpoints[index]! <= progress) lower = index;
    return lower === last ? last : lower + (progress - checkpoints[lower]!) / (checkpoints[lower + 1]! - checkpoints[lower]!);
  };
  const progressAt = (step: number) => {
    if (!Number.isFinite(step) || step < 0 || step > last) throw new Error("Code step is outside the supported score.");
    const lower = Math.floor(step), upper = Math.ceil(step);
    return checkpoints[lower]! + (checkpoints[upper]! - checkpoints[lower]!) * (step - lower);
  };
  const seek = (step: number, animate = false, settle = false) => {
    live(); const target = progressAt(step); active = undefined;
    navigateKpFocusDeckPlayback(clock, settle
      ? { kind: "settle-gesture", target, motion: animate ? "full" : "reduced", durationMs: Math.max(160, Math.min(380, Math.abs(target - clock.getSnapshot().progress) * clock.durationMs)) }
      : { kind: "play-transition", target, motion: animate ? "full" : "reduced" });
  };
  return Object.freeze({
    last, position, seek, getView: () => view.kind,
    begin(now: number) {
      live(); if (!Number.isFinite(now)) throw new Error("Code input time must be finite."); clock.pause();
      const token = {}; active = token;
      const origin = Math.round(position());
      let at = now, previous = position(), velocity = 0;
      return {
        update(step: number, time: number) {
          if (disposed || active !== token) return;
          if (!Number.isFinite(step) || !Number.isFinite(time) || time < at) throw new Error("Code input samples must be finite and time monotonic.");
          const bounded = Math.max(0, Math.min(last, step));
          const progress = progressAt(bounded);
          velocity = time > at && time - at <= 100 ? (bounded - previous) / (time - at) : 0;
          previous = bounded; at = time; clock.seek(progress);
        },
        finish(time: number, animate = true) {
          if (disposed || active !== token) return;
          if (!Number.isFinite(time) || time < at) throw new Error("Code input release time must be monotonic.");
          const target = reasoningGestureTarget(origin, position(), time - at <= 100 ? velocity : 0, last);
          seek(target, animate, true);
        },
        cancel() { if (active === token) active = undefined; }
      };
    },
    open() {
      live(); active = undefined;
      if (view.kind === "reason") return;
      const returnTo = captureCodeReasoningReturn(evidence, clock.getSnapshot().progress);
      clock.pause(); view = { kind: "reason", returnTo }; clock.seek(0);
    },
    returnToParent() {
      live(); active = undefined;
      if (view.kind !== "reason") return;
      const saved = restoreCodeReasoningReturn(evidence, view.returnTo);
      clock.pause(); view = { kind: "parent" }; clock.seek(saved.progress);
    },
    dispose() { active = undefined; disposed = true; }
  });
}
