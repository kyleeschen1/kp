import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalFractionalLinearProblem,
  verifyLinearSolution,
  verifyLinearStep
} from "../providers/linear-problems/public-api.ts";
import {
  canonicalFractionalLinearEquationRequests,
  mapCanonicalFractionalLinearEquationTrace
} from "../src/app-adapters/fractional-linear-equation-canonical-provider.ts";

test("fractional exemplar accepts the exact subtract and multiply path", () => {
  const problem = canonicalFractionalLinearProblem();
  const requests = canonicalFractionalLinearEquationRequests({
    schemaVersion: "linear-problem.generate.response.v1",
    problem
  });
  const subtractResponse = verifyLinearStep(requests.subtract);
  const multiplyResponse = verifyLinearStep(requests.multiply);
  assert.deepEqual(
    [subtractResponse, multiplyResponse].map(({ valid, classification, operation }) => ({
      valid,
      classification,
      operation
    })),
    [
      { valid: true, classification: "canonical-operation", operation: "subtract-both-sides" },
      { valid: true, classification: "canonical-operation", operation: "multiply-both-sides" }
    ]
  );

  const trace = mapCanonicalFractionalLinearEquationTrace({
    requests,
    subtractResponse,
    multiplyResponse,
    solutionResponse: verifyLinearSolution(requests.solution)
  });
  assert.equal(trace.preservation, "strict");
  assert.equal(trace.solutionVerified, true);
  assert.deepEqual(trace.frames.map((frame) => frame.semanticIds.equation), [
    "equation.fractional.initial",
    "equation.fractional.after-subtract",
    "equation.fractional.solved"
  ]);
  assert.deepEqual(trace.operations.map((operation) => operation.kind), [
    "subtract-both-sides",
    "multiply-both-sides"
  ]);
});

test("fractional exemplar rejects provider drift before animation compilation", () => {
  const problem = canonicalFractionalLinearProblem();
  assert.throws(() => canonicalFractionalLinearEquationRequests({
    schemaVersion: "linear-problem.generate.response.v1",
    problem: {
      ...problem,
      equation: {
        ...problem.equation,
        left: {
          ...problem.equation.left,
          coefficient: { numerator: "1", denominator: "3" }
        }
      }
    }
  }), /x\/2 \+ 3 = 7/);
});
