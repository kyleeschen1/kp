import { constant } from '../../math/expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows } from '../../math/typed-semantic-math.ts';
import { matrixProduct } from '../../math/matrix-product.ts';
import { dotPassage, DotPassageGap } from '../dot-product-passage/model.ts';

const matrix = (id: string, rows: readonly (readonly number[])[]) => createKpTypedMatrixFromRows({ id,
  rows: rows.map((row, i) => row.map((value, j) => createKpScalarExpression({ id: `${id}.${i}.${j}`, expression: constant(value) }))),
});
// Naming follows function application: B receives the columns of A; C = BA.
export const pouringProduct = matrixProduct({ id: 'pour.BA',
  left: matrix('pour.B', [[2, -1, 3], [0, 4, 1]]),
  right: matrix('pour.A', [[4, 1], [5, -2], [-2, 3]]),
});
export function pouringModel(product = pouringProduct) {
  if (product.left.rowCount !== 2 || product.left.columnCount !== 3 || product.right.columnCount !== 2)
    throw new DotPassageGap('The pouring exemplar requires two rows, three components and two input columns.');
  const columns = Object.freeze(product.columns.map(column => Object.freeze(column.map(dotPassage))));
  return Object.freeze({ product, columns });
}
export const pouringBeats = Object.freeze([
  ['initial', 'B acts on each column of A. The result is C = BA.'],
  ['rows-1', 'Move B down as one block, opening space beside each coefficient.'],
  ['input-1', 'Tip the first input column directly from A toward the receiving grid.'],
  ['tilt-1', 'Tip its components into their matching positions in the first row.'],
  ['pour-1', 'Keep one copy here; pass the same components to the next row.'],
  ['products-1', 'Multiply each matched pair.'],
  ['addition-1', 'Each row now has three contributions to add.'],
  ['sums-1', 'Each receiving row produces one component of the output.'],
  ['dock-1', 'Keep those results together as the first column of C.'],
  ['rows-2', 'The same receiving rows are ready for the next input.'],
  ['input-2', 'Tip the second column directly into the same receiving grid.'],
  ['tilt-2', 'Use the same matching positions.'],
  ['pour-2', 'Every row receives this whole input too.'],
  ['products-2', 'Multiply the new pairs.'],
  ['addition-2', 'Keep the contributions grouped by receiving row.'],
  ['sums-2', 'One answer per row makes the second output column.'],
  ['dock-2', 'Input column two stays output column two.'],
  ['assembled', 'C is complete: a new matrix, ready to supply inputs to another transformation.'],
].map(([id, cue]) => Object.freeze({ id: id!, cue: cue! })));
export function samplePouring(progress: number) {
  if (!Number.isFinite(progress)) throw new DotPassageGap('Pouring progress must be finite.');
  const p = Math.max(0, Math.min(1, progress));
  const phase = p * (pouringBeats.length - 1);
  const index = Math.ceil(phase);
  return { progress: p, phase, index, beat: pouringBeats[index]!, local: index === 0 ? 1 : phase - index + 1 };
}
export type PouringModel = ReturnType<typeof pouringModel>;
