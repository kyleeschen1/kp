import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpReaderTimelinePlaybackClock,
  type KpReaderTimelinePlaybackScheduler
} from "../src/reader/runtime/timeline-playback-clock.ts";

function fakeScheduler() {
  let nowMs = 0;
  let nextHandle = 1;
  const callbacks = new Map<number, (nowMs: number) => void>();
  const scheduler: KpReaderTimelinePlaybackScheduler = {
    now: () => nowMs,
    request(callback) {
      const handle = nextHandle++;
      callbacks.set(handle, callback);
      return handle;
    },
    cancel(handle) {
      callbacks.delete(handle);
    }
  };
  return {
    scheduler,
    step(nextNowMs: number) {
      nowMs = nextNowMs;
      const pending = [...callbacks.values()];
      callbacks.clear();
      for (const callback of pending) callback(nowMs);
    },
    pending: () => callbacks.size
  };
}

test("timeline clock advances global progress and settles at an exact stop", () => {
  const fake = fakeScheduler();
  const clock = createKpReaderTimelinePlaybackClock({
    id: "clock.test",
    durationMs: 4_000,
    initialProgress: 0.1,
    scheduler: fake.scheduler
  });
  clock.play({ direction: "forward", stopAt: 0.3 });
  fake.step(400);
  assert.equal(clock.getSnapshot().progress, 0.2);
  assert.equal(clock.getStatus(), "playing");
  fake.step(800);
  assert.equal(clock.getSnapshot().progress, 0.3);
  assert.equal(clock.getSnapshot().settled, true);
  assert.equal(clock.getStatus(), "paused");
  assert.equal(fake.pending(), 0);
});

test("seek, pause, replay, and rewind share the same clock identity", () => {
  const fake = fakeScheduler();
  const clock = createKpReaderTimelinePlaybackClock({
    id: "clock.test",
    durationMs: 1_000,
    initialProgress: 0.2,
    scheduler: fake.scheduler
  });
  const identity = clock;
  clock.seek(0.7);
  clock.play({ direction: "rewind", stopAt: 0.2 });
  fake.step(250);
  assert.ok(Math.abs(clock.getSnapshot().progress - 0.45) < Number.EPSILON);
  clock.pause();
  assert.equal(fake.pending(), 0);
  clock.seek(0.2);
  clock.play({ direction: "forward", stopAt: 0.4 });
  fake.step(450);
  assert.equal(clock.getSnapshot().progress, 0.4);
  assert.equal(clock, identity);
});

test("invalid stops and use after disposal fail closed", () => {
  const fake = fakeScheduler();
  const clock = createKpReaderTimelinePlaybackClock({
    id: "clock.test",
    durationMs: 1_000,
    initialProgress: 0.5,
    scheduler: fake.scheduler
  });
  assert.throws(
    () => clock.play({ direction: "forward", stopAt: 0.4 }),
    /must follow playback direction/u
  );
  clock.dispose();
  assert.throws(() => clock.seek(0), /disposed/u);
});
