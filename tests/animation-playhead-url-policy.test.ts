import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationUrlReplaceScheduler,
  formatKpAnimationUrlPlayhead,
  readKpAnimationPlayheadHistoryState,
  writeKpAnimationPlayheadHistoryState
} from "../src/editor/animation-playhead-url-policy.ts";

test("formats shareable playheads without reducing runtime precision", () => {
  assert.equal(formatKpAnimationUrlPlayhead(0.5534), "0.55");
  assert.equal(formatKpAnimationUrlPlayhead(0.625), "0.63");
  assert.equal(formatKpAnimationUrlPlayhead(1), "1");
  assert.throws(() => formatKpAnimationUrlPlayhead(1.001),
    /between zero and one/);
});

test("coalesces frame-rate requests into a leading and trailing replacement", () => {
  let nowMs = 0;
  let nextTimerId = 0;
  const timers = new Map<number, () => void>();
  const replacements: string[] = [];
  const scheduler = createKpAnimationUrlReplaceScheduler({
    now: () => nowMs,
    setTimer(callback) {
      const id = ++nextTimerId;
      timers.set(id, callback);
      return id;
    },
    clearTimer: (id) => timers.delete(id),
    minimumIntervalMs: 250
  });

  scheduler.request(() => replacements.push("0.01"));
  nowMs = 16;
  scheduler.request(() => replacements.push("0.02"));
  nowMs = 32;
  scheduler.request(() => replacements.push("0.03"));

  assert.deepEqual(replacements, ["0.01"]);
  assert.equal(timers.size, 1);
  nowMs = 250;
  [...timers.values()][0]!();
  assert.deepEqual(replacements, ["0.01", "0.03"]);
});

test("keeps exact playhead state for same-document history restoration", () => {
  const state = writeKpAnimationPlayheadHistoryState({
    currentState: { host: "catalogue" },
    animationId: "animation.example",
    progress: 0.625
  });

  assert.equal(state["host"], "catalogue");
  assert.equal(readKpAnimationPlayheadHistoryState({
    state,
    animationId: "animation.example"
  }), 0.625);
  assert.equal(readKpAnimationPlayheadHistoryState({
    state,
    animationId: "animation.other"
  }), undefined);
});

test("flush commits the latest settled position and dispose drops pending work", () => {
  let nowMs = 0;
  let timer: (() => void) | undefined;
  const replacements: string[] = [];
  const scheduler = createKpAnimationUrlReplaceScheduler({
    now: () => nowMs,
    setTimer(callback) {
      timer = callback;
      return 1;
    },
    clearTimer() {
      timer = undefined;
    },
    minimumIntervalMs: 250
  });

  scheduler.request(() => replacements.push("start"));
  nowMs = 10;
  scheduler.request(() => replacements.push("settled"));
  scheduler.flush();
  assert.deepEqual(replacements, ["start", "settled"]);
  nowMs = 20;
  scheduler.request(() => replacements.push("stale"));
  assert.notEqual(timer, undefined);
  scheduler.dispose();
  timer?.();
  assert.deepEqual(replacements, ["start", "settled"]);
});

test("defers continuous scrub history until the settled position flushes", () => {
  const replacements: string[] = [];
  const scheduler = createKpAnimationUrlReplaceScheduler();

  scheduler.defer(() => replacements.push("0.42"));
  scheduler.defer(() => replacements.push("0.63"));
  assert.deepEqual(replacements, []);
  scheduler.flush();
  assert.deepEqual(replacements, ["0.63"]);
});
