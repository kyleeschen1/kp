import { constant } from '../../math/expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows } from '../../math/typed-semantic-math.ts';
import { matrixProduct } from '../../math/matrix-product.ts';
import { pouringProduct } from './pouring-model.ts';

// This view omits values from the paint, not from mathematical authority.
const next = createKpTypedMatrixFromRows({ id: 'structure.D', rows: [[1, 0], [0, 1], [1, 1]].map((row, r) =>
  row.map((value, c) => createKpScalarExpression({ id: `structure.D.${r}.${c}`, expression: constant(value) }))) });
export const structureModel = Object.freeze({ product: pouringProduct,
  next: matrixProduct({ id: 'structure.DC', left: next, right: pouringProduct.result }),
});
export const structureBeats = Object.freeze([
  ['initial', 'A contains two input columns. Each has three components.'],
  ['receive-1', 'One whole input fits the three positions in a row of B.'],
  ['copy-1', 'Both rows receive the same whole input. Nothing is divided between them.'],
  ['output-1', 'Each row computes one output component. Two rows give two components.'],
  ['column-1', 'Together, those components form the first column of C.'],
  ['receive-2', 'The next input column fits the same receiving structure.'],
  ['copy-2', 'Again, the whole input reaches every row.'],
  ['output-2', 'Again, two receiving rows produce two components.'],
  ['C', 'Two input columns become two output columns. C = BA has shape 2 × 2.'],
  ['next-input', 'Inspect C’s first column: its two components fit each row of D.'],
  ['next-copy', 'D has three receiving rows. Each receives this same two-component input.'],
  ['next-output', 'This time there are three output components—one per row of D.'],
  ['composition', 'The intermediate dimensions match: B produces two components, and D accepts two.'],
].map(([id, cue]) => Object.freeze({ id: id!, cue: cue! })));
export function sampleStructure(progress: number) {
  if (!Number.isFinite(progress)) throw new Error('Structure progress must be finite.');
  const p = Math.max(0, Math.min(1, progress)), phase = p * (structureBeats.length - 1), index = Math.ceil(phase);
  return { progress: p, phase, index, beat: structureBeats[index]! };
}
