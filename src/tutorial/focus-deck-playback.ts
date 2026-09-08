import type { KpReaderTimelinePlaybackClock } from "../reader/runtime/timeline-playback-clock.ts";

/** Button playback, gesture settlement and restoration have different timing
 * contracts. A play request cannot silently acquire the short settlement curve.
 * Targets remain caller-owned semantic clock positions, never prose indices. */
export type KpFocusDeckPlaybackRequest =
  | { readonly kind: "play-transition"; readonly target: number; readonly motion: "full" | "reduced" }
  | { readonly kind: "settle-gesture"; readonly target: number; readonly motion: "full" | "reduced"; readonly durationMs: number }
  | { readonly kind: "restore-position"; readonly target: number; readonly source?: "controls" | "url" };

export function navigateKpFocusDeckPlayback(clock: KpReaderTimelinePlaybackClock, request: KpFocusDeckPlaybackRequest): void {
  if (!Number.isFinite(request.target) || request.target < 0 || request.target > 1)
    throw new Error("Focus Card playback target must be a normalized semantic position.");
  if (request.kind === "settle-gesture" && (!Number.isFinite(request.durationMs) || request.durationMs <= 0))
    throw new Error("Focus Card settlement duration must be positive.");
  clock.pause();
  if (request.kind === "restore-position") {
    clock.seek(request.target, request.source ?? "controls");
    return;
  }
  if (request.motion === "reduced") {
    clock.seek(request.target);
    return;
  }
  clock.play({ direction: request.target >= clock.getSnapshot().progress ? "forward" : "rewind",
    stopAt: request.target,
    ...(request.kind === "settle-gesture" ? { settlement: { durationMs: request.durationMs } } : {}) });
}
