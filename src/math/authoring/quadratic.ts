import { add, constant, multiply, power, variable, differentiate, compileExpression, type MathExpression } from '../expression.ts';

export interface QuadraticCoefficients { readonly a: number; readonly b: number; readonly c: number }
export const coefficientLimit = 10;
export const tangentLimit = 4;

/** This pilot admits real polynomials of degree at most two, including the
 * linear and constant boundaries. The expression owner performs all algebra. */
export function quadraticExpression({ a, b, c }: QuadraticCoefficients): MathExpression {
  for (const value of [a, b, c]) if (!Number.isFinite(value) || Math.abs(value) > coefficientLimit)
    throw new Error(`Coefficients must be finite numbers between -${coefficientLimit} and ${coefficientLimit}.`);
  return add(multiply(constant(a), power(variable('x'), 2)), multiply(constant(b), variable('x')), constant(c));
}

export function quadraticDerivative(coefficients: QuadraticCoefficients): MathExpression {
  return differentiate(quadraticExpression(coefficients), 'x');
}

export function tangentExpression(expression: MathExpression, derivative: MathExpression, at: number): MathExpression {
  if (!Number.isFinite(at) || Math.abs(at) > tangentLimit) throw new Error(`The tangent point must be between -${tangentLimit} and ${tangentLimit}.`);
  const y = compileExpression(expression)({ x: at }), slope = compileExpression(derivative)({ x: at });
  return add(constant(y), multiply(constant(slope), add(variable('x'), constant(-at))));
}
