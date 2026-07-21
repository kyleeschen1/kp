import {
  generateLinearProblemResponseSchema,
  type ExactRationalDto,
  type LinearEquationDto,
  type LinearProblemDto,
  type VerifyLinearSolutionRequestDto,
  type VerifyLinearStepRequestDto
} from "../../protocols/public-api.ts";
import {
  mapLinearProblemToKpTrace,
  type KpLinearTraceSolutionImport,
  type KpLinearTraceStepImport
} from "../integrations/public-api.ts";

export interface KpCanonicalFractionalLinearEquationRequests {
  readonly generation: ReturnType<typeof generateLinearProblemResponseSchema.parse>;
  readonly subtract: VerifyLinearStepRequestDto;
  readonly multiply: VerifyLinearStepRequestDto;
  readonly solution: VerifyLinearSolutionRequestDto;
}

export function canonicalFractionalLinearEquationRequests(
  generationInput: unknown
): KpCanonicalFractionalLinearEquationRequests {
  const generation = generateLinearProblemResponseSchema.parse(generationInput);
  requireCanonicalProblem(generation.problem);
  const afterSubtract = equation(rational(1, 2), rational(0), rational(0), rational(4));
  const solved = equation(rational(1), rational(0), rational(0), rational(8));
  return deepFreeze({
    generation,
    subtract: {
      schemaVersion: "linear-problem.verify-step.request.v1",
      problem: generation.problem,
      previous: generation.problem.equation,
      candidate: afterSubtract
    },
    multiply: {
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

export function mapCanonicalFractionalLinearEquationTrace(input: {
  readonly requests: KpCanonicalFractionalLinearEquationRequests;
  readonly subtractResponse: unknown;
  readonly multiplyResponse: unknown;
  readonly solutionResponse: unknown;
}) {
  const steps: readonly KpLinearTraceStepImport[] = [
    {
      request: input.requests.subtract,
      response: input.subtractResponse,
      semanticIds: {
        operation: "operation.fractional.subtract-three",
        equation: "equation.fractional.after-subtract"
      }
    },
    {
      request: input.requests.multiply,
      response: input.multiplyResponse,
      semanticIds: {
        operation: "operation.fractional.multiply-two",
        equation: "equation.fractional.solved"
      }
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
      equation: "equation.fractional.initial",
      leftVariable: "term.fractional.x",
      leftConstant: "term.fractional.add-three",
      rightVariable: "term.fractional.zero-x",
      rightConstant: "term.fractional.seven"
    }
  });
}

function requireCanonicalProblem(problem: LinearProblemDto): void {
  const equationValue = problem.equation;
  const exact = sameRational(equationValue.left.coefficient, rational(1, 2)) &&
    sameRational(equationValue.left.constant, rational(3)) &&
    sameRational(equationValue.right.coefficient, rational(0)) &&
    sameRational(equationValue.right.constant, rational(7)) &&
    sameRational(problem.solution, rational(8));
  if (!exact) {
    throw new Error("Canonical provider input no longer describes x/2 + 3 = 7.");
  }
}

function equation(
  leftCoefficient: ExactRationalDto,
  leftConstant: ExactRationalDto,
  rightCoefficient: ExactRationalDto,
  rightConstant: ExactRationalDto
): LinearEquationDto {
  return {
    left: { variable: "x", coefficient: leftCoefficient, constant: leftConstant },
    right: { variable: "x", coefficient: rightCoefficient, constant: rightConstant }
  };
}

function rational(numerator: number, denominator = 1): ExactRationalDto {
  return { numerator: String(numerator), denominator: String(denominator) };
}

function sameRational(left: ExactRationalDto, right: ExactRationalDto): boolean {
  return left.numerator === right.numerator && left.denominator === right.denominator;
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
