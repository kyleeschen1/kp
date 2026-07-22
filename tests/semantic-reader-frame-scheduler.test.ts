import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpReaderFrameScheduler,
  defineKpReaderFrameScheduler,
  type KpReaderFrameClock
} from "../src/reader/runtime/public-api.ts";

function createTestClock() {
  let nextId = 1;
  const callbacks = new Map<number, FrameRequestCallback>();
  const clock: KpReaderFrameClock = {
    request(callback) {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    cancel(id) {
      callbacks.delete(id);
    }
  };
  return {
    clock,
    pending: () => callbacks.size,
    flush() {
      const entry = callbacks.entries().next().value as
        | [number, FrameRequestCallback]
        | undefined;
      if (entry === undefined) throw new Error("No scheduled frame.");
      callbacks.delete(entry[0]);
      entry[1](0);
    }
  };
}

test("scheduler coalesces input and enforces read plan write ordering", () => {
  const frameClock = createTestClock();
  const events: string[] = [];
  const scheduler = defineKpReaderFrameScheduler<number>()({
    frameClock: frameClock.clock,
    readLayout: ({ revision, reasons }) => {
      events.push(`read:${revision}:${reasons.join("+")}`);
      return { revision };
    },
    planLayout: (layout) => {
      events.push(`plan-layout:${layout.revision}`);
      return { layoutRevision: layout.revision };
    },
    planFrame: ({ input, layoutPlan }) => {
      events.push(`plan-frame:${input}:${layoutPlan.layoutRevision}`);
      return input;
    },
    writeFrame: (frame) => events.push(`write:${frame}`)
  });

  scheduler.render(0.1);
  scheduler.render(0.2);
  assert.equal(frameClock.pending(), 1);
  frameClock.flush();
  assert.deepEqual(events, [
    "read:0:mount",
    "plan-layout:0",
    "plan-frame:0.2:0",
    "write:0.2"
  ]);
  assert.deepEqual(scheduler.inspect(), {
    disposed: false,
    pending: false,
    layoutRevision: 0,
    pendingInvalidationReasons: [],
    readCount: 1,
    layoutPlanCount: 1,
    framePlanCount: 1,
    writeCount: 1
  });
});

test("ordinary frames are write-only until invalidation batches a new read", () => {
  const frameClock = createTestClock();
  const reads: string[] = [];
  const scheduler = createKpReaderFrameScheduler({
    frameClock: frameClock.clock,
    readLayout: ({ revision, reasons }) => {
      reads.push(`${revision}:${reasons.join("+")}`);
      return revision;
    },
    planLayout: (layout) => layout,
    planFrame: ({ input, layoutPlan }) => `${input}@${layoutPlan}`,
    writeFrame: () => undefined
  });

  scheduler.render("first");
  frameClock.flush();
  scheduler.render("ordinary");
  frameClock.flush();
  assert.deepEqual(reads, ["0:mount"]);

  scheduler.invalidate("resize");
  scheduler.invalidate("fonts");
  scheduler.render("refreshed");
  assert.equal(frameClock.pending(), 1);
  frameClock.flush();
  assert.deepEqual(reads, ["0:mount", "1:resize+fonts"]);
  assert.equal(scheduler.inspect().framePlanCount, 3);
  assert.equal(scheduler.inspect().writeCount, 3);
});

test("invalidation during a write schedules a separate refresh and dispose cancels work", () => {
  const frameClock = createTestClock();
  let scheduler: ReturnType<typeof createKpReaderFrameScheduler<number, number, number, number>>;
  let writes = 0;
  scheduler = createKpReaderFrameScheduler({
    frameClock: frameClock.clock,
    readLayout: ({ revision }) => revision,
    planLayout: (layout) => layout,
    planFrame: ({ input }) => input,
    writeFrame: () => {
      writes += 1;
      if (writes === 1) scheduler.invalidate("content");
    }
  });

  scheduler.render(0.5);
  frameClock.flush();
  assert.equal(frameClock.pending(), 1);
  frameClock.flush();
  assert.equal(scheduler.inspect().readCount, 2);

  scheduler.render(0.75);
  assert.equal(frameClock.pending(), 1);
  scheduler.dispose();
  assert.equal(frameClock.pending(), 0);
  assert.equal(scheduler.inspect().disposed, true);
  assert.throws(() => scheduler.render(1), /disposed/);
});

test("renderNow preserves pipeline ordering for direct manipulation", () => {
  const frameClock = createTestClock();
  const writes: number[] = [];
  const scheduler = defineKpReaderFrameScheduler<number>()({
    frameClock: frameClock.clock,
    readLayout: ({ revision }) => revision,
    planLayout: (layout) => layout,
    planFrame: ({ input }) => input,
    writeFrame: (frame) => writes.push(frame)
  });

  scheduler.render(1);
  assert.equal(frameClock.pending(), 1);
  scheduler.renderNow(2);
  assert.equal(frameClock.pending(), 0);
  assert.deepEqual(writes, [2]);
});
