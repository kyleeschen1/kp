import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpExponentLawChoreography,
  sampleKpExponentLawChoreography
} from "../src/animation/exponent-law-choreography.ts";

test("exponent laws focus before product layout and emission", () => {
  const preview = sampleKpExponentLawChoreography({
    plan: peelPlan(),
    progress: 0.12
  });
  assert.ok(preview.focusStrength > 0.9);
  assert.ok(preview.reflowProgress > 0);
  assert.equal(preview.emissionProgress, 0);
  assert.equal(preview.exponentChangeProgress, 0);
});

test("factor and operator emissions stagger in semantic order", () => {
  const frame = sampleKpExponentLawChoreography({
    plan: peelPlan(),
    progress: 0.5
  });
  assert.ok(frame.emissions[0]!.pathProgress > frame.emissions[1]!.pathProgress);
  assert.ok(frame.emissions.every((emission) => emission.opacity === 1));
  assert.equal(frame.exponentChangeProgress, 0);
});

test("unit absorption and factor peeling settle native and release focus", () => {
  for (const plan of [peelPlan(), absorbPlan()]) {
    const settled = sampleKpExponentLawChoreography({ plan, progress: 1 });
    assert.equal(settled.reflowProgress, 1);
    assert.equal(settled.emissionProgress, 1);
    assert.equal(settled.exponentChangeProgress, 1);
    assert.equal(settled.settlementProgress, 1);
    assert.equal(settled.focusStrength, 0);
  }
});

test("unit absorption rejects an unanchored exit", () => {
  assert.throws(() => compileKpExponentLawChoreography({
    id: "bad-absorption",
    operationKind: "absorb-unit-exponent",
    focusRecordIds: ["unit-exponent-exits"],
    continuantRecordIds: [],
    emittedRecordIds: [],
    exitRecordIds: ["unit-exponent-exits"]
  }), /continuants and an exit record/);
});

function peelPlan() {
  return compileKpExponentLawChoreography({
    id: "exponent.peel",
    operationKind: "peel-one-factor",
    focusRecordIds: ["base-splits", "exponent-lowers"],
    continuantRecordIds: [],
    emittedRecordIds: ["base-splits", "exponent-lowers"],
    exitRecordIds: []
  });
}

function absorbPlan() {
  return compileKpExponentLawChoreography({
    id: "exponent.absorb-unit",
    operationKind: "absorb-unit-exponent",
    focusRecordIds: ["unit-exponent-exits"],
    continuantRecordIds: ["residual-base-persists"],
    emittedRecordIds: [],
    exitRecordIds: ["unit-exponent-exits"]
  });
}
