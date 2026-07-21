import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalFractionalLinearProblem,
  canonicalLinearProblem,
  generateLinearProblem,
  rationalFromDto
} from "../providers/linear-problems/public-api.ts";
import {
  generateLinearProblemResponseSchema
} from "../protocols/public-api.ts";

const fractionalRequest = {
  schemaVersion: "linear-problem.generate.request.v1",
  seed: "fixture-seed-17",
  constraints: {
    minimumCoefficient: -9,
    maximumCoefficient: 9,
    allowFractionalSolution: true
  }
} as const;

test("canonical fixture is exactly 2x + 3 = 8 with solution 5/2", () => {
  const problem = canonicalLinearProblem();
  assert.deepEqual(problem.equation, {
    left: {
      variable: "x",
      coefficient: { numerator: "2", denominator: "1" },
      constant: { numerator: "3", denominator: "1" }
    },
    right: {
      variable: "x",
      coefficient: { numerator: "0", denominator: "1" },
      constant: { numerator: "8", denominator: "1" }
    }
  });
  assert.deepEqual(problem.solution, { numerator: "5", denominator: "2" });
  assert.equal(problem.provenance.seed, "canonical-2x-plus-3");
});

test("fractional exemplar fixture is exactly x/2 + 3 = 7 with solution 8", () => {
  const problem = canonicalFractionalLinearProblem();
  assert.deepEqual(problem.equation, {
    left: {
      variable: "x",
      coefficient: { numerator: "1", denominator: "2" },
      constant: { numerator: "3", denominator: "1" }
    },
    right: {
      variable: "x",
      coefficient: { numerator: "0", denominator: "1" },
      constant: { numerator: "7", denominator: "1" }
    }
  });
  assert.deepEqual(problem.solution, { numerator: "8", denominator: "1" });
  assert.equal(problem.provenance.seed, "canonical-x-over-2-plus-3");
});

test("seeded generation is stable, bounded, solvable, and schema-valid", () => {
  const first = generateLinearProblem(fractionalRequest);
  const second = generateLinearProblem(fractionalRequest);
  assert.deepEqual(first, second);
  assert.equal(generateLinearProblemResponseSchema.safeParse({
    schemaVersion: "linear-problem.generate.response.v1",
    problem: first
  }).success, true);

  const coefficient = Number(first.equation.left.coefficient.numerator);
  const constant = Number(first.equation.left.constant.numerator);
  const right = Number(first.equation.right.constant.numerator);
  assert.notEqual(coefficient, 0);
  for (const value of [coefficient, constant, right]) assert.ok(value >= -9 && value <= 9);

  const solution = rationalFromDto(first.solution);
  assert.equal(
    solution.numerator * BigInt(coefficient) + BigInt(constant) * solution.denominator,
    BigInt(right) * solution.denominator
  );
});

test("integer-only generation produces exact integer solutions for many seeds", () => {
  for (let index = 0; index < 80; index += 1) {
    const problem = generateLinearProblem({
      ...fractionalRequest,
      seed: `integer-${index}`,
      constraints: { ...fractionalRequest.constraints, allowFractionalSolution: false }
    });
    assert.equal(problem.solution.denominator, "1");
  }
});

test("generation rejects impossible or inverted bounds", () => {
  assert.throws(() => generateLinearProblem({
    ...fractionalRequest,
    constraints: { ...fractionalRequest.constraints, minimumCoefficient: 0, maximumCoefficient: 0 }
  }), /nonzero/);
  assert.throws(() => generateLinearProblem({
    ...fractionalRequest,
    constraints: { ...fractionalRequest.constraints, minimumCoefficient: 2, maximumCoefficient: -2 }
  }), /must not exceed/);
});
