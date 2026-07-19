import type { LinearExpressionDto } from "../../protocols/public-api.ts";

import {
  addRational,
  multiplyRational,
  rational,
  rationalFromDto,
  rationalToDto,
  subtractRational,
  type ExactRational
} from "./rational.ts";

export interface LinearExpression {
  readonly variable: string;
  readonly coefficient: ExactRational;
  readonly constant: ExactRational;
}

export function linearExpression(
  variable: string,
  coefficient: ExactRational,
  constant: ExactRational = rational(0n)
): LinearExpression {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(variable)) {
    throw new Error(`Invalid linear-expression variable: ${variable}`);
  }
  return { variable, coefficient, constant };
}

export function linearExpressionFromDto(dto: LinearExpressionDto): LinearExpression {
  return linearExpression(
    dto.variable,
    rationalFromDto(dto.coefficient),
    rationalFromDto(dto.constant)
  );
}

export function linearExpressionToDto(value: LinearExpression): LinearExpressionDto {
  return {
    variable: value.variable,
    coefficient: rationalToDto(value.coefficient),
    constant: rationalToDto(value.constant)
  };
}

export function addLinearExpression(
  left: LinearExpression,
  right: LinearExpression
): LinearExpression {
  assertSameVariable(left, right);
  return linearExpression(
    left.variable,
    addRational(left.coefficient, right.coefficient),
    addRational(left.constant, right.constant)
  );
}

export function subtractLinearExpression(
  left: LinearExpression,
  right: LinearExpression
): LinearExpression {
  assertSameVariable(left, right);
  return linearExpression(
    left.variable,
    subtractRational(left.coefficient, right.coefficient),
    subtractRational(left.constant, right.constant)
  );
}

export function scaleLinearExpression(
  value: LinearExpression,
  factor: ExactRational
): LinearExpression {
  return linearExpression(
    value.variable,
    multiplyRational(value.coefficient, factor),
    multiplyRational(value.constant, factor)
  );
}

export function evaluateLinearExpression(
  expression: LinearExpression,
  variableValue: ExactRational
): ExactRational {
  return addRational(
    multiplyRational(expression.coefficient, variableValue),
    expression.constant
  );
}

function assertSameVariable(left: LinearExpression, right: LinearExpression): void {
  if (left.variable !== right.variable) {
    throw new Error(`Cannot combine ${left.variable} and ${right.variable} expressions.`);
  }
}

