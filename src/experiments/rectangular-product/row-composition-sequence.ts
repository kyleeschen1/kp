import { requireCollectionSource } from './collection-source.ts';
import { linearSystemSource } from './linear-system-source.ts';
import { compileRowSequenceComposition, type RowSequenceCompositionSource } from './row-composition-model.ts';

export const eliminationSequenceSource: RowSequenceCompositionSource = {
  id: 'short-elimination',
  before: requireCollectionSource({ ...linearSystemSource, id: 'short-elimination.initial',
    coefficients: [[0, 2, 2], [1, 1, -1]], domain: { kind: 'linear-system', rhs: [4, 1] } }),
  title: 'Three operations, the same solutions',
  introduction: 'Collect the equations, exchange their rows, normalize a pivot, and eliminate above it. Then read the resulting equations.',
  steps: [
    { id: 'swap', operation: { kind: 'swap', first: 0, second: 1 },
      during: 'Exchange the two complete equations, including their right-hand sides. Put the x pivot first.',
      after: 'The x pivot is in the first row. The second row has no x term: this is row-echelon form.' },
    { id: 'normalize', operation: { kind: 'scale', row: 1, factor: '1/2' },
      during: 'Multiply the whole second equation by one half, including its right-hand side.',
      after: 'The second pivot is now 1. The second equation is y + z = 2.' },
    { id: 'eliminate', operation: { kind: 'add', sourceRow: 1, targetRow: 0, factor: -1 },
      during: 'Subtract the second row from the first. The y terms cancel; keep the second row.',
      after: 'The pivot columns now have zeros everywhere else. This is reduced row-echelon form; z has no pivot.' },
  ],
  annotations: {
    equations: 'Two equations constrain three unknowns. Follow every right-hand side along with its coefficients.',
    matrix: 'The same constraints in matrix form. Each operation will preserve their joint solutions.',
    expanded: 'Read x = 2z − 1 and y = 2 − z. Any real z determines one solution: the solution set is a line.',
  },
};
const compiled = compileRowSequenceComposition(eliminationSequenceSource);
if (compiled.status !== 'compiled') throw new Error(`${compiled.path}: ${compiled.message}`);
export const eliminationSequenceComposition = compiled;
