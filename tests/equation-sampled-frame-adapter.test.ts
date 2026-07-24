import assert from "node:assert/strict";
import test from "node:test";

import {
  adaptKpEquationSampledRuntimeFrame
} from "../src/animation/equation-sampled-frame-adapter.ts";
import {
  createLinearSolveAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import { runKpInterpreter } from "../src/semantic/asset-interpreter.ts";
import { createLinearSolveKpAssetBundle } from "../src/semantic/linear-solve-asset.ts";
import {
  createLinearSolveEquationFrameInterpreter
} from "../src/semantic/linear-solve-equation-frame-interpreter.ts";

function sample(direction: "forward" | "rewind" = "forward") {
  const progress = 0.5;
  const animation = createLinearSolveAnimationAsset();
  const equationFrame = runKpInterpreter(
    createLinearSolveEquationFrameInterpreter(),
    {
      asset: createLinearSolveKpAssetBundle(),
      progress
    }
  ).output;
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation,
    direction,
    progress
  });

  return {
    equationFrame,
    runtimeFrame,
    adaptation: adaptKpEquationSampledRuntimeFrame({
      runtimeFrame,
      equationFrame
    })
  };
}

test("equation runtime frames carry a typed canonical payload", () => {
  const { adaptation } = sample();

  assert.equal(adaptation.runtimeFrame.envelope.payload?.domain, "equation");
  assert.deepEqual(
    adaptation.runtimeFrame.envelope.payload,
    adaptation.payload
  );
  assert.equal(adaptation.payload.frameId, "frame.linear-solve.katex.0001");
  assert.equal(adaptation.payload.objects[0]?.role, "source");
  assert.equal(adaptation.payload.correspondences.length, 5);
});

test("the public equation frame remains the exact compatibility view", () => {
  const { equationFrame, adaptation } = sample();
  const before = JSON.stringify(equationFrame);

  assert.strictEqual(adaptation.compatibilityFrame, equationFrame);
  assert.equal(JSON.stringify(adaptation.compatibilityFrame), before);
  assert.deepEqual(adaptation.compatibilityFrame.diagnostics, []);
  assert.deepEqual(adaptation.compatibilityFrame.drillDownIds, [
    "drilldown.linear-solve.cancel-additive-inverse"
  ]);
});

test("rewind mirrors equation roles and correspondence without forking the clock", () => {
  const forward = sample("forward").adaptation;
  const rewind = sample("rewind").adaptation;

  assert.equal(rewind.runtimeFrame.envelope.clock.progress, 0.5);
  assert.equal(rewind.runtimeFrame.envelope.clock.direction, "rewind");
  assert.equal(rewind.payload.objects[0]?.role, "target");
  assert.equal(
    rewind.payload.correspondences[0]?.sourceSelectorId,
    forward.payload.correspondences[0]?.targetSelectorId
  );
  assert.equal(
    rewind.payload.correspondences[0]?.targetSelectorId,
    forward.payload.correspondences[0]?.sourceSelectorId
  );
});

test("payload attachment changes no runtime descriptor or diagnostic view", () => {
  const { runtimeFrame, adaptation } = sample();
  const { envelope: originalEnvelope, ...originalView } = runtimeFrame;
  const { envelope: adaptedEnvelope, ...adaptedView } = adaptation.runtimeFrame;

  assert.deepEqual(adaptedView, originalView);
  assert.deepEqual(
    { ...adaptedEnvelope, payload: undefined },
    { ...originalEnvelope, payload: undefined }
  );
  assert.deepEqual(adaptation.runtimeFrame.diagnostics, runtimeFrame.diagnostics);
});

test("equation adaptation rejects clock or transformation drift", () => {
  const { runtimeFrame, equationFrame } = sample();

  assert.throws(
    () => adaptKpEquationSampledRuntimeFrame({
      runtimeFrame,
      equationFrame: { ...equationFrame, progress: 0.25 }
    }),
    /progress does not match/
  );
  assert.throws(
    () => adaptKpEquationSampledRuntimeFrame({
      runtimeFrame,
      equationFrame: {
        ...equationFrame,
        activeTransformationIds: ["transform.missing"]
      }
    }),
    /inactive runtime transformations/
  );
});
