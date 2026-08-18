import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCanonicalLogExponentSequenceTimeline,
  resolveKpLogExponentNearestEndpointIndex,
  sampleKpLogExponentSequenceFrame
} from "../src/animation/log-exponent-timeline.ts";

test("one host clock spans three contiguous deterministic operation windows", () => {
  const timeline = kpCanonicalLogExponentSequenceTimeline;
  assert.equal(
    timeline.clockId,
    "clock.animation.algebra.log-exponent.solve-two-power-x"
  );
  assert.deepEqual(
    timeline.windows.map(({ start, end }) => [start, end]),
    [[0, 0.28], [0.28, 0.7], [0.7, 1]]
  );
  for (const progress of [0, 0.11, 0.28, 0.5, 0.7, 0.91, 1]) {
    assert.deepEqual(
      sampleKpLogExponentSequenceFrame({ progress }),
      sampleKpLogExponentSequenceFrame({ progress })
    );
  }
});

test("direct seek and rewind resolve the same semantic frame", () => {
  for (const progress of [0, 0.2, 0.49, 0.8, 1]) {
    const rewind = sampleKpLogExponentSequenceFrame({
      progress,
      direction: "rewind"
    });
    const forward = sampleKpLogExponentSequenceFrame({
      progress: 1 - progress,
      direction: "forward"
    });
    assert.equal(rewind.semanticProgress, forward.semanticProgress);
    assert.equal(rewind.operationId, forward.operationId);
    assert.equal(rewind.localProgress, forward.localProgress);
    assert.deepEqual(rewind.obligationFrames, forward.obligationFrames);
  }
});

test("exponent extraction obligations progress only through the act window", () => {
  const samples = [0.3, 0.4, 0.5, 0.6, 0.69]
    .map((progress) => sampleKpLogExponentSequenceFrame({ progress }))
    .filter(({ operationIndex }) => operationIndex === 1);
  const xProgress = samples.map((frame) =>
    frame.obligationFrames.find(({ obligationId }) =>
      obligationId.endsWith("unknown-x")
    )?.progress ?? 0
  );
  assert.deepEqual(xProgress, [...xProgress].sort((a, b) => a - b));
  assert.ok(xProgress.some((progress) => progress > 0 && progress < 1));
  assert.equal(
    JSON.stringify(kpCanonicalLogExponentSequenceTimeline).includes("durationMs"),
    false
  );
});

test("fallback endpoints derive from semantic time in both directions", () => {
  assert.equal(resolveKpLogExponentNearestEndpointIndex({ progress: 0 }), 0);
  assert.equal(resolveKpLogExponentNearestEndpointIndex({ progress: 1 }), 3);
  assert.equal(resolveKpLogExponentNearestEndpointIndex({
    progress: 0,
    direction: "rewind"
  }), 3);
  assert.equal(resolveKpLogExponentNearestEndpointIndex({
    progress: 1,
    direction: "rewind"
  }), 0);
  for (const progress of [0.16, 0.35, 0.5, 0.625, 0.86]) {
    const endpointIndex = resolveKpLogExponentNearestEndpointIndex({
      progress
    });
    assert.ok(endpointIndex >= 0 && endpointIndex <= 3);
  }
});
