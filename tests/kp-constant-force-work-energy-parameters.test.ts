import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpConstantForceWorkEnergySynchronizedView
} from "../src/animation/constant-force-work-energy-synchronized-view.ts";
import {
  sampleKpConstantForceWorkEnergyRuntimeFrame
} from "../src/animation/constant-force-work-energy-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  renderKpAnimationCatalogueParameters
} from "../src/editor/animation-catalogue-shell.ts";
import {
  createKpConstantForceWorkEnergyParameterState,
  createParameterizedConstantForceWorkEnergyAnimation,
  readKpConstantForceWorkEnergyParameters,
  writeKpConstantForceWorkEnergyParameters
} from "../src/editor/constant-force-work-energy-parameters.ts";

test("physics parameter route restores bounded values and omits the default", () => {
  assert.equal(
    readKpConstantForceWorkEnergyParameters("?artifact=physics&netForce=5")
      .netForceNewtons,
    5
  );
  assert.equal(
    readKpConstantForceWorkEnergyParameters("?netForce=6").netForceNewtons,
    3
  );
  assert.equal(
    writeKpConstantForceWorkEnergyParameters({
      search: "?artifact=animation.physics.constant-force-work-energy",
      state: createKpConstantForceWorkEnergyParameterState(5)
    }),
    "?artifact=animation.physics.constant-force-work-energy&netForce=5"
  );
  assert.equal(
    writeKpConstantForceWorkEnergyParameters({
      search:
        "?artifact=animation.physics.constant-force-work-energy&netForce=5",
      state: createKpConstantForceWorkEnergyParameterState(3)
    }),
    "?artifact=animation.physics.constant-force-work-energy"
  );
});

test("parameterized physics asset carries exact work-energy truth", () => {
  const parameterized = createParameterizedConstantForceWorkEnergyAnimation(
    createKpConstantForceWorkEnergyParameterState(5)
  );
  const runtime = sampleKpConstantForceWorkEnergyRuntimeFrame({
    animation: parameterized.animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation: parameterized.animation,
      progress: 1
    })
  });
  const view = createKpConstantForceWorkEnergySynchronizedView(runtime);

  assert.deepEqual(parameterized.model.states.final.accumulatedWork, {
    numerator: "20",
    denominator: "1"
  });
  assert.deepEqual(parameterized.model.states.final.kineticEnergy, {
    numerator: "24",
    denominator: "1"
  });
  assert.equal(view.equations.forceLatex, "F_x = 5\\,\\mathrm{N}");
  assert.equal(
    view.equations.workLatex,
    "W_{\\mathrm{net}} = F_x\\Delta x = 20.00\\,\\mathrm{J}"
  );
  assert.equal(
    view.equations.energyLatex,
    "K = K_0 + W_{\\mathrm{net}} = 24.00\\,\\mathrm{J}"
  );
});

test("catalogue exposes one compact physics control behind Parameters", () => {
  const base = createKpAnimationCatalogueProjection().entries[0]!;
  const entry = {
    ...base,
    animationId: "animation.physics.constant-force-work-energy"
  };
  const html = renderKpAnimationCatalogueParameters({
    entry,
    physicsParameters: createKpConstantForceWorkEnergyParameterState(5)
  });

  assert.match(html, /<h3>Parameters<\/h3>/);
  assert.match(html, /data-kp-physics-work-energy-parameters/);
  assert.match(html, /data-action="set-physics-net-force"/);
  assert.match(html, /min="1" max="5" step="1" value="5"/);
  assert.match(html, /data-kp-physics-net-force-output>5 N<\/output>/);
  assert.equal([...html.matchAll(/<input/g)].length, 1);
  assert.doesNotMatch(html, /ontology|registry|advanced/i);
});
