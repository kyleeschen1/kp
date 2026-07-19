import {
  canonicalLinearProblem,
  verifyLinearSolution,
  verifyLinearStep
} from "../../providers/linear-problems/public-api.ts";
import type { LinearEquationDto } from "../../protocols/public-api.ts";
import { mapLinearProblemToKpTrace } from "../../src/integrations/public-api.ts";

export function createCanonicalConceptRoomTrace() {
  const problem = canonicalLinearProblem();
  const afterSubtract = equation(2, 0, 0, 5);
  const solved = equation(1, 0, 0, 5, 2);
  const subtractRequest = {
    schemaVersion: "linear-problem.verify-step.request.v1" as const,
    problem,
    previous: problem.equation,
    candidate: afterSubtract
  };
  const divideRequest = {
    schemaVersion: "linear-problem.verify-step.request.v1" as const,
    problem,
    previous: afterSubtract,
    candidate: solved
  };
  const solutionRequest = {
    schemaVersion: "linear-problem.verify-solution.request.v1" as const,
    problem,
    candidate: problem.solution
  };
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
