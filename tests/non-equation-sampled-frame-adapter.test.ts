import assert from "node:assert/strict";
import test from "node:test";

import {
  createLinearMapVectorAnimationAsset
} from "../src/animation/graph-adapter.ts";
import {
  sampleLinearMapVectorGraphRuntimeFrame
} from "../src/animation/graph-runtime-frame.ts";
import {
  adaptKpGraphDiagramSampledRuntimeFrame,
  adaptKpProgramTraceSampledRuntimeFrame
} from "../src/animation/non-equation-sampled-frame-adapter.ts";
import {
  createProgramTraceAnimationAsset
} from "../src/animation/programming-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createAdditionProgrammingExecutionTraceFixture
} from "../src/tutorial/programming-execution-trace-fixture.ts";

function graphSample(direction: "forward" | "rewind", progress: number) {
  const animation = createLinearMapVectorAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation,
    direction,
    progress
  });
  const graphFrame = sampleLinearMapVectorGraphRuntimeFrame({
    animation,
    runtimeFrame
  });
  return adaptKpGraphDiagramSampledRuntimeFrame({
    runtimeFrame,
    graphFrame
  });
}

test("graph frames attach mathematical samples without an independent clock", () => {
  const adaptation = graphSample("forward", 0.25);

  assert.equal(adaptation.runtimeFrame.envelope.payload?.domain, "graph-diagram");
  assert.equal(adaptation.payload.sceneId, "graph.vector-plane");
  assert.deepEqual(
    adaptation.payload.numericSamples.find(({ role }) => role === "current")
      ?.components,
    [1.25, 3]
  );
  assert.equal("progress" in adaptation.payload, false);
  assert.strictEqual(adaptation.compatibilityFrame.kind, "graph-vector-runtime-frame");
});

test("graph direct seek and rewind share the envelope clock and semantic sample", () => {
  const forward = graphSample("forward", 0.25);
  const rewind = graphSample("rewind", 0.75);

  assert.deepEqual(
    rewind.payload.numericSamples.find(({ role }) => role === "current"),
    forward.payload.numericSamples.find(({ role }) => role === "current")
  );
  assert.equal(forward.runtimeFrame.envelope.clock.direction, "forward");
  assert.equal(rewind.runtimeFrame.envelope.clock.direction, "rewind");
  assert.equal("clock" in rewind.payload, false);
});

test("program traces attach execution state to the runtime envelope", () => {
  const progress = 1 / 3;
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.program-trace.test",
    animation: createProgramTraceAnimationAsset(),
    progress
  });
  const traceFrame =
    createAdditionProgrammingExecutionTraceFixture().sample(progress);
  const adaptation = adaptKpProgramTraceSampledRuntimeFrame({
    runtimeFrame,
    traceFrame
  });

  assert.equal(adaptation.runtimeFrame.envelope.payload?.domain, "program-trace");
  assert.equal(adaptation.payload.step.id, "step.programming.add.evaluate-return");
  assert.deepEqual(adaptation.payload.locals.map(({ name, value }) => [name, value]), [
    ["a", "2"],
    ["b", "2"]
  ]);
  assert.equal("progress" in adaptation.payload, false);
  assert.strictEqual(adaptation.compatibilityFrame, traceFrame);
});

test("non-equation adapters reject runtime identity or clock drift", () => {
  const graph = graphSample("forward", 0.5);
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.program-trace.test",
    animation: createProgramTraceAnimationAsset(),
    progress: 0.5
  });
  const traceFrame =
    createAdditionProgrammingExecutionTraceFixture().sample(1 / 3);

  assert.throws(
    () => adaptKpGraphDiagramSampledRuntimeFrame({
      runtimeFrame: graph.runtimeFrame,
      graphFrame: {
        ...graph.compatibilityFrame,
        runtimeFrameId: "runtime.missing"
      }
    }),
    /does not belong/
  );
  assert.throws(
    () => adaptKpProgramTraceSampledRuntimeFrame({
      runtimeFrame,
      traceFrame
    }),
    /progress does not match/
  );
});
