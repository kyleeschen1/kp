import { constant, variable, power } from '../../math/expression.ts';
import { requireCollectionSource, sampleCollection, type CollectionSource } from './collection-source.ts';

export const polynomialSource: CollectionSource = {
  id: 'poly', coefficients: [[2, 0, -1, 4], [1, 3, 0, -2]],
  inputs: [power(variable('t'), 3), power(variable('t'), 2), variable('t'), constant(1)],
  domain: { kind: 'polynomials', names: ['p(t)', 'q(t)'] },
  annotations: {
    polynomials: 'Two polynomials: the familiar notation hides some coefficients.',
    align: 'Align powers of t. Zero coefficients make the missing terms explicit.',
    notice: 'Both cubic terms use the same basis expression, t³. Their coefficients occupy one column.',
    collect: 'Keep the coefficient grid fixed. Collect the shared basis expressions above it.',
    pivot: 'Turn the ordered basis into a column: cubic, quadratic, linear, constant.',
    matrix: 'The same polynomials, expressed as a coefficient matrix times the basis vector.',
    rows: 'The coefficients of p(t) form the first row of the matrix.',
    columns: 'The cubic basis expression corresponds to the first column of coefficients.',
    hold: 'One row per polynomial; one column per basis expression. Scrub backward to expand again.',
  },
};
export const polynomialModel = requireCollectionSource(polynomialSource);
export const polynomialCoefficients = polynomialModel.coefficients;
export const polynomialBasis = polynomialModel.inputs;
export const polynomialProduct = polynomialModel.product;
export const polynomialBeats = polynomialModel.beats;
export const samplePolynomial = (progress: number) => sampleCollection(polynomialModel, progress);
