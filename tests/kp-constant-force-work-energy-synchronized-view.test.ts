import assert from "node:assert/strict";
import test from "node:test";

import {
  createConstantForceWorkEnergyAnimationAsset
} from "../src/animation/constant-force-work-energy-adapter.ts";
import {
  sampleKpConstantForceWorkEnergyRuntimeFrame
} from "../src/animation/constant-force-work-energy-runtime-frame.ts";
import {
  createKpConstantForceWorkEnergySynchronizedView
} from "../src/animation/constant-force-work-energy-synchronized-view.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";

test("physics synchronized view derives equations and claims from exact state", () => {
  const animation = createConstantForceWorkEnergyAnimationAsset();
  const runtime = sampleKpConstantForceWorkEnergyRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 0.46
    })
  });
  const view = createKpConstantForceWorkEnergySynchronizedView(runtime);

  assert.deepEqual(view.equations, {
    forceLatex: "F_x = 3\\,\\mathrm{N}",
    workLatex:
      "W_{\\mathrm{net}} = F_x\\Delta x \\approx 6.00\\,\\mathrm{J}",
    energyLatex: "K = K_0 + W_{\\mathrm{net}} \\approx 10.00\\,\\mathrm{J}",
    unitLatex: "\\mathrm{N}\\!\\cdot\\!\\mathrm{m}=\\mathrm{J}"
  });
  assert.equal(view.narrative.id, "narrative.physics.accumulate-work");
  assert.deepEqual(view.narrative.claimIds, [
    "claim.physics.force-constant",
    "claim.physics.graph-area-is-work",
    "claim.physics.work-equals-energy-change"
  ]);
  assert.match(view.nonvisualSummary, /Position x is horizontal/);
  assert.match(view.nonvisualSummary, /current displacement is 2 meters/);
  assert.match(view.nonvisualSummary, /exact accumulated work is 6 joules/);
  assert.match(view.nonvisualSummary, /kinetic energy is 10 joules/);
});

test("physics narrative and exact endpoint notation follow choreography", () => {
  const animation = createConstantForceWorkEnergyAnimationAsset();
  const samples = [0, 0.46, 0.85, 1].map((progress) => {
    const runtime = sampleKpConstantForceWorkEnergyRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress })
    });
    return createKpConstantForceWorkEnergySynchronizedView(runtime);
  });

  assert.deepEqual(
    samples.map(({ narrative }) => narrative.id),
    [
      "narrative.physics.establish-force",
      "narrative.physics.accumulate-work",
      "narrative.physics.connect-energy",
      "narrative.physics.settle-theorem"
    ]
  );
  assert.equal(
    samples[0]?.equations.workLatex,
    "W_{\\mathrm{net}} = F_x\\Delta x = 0.00\\,\\mathrm{J}"
  );
  assert.equal(
    samples[3]?.equations.workLatex,
    "W_{\\mathrm{net}} = F_x\\Delta x = 12.00\\,\\mathrm{J}"
  );
  assert.equal(
    samples[3]?.equations.energyLatex,
    "K = K_0 + W_{\\mathrm{net}} = 16.00\\,\\mathrm{J}"
  );
});
