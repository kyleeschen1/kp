import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpLogQuotientFrame
} from "../src/animation/log-quotient-timeline.ts";

test("log-quotient sampling is direct, deterministic, and padding-free", () => {
  for (let index = 0; index <= 100; index += 1) {
    const progress = index / 100;
    const first = sampleKpLogQuotientFrame({ progress });
    const second = sampleKpLogQuotientFrame({ progress });
    assert.deepEqual(first, second);
    assert.equal(first.semanticProgress, progress);
  }
});

test("rewind resolves the same semantic frame in the opposite direction", () => {
  for (const progress of [0, 0.125, 0.5, 0.875, 1]) {
    const rewind = sampleKpLogQuotientFrame({
      progress,
      direction: "rewind"
    });
    const forward = sampleKpLogQuotientFrame({ progress: 1 - progress });
    assert.equal(rewind.semanticProgress, forward.semanticProgress);
  }
});

test("reduced motion snaps to native endpoints and invalid input is rejected", () => {
  assert.equal(sampleKpLogQuotientFrame({
    progress: 0.49,
    reducedMotion: true
  }).semanticProgress, 0);
  assert.equal(sampleKpLogQuotientFrame({
    progress: 0.5,
    reducedMotion: true
  }).semanticProgress, 1);
  assert.throws(
    () => sampleKpLogQuotientFrame({ progress: Number.NaN }),
    /must be finite/
  );
});
