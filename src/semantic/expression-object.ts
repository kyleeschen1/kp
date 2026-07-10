import {
  expressionToLatex,
  type MathExpression
} from "../math/expression.ts";

export interface ExpressionObject {
  id: string;
  type: "expression";
  label: string;
  expression: MathExpression;
  variables: readonly string[];
}

interface CreateExpressionObjectInput {
  id: string;
  label: string;
  expression: MathExpression;
  variables?: readonly string[];
}

export function createExpressionObject(
  input: CreateExpressionObjectInput
): ExpressionObject {
  assertNonEmpty(input.id, "Expression id");
  assertNonEmpty(input.label, `Expression ${input.id} label`);

  return {
    id: input.id,
    type: "expression",
    label: input.label,
    expression: input.expression,
    variables: input.variables ?? expressionVariables(input.expression)
  };
}

export function expressionObjectToLatex(object: ExpressionObject): string {
  return expressionToLatex(object.expression);
}

export function expressionVariables(
  expression: MathExpression
): readonly string[] {
  const variables = new Set<string>();

  collectExpressionVariables(expression, variables);

  return [...variables];
}

function collectExpressionVariables(
  expression: MathExpression,
  variables: Set<string>
): void {
  switch (expression.kind) {
    case "constant":
      return;
    case "variable":
      variables.add(expression.name);
      return;
    case "add":
      expression.terms.forEach((term) =>
        collectExpressionVariables(term, variables)
      );
      return;
    case "multiply":
      expression.factors.forEach((factor) =>
        collectExpressionVariables(factor, variables)
      );
      return;
    case "divide":
      collectExpressionVariables(expression.numerator, variables);
      collectExpressionVariables(expression.denominator, variables);
      return;
    case "power":
      collectExpressionVariables(expression.base, variables);
      return;
    case "negate":
    case "sin":
    case "cos":
      collectExpressionVariables(expression.value, variables);
      return;
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
