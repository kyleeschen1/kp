import {
  generateLinearProblemResponseSchema,
  type GenerateLinearProblemRequestDto,
  type LinearProblemDto,
  type VerifyLinearSolutionRequestDto,
  type VerifyLinearStepRequestDto
} from "../../protocols/public-api.ts";
import {
  mapLinearProblemToKpTrace,
  type KpLinearTraceSolutionImport,
  type KpLinearTraceStepImport
} from "../integrations/public-api.ts";

export interface KpCanonicalLinearEquationRequests {
  readonly generation: ReturnType<typeof generateLinearProblemResponseSchema.parse>;
  readonly subtract: VerifyLinearStepRequestDto;
  readonly divide: VerifyLinearStepRequestDto;
  readonly solution: VerifyLinearSolutionRequestDto;
}

export function canonicalLinearEquationGenerationRequest(): GenerateLinearProblemRequestDto {
  return Object.freeze({
    schemaVersion: "linear-problem.generate.request.v1",
    // This seed is a provider-versioned content input whose published result is exactly 2x + 3 = 8.
    seed: "canonical-room-9868",
    constraints: {
      minimumCoefficient: -9,
      maximumCoefficient: 9,
      allowFractionalSolution: true
    }
  });
}

export function canonicalLinearEquationRequests(
  generationInput: unknown
): KpCanonicalLinearEquationRequests {
  const generation = generateLinearProblemResponseSchema.parse(generationInput);
  requireCanonicalProblem(generation.problem);
  const afterSubtract = equation(2, 0, 0, 5);
  const solved = equation(1, 0, 0, 5, 2);
  return deepFreeze({
    generation,
    subtract: {
      schemaVersion: "linear-problem.verify-step.request.v1",
      problem: generation.problem,
      previous: generation.problem.equation,
      candidate: afterSubtract
    },
    divide: {
      schemaVersion: "linear-problem.verify-step.request.v1",
      problem: generation.problem,
      previous: afterSubtract,
      candidate: solved
    },
    solution: {
      schemaVersion: "linear-problem.verify-solution.request.v1",
      problem: generation.problem,
      candidate: generation.problem.solution
    }
  });
}

export function mapCanonicalLinearEquationTrace(input: {
  readonly requests: KpCanonicalLinearEquationRequests;
  readonly subtractResponse: unknown;
  readonly divideResponse: unknown;
  readonly solutionResponse: unknown;
}) {
  const steps: readonly KpLinearTraceStepImport[] = [
    {
      request: input.requests.subtract,
      response: input.subtractResponse,
      semanticIds: { operation: "operation.subtract-three", equation: "equation.after-subtract" }
    },
    {
      request: input.requests.divide,
      response: input.divideResponse,
      semanticIds: { operation: "operation.divide-two", equation: "equation.solved" }
    }
  ];
  const solutionVerification: KpLinearTraceSolutionImport = {
    request: input.requests.solution,
    response: input.solutionResponse
  };
  return mapLinearProblemToKpTrace({
    generation: input.requests.generation,
    steps,
    solutionVerification,
    initialSemanticIds: {
      equation: "equation.initial",
      leftVariable: "term.two-x",
      leftConstant: "term.add-three",
      rightVariable: "term.zero-x",
      rightConstant: "term.eight"
    }
  });
}

function requireCanonicalProblem(problem: LinearProblemDto): void {
  const equationValue = problem.equation;
  const exact = equationValue.left.coefficient.numerator === "2" &&
    equationValue.left.coefficient.denominator === "1" &&
    equationValue.left.constant.numerator === "3" &&
    equationValue.left.constant.denominator === "1" &&
    equationValue.right.coefficient.numerator === "0" &&
    equationValue.right.coefficient.denominator === "1" &&
    equationValue.right.constant.numerator === "8" &&
    equationValue.right.constant.denominator === "1" &&
    problem.solution.numerator === "5" && problem.solution.denominator === "2";
  if (!exact) throw new Error("Canonical provider input no longer generates 2x + 3 = 8.");
}

function equation(
  leftCoefficient: number,
  leftConstant: number,
  rightCoefficient: number,
  rightNumerator: number,
  rightDenominator = 1
) {
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

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
