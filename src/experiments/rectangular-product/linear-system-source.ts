import { variable } from '../../math/expression.ts';
import { requireCollectionSource, type CollectionSource } from './collection-source.ts';

// This caller supplies constraints, not definitions of named polynomial outputs.
// The common view displays b = Ax; it does not solve for x or assert any solution.
export const linearSystemSource: CollectionSource = {
  id: 'system', coefficients: [[2, -1, 3], [0, 1, -2]],
  inputs: [variable('x'), variable('y'), variable('z')],
  domain: { kind: 'linear-system', rhs: [7, -1] },
  focus: { row: 1, column: 2 },
  annotations: {
    polynomials: 'Two equations constrain the same unknowns: x, y and z. The numbers on the left are their right-hand sides.',
    align: 'Align the unknowns. The second equation has no x term, so its x coefficient is zero.',
    notice: 'Follow z in both equations. Its coefficients, 3 and −2, occupy the same column.',
    collect: 'Keep every coefficient in its row. Collect the repeated unknowns without changing either constraint.',
    pivot: 'Turn x, y and z into one ordered column. These are unknown coordinates, not powers of a polynomial variable.',
    matrix: 'The same system in matrix form: b = Ax, equivalently Ax = b. No equation has been solved.',
    rows: 'The second row and the second right-hand side still express y − 2z = −1.',
    columns: 'The third coefficient column multiplies z in both equations.',
    hold: 'Expand either row to recover its equation. Which column would change position if we ordered the unknowns as z, x, y?',
  },
  pacing: { notice: 4500, matrix: 4500, hold: 5000 },
};
export const linearSystemModel = requireCollectionSource(linearSystemSource);
