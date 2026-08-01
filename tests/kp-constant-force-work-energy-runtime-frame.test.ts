import assert from "node:assert/strict";
import test from "node:test";

import {
  createConstantForceWorkEnergyAnimationAsset
} from "../src/animation/constant-force-work-energy-adapter.ts";
import {
  sampleKpConstantForceWorkEnergyRuntimeFrame
} from "../src/animation/constant-force-work-energy-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKpConstantForceWorkEnergyModel
} from "../domains/physics/constant-force-work-energy-model.ts";

const exact = (numerator: string, denominator = "1") => ({
  numerator,
  denominator
});

test("physics runtime establishes, accumulates, connects, and settles", () => {
  const animation = createConstantForceWorkEnergyAnimationAsset();
  const sample = (progress: number) =>
    sampleKpConstantForceWorkEnergyRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress })
    });
  const establish = sample(0.1);
  const accumulate = sample(0.46);
  const connect = sample(0.85);
  const settle = sample(1);

  assert.deepEqual(
    [establish.stage, accumulate.stage, connect.stage, settle.stage],
    ["establish", "accumulate", "connect", "settle"]
  );
  assert.deepEqual(establish.semanticFrame.state.position, exact("0"));
  assert.equal(accumulate.modelProgress, 0.5);
  assert.deepEqual(accumulate.semanticFrame.state.position, exact("2"));
  assert.deepEqual(accumulate.semanticFrame.state.accumulatedWork, exact("6"));
  assert.deepEqual(accumulate.semanticFrame.state.kineticEnergy, exact("10"));
  assert.deepEqual(connect.semanticFrame.state, settle.semanticFrame.state);
  assert.ok(connect.unitIdentityOpacity < settle.unitIdentityOpacity);
});

test("physics runtime has dense forward and rewind visual symmetry", () => {
  const model = createKpConstantForceWorkEnergyModel({
    netForceMagnitude: exact("5")
  });
  const animation = createConstantForceWorkEnergyAnimationAsset(model);

  for (let index = 0; index <= 100; index += 1) {
    const progress = index / 100;
    const forward = sampleKpConstantForceWorkEnergyRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({
        animation,
        direction: "forward",
        progress
      })
    });
    const rewind = sampleKpConstantForceWorkEnergyRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({
        animation,
        direction: "rewind",
        progress: 1 - progress
      })
    });

    assert.equal(rewind.presentationProgress, forward.presentationProgress);
    assert.equal(rewind.stage, forward.stage);
    assert.equal(rewind.modelProgress, forward.modelProgress);
    assert.equal(rewind.unitIdentityOpacity, forward.unitIdentityOpacity);
    assert.deepEqual(rewind.semanticFrame, forward.semanticFrame);
  }
});
