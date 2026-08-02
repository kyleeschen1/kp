import assert from "node:assert/strict";
import test from "node:test";

import { createProgramTraceAnimationAsset } from
  "../src/animation/programming-adapter.ts";
import {
  checkKpProgrammingAdditionRuntimeLaw,
  createKpProgrammingAdditionStaticFrame,
  sampleKpProgrammingAdditionRuntimeFrame
} from "../src/animation/programming-addition-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from
  "../src/animation/runtime-sampler.ts";

const animation = createProgramTraceAnimationAsset();

test("addition frames synchronize source, stack, locals, output, and control", () => {
  const samples = [0, 1 / 3, 2 / 3, 1].map((progress) =>
    sampleKpProgrammingAdditionRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress }),
      playbackStatus: progress === 1 ? "complete" : "paused"
    })
  );

  assert.deepEqual(samples.map(({ stepId }) => stepId), [
    "step.programming.add.call",
    "step.programming.add.evaluate-return",
    "step.programming.add.return",
    "step.programming.add.output"
  ]);
  assert.deepEqual(samples[0]?.activeSourceRanges.map(({ exactText }) =>
    exactText
  ), ["export function add(a: number, b: number) {"]);
  assert.deepEqual(samples[1]?.activeSourceRanges.map(({ exactText }) =>
    exactText
  ), ["return a + b;"]);
  assert.deepEqual(samples[0]?.locals.map(({ name, value }) =>
    [name, value]
  ), [["a", "2"], ["b", "2"]]);
  assert.deepEqual(samples[2]?.locals.map(({ name, value }) =>
    [name, value]
  ), [["a", "2"], ["b", "2"], ["return", "4"]]);
  assert.deepEqual(samples[3]?.stack, []);
  assert.deepEqual(samples[3]?.locals, []);
  assert.deepEqual(samples[3]?.output, ["4"]);
  assert.equal(samples[3]?.control.playbackStatus, "complete");
  assert.match(samples[3]?.accessibleDescription ?? "", /Output: 4\./u);
});

test("direct seek and mirrored rewind preserve exact absolute trace state", () => {
  for (const progress of Array.from({ length: 65 }, (_, index) => index / 64)) {
    const forward = frame("forward", progress);
    const rewind = frame("rewind", 1 - progress);

    assert.equal(forward.semanticProgress, rewind.semanticProgress);
    assert.equal(forward.stepId, rewind.stepId);
    assert.deepEqual(forward.activeSourceRanges, rewind.activeSourceRanges);
    assert.deepEqual(forward.stack, rewind.stack);
    assert.deepEqual(forward.locals, rewind.locals);
    assert.deepEqual(forward.output, rewind.output);
    assert.equal(forward.accessibleDescription, rewind.accessibleDescription);
  }
});

test("reduced motion removes travel without changing semantic endpoints", () => {
  const animated = sampleKpProgrammingAdditionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: 0.5 })
  });
  const reduced = sampleKpProgrammingAdditionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: 0.5 }),
    mode: "reduced-motion"
  });

  assert.equal(animated.stepProgress, 0.5);
  assert.equal(animated.emphasisProgress, 0.5);
  assert.equal(reduced.stepProgress, 0.5);
  assert.equal(reduced.emphasisProgress, 1);
  assert.deepEqual(reduced.activeSourceRanges, animated.activeSourceRanges);
  assert.deepEqual(reduced.locals, animated.locals);
  assert.deepEqual(reduced.output, animated.output);
});

test("static output is the exact settled accessible frame", () => {
  const frame = createKpProgrammingAdditionStaticFrame(animation);

  assert.equal(frame.semanticProgress, 1);
  assert.equal(frame.stepId, "step.programming.add.output");
  assert.equal(frame.control.mode, "static");
  assert.equal(frame.control.playbackStatus, "complete");
  assert.deepEqual(frame.output, ["4"]);
  assert.match(frame.accessibleDescription, /call stack is empty/u);
  assert.match(frame.accessibleDescription, /No local bindings remain/u);
});

test("dense runtime law rejects no trace, rewind, or provenance state", () => {
  assert.deepEqual(checkKpProgrammingAdditionRuntimeLaw({ animation }), {
    lawId: "programming-runtime.addition-trace",
    passed: true,
    failures: []
  });
});

function frame(
  direction: "forward" | "rewind",
  progress: number
) {
  return sampleKpProgrammingAdditionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction,
      progress
    })
  });
}
