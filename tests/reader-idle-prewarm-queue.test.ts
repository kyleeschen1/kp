import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpReaderIdlePrewarmQueue,
  type KpReaderIdleDeadline
} from "../src/reader/runtime/public-api.ts";

test("idle prewarm is bounded, latest-only, and consumes one task per idle turn", () => {
  const callbacks = new Map<number, (deadline: KpReaderIdleDeadline) => void>();
  const cancelled: number[] = [];
  const ran: string[] = [];
  let nextId = 0;
  const queue = createKpReaderIdlePrewarmQueue({
    maximumPending: 2,
    clock: {
      request(callback) {
        nextId += 1;
        callbacks.set(nextId, callback);
        return nextId;
      },
      cancel(requestId) {
        cancelled.push(requestId);
        callbacks.delete(requestId);
      }
    }
  });
  queue.replace([
    { id: "old", run: () => ran.push("old") }
  ]);
  queue.replace([
    { id: "next", run: () => ran.push("next") },
    { id: "prior", run: () => ran.push("prior") },
    { id: "out-of-bound", run: () => ran.push("out-of-bound") }
  ]);
  assert.deepEqual(cancelled, [1]);

  callbacks.get(2)?.({ didTimeout: false, timeRemaining: () => 5 });
  callbacks.get(3)?.({ didTimeout: true, timeRemaining: () => 0 });
  assert.deepEqual(ran, ["next", "prior"]);
  assert.equal(callbacks.size, 2);

  queue.dispose();
});

