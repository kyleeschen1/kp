import { createKpReaderTimelinePlaybackClock, type KpReaderTimelinePlaybackScheduler } from "../reader/runtime/timeline-playback-clock.ts";
import { initialSectionView, readSaddleSectionView, sampleSaddleSection, sectionSource,
  type PreparedSaddleSection, type SaddleSectionView } from "./section-source.ts";

export interface SectionPlaybackSnapshot {
  readonly source: PreparedSaddleSection["source"];
  readonly view: SaddleSectionView;
  readonly status: "idle" | "playing" | "paused";
  readonly frame: ReturnType<typeof sampleSaddleSection>;
}
export function createSectionPlayback(initial: PreparedSaddleSection, options: {
  readonly view?: SaddleSectionView; readonly scheduler?: KpReaderTimelinePlaybackScheduler; readonly ownerWindow?: Window;
} = {}) {
  let prepared = initial;
  sectionSource(prepared);
  const checked = readSaddleSectionView(options.view ?? initialSectionView);
  if (checked.status !== "ready") throw new Error(checked.message);
  let camera = checked.value, disposed = false;
  const clock = createKpReaderTimelinePlaybackClock({ id: prepared.source.id, durationMs: 1600,
    initialProgress: camera.inspection, scheduler: options.scheduler, ownerWindow: options.ownerWindow });
  const listeners = new Set<(snapshot: SectionPlaybackSnapshot) => void>();
  const live = () => { if (disposed) throw new Error("This section player has been disposed."); };
  const snapshot = (): SectionPlaybackSnapshot => {
    live(); const view = Object.freeze({ ...camera, inspection: clock.getSnapshot().progress });
    return { source: prepared.source, view, status: clock.getStatus(), frame: sampleSaddleSection(prepared, view) };
  };
  const publish = () => { const state = snapshot(); for (const listener of listeners) listener(state); };
  const unsubscribe = clock.subscribe(publish);
  return {
    snapshot,
    subscribe(listener: (snapshot: SectionPlaybackSnapshot) => void) { live(); listeners.add(listener); return () => listeners.delete(listener); },
    seek(inspection: number) { live(); const checked = readSaddleSectionView({ ...camera, inspection });
      if (checked.status !== "ready") throw new Error(checked.message); clock.pause(); clock.seek(inspection); },
    play(direction: "forward" | "rewind" = "forward") { live(); clock.play({ direction, stopAt: direction === "forward" ? 1 : 0 }); publish(); },
    // The clock pauses scheduling without emitting. The player also owns observable status/paint invalidation.
    pause() { live(); clock.pause(); publish(); },
    setCamera(azimuth: number, elevation: number) { live(); const checked = readSaddleSectionView({ inspection: 0, azimuth, elevation });
      if (checked.status !== "ready") throw new Error(checked.message);
      // A new saved camera explicitly returns to spatial inspection, never overwriting it during a turn.
      clock.pause(); camera = checked.value; clock.seek(0); },
    updateSource(next: PreparedSaddleSection) { live(); const source = sectionSource(next);
      if (source.id !== prepared.source.id) throw new Error("Source replacement must preserve identity; mount a new occurrence for another source.");
      clock.pause(); prepared = next; publish(); },
    dispose() { if (disposed) return; disposed = true; unsubscribe(); clock.dispose(); listeners.clear(); }
  };
}
export type SectionPlayback = ReturnType<typeof createSectionPlayback>;
