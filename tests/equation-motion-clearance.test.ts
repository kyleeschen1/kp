import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpEquationMotionClearanceFrame,
  type KpEquationMotionClearanceFrame,
  type KpEquationMotionClearanceRequirement
} from "../src/rendering/equation-motion-clearance.ts";

const requirement: KpEquationMotionClearanceRequirement = {
  id: "solve-x.focal-clearance",
  movingIds: ["seven", "three"],
  protectedIds: ["x", "equals"],
  minClearancePx: 4
};

test("clearance reports authored moving/protected overlap", () => {
  const report = evaluateKpEquationMotionClearanceFrame({
    frame: frame([
      ink("seven", 18, 0),
      ink("three", 48, 0),
      ink("x", 20, 0),
      ink("equals", 74, 0)
    ]),
    requirements: [requirement]
  });

  assert.equal(report.passed, false);
  assert.deepEqual(
    report.diagnostics.map((diagnostic) => diagnostic.code),
    ["motion.ink-overlap"]
  );
  assert.deepEqual(report.diagnostics[0]?.movingId, "seven");
  assert.deepEqual(report.diagnostics[0]?.protectedId, "x");
});

test("clearance distinguishes near misses from safe authored pairs", () => {
  const near = evaluateKpEquationMotionClearanceFrame({
    frame: frame([
      ink("seven", 7, 0),
      ink("three", 38, 0),
      ink("x", 20, 0),
      ink("equals", 52, 0)
    ]),
    requirements: [requirement]
  });
  assert.equal(near.passed, false);
  assert.equal(near.diagnostics[0]?.code, "motion.ink-clearance");
  assert.equal(near.diagnostics[0]?.measuredPx, 3);

  const safe = evaluateKpEquationMotionClearanceFrame({
    frame: frame([
      ink("seven", 6, -20),
      ink("three", 38, 20),
      ink("x", 20, 0),
      ink("equals", 52, 0)
    ]),
    requirements: [requirement]
  });
  assert.equal(safe.passed, true);
  assert.ok(Math.abs((safe.minimumClearancePx ?? 0) - Math.hypot(4, 10)) < 0.0001);
});

test("invisible moving ink does not create false collision evidence", () => {
  const report = evaluateKpEquationMotionClearanceFrame({
    frame: frame([
      ink("seven", 20, 0, 0),
      ink("three", 52, 0, 0),
      ink("x", 20, 0),
      ink("equals", 52, 0)
    ]),
    requirements: [requirement]
  });
  assert.equal(report.passed, true);
  assert.equal(report.minimumClearancePx, null);
});

function frame(inkSamples: KpEquationMotionClearanceFrame["ink"]): KpEquationMotionClearanceFrame {
  return { progress: 0.5, ink: inkSamples };
}

function ink(id: string, left: number, top: number, opacity = 1) {
  return { id, left, top, width: 10, height: 10, opacity } as const;
}
