import assert from "node:assert/strict";
import test from "node:test";
import { gradientComparisonAnnotations, gradientComparisonPlan, gradientComparisonReading, gradientComparisonTargets, projectGradientComparison } from "../src/tutorial/gradient-contour/gradient-contour-attention.ts";
import { gradientContourBeats, gradientComparisonBounds, sampleGradientContour } from "../src/tutorial/gradient-contour/gradient-contour-sequence.ts";

const { start, end } = gradientComparisonBounds;
const last = gradientContourBeats.length - 1;
const compare = (offset: number) => projectGradientComparison(start + offset);

test("comparison uses known semantic targets and the shared attention phases", () => {
  assert.deepEqual(gradientComparisonPlan.phases.map(p => p.kind), ["orient", "act", "settle", "inspect"]);
  for (const phase of gradientComparisonPlan.phases) {
    assert.ok(["components", "across"].includes(phase.beatId));
    for (const target of phase.focusRefs) assert.ok(gradientComparisonTargets.some(id => id === target));
  }
  for (const id of Object.keys(gradientComparisonAnnotations)) assert.ok(gradientComparisonTargets.some(target => target === id));
  assert.equal(compare(0)!.instructionRole, "Before the move");
  assert.equal(compare(0.5)!.instructionRole, "Watch");
  assert.equal(compare(0.9)!.instructionRole, "Watch");
  assert.equal(compare(1)!.instructionRole, "What this shows");
  assert.deepEqual(compare(0)!.focusRefs, ["gradient.across-component"]);
  assert.equal(compare(-0.01), undefined);
  assert.equal(compare(1.01), undefined);
  assert.throws(() => projectGradientComparison(NaN), /finite/);
});

test("essential geometry holds while reading; interpretation cannot arrive during motion", () => {
  const source = sampleGradientContour(start / last), target = sampleGradientContour(end / last);
  const sourceCue = source.attention!.cue;
  for (const position of [0, .025, .05, .099]) {
    const state = sampleGradientContour((start + position) / last);
    assert.equal(state.attention!.motionGate, "hold");
    assert.deepEqual(state.direction, source.direction);
    assert.deepEqual(state.attention!.reading, gradientComparisonReading.prepare);
  }
  for (const position of [.11, .25, .5, .75, .84]) {
    const state = sampleGradientContour((start + position) / last);
    assert.equal(state.attention!.primaryTarget, "visual");
    assert.equal(state.attention!.motionGate, "play");
    assert.equal(state.attention!.reading, gradientComparisonReading.prepare);
    assert.equal(state.attention!.cue, sourceCue);
    assert.equal(state.fraction, `${start + 1} / ${gradientContourBeats.length}`);
    assert.ok(state.components.across > source.components.across && state.components.across < 1);
  }
  for (const position of [.86, .9, .94, .98, 1]) {
    const state = sampleGradientContour((start + position) / last);
    assert.equal(state.attention!.motionGate, "hold");
    assert.deepEqual(state.direction, target.direction);
    assert.equal(state.components.along, 0);
  }
  assert.equal(target.attention!.reading, gradientComparisonReading.conclude);
  assert.equal(target.fraction, `${end + 1} / ${gradientContourBeats.length}`);
});

test("backward, interrupted and direct seeks resolve the same cue, geometry and reading", () => {
  const positions = [-.01, 0, .08, .3, .7, .9, .96, 1, 1.01];
  const expected = positions.map(position => sampleGradientContour((start + position) / last));
  assert.deepEqual([...positions].reverse().map(position => sampleGradientContour((start + position) / last)).reverse(), expected);
  sampleGradientContour(0); sampleGradientContour(1);
  assert.deepEqual(positions.map(position => sampleGradientContour((start + position) / last)), expected);
  // Attention phrases the existing motion without changing its semantic endpoints.
  assert.ok(Math.abs(expected[1]!.slope - 2) < 1e-12);
  assert.ok(Math.abs(expected[7]!.slope - Math.sqrt(8)) < 1e-12);
});
