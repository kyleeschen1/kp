import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_SYNCHRONIZED_MODEL_PROGRESS_DENOMINATOR,
  exactKpSynchronizedModelProgress,
  quantizeKpSynchronizedModelProgress,
  sampleKpSynchronizedModelProjectionProgress
} from "../src/animation/synchronized-model-projection.ts";

test("forward and rewind project one history-independent presentation clock", () => {
  for (const progress of [0, 0.1, 1 / 3, 0.5, 0.87, 1]) {
    const forward = sampleKpSynchronizedModelProjectionProgress({
      direction: "forward",
      progress
    });
    const rewind = sampleKpSynchronizedModelProjectionProgress({
      direction: "rewind",
      progress: 1 - progress
    });
    assert.equal(forward.presentationProgress, rewind.presentationProgress);
  }
});

test("number and rational projections share one named precision authority", () => {
  const value = 1 / 3;
  const quantized = quantizeKpSynchronizedModelProgress(value);
  const exact = exactKpSynchronizedModelProgress(value);
  assert.equal(exact.denominator, String(KP_SYNCHRONIZED_MODEL_PROGRESS_DENOMINATOR));
  assert.equal(
    quantized,
    Number(exact.numerator) / Number(exact.denominator)
  );
  assert.equal(quantizeKpSynchronizedModelProgress(-1), 0);
  assert.equal(quantizeKpSynchronizedModelProgress(2), 1);
});
