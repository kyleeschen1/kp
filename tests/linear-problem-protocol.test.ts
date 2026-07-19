import assert from "node:assert/strict";
import test from "node:test";

import {
  exactRationalSchema,
  generateLinearProblemRequestSchema,
  linearProblemErrorSchema,
  verifyLinearStepResponseSchema
} from "../protocols/public-api.ts";

test("linear-problem schemas accept canonical wire DTOs", () => {
  assert.deepEqual(exactRationalSchema.parse({ numerator: "-5", denominator: "2" }), {
    numerator: "-5",
    denominator: "2"
  });
  assert.equal(generateLinearProblemRequestSchema.safeParse({
    schemaVersion: "linear-problem.generate.request.v1",
    seed: "canonical-2x-plus-3",
    constraints: {
      minimumCoefficient: -10,
      maximumCoefficient: 10,
      allowFractionalSolution: true
    }
  }).success, true);
  assert.equal(verifyLinearStepResponseSchema.safeParse({
    schemaVersion: "linear-problem.verify-step.response.v1",
    valid: true,
    classification: "canonical-operation",
    operation: "subtract-both-sides",
    diagnostics: [],
    provenance: {
      providerId: "linear-problems.exact-rational",
      providerVersion: "1.0.0",
      protocolVersion: "linear-problem.v1",
      seed: "canonical-2x-plus-3"
    }
  }).success, true);
});

test("linear-problem schemas reject noncanonical and untrusted payloads", () => {
  const cases: readonly unknown[] = [
    { numerator: "2", denominator: "4" },
    { numerator: "1", denominator: "0" },
    { numerator: 1, denominator: "2" },
    { numerator: "1", denominator: "2", renderedLatex: "\\frac12" }
  ];
  for (const input of cases) assert.equal(exactRationalSchema.safeParse(input).success, false);

  assert.equal(linearProblemErrorSchema.safeParse({
    schemaVersion: "linear-problem.error.v1",
    code: "arbitrary-code",
    message: "bad",
    path: [],
    retryable: false
  }).success, false);
});

