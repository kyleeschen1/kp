import assert from "node:assert/strict";
import test from "node:test";

import {
  createConceptRoomPlaybackController,
  type KpConceptRoomFrameDriver,
  type KpConceptRoomPlaybackSeekSource
} from "../src/app-adapters/concept-room-playback-controller.ts";

test("playback samples one timeline, reaches its endpoint, and rewinds", () => {
  let time = 400;
  const seeks: Array<[number, KpConceptRoomPlaybackSeekSource]> = [];
  const playing: boolean[] = [];
  const frames = fakeFrames();
  const controller = createConceptRoomPlaybackController({
    checkpointTimes: [0, 400, 750, 1000],
    durationMs: 1000,
    getTimePermille: () => time,
    onSeek(next, source) { time = next; seeks.push([next, source]); },
    onPlayingChange: (value) => playing.push(value),
    frameDriver: frames.driver
  });

  controller.play();
  frames.step(100);
  frames.step(600);
  frames.step(1100);
  assert.deepEqual(seeks, [[400, "playback"], [900, "playback"], [1000, "playback"]]);
  assert.deepEqual(playing, [true, false]);
  assert.equal(controller.playing, false);

  controller.previous();
  controller.next();
  assert.deepEqual(seeks.slice(-2), [[750, "step"], [1000, "step"]]);
});

test("scrub, replay, pause, and disposal retain bounded deterministic state", () => {
  let time = 1000;
  const seeks: Array<[number, KpConceptRoomPlaybackSeekSource]> = [];
  const frames = fakeFrames();
  const controller = createConceptRoomPlaybackController({
    checkpointTimes: [0, 400, 750, 1000],
    durationMs: 1000,
    getTimePermille: () => time,
    onSeek(next, source) { time = next; seeks.push([next, source]); },
    onPlayingChange: () => undefined,
    frameDriver: frames.driver
  });
  controller.scrub(1200);
  controller.replay();
  assert.deepEqual(seeks, [[1000, "scrub"], [0, "replay"]]);
  assert.equal(controller.playing, true);
  controller.dispose();
  assert.equal(controller.playing, false);
  assert.equal(frames.cancelled.length, 1);
  controller.play();
  assert.equal(controller.playing, false);
});

function fakeFrames(): {
  readonly driver: KpConceptRoomFrameDriver;
  readonly cancelled: number[];
  step(now: number): void;
} {
  let nextId = 1;
  let pending: FrameRequestCallback | undefined;
  const cancelled: number[] = [];
  return {
    driver: {
      request(callback) { pending = callback; return nextId++; },
      cancel(requestId) { cancelled.push(requestId); pending = undefined; }
    },
    cancelled,
    step(now) {
      const callback = pending;
      pending = undefined;
      if (callback === undefined) throw new Error("No pending animation frame.");
      callback(now);
    }
  };
}
