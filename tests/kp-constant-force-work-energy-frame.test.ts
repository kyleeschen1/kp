import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpConstantForceWorkEnergyFrame
} from "../domains/physics/constant-force-work-energy-frame.ts";
import {
  createKpConstantForceWorkEnergyModel
} from "../domains/physics/constant-force-work-energy-model.ts";

const exact = (numerator: string, denominator = "1") => ({
  numerator,
  denominator
});

test("physics frames project exact graph, diagram, work, and energy state", () => {
  const model = createKpConstantForceWorkEnergyModel();
  const initial = sampleKpConstantForceWorkEnergyFrame({
    model,
    progress: exact("0")
  });
  const midpoint = sampleKpConstantForceWorkEnergyFrame({
    model,
    progress: exact("1", "2")
  });
  const final = sampleKpConstantForceWorkEnergyFrame({
    model,
    progress: exact("1")
  });

  assert.deepEqual(initial.state.position, exact("0"));
  assert.deepEqual(initial.state.accumulatedWork, exact("0"));
  assert.equal(initial.phase, "initial");
  assert.deepEqual(midpoint.state.position, exact("2"));
  assert.deepEqual(midpoint.state.accumulatedWork, exact("6"));
  assert.deepEqual(midpoint.state.kineticEnergy, exact("10"));
  assert.equal(midpoint.phase, "accumulating");
  assert.deepEqual(final.state.position, exact("4"));
  assert.deepEqual(final.state.accumulatedWork, exact("12"));
  assert.deepEqual(final.state.kineticEnergy, exact("16"));
  assert.equal(final.phase, "final");
  assert.deepEqual(final.axes, {
    positionAxisId: "axis.physics.work-energy.position",
    forceAxisId: "axis.physics.work-energy.force-x",
    horizontalSymbolLatex: "x",
    verticalSymbolLatex: "F_x"
  });
});

test("physics frame identity is exact under mirrored seek and rewind", () => {
  const model = createKpConstantForceWorkEnergyModel({
    netForceMagnitude: exact("5")
  });

  for (let numerator = 0; numerator <= 20; numerator += 1) {
    const forward = sampleKpConstantForceWorkEnergyFrame({
      model,
      progress: exact(String(numerator), "20")
    });
    const rewind = sampleKpConstantForceWorkEnergyFrame({
      model,
      progress: exact(String(20 - numerator), "20"),
      direction: "rewind"
    });

    assert.deepEqual(rewind.state, forward.state);
    assert.deepEqual(rewind.activeSemanticIds, forward.activeSemanticIds);
  }
});
