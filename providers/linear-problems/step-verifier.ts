import type {
  LinearEquationDto,
  LinearProblemProvenanceDto,
  VerifyLinearStepRequestDto,
  VerifyLinearStepResponseDto
} from "../../protocols/public-api.ts";

import {
  linearExpressionFromDto,
  type LinearExpression
} from "./linear-expression.ts";
import {
  divideRational,
  equalRational,
  isZeroRational,
  rational,
  subtractRational,
  type ExactRational
} from "./rational.ts";

interface ProviderEquation {
  readonly left: LinearExpression;
  readonly right: LinearExpression;
}

interface UniqueEquationSolution {
  readonly kind: "unique";
  readonly value: ExactRational;
}

interface DegenerateEquationSolution {
  readonly kind: "identity" | "contradiction";
}

type EquationSolution = UniqueEquationSolution | DegenerateEquationSolution;

export function verifyLinearStep(
  request: VerifyLinearStepRequestDto
): VerifyLinearStepResponseDto {
  const problem = equationFromDto(request.problem.equation);
  const previous = equationFromDto(request.previous);
  const candidate = equationFromDto(request.candidate);
  const provenance = request.problem.provenance;

  if (!sameVariable(problem, previous) || !sameVariable(previous, candidate)) {
    return result(false, "unsupported-form", "none", ["variable-mismatch"], provenance);
  }

  const problemSolution = solveEquation(problem);
  const previousSolution = solveEquation(previous);
  const candidateSolution = solveEquation(candidate);
  if (problemSolution.kind !== "unique" || previousSolution.kind !== "unique" || candidateSolution.kind !== "unique") {
    return result(false, "unsupported-form", "none", ["degenerate-linear-equation"], provenance);
  }
  if (!equalRational(problemSolution.value, previousSolution.value)) {
    return result(false, "ambiguous", "none", ["previous-not-equivalent-to-problem"], provenance);
  }

  const equivalent = equalRational(previousSolution.value, candidateSolution.value);
  const leftUnchanged = equalExpression(previous.left, candidate.left);
  const rightUnchanged = equalExpression(previous.right, candidate.right);

  if (equivalent && leftUnchanged && rightUnchanged) {
    return result(true, "valid-simplification", "simplify", [], provenance);
  }

  const translation = sharedTranslation(previous, candidate);
  if (equivalent && translation !== undefined) {
    return result(
      true,
      "canonical-operation",
      translation.numerator < 0n ? "subtract-both-sides" : "add-both-sides",
      [],
      provenance
    );
  }

  const scale = sharedScale(previous, candidate);
  if (equivalent && scale !== undefined) {
    return result(
      true,
      "canonical-operation",
      scale.denominator === 1n ? "multiply-both-sides" : "divide-both-sides",
      [],
      provenance
    );
  }

  if (equivalent) {
    return result(true, "compressed-equivalent", "equivalent-rewrite", [], provenance);
  }
  if (leftUnchanged !== rightUnchanged) {
    return result(false, "one-sided-mutation", "none", ["only-one-side-changed"], provenance);
  }
  if (looksLikeFailedSharedOperation(previous, candidate)) {
    return result(false, "arithmetic-failure", "none", ["shared-operation-disagrees"], provenance);
  }
  return result(false, "ambiguous", "none", ["not-equivalent"], provenance);
}

function equationFromDto(dto: LinearEquationDto): ProviderEquation {
  return {
    left: linearExpressionFromDto(dto.left),
    right: linearExpressionFromDto(dto.right)
  };
}

function solveEquation(equation: ProviderEquation): EquationSolution {
  const coefficient = subtractRational(equation.left.coefficient, equation.right.coefficient);
  const constant = subtractRational(equation.right.constant, equation.left.constant);
  if (isZeroRational(coefficient)) {
    return { kind: isZeroRational(constant) ? "identity" : "contradiction" };
  }
  return { kind: "unique", value: divideRational(constant, coefficient) };
}

function sameVariable(left: ProviderEquation, right: ProviderEquation): boolean {
  return left.left.variable === left.right.variable &&
    left.left.variable === right.left.variable &&
    right.left.variable === right.right.variable;
}

function equalExpression(left: LinearExpression, right: LinearExpression): boolean {
  return left.variable === right.variable &&
    equalRational(left.coefficient, right.coefficient) &&
    equalRational(left.constant, right.constant);
}

function sharedTranslation(
  previous: ProviderEquation,
  candidate: ProviderEquation
): ExactRational | undefined {
  if (!equalRational(previous.left.coefficient, candidate.left.coefficient) ||
    !equalRational(previous.right.coefficient, candidate.right.coefficient)) return undefined;
  const leftChange = subtractRational(candidate.left.constant, previous.left.constant);
  const rightChange = subtractRational(candidate.right.constant, previous.right.constant);
  return equalRational(leftChange, rightChange) && !isZeroRational(leftChange)
    ? leftChange
    : undefined;
}

function sharedScale(
  previous: ProviderEquation,
  candidate: ProviderEquation
): ExactRational | undefined {
  const pairs = [
    [previous.left.coefficient, candidate.left.coefficient],
    [previous.left.constant, candidate.left.constant],
    [previous.right.coefficient, candidate.right.coefficient],
    [previous.right.constant, candidate.right.constant]
  ] as const;
  const witness = pairs.find(([before]) => !isZeroRational(before));
  if (witness === undefined) return undefined;
  const factor = divideRational(witness[1], witness[0]);
  if (isZeroRational(factor)) return undefined;
  return pairs.every(([before, after]) =>
    equalRational(divideOrZero(after, before, factor), factor)
  ) ? factor : undefined;
}

function divideOrZero(
  after: ExactRational,
  before: ExactRational,
  expectedFactor: ExactRational
): ExactRational {
  if (isZeroRational(before)) return isZeroRational(after) ? expectedFactor : rational(0n);
  return divideRational(after, before);
}

function looksLikeFailedSharedOperation(
  previous: ProviderEquation,
  candidate: ProviderEquation
): boolean {
  const coefficientsUnchanged =
    equalRational(previous.left.coefficient, candidate.left.coefficient) &&
    equalRational(previous.right.coefficient, candidate.right.coefficient);
  if (coefficientsUnchanged) return true;

  const leftFactor = expressionScale(previous.left, candidate.left);
  const rightFactor = expressionScale(previous.right, candidate.right);
  return leftFactor !== undefined && rightFactor !== undefined &&
    !equalRational(leftFactor, rightFactor);
}

function expressionScale(
  previous: LinearExpression,
  candidate: LinearExpression
): ExactRational | undefined {
  const witness = !isZeroRational(previous.coefficient)
    ? [previous.coefficient, candidate.coefficient] as const
    : !isZeroRational(previous.constant)
      ? [previous.constant, candidate.constant] as const
      : undefined;
  if (witness === undefined) return undefined;
  const factor = divideRational(witness[1], witness[0]);
  const coefficientMatches = isZeroRational(previous.coefficient)
    ? isZeroRational(candidate.coefficient)
    : equalRational(divideRational(candidate.coefficient, previous.coefficient), factor);
  const constantMatches = isZeroRational(previous.constant)
    ? isZeroRational(candidate.constant)
    : equalRational(divideRational(candidate.constant, previous.constant), factor);
  return coefficientMatches && constantMatches ? factor : undefined;
}

function result(
  valid: boolean,
  classification: VerifyLinearStepResponseDto["classification"],
  operation: string,
  diagnostics: readonly string[],
  provenance: LinearProblemProvenanceDto
): VerifyLinearStepResponseDto {
  return {
    schemaVersion: "linear-problem.verify-step.response.v1",
    valid,
    classification,
    operation,
    diagnostics,
    provenance
  };
}

