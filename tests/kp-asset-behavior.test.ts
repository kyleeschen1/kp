import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpBehavior,
  reparameterizeKpBehavior,
  sampleKpBehavior,
  sampleKpBehaviorAtProgress
} from "../src/semantic/asset-behavior.ts";

test("sampleKpBehavior samples deterministic frames with normalized time", () => {
  const behavior = createKpBehavior({
    id: "behavior.linear-solve",
    durationMs: 1000,
    sample: ({ timeMs, progress }) => ({
      timeMs,
      progress,
      beat: progress < 0.5 ? "subtract" : "cancel"
    })
  });

  assert.deepEqual(sampleKpBehavior(behavior, 250), {
    timeMs: 250,
    progress: 0.25,
    beat: "subtract"
  });
  assert.deepEqual(sampleKpBehavior(behavior, 250), sampleKpBehavior(behavior, 250));
  assert.deepEqual(sampleKpBehavior(behavior, 750), {
    timeMs: 750,
    progress: 0.75,
    beat: "cancel"
  });
});

test("sampleKpBehavior clamps samples to the behavior domain", () => {
  const behavior = createKpBehavior({
    id: "behavior.clamped",
    durationMs: 200,
    sample: ({ timeMs, progress }) => ({ timeMs, progress })
  });

  assert.deepEqual(sampleKpBehavior(behavior, -50), {
    timeMs: 0,
    progress: 0
  });
  assert.deepEqual(sampleKpBehavior(behavior, 250), {
    timeMs: 200,
    progress: 1
  });
  assert.deepEqual(sampleKpBehaviorAtProgress(behavior, 0.5), {
    timeMs: 100,
    progress: 0.5
  });
});

test("reparameterizeKpBehavior preserves normalized semantic samples", () => {
  const behavior = createKpBehavior({
    id: "behavior.original",
    durationMs: 1000,
    sample: ({ timeMs, progress }) => ({
      sourceTimeMs: timeMs,
      progress,
      phase: progress < 0.5 ? "move" : "settle"
    })
  });
  const slowed = reparameterizeKpBehavior(behavior, {
    id: "behavior.slowed",
    durationMs: 4000
  });

  assert.equal(slowed.id, "behavior.slowed");
  assert.equal(slowed.durationMs, 4000);
  assert.deepEqual(sampleKpBehavior(slowed, 1000), {
    sourceTimeMs: 250,
    progress: 0.25,
    phase: "move"
  });
  assert.deepEqual(sampleKpBehavior(slowed, 3000), {
    sourceTimeMs: 750,
    progress: 0.75,
    phase: "settle"
  });
});

test("createKpBehavior rejects invalid duration", () => {
  assert.throws(
    () =>
      createKpBehavior({
        id: "behavior.bad",
        durationMs: 0,
        sample: () => null
      }),
    /durationMs must be positive/
  );
});
