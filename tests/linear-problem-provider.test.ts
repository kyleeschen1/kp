import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalLinearProblem,
  createExactRationalLinearProblemProvider,
  verifyLinearSolution
} from "../providers/linear-problems/public-api.ts";
import {
  checkLinearProblemProviderConformance,
  linearProblemErrorSchema,
  linearProblemProviderDescriptorSchema,
  verifyLinearSolutionResponseSchema
} from "../protocols/public-api.ts";

test("solution verification substitutes exact fractional candidates", () => {
  const problem = canonicalLinearProblem();
  const correct = verifyLinearSolution({
    schemaVersion: "linear-problem.verify-solution.request.v1",
    problem,
    candidate: { numerator: "5", denominator: "2" }
  });
  assert.equal(correct.valid, true);
  assert.deepEqual(correct.substitutedLeft, { numerator: "8", denominator: "1" });
  assert.deepEqual(correct.substitutedRight, { numerator: "8", denominator: "1" });

  const incorrect = verifyLinearSolution({
    schemaVersion: "linear-problem.verify-solution.request.v1",
    problem,
    candidate: { numerator: "2", denominator: "5" }
  });
  assert.equal(incorrect.valid, false);
  assert.equal(verifyLinearSolutionResponseSchema.safeParse(incorrect).success, true);
});

test("provider facade is immutable, described, validated, and conformant", () => {
  const provider = createExactRationalLinearProblemProvider();
  assert.equal(Object.isFrozen(provider), true);
  assert.equal(linearProblemProviderDescriptorSchema.safeParse(provider.descriptor).success, true);
  assert.deepEqual(checkLinearProblemProviderConformance(provider), {
    passed: true,
    diagnostics: []
  });
  assert.equal(linearProblemErrorSchema.safeParse(provider.generate({})).success, true);
});

