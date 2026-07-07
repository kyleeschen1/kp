import {
  type MathExpression
} from "./expression.ts";
import {
  LatexParseError,
  parseLatexExpression,
  type ParsedLatexExpression
} from "./latex-parser.ts";
import {
  parsedLatexExpressionToMathExpression
} from "./latex-to-expression.ts";
import {
  tokenizeLatex,
  type LatexToken
} from "./latex-tokenizer.ts";

export type ClassifiedLatexEquation =
  | Explicit2DCurveEquation
  | Explicit3DSurfaceEquation;

export interface Explicit2DCurveEquation {
  kind: "explicit-2d-curve";
  dependentVariable: "y";
  independentVariable: "x";
  expression: MathExpression;
}

export interface Explicit3DSurfaceEquation {
  kind: "explicit-3d-surface";
  dependentVariable: "z";
  independentVariables: readonly ["x", "y"];
  expression: MathExpression;
}

export interface ParsedLatexEquation {
  kind: "equation";
  left: ParsedLatexExpression;
  right: ParsedLatexExpression;
}

export function parseLatexEquation(input: string): ParsedLatexEquation {
  const tokens = tokenizeLatex(input);
  const equalsToken = findTopLevelEquals(tokens);

  if (equalsToken === undefined) {
    throw new LatexParseError("Expected equation.", input.length, "=");
  }

  return {
    kind: "equation",
    left: parseLatexExpression(input.slice(0, equalsToken.offset)),
    right: parseLatexExpression(input.slice(equalsToken.offset + 1))
  };
}

export function classifyLatexEquation(input: string): ClassifiedLatexEquation {
  const equation = parseLatexEquation(input);

  if (equation.left.kind !== "identifier") {
    throw unsupportedExplicitEquationError();
  }

  const variables = collectVariableNames(equation.right);
  const expression = parsedLatexExpressionToMathExpression(equation.right);

  if (equation.left.name === "y" && isSubsetOf(variables, ["x"])) {
    return {
      kind: "explicit-2d-curve",
      dependentVariable: "y",
      independentVariable: "x",
      expression
    };
  }

  if (equation.left.name === "z" && isSubsetOf(variables, ["x", "y"])) {
    return {
      kind: "explicit-3d-surface",
      dependentVariable: "z",
      independentVariables: ["x", "y"],
      expression
    };
  }

  throw unsupportedExplicitEquationError();
}

function findTopLevelEquals(
  tokens: readonly LatexToken[]
): LatexToken | undefined {
  let depth = 0;
  let equalsToken: LatexToken | undefined;

  for (const token of tokens) {
    if (token.kind === "leftBrace" || token.kind === "leftParen") {
      depth += 1;
      continue;
    }

    if (token.kind === "rightBrace" || token.kind === "rightParen") {
      depth -= 1;
      continue;
    }

    if (token.kind === "equals" && depth === 0) {
      if (equalsToken !== undefined) {
        throw new LatexParseError(
          "Expected a single top-level equals sign.",
          token.offset,
          "single equals"
        );
      }

      equalsToken = token;
    }
  }

  return equalsToken;
}

function collectVariableNames(
  expression: ParsedLatexExpression,
  variables = new Set<string>()
): ReadonlySet<string> {
  switch (expression.kind) {
    case "identifier":
      variables.add(expression.name);
      return variables;
    case "number":
      return variables;
    case "unary":
      return collectVariableNames(expression.value, variables);
    case "call":
      return collectVariableNames(expression.argument, variables);
    case "binary":
      collectVariableNames(expression.left, variables);
      collectVariableNames(expression.right, variables);
      return variables;
  }
}

function isSubsetOf(
  actual: ReadonlySet<string>,
  expected: readonly string[]
): boolean {
  return [...actual].every((variableName) => expected.includes(variableName));
}

function unsupportedExplicitEquationError(): Error {
  return new Error(
    "Only explicit equations with a single dependent variable on the left are supported."
  );
}
