import {
  add,
  constant,
  cos,
  divide,
  multiply,
  negate,
  power,
  sin,
  variable,
  type MathExpression
} from "./expression.ts";
import {
  LatexParseError,
  parseLatexExpression,
  type ParsedLatexExpression
} from "./latex-parser.ts";

export function parseLatexMathExpression(input: string): MathExpression {
  return parsedLatexExpressionToMathExpression(parseLatexExpression(input));
}

export function parsedLatexExpressionToMathExpression(
  expression: ParsedLatexExpression
): MathExpression {
  switch (expression.kind) {
    case "number":
      return constant(expression.value);
    case "identifier":
      return variable(expression.name);
    case "unary":
      return negate(parsedLatexExpressionToMathExpression(expression.value));
    case "call":
      return lowerCallExpression(expression.name, expression.argument);
    case "binary":
      return lowerBinaryExpression(expression);
  }
}

function lowerCallExpression(
  name: "cos" | "ln" | "sin" | "sqrt",
  argument: ParsedLatexExpression
): MathExpression {
  const loweredArgument = parsedLatexExpressionToMathExpression(argument);

  switch (name) {
    case "cos":
      return cos(loweredArgument);
    case "sin":
      return sin(loweredArgument);
    case "ln":
      // Syntax normalization supports logs before numeric graph evaluation does.
      throw new LatexParseError(
        "Natural logarithms are not executable math expressions yet.",
        0,
        "executable function"
      );
    case "sqrt":
      return power(loweredArgument, 0.5);
  }
}

function lowerBinaryExpression(
  expression: Extract<ParsedLatexExpression, { kind: "binary" }>
): MathExpression {
  const left = parsedLatexExpressionToMathExpression(expression.left);
  const right = parsedLatexExpressionToMathExpression(expression.right);

  switch (expression.operator) {
    case "+":
      return add(left, right);
    case "-":
      return add(left, negate(right));
    case "*":
      return multiply(left, right);
    case "/":
      return divide(left, right);
    case "^":
      return power(left, numericExponent(expression.right));
  }
}

function numericExponent(expression: ParsedLatexExpression): number {
  if (expression.kind !== "number") {
    throw new LatexParseError(
      "Expected numeric exponent.",
      0,
      "numeric exponent"
    );
  }

  return expression.value;
}
