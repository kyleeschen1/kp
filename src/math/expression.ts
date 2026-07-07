export type MathExpression =
  | AddExpression
  | ConstantExpression
  | CosExpression
  | DivideExpression
  | MultiplyExpression
  | NegateExpression
  | PowerExpression
  | SinExpression
  | VariableExpression;

export type NumericScope = Readonly<Record<string, number>>;
export type CompiledExpression = (scope: NumericScope) => number;

interface ConstantExpression {
  kind: "constant";
  value: number;
}

interface VariableExpression {
  kind: "variable";
  name: string;
}

interface AddExpression {
  kind: "add";
  terms: readonly MathExpression[];
}

interface MultiplyExpression {
  kind: "multiply";
  factors: readonly MathExpression[];
}

interface DivideExpression {
  kind: "divide";
  numerator: MathExpression;
  denominator: MathExpression;
}

interface PowerExpression {
  kind: "power";
  base: MathExpression;
  exponent: number;
}

interface NegateExpression {
  kind: "negate";
  value: MathExpression;
}

interface SinExpression {
  kind: "sin";
  value: MathExpression;
}

interface CosExpression {
  kind: "cos";
  value: MathExpression;
}

export function constant(value: number): MathExpression {
  return { kind: "constant", value };
}

export function variable(name: string): MathExpression {
  return { kind: "variable", name };
}

export function add(...terms: readonly MathExpression[]): MathExpression {
  const flattenedTerms = terms.flatMap((term) =>
    term.kind === "add" ? term.terms : [term]
  );
  const numericSum = flattenedTerms
    .filter((term): term is ConstantExpression => term.kind === "constant")
    .reduce((sum, term) => sum + term.value, 0);
  const nonConstantTerms = flattenedTerms.filter(
    (term) => term.kind !== "constant"
  );
  const simplifiedTerms =
    numericSum === 0
      ? nonConstantTerms
      : [...nonConstantTerms, constant(numericSum)];

  if (simplifiedTerms.length === 0) {
    return constant(0);
  }

  if (simplifiedTerms.length === 1) {
    return simplifiedTerms[0] ?? constant(0);
  }

  return { kind: "add", terms: simplifiedTerms };
}

export function multiply(
  ...factors: readonly MathExpression[]
): MathExpression {
  const flattenedFactors = factors.flatMap((factor) =>
    factor.kind === "multiply" ? factor.factors : [factor]
  );

  if (
    flattenedFactors.some(
      (factor) => factor.kind === "constant" && factor.value === 0
    )
  ) {
    return constant(0);
  }

  const numericProduct = flattenedFactors
    .filter((factor): factor is ConstantExpression => factor.kind === "constant")
    .reduce((product, factor) => product * factor.value, 1);
  const nonConstantFactors = flattenedFactors.filter(
    (factor) => factor.kind !== "constant"
  );
  const simplifiedFactors =
    numericProduct === 1
      ? nonConstantFactors
      : [constant(numericProduct), ...nonConstantFactors];

  if (simplifiedFactors.length === 0) {
    return constant(1);
  }

  if (simplifiedFactors.length === 1) {
    return simplifiedFactors[0] ?? constant(1);
  }

  return { kind: "multiply", factors: simplifiedFactors };
}

export function divide(
  numerator: MathExpression,
  denominator: MathExpression
): MathExpression {
  if (isConstant(numerator, 0)) {
    return constant(0);
  }

  if (isConstant(denominator, 1)) {
    return numerator;
  }

  return { kind: "divide", numerator, denominator };
}

export function power(base: MathExpression, exponent: number): MathExpression {
  if (exponent === 0) {
    return constant(1);
  }

  if (exponent === 1) {
    return base;
  }

  if (base.kind === "constant") {
    return constant(base.value ** exponent);
  }

  return { kind: "power", base, exponent };
}

export function negate(value: MathExpression): MathExpression {
  if (value.kind === "constant") {
    return constant(-value.value);
  }

  if (value.kind === "negate") {
    return value.value;
  }

  return { kind: "negate", value };
}

export function sin(value: MathExpression): MathExpression {
  return { kind: "sin", value };
}

export function cos(value: MathExpression): MathExpression {
  return { kind: "cos", value };
}

export function differentiate(
  expression: MathExpression,
  variableName: string
): MathExpression {
  switch (expression.kind) {
    case "constant":
      return constant(0);
    case "variable":
      return constant(expression.name === variableName ? 1 : 0);
    case "add":
      return add(
        ...expression.terms.map((term) => differentiate(term, variableName))
      );
    case "multiply":
      return add(
        ...expression.factors.map((factor, factorIndex) =>
          multiply(
            ...expression.factors.map((innerFactor, innerIndex) =>
              innerIndex === factorIndex
                ? differentiate(factor, variableName)
                : innerFactor
            )
          )
        )
      );
    case "divide": {
      const numeratorDerivative = differentiate(
        expression.numerator,
        variableName
      );
      const denominatorDerivative = differentiate(
        expression.denominator,
        variableName
      );

      return divide(
        add(
          multiply(numeratorDerivative, expression.denominator),
          negate(multiply(expression.numerator, denominatorDerivative))
        ),
        power(expression.denominator, 2)
      );
    }
    case "power":
      return multiply(
        constant(expression.exponent),
        power(expression.base, expression.exponent - 1),
        differentiate(expression.base, variableName)
      );
    case "negate":
      return negate(differentiate(expression.value, variableName));
    case "sin":
      return multiply(
        cos(expression.value),
        differentiate(expression.value, variableName)
      );
    case "cos":
      return negate(
        multiply(sin(expression.value), differentiate(expression.value, variableName))
      );
  }
}

export function compileExpression(
  expression: MathExpression
): CompiledExpression {
  switch (expression.kind) {
    case "constant":
      return () => expression.value;
    case "variable":
      return (scope) => {
        const value = scope[expression.name];

        if (value === undefined) {
          throw new Error(`Missing numeric scope value for ${expression.name}.`);
        }

        return value;
      };
    case "add": {
      const terms = expression.terms.map(compileExpression);

      return (scope) => terms.reduce((sum, term) => sum + term(scope), 0);
    }
    case "multiply": {
      const factors = expression.factors.map(compileExpression);

      return (scope) =>
        factors.reduce((product, factor) => product * factor(scope), 1);
    }
    case "divide": {
      const numerator = compileExpression(expression.numerator);
      const denominator = compileExpression(expression.denominator);

      return (scope) => numerator(scope) / denominator(scope);
    }
    case "power": {
      const base = compileExpression(expression.base);

      return (scope) => base(scope) ** expression.exponent;
    }
    case "negate": {
      const value = compileExpression(expression.value);

      return (scope) => -value(scope);
    }
    case "sin": {
      const value = compileExpression(expression.value);

      return (scope) => Math.sin(value(scope));
    }
    case "cos": {
      const value = compileExpression(expression.value);

      return (scope) => Math.cos(value(scope));
    }
  }
}

export function compileGradient(
  expression: MathExpression,
  variableNames: readonly string[]
): readonly CompiledExpression[] {
  return variableNames.map((variableName) =>
    compileExpression(differentiate(expression, variableName))
  );
}

export function expressionToLatex(expression: MathExpression): string {
  return expressionToLatexWithPrecedence(expression, 0);
}

function expressionToLatexWithPrecedence(
  expression: MathExpression,
  parentPrecedence: number
): string {
  const precedence = expressionPrecedence(expression);
  const rendered = renderExpressionBody(expression, precedence);

  return precedence < parentPrecedence ? `\\left(${rendered}\\right)` : rendered;
}

function renderExpressionBody(
  expression: MathExpression,
  precedence: number
): string {
  switch (expression.kind) {
    case "constant":
      return formatNumber(expression.value);
    case "variable":
      return expression.name;
    case "add":
      return renderAddExpression(expression);
    case "multiply":
      return expression.factors
        .map((factor) => expressionToLatexWithPrecedence(factor, precedence))
        .join(" ");
    case "divide":
      return `\\frac{${expressionToLatex(expression.numerator)}}{${expressionToLatex(expression.denominator)}}`;
    case "power":
      return `${expressionToLatexWithPrecedence(expression.base, precedence)}^{${formatNumber(expression.exponent)}}`;
    case "negate":
      return `-${expressionToLatexWithPrecedence(expression.value, precedence)}`;
    case "sin":
      return `\\sin\\left(${expressionToLatex(expression.value)}\\right)`;
    case "cos":
      return `\\cos\\left(${expressionToLatex(expression.value)}\\right)`;
  }
}

function renderAddExpression(expression: AddExpression): string {
  return expression.terms
    .map((term, index) => {
      if (term.kind === "negate") {
        return `${index === 0 ? "-" : " - "}${expressionToLatexWithPrecedence(term.value, 1)}`;
      }

      if (term.kind === "constant" && term.value < 0) {
        return `${index === 0 ? "-" : " - "}${formatNumber(Math.abs(term.value))}`;
      }

      return `${index === 0 ? "" : " + "}${expressionToLatexWithPrecedence(term, 1)}`;
    })
    .join("");
}

function expressionPrecedence(expression: MathExpression): number {
  switch (expression.kind) {
    case "add":
      return 1;
    case "negate":
      return 2;
    case "multiply":
    case "divide":
      return 3;
    case "power":
      return 4;
    case "constant":
    case "cos":
    case "sin":
    case "variable":
      return 5;
  }
}

function isConstant(expression: MathExpression, value: number): boolean {
  return expression.kind === "constant" && expression.value === value;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}
