/** Two bounded teaching sources, not a generic relation-inference API. The
 * exact solver checks their systems; tests bind this prose to their traces. */
export const contrastSources = {
  2: {
    coefficients: [[1, 1], [2, 2]], rhs: [3, 6],
    rowName: 'second', unknowns: ['x', 'y'],
    relation: 'row 2 is twice row 1', relationLatex: 'b_2-2b_1=0',
    checks: ['6-2\\cdot3=0', '7-2\\cdot3=1\\ne0'],
    compatibleSolution: 'Any real y gives a solution x = 3 − y: infinitely many solutions.',
    introduction: 'Both systems have the same dependent coefficient rows. Change only the second right-hand side, then compare the same subtraction.',
    equations: ['The second left-hand side is twice the first. Its right-hand side is also twice the first: 6 = 2 × 3.',
      'The second left-hand side is twice the first. Its right-hand side is 7, not twice 3. Can both equations hold?'],
    matrix: 'Keep A fixed. Subtract twice row 1 from row 2, including the right-hand side.',
    steps: [{ id: 'eliminate',
      during: 'Subtract twice row 1 from row 2. The coefficients cancel in both systems; compare what happens on the right-hand side.', after: '' }],
  },
  3: {
    coefficients: [[1, 0, 1], [0, 1, 1], [1, 1, 2]], rhs: [3, 2, 5],
    rowName: 'third', unknowns: ['x', 'y', 'z'],
    relation: 'row 3 is the sum of rows 1 and 2', relationLatex: 'b_3-b_1-b_2=0',
    checks: ['5-3-2=0', '6-3-2=1\\ne0'],
    compatibleSolution: 'Any real z gives x = 3 − z and y = 2 − z: infinitely many solutions.',
    introduction: 'The third coefficient row is the sum of the first two. Change only its right-hand side, then subtract those rows in two steps.',
    equations: ['The third left-hand side is the sum of the first two. Its right-hand side also matches: 5 = 3 + 2.',
      'The third left-hand side is the sum of the first two. Its right-hand side is 6, not 3 + 2. Can all three equations hold?'],
    matrix: 'Keep A fixed. Subtract row 1 from row 3, then subtract row 2 from row 3. Carry the right-hand side through both steps.',
    steps: [{ id: 'subtract-first', during: 'Subtract row 1 from row 3, including its right-hand side. The x term cancels; y + z remains.',
      after: 'The third coefficient row now matches row 2. Compare their right-hand sides before subtracting row 2.' },
    { id: 'eliminate', during: 'Subtract row 2 from row 3. The remaining y and z terms cancel; compare the right-hand-side residual.', after: '' }],
  },
} as const;
