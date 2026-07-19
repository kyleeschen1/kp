import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canonicalLinearProblem,
  generateLinearProblem,
  verifyLinearSolution,
  verifyLinearStep
} from "../providers/linear-problems/public-api.ts";
import type { LinearEquationDto } from "../protocols/public-api.ts";
import { validateKpLinearEquationTrace } from "../domains/public-api.ts";
import { mapLinearProblemToKpTrace } from "../src/integrations/public-api.ts";

const problem = canonicalLinearProblem();
const subtractRequest = {
  schemaVersion: "linear-problem.verify-step.request.v1" as const,
  problem,
  previous: problem.equation,
  candidate: equation(2, 0, 0, 5)
};
const divideRequest = {
  schemaVersion: "linear-problem.verify-step.request.v1" as const,
  problem,
  previous: subtractRequest.candidate,
  candidate: equation(1, 0, 0, 5, 2)
};
const solutionRequest = {
  schemaVersion: "linear-problem.verify-solution.request.v1" as const,
  problem,
  candidate: problem.solution
};

test("mapper produces the strict canonical exact KP trace with stable semantic IDs", () => {
  const trace = canonicalTrace();
  assert.equal(trace.preservation, "strict");
  assert.equal(trace.solutionVerified, true);
  assert.deepEqual(trace.frames.map((frame) => frame.semanticIds.equation), [
    "equation.initial",
    "equation.after-subtract",
    "equation.solved"
  ]);
  assert.deepEqual(trace.operations.map((operation) => [operation.semanticId, operation.kind]), [
    ["operation.subtract-three", "subtract-both-sides"],
    ["operation.divide-two", "divide-both-sides"]
  ]);
  assert.deepEqual(trace.solution, { numerator: "5", denominator: "2" });
  assert.equal(trace.provenance.providerId, "linear-problems.exact-rational");
  assert.deepEqual(trace.assumptions, [
    "exact-rational-arithmetic",
    "unique-linear-solution",
    "equivalence-preserving-steps"
  ]);
  assert.deepEqual(trace.diagnostics, []);
  assert.deepEqual(validateKpLinearEquationTrace(trace), []);
  assert.equal(Object.isFrozen(trace.frames[0]?.equation.left.coefficient), true);
});

test("mapper handles generated equations without canonical-fixture matching", () => {
  for (let index = 1; index <= 12; index += 1) {
    const generated = generateLinearProblem({
      schemaVersion: "linear-problem.generate.request.v1",
      seed: `generated-${index}`,
      constraints: {
        minimumCoefficient: -12,
        maximumCoefficient: 12,
        allowFractionalSolution: true
      }
    });
    const solution = verifyLinearSolution({
      schemaVersion: "linear-problem.verify-solution.request.v1",
      problem: generated,
      candidate: generated.solution
    });
    const trace = mapLinearProblemToKpTrace({
      generation: { schemaVersion: "linear-problem.generate.response.v1", problem: generated },
      steps: [],
      solutionVerification: {
        request: {
          schemaVersion: "linear-problem.verify-solution.request.v1",
          problem: generated,
          candidate: generated.solution
        },
        response: solution
      },
      initialSemanticIds: initialIds(`generated-${index}`)
    });
    assert.equal(trace.solutionVerified, true, generated.problemId);
    assert.equal(trace.provenance.seed, `generated-${index}`);
  }
});

test("mapper exposes discontinuity, rejection, provenance, and operation loss", () => {
  const unknownOperation = {
    ...verifyLinearStep(subtractRequest),
    operation: "provider-private-operation"
  };
  const trace = mapLinearProblemToKpTrace({
    generation: { schemaVersion: "linear-problem.generate.response.v1", problem },
    steps: [
      {
        request: { ...subtractRequest, previous: equation(9, 9, 0, 1) },
        response: verifyLinearStep(subtractRequest),
        semanticIds: { operation: "operation.bad-previous", equation: "equation.bad-previous" }
      },
      {
        request: subtractRequest,
        response: unknownOperation,
        semanticIds: { operation: "operation.external", equation: "equation.external" }
      },
      {
        request: divideRequest,
        response: { ...verifyLinearStep(divideRequest), valid: false, classification: "arithmetic-failure" },
        semanticIds: { operation: "operation.rejected", equation: "equation.rejected" }
      }
    ],
    solutionVerification: { request: solutionRequest, response: verifyLinearSolution(solutionRequest) },
    initialSemanticIds: initialIds("lossy")
  });
  assert.equal(trace.preservation, "lossy");
  assert.deepEqual(trace.diagnostics.map((item) => item.code), [
    "trace-previous-mismatch",
    "operation-unmapped",
    "provider-step-rejected"
  ]);
  assert.equal(trace.operations[0]?.kind, "external");
});

test("mapper is the sole protocol-to-KP boundary and imports no provider engine", () => {
  const mapper = readFileSync(new URL("../src/integrations/linear-problem-trace-mapper.ts", import.meta.url), "utf8");
  const provider = readFileSync(new URL("../providers/linear-problems/provider.ts", import.meta.url), "utf8");
  assert.equal(mapper.includes("providers/"), false);
  assert.equal(provider.includes("src/"), false);
  assert.match(mapper, /protocols\/public-api\.ts/);
  assert.match(mapper, /domains\/public-api\.ts/);
});

function canonicalTrace() {
  return mapLinearProblemToKpTrace({
    generation: { schemaVersion: "linear-problem.generate.response.v1", problem },
    steps: [
      {
        request: subtractRequest,
        response: verifyLinearStep(subtractRequest),
        semanticIds: { operation: "operation.subtract-three", equation: "equation.after-subtract" }
      },
      {
        request: divideRequest,
        response: verifyLinearStep(divideRequest),
        semanticIds: { operation: "operation.divide-two", equation: "equation.solved" }
      }
    ],
    solutionVerification: { request: solutionRequest, response: verifyLinearSolution(solutionRequest) },
    initialSemanticIds: {
      equation: "equation.initial",
      leftVariable: "term.two-x",
      leftConstant: "term.add-three",
      rightVariable: "term.zero-x",
      rightConstant: "term.eight"
    }
  });
}

function initialIds(suffix: string) {
  return {
    equation: `equation.${suffix}`,
    leftVariable: `term.${suffix}.left-variable`,
    leftConstant: `term.${suffix}.left-constant`,
    rightVariable: `term.${suffix}.right-variable`,
    rightConstant: `term.${suffix}.right-constant`
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
      coefficient: { numerator: String(leftCoefficient), denominator: "1" },
      constant: { numerator: String(leftConstant), denominator: "1" }
    },
    right: {
      variable: "x",
      coefficient: { numerator: String(rightCoefficient), denominator: "1" },
      constant: { numerator: String(rightNumerator), denominator: String(rightDenominator) }
    }
  };
}
