import type { KpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { createKpFocusDeckCheckpointPlayback } from "../../tutorial/focus-deck-checkpoint-playback.ts";
import { captureCodeReasoningReturn, restoreCodeReasoningReturn, type KpCodeReasoningEvidence } from "./code-evidence.ts";

export function createCodeReasoningNavigator(evidence: KpCodeReasoningEvidence, clock: KpReaderTimelinePlaybackClock) {
  const playback = createKpFocusDeckCheckpointPlayback(clock, evidence.context.steps.map(step => step.timelineProgress));
  let view: { kind: "parent" } | { kind: "reason"; returnTo: ReturnType<typeof captureCodeReasoningReturn> } = { kind: "parent" };
  let disposed = false;
  const live = () => { if (disposed) throw new Error("Code reasoning navigator is disposed."); };
  return Object.freeze({
    last: playback.last, position: playback.position, seek: playback.seek, begin: playback.begin, getView: () => view.kind,
    open() {
      live(); playback.cancel();
      if (view.kind === "reason") return;
      const returnTo = captureCodeReasoningReturn(evidence, clock.getSnapshot().progress);
      clock.pause(); view = { kind: "reason", returnTo }; clock.seek(0);
    },
    returnToParent() {
      live(); playback.cancel();
      if (view.kind !== "reason") return;
      const saved = restoreCodeReasoningReturn(evidence, view.returnTo);
      clock.pause(); view = { kind: "parent" }; clock.seek(saved.progress);
    },
    dispose() { playback.dispose(); disposed = true; }
  });
}
