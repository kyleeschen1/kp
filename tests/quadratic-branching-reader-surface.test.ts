import assert from "node:assert/strict";
import test from "node:test";

import {
  kpQuadraticReaderCheckpoints,
  parseKpQuadraticReaderMethod,
  projectKpQuadraticReaderSurface
} from "../src/reader/app/quadratic-branching-surface.ts";

test("quadratic reader projects both methods from one normalized progress value", () => {
  const square = projectKpQuadraticReaderSurface({
    progress: 0.43,
    methodId: "method.quadratic.completing-square"
  });
  const formula = projectKpQuadraticReaderSurface({
    progress: 0.43,
    methodId: "method.quadratic.formula"
  });
  assert.equal(square.progress, formula.progress);
  assert.equal(square.phase, "method");
  assert.match(square.equationState.id, /completing-square/);
  assert.match(formula.equationState.id, /formula/);
  assert.equal(square.solutionSetNative, false);
});

test("quadratic reader exposes exact branch and reunion boundaries", () => {
  const branch = projectKpQuadraticReaderSurface({
    progress: 0.68,
    methodId: parseKpQuadraticReaderMethod("formula")
  });
  const reunion = projectKpQuadraticReaderSurface({
    progress: 0.88,
    methodId: parseKpQuadraticReaderMethod(null)
  });
  assert.equal(branch.phase, "branch");
  assert.equal(branch.checkpointId, "branches");
  assert.equal(branch.solutionSetNative, false);
  assert.equal(reunion.phase, "reunion");
  assert.equal(reunion.checkpointId, "solution-set");
  assert.equal(reunion.solutionSetNative, true);
  assert.deepEqual(
    kpQuadraticReaderCheckpoints.map(({ progressPermille }) => progressPermille),
    [0, 320, 680, 880, 1_000]
  );
});

test("quadratic reader rejects out-of-range progress", () => {
  assert.throws(() => projectKpQuadraticReaderSurface({
    progress: 1.01,
    methodId: "method.quadratic.completing-square"
  }), /normalized/);
});
