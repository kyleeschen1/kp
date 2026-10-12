import { constant, variable, power } from '../../math/expression.ts';
import { requireCollectionSource } from './collection-source.ts';
import { polynomialSource } from './polynomial-model.ts';

export const reorderedPolynomialModel = requireCollectionSource({
  ...polynomialSource, id: 'reordered',
  coefficients: [[1, -1, 0], [-1, 2, 3]],
  inputs: [constant(1), power(variable('s'), 2), variable('s')],
  domain: { kind: 'polynomials', names: ['r(s)', 'h(s)'] },
  focus: { row: 1, column: 2 },
  annotations: {
    polynomials: 'Two polynomials, written in the declared order: constant, quadratic, linear.',
    align: 'Make each coefficient explicit, including the missing linear term in r(s).',
    notice: 'Follow the linear input s and its coefficient in each row.',
    collect: 'Collect the repeated input expressions; their coefficient columns remain in place.',
    pivot: 'Turn the declared order (1, s², s) into a column.',
    matrix: 'The constant is now the first input, so the first matrix column holds constant coefficients.',
    rows: 'The second row reconstructs h(s) = −1 + 2s² + 3s.',
    columns: 'The third column contains the coefficients of s.',
    hold: 'Input order determines column order. Which column would move if s came first?',
  },
});
