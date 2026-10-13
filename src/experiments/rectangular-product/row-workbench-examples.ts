import { requireRowWorkbenchSource, type RowWorkbenchSource } from './row-workbench-source.ts';

export const originalRowSource: RowWorkbenchSource = {
  id: 'system', title: 'One system, three row operations',
  introduction: 'Change one equation at a time. Keep the solutions, inspect the arithmetic, and undo any step.',
  unknowns: ['x', 'y', 'z'], coefficients: [[2, -1, 3], [0, 1, -2]], rhs: [7, -1],
  steps: [
    { id: 'exchange', operation: { kind: 'swap', first: 0, second: 1 }, during: 'Exchange both complete equations.', after: 'Both equations are still here; only their order has changed.' },
    { id: 'eliminate-y', operation: { kind: 'add', sourceRow: 0, targetRow: 1, factor: 1 }, during: 'Add row 1 to row 2. The y coefficients cancel.', after: 'The second equation is now 2x + z = 6. The first equation is retained.' },
    { id: 'normalize-x', operation: { kind: 'scale', row: 1, factor: '1/2' }, during: 'Halve the whole second equation, including its right-hand side.', after: 'The second equation is x + z/2 = 3. Dividing by a nonzero number preserves its solutions.' },
    { id: 'order-rows', operation: { kind: 'swap', first: 0, second: 1 }, during: 'Place the equation for x above the equation for y.', after: 'The solutions are unchanged. There are still three unknowns and two independent equations; z remains free.' },
  ],
};
export const redundantRowSource: RowWorkbenchSource = {
  id: 'redundant', title: 'When an equation adds nothing',
  introduction: 'The second equation is exactly twice the first. Subtract twice row 1 from row 2 to see what remains.',
  unknowns: ['x', 'y', 'z'], coefficients: [[1, 2, 3], [2, 4, 6]], rhs: [7, 14],
  steps: [{ id: 'expose-redundancy', operation: { kind: 'add', sourceRow: 0, targetRow: 1, factor: -2 },
    during: 'Subtract twice the first equation from the second, including the right-hand side.',
    after: 'The second equation is now 0 = 0: it imposes no additional constraint. The first equation still restricts x, y and z.' }],
};
export const inconsistentRowSource: RowWorkbenchSource = {
  id: 'inconsistent', title: 'When equations cannot both hold',
  introduction: 'The coefficient rows have the same ratio, but 15 is not twice 7. Apply the same subtraction and watch the right-hand side.',
  unknowns: ['x', 'y', 'z'], coefficients: [[1, 2, 3], [2, 4, 6]], rhs: [7, 15],
  steps: [{ id: 'expose-contradiction', operation: { kind: 'add', sourceRow: 0, targetRow: 1, factor: -2 },
    during: 'Subtract twice the first equation. All three coefficients cancel, but the right-hand sides do not.',
    after: 'The second equation says 0 = 1, which cannot hold. No assignment can satisfy this system, or the original system with the same solutions.' }],
};
export const rowWorkbenchExamples = Object.freeze([
  { key: 'original', label: 'Three operations', model: requireRowWorkbenchSource(originalRowSource) },
  { key: 'redundant', label: 'Redundant equation', model: requireRowWorkbenchSource(redundantRowSource) },
  { key: 'inconsistent', label: 'Inconsistent equations', model: requireRowWorkbenchSource(inconsistentRowSource) },
]);
