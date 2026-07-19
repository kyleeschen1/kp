import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalLinearProblem,
  generateLinearProblem,
  verifyLinearStep
} from "../providers/linear-problems/public-api.ts";
import type { LinearEquationDto } from "../protocols/public-api.ts";

const problem = canonicalLinearProblem();
const original = problem.equation;
const twoXEqualsFive = equation(2, 0, 0, 5);
const xEqualsFiveHalves = equation(1, 0, 0, 5, 2);

test("step verifier classifies the canonical linear-equation path", () => {
  assert.deepEqual(classify(original, twoXEqualsFive), {
    valid: true,
    classification: "canonical-operation",
    operation: "subtract-both-sides"
  });
  assert.deepEqual(classify(twoXEqualsFive, xEqualsFiveHalves), {
    valid: true,
    classification: "canonical-operation",
    operation: "divide-both-sides"
  });
  assert.deepEqual(classify(original, xEqualsFiveHalves), {
    valid: true,
    classification: "compressed-equivalent",
    operation: "equivalent-rewrite"
  });
  assert.deepEqual(classify(original, original), {
    valid: true,
    classification: "valid-simplification",
    operation: "simplify"
  });
});

test("step verifier rejects named adversarial invalid classes", () => {
  assert.equal(classify(original, equation(2, 0, 0, 8)).classification, "one-sided-mutation");
  assert.equal(classify(original, equation(2, 0, 0, 6)).classification, "arithmetic-failure");
  assert.equal(
    classify(original, {
      ...original,
      left: { ...original.left, variable: "y" },
      right: { ...original.right, variable: "y" }
    }).classification,
    "unsupported-form"
  );
  assert.equal(classify(original, equation(3, 1, 0, 9)).classification, "ambiguous");
});

test("canonical transformations preserve exact solutions across generated problems", () => {
  for (let index = 0; index < 60; index += 1) {
    const generated = generateLinearProblem({
      schemaVersion: "linear-problem.generate.request.v1",
      seed: `step-property-${index}`,
      constraints: {
        minimumCoefficient: -12,
        maximumCoefficient: 12,
        allowFractionalSolution: true
      }
    });
    const shifted = {
      left: { ...generated.equation.left, constant: rationalDto(0) },
      right: {
        ...generated.equation.right,
        constant: rationalDto(
          Number(generated.equation.right.constant.numerator) -
          Number(generated.equation.left.constant.numerator)
        )
      }
    };
    const response = verifyLinearStep({
      schemaVersion: "linear-problem.verify-step.request.v1",
      problem: generated,
      previous: generated.equation,
      candidate: shifted
    });
    assert.equal(response.valid, true, generated.problemId);
    assert.ok(
      response.classification === "canonical-operation" ||
      response.classification === "valid-simplification",
      generated.problemId
    );
  }
});

function classify(previous: LinearEquationDto, candidate: LinearEquationDto) {
  const response = verifyLinearStep({
    schemaVersion: "linear-problem.verify-step.request.v1",
    problem,
    previous,
    candidate
  });
  return {
    valid: response.valid,
    classification: response.classification,
    operation: response.operation
  };
}

function equation(
  leftCoefficient: number,
  leftConstant: number,
  rightCoefficient: number,
  rightNumerator: number,
  rightDenominator = 1
): LinearEquationDto {
  return {
    left: {
      variable: "x",
      coefficient: rationalDto(leftCoefficient),
      constant: rationalDto(leftConstant)
    },
    right: {
      variable: "x",
      coefficient: rationalDto(rightCoefficient),
      constant: { numerator: String(rightNumerator), denominator: String(rightDenominator) }
    }
  };
}

function rationalDto(value: number) {
  return { numerator: String(value), denominator: "1" } as const;
}
