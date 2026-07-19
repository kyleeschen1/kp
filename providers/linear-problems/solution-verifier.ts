import type {
  VerifyLinearSolutionRequestDto,
  VerifyLinearSolutionResponseDto
} from "../../protocols/public-api.ts";

import {
  evaluateLinearExpression,
  linearExpressionFromDto
} from "./linear-expression.ts";
import {
  equalRational,
  rationalFromDto,
  rationalToDto
} from "./rational.ts";

export function verifyLinearSolution(
  request: VerifyLinearSolutionRequestDto
): VerifyLinearSolutionResponseDto {
  const candidate = rationalFromDto(request.candidate);
  const left = evaluateLinearExpression(
    linearExpressionFromDto(request.problem.equation.left),
    candidate
  );
  const right = evaluateLinearExpression(
    linearExpressionFromDto(request.problem.equation.right),
    candidate
  );
  return {
    schemaVersion: "linear-problem.verify-solution.response.v1",
    valid: equalRational(left, right),
    substitutedLeft: rationalToDto(left),
    substitutedRight: rationalToDto(right),
    provenance: request.problem.provenance
  };
}

