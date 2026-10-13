import { variable } from '../../math/expression.ts';
import { requireCollectionSource } from './collection-source.ts';
import { linearSystemSource } from './linear-system-source.ts';
import { requireRowComposition, type RowCompositionSource } from './row-composition-model.ts';

export const eliminateSecondSource: RowCompositionSource = {
  id: 'eliminate-second.add-first-to-second',
  before: requireCollectionSource({
    ...linearSystemSource, id: 'eliminate-second',
    coefficients: [[1, 2, -1], [-1, 1, 2]],
    inputs: [variable('u'), variable('v'), variable('w')],
    domain: { kind: 'linear-system', rhs: [4, 2] },
    focus: { row: 1, column: 0 },
    annotations: {
      polynomials: 'Two constraints share the unknowns u, v and w.',
      align: 'Align u, v and w without changing either equation.',
      notice: 'The u coefficients are opposites: 1 and −1.',
      collect: 'Collect repeated unknowns; keep coefficients in their rows.',
      pivot: 'Turn u, v and w into one ordered vector.',
      matrix: 'Both constraints are now in matrix form.',
      rows: 'Each row still represents a complete equation, including its RHS.',
      columns: 'The first column holds the two coefficients of u.',
      hold: 'Adding the first row to the second will eliminate u from the second equation.',
    },
  }),
  title: 'Eliminate an unknown from one equation',
  introduction: 'The u coefficients are opposites. Add the first equation to the second, keeping the first equation available.',
  operation: { kind: 'add', sourceRow: 0, targetRow: 1, factor: 1 },
  annotations: {
    equations: 'The first equation contains u; the second contains −u. Their sum will have no u term.',
    matrix: 'Follow the first column: 1 and −1 are the coefficients of u. Keep both right-hand sides with their rows.',
    changed: 'Add row 1 to row 2, including 4 + 2 on the right-hand side. Keep row 1 unchanged.',
    expanded: 'The second equation is now 6 = 3v + w. The first still contains u. The joint solutions are unchanged.',
  },
};
export const eliminateSecondComposition = requireRowComposition(eliminateSecondSource);
