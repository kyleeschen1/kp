import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  createKpReaderClockSample,
  sampleKpReaderAnimationFrame
} from "../src/reader/runtime/public-api.ts";

test("reader clock samples normalize progress without owning time", () => {
  assert.deepEqual(createKpReaderClockSample({
    source: "scroll",
    progress: 0.333,
    previousProgress: 0.2,
    sequence: 4,
    checkpointId: "subtract-three"
  }), {
    source: "scroll",
    progress: 0.333,
    progressPermille: 333,
    direction: "forward",
    sequence: 4,
    settled: false,
    checkpointId: "subtract-three"
  });
});

test("reader clock derives exact reverse direction from source progress", () => {
  const sample = createKpReaderClockSample({
    source: "controls",
    progress: 0.25,
    previousProgress: 0.75,
    sequence: 8,
    settled: true
  });
  assert.equal(sample.direction, "rewind");
  assert.equal(sample.progressPermille, 250);
  assert.equal(sample.settled, true);
});

test("reader clock rejects invalid progress, sequence, and checkpoint identity", () => {
  assert.throws(
    () => createKpReaderClockSample({ source: "scroll", progress: -0.01 }),
    /between 0 and 1/
  );
  assert.throws(
    () => createKpReaderClockSample({ source: "scroll", progress: Number.NaN }),
    /between 0 and 1/
  );
  assert.throws(
    () => createKpReaderClockSample({ source: "scroll", progress: 0.5, sequence: 1.5 }),
    /non-negative integer/
  );
  assert.throws(
    () => createKpReaderClockSample({ source: "url", progress: 0, checkpointId: " " }),
    /must not be empty/
  );
});

test("reader clock projects the canonical asset phase without the catalog runtime", () => {
  const animation = createLinearSolveAnimationAsset();
  const clock = createKpReaderClockSample({
    source: "scroll",
    progress: 0.667,
    previousProgress: 0.333,
    sequence: 2
  });
  const first = sampleKpReaderAnimationFrame({ animation, clock });
  const second = sampleKpReaderAnimationFrame({ animation, clock });
  assert.equal(first.rendererNeutral, true);
  assert.equal(first.animationId, "animation.linear-solve.solve-x");
  assert.equal(first.clock.progress, 0.667);
  assert.equal(first.clock.direction, "forward");
  assert.deepEqual(second, first);
});

test("reader rewind preserves the canonical asset phase direction", () => {
  const animation = createLinearSolveAnimationAsset();
  const frame = sampleKpReaderAnimationFrame({
    animation,
    clock: createKpReaderClockSample({
      source: "scroll",
      progress: 0.25,
      previousProgress: 0.75
    })
  });
  assert.equal(frame.clock.direction, "rewind");
  assert.equal(frame.clock.progress, 0.25);
});
