import { constant, variable, power, type MathExpression } from '../../math/expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows } from '../../math/typed-semantic-math.ts';
import { matrixProduct } from '../../math/matrix-product.ts';

const scalar = (id: string, expression: MathExpression) => createKpScalarExpression({ id, expression });
export const polynomialCoefficients = Object.freeze([[2, 0, -1, 4], [1, 3, 0, -2]].map(row => Object.freeze(row)));
// The basis is explicitly declared, not inferred from repeated glyph strings.
export const polynomialBasis = Object.freeze([power(variable('t'), 3), power(variable('t'), 2), variable('t'), constant(1)]
  .map((expression, i) => scalar(`poly.basis.${i}`, expression)));
export const polynomialProduct = matrixProduct({ id: 'poly.factorization',
  left: createKpTypedMatrixFromRows({ id: 'poly.coefficients', rows: polynomialCoefficients.map((row, r) =>
    row.map((n, c) => scalar(`poly.coefficient.${r}.${c}`, constant(n)))) }),
  right: createKpTypedMatrixFromRows({ id: 'poly.basis', rows: polynomialBasis.map(value => [value]) }),
});
export const polynomialBeats = Object.freeze([
  ['polynomials', 'Two polynomials: the familiar notation hides some coefficients.'],
  ['align', 'Align powers of t. Zero coefficients make the missing terms explicit.'],
  ['notice', 'Both cubic terms use the same basis expression, t³. Their coefficients occupy one column.'],
  ['collect', 'Keep the coefficient grid fixed. Collect the shared basis expressions above it.'],
  ['pivot', 'Turn the ordered basis into a column: cubic, quadratic, linear, constant.'],
  ['matrix', 'The same polynomials, expressed as a coefficient matrix times the basis vector.'],
  ['rows', 'The coefficients of p(t) form the first row of the matrix.'],
  ['columns', 'The cubic basis expression corresponds to the first column of coefficients.'],
  ['hold', 'One row per polynomial; one column per basis expression. Scrub backward to expand again.'],
].map(([id, cue]) => Object.freeze({ id: id!, cue: cue! })));
export function samplePolynomial(progress: number) {
  if (!Number.isFinite(progress)) throw new Error('Polynomial progress must be finite.');
  const p = Math.max(0, Math.min(1, progress)), phase = p * (polynomialBeats.length - 1), index = Math.ceil(phase);
  return { progress: p, phase, index, beat: polynomialBeats[index]! };
}
