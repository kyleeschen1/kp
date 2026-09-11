import assert from "node:assert/strict";
import test from "node:test";
import { gradientComparisonPlan, gradientComparisonReading, gradientComparisonTargets, projectGradientComparison } from "../src/tutorial/gradient-contour/gradient-contour-attention.ts";
import { sampleGradientContour } from "../src/tutorial/gradient-contour/gradient-contour-sequence.ts";

test("comparison uses known semantic targets and the shared attention phases", () => {
  assert.deepEqual(gradientComparisonPlan.phases.map(p => p.kind), ["orient", "act", "settle", "inspect"]);
  for (const phase of gradientComparisonPlan.phases) {
    assert.ok(["components", "across"].includes(phase.beatId));
    for (const target of phase.focusRefs) assert.ok(gradientComparisonTargets.some(id => id === target));
  }
  assert.equal(projectGradientComparison(4.99), undefined);
  assert.equal(projectGradientComparison(6.01), undefined);
  assert.throws(() => projectGradientComparison(NaN), /finite/);
});

test("essential geometry holds while reading; interpretation cannot arrive during motion", () => {
  const source = sampleGradientContour(5 / 7), target = sampleGradientContour(6 / 7);
  const sourceCue = source.attention!.cue;
  for (const position of [5, 5.025, 5.05, 5.099]) {
    const state = sampleGradientContour(position / 7);
    assert.equal(state.attention!.motionGate, "hold");
    assert.deepEqual(state.direction, source.direction);
    assert.deepEqual(state.attention!.reading, gradientComparisonReading.prepare);
  }
  for (const position of [5.11, 5.25, 5.5, 5.75, 5.84]) {
    const state = sampleGradientContour(position / 7);
    assert.equal(state.attention!.primaryTarget, "visual");
    assert.equal(state.attention!.motionGate, "play");
    assert.equal(state.attention!.reading, gradientComparisonReading.prepare);
    assert.equal(state.attention!.cue, sourceCue);
    assert.equal(state.fraction, "6 / 8");
    assert.ok(state.components.across > source.components.across && state.components.across < 1);
  }
  for (const position of [5.86, 5.9, 5.94, 5.98, 6]) {
    const state = sampleGradientContour(position / 7);
    assert.equal(state.attention!.motionGate, "hold");
    assert.deepEqual(state.direction, target.direction);
    assert.equal(state.components.along, 0);
  }
  assert.equal(target.attention!.reading, gradientComparisonReading.conclude);
  assert.equal(target.fraction, "7 / 8");
});

test("backward, interrupted and direct seeks resolve the same cue, geometry and reading", () => {
  const positions = [4.99, 5, 5.08, 5.3, 5.7, 5.9, 5.96, 6, 6.01];
  const expected = positions.map(position => sampleGradientContour(position / 7));
  assert.deepEqual([...positions].reverse().map(position => sampleGradientContour(position / 7)).reverse(), expected);
  sampleGradientContour(0); sampleGradientContour(1);
  assert.deepEqual(positions.map(position => sampleGradientContour(position / 7)), expected);
  // Attention phrases the existing motion without changing its semantic endpoints.
  assert.ok(Math.abs(expected[1]!.slope - 2) < 1e-12);
  assert.ok(Math.abs(expected[7]!.slope - Math.sqrt(8)) < 1e-12);
});
