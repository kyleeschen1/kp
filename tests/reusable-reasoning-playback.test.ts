import assert from "node:assert/strict";
import test from "node:test";
import { navigateKpFocusDeckPlayback, type KpFocusDeckPlaybackRequest } from "../src/tutorial/focus-deck-playback.ts";
import { createKpReaderTimelinePlaybackClock } from "../src/reader/runtime/timeline-playback-clock.ts";

if (false) {
  // @ts-expect-error Button playback cannot receive a gesture's short duration.
  const invalid: KpFocusDeckPlaybackRequest = { kind: "play-transition", target: .5, motion: "full", durationMs: 100 };
  void invalid;
}

test("shared playback preserves authored forward/reverse time, separate from settlement and restore", () => {
  let now = 0;
  let callback: ((now: number) => void) | undefined;
  const clock = createKpReaderTimelinePlaybackClock({ id: "focus-playback", durationMs: 1000,
    scheduler: { now: () => now, request: next => { callback = next; return 1; }, cancel: () => { callback = undefined; } } });
  const advance = (delta: number) => { now += delta; const next = callback; callback = undefined; next?.(now); };
  navigateKpFocusDeckPlayback(clock, { kind: "play-transition", target: .5, motion: "full" });
  advance(100); assert.equal(clock.getSnapshot().progress, .1);
  advance(400); assert.equal(clock.getSnapshot().progress, .5);
  navigateKpFocusDeckPlayback(clock, { kind: "play-transition", target: 0, motion: "full" });
  advance(100); assert.equal(clock.getSnapshot().progress, .4);
  navigateKpFocusDeckPlayback(clock, { kind: "restore-position", target: .37, source: "url" });
  assert.equal(callback, undefined); advance(1000);
  assert.equal(clock.getSnapshot().progress, .37); assert.equal(clock.getSnapshot().source, "url");
  navigateKpFocusDeckPlayback(clock, { kind: "settle-gesture", target: .5, motion: "full", durationMs: 200 });
  advance(200); assert.equal(clock.getSnapshot().progress, .5);
  navigateKpFocusDeckPlayback(clock, { kind: "play-transition", target: 1, motion: "reduced" });
  assert.equal(clock.getSnapshot().progress, 1); assert.equal(callback, undefined);
  assert.throws(() => navigateKpFocusDeckPlayback(clock, { kind: "settle-gesture", target: .5, motion: "full", durationMs: NaN }));
  assert.equal(clock.getSnapshot().progress, 1);
  clock.dispose();
});
