import assert from "node:assert/strict";
import test from "node:test";
import { KpDevReviewTemporalTrace } from "../src/dev-review/temporal-trace.ts";

test("retains only bounded recent samples from the caller's render clock", () => {
  const trace = new KpDevReviewTemporalTrace({ capacity: 3, windowMs: 1_000 });
  trace.push({ atMs: 0, progressPermille: 0 });
  trace.push({ atMs: 500, progressPermille: 100 });
  trace.push({ atMs: 1_000, progressPermille: 200 });
  trace.push({ atMs: 1_500, progressPermille: 300, transitionId: "cancel-three" });

  assert.deepEqual(trace.snapshot(1_500), [
    { offsetMs: -1_000, progressPermille: 100 },
    { offsetMs: -500, progressPermille: 200 },
    { offsetMs: 0, progressPermille: 300, transitionId: "cancel-three" }
  ]);
});

test("snapshots neither future frames nor mutable internal samples", () => {
  const trace = new KpDevReviewTemporalTrace({ capacity: 4, windowMs: 1_000 });
  const sample = { atMs: 100, progressPermille: 100 };
  trace.push(sample);
  trace.push({ atMs: 200, progressPermille: 200 });

  const snapshot = trace.snapshot(150);
  assert.deepEqual(snapshot, [{ offsetMs: -50, progressPermille: 100 }]);
  assert.equal(Object.isFrozen(snapshot[0]), true);
  assert.deepEqual(sample, { atMs: 100, progressPermille: 100 });
});

test("rejects a second clock's out-of-order samples", () => {
  const trace = new KpDevReviewTemporalTrace();
  trace.push({ atMs: 200 });
  assert.throws(() => trace.push({ atMs: 199 }), /renderer clock/);
});
