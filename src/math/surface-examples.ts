import {
  add,
  compileExpression,
  compileGradient,
  constant,
  divide,
  expressionToLatex,
  negate,
  power,
  variable,
  type CompiledExpression,
  type MathExpression,
  type NumericScope
} from "./expression.ts";

export const DEFAULT_SADDLE_DENOMINATOR = 4;

export interface SaddleSurfaceInput {
  x: number;
  y: number;
}

export interface SaddleSurfaceGradient {
  dx: number;
  dy: number;
}

export function createSaddleSurfaceExpression(
  denominator = DEFAULT_SADDLE_DENOMINATOR
): MathExpression {
  if (!Number.isFinite(denominator) || denominator <= 0) {
    throw new Error("Saddle surface denominator must be positive.");
  }

  return divide(
    add(power(variable("x"), 2), negate(power(variable("y"), 2))),
    constant(denominator)
  );
}

export const saddleSurfaceExpression: MathExpression =
  createSaddleSurfaceExpression();

export const saddleSurfaceLatex = expressionToLatex(saddleSurfaceExpression);

const evaluateSaddleSurfaceExpression = compileExpression(saddleSurfaceExpression);
const saddleSurfaceGradient = compileGradient(
  saddleSurfaceExpression,
  ["x", "y"]
);
const evaluateSaddleSurfaceDx = requireGradientEvaluator(
  saddleSurfaceGradient[0],
  "dx"
);
const evaluateSaddleSurfaceDy = requireGradientEvaluator(
  saddleSurfaceGradient[1],
  "dy"
);

export function evaluateSaddleSurface(input: SaddleSurfaceInput): number {
  return evaluateSaddleSurfaceExpression(toScope(input));
}

export function evaluateSaddleSurfaceGradient(
  input: SaddleSurfaceInput
): SaddleSurfaceGradient {
  return {
    dx: evaluateSaddleSurfaceDx(toScope(input)),
    dy: evaluateSaddleSurfaceDy(toScope(input))
  };
}

function toScope(input: SaddleSurfaceInput): NumericScope {
  return {
    x: input.x,
    y: input.y
  };
}

function requireGradientEvaluator(
  evaluator: CompiledExpression | undefined,
  label: string
): CompiledExpression {
  if (evaluator === undefined) {
    throw new Error(`Expected saddle surface gradient to contain ${label}.`);
  }

  return evaluator;
}
