import type { matrixProduct } from '../../math/matrix-product.ts';
import { beats, dotPassage, DotPassageGap } from '../dot-product-passage/model.ts';

/** This caller composes one existing three-term passage with its matrix context. */
export function rectangularContext(product: ReturnType<typeof matrixProduct>, row = 0, column = 0) {
  if (product.left.rowCount !== 2 || product.left.columnCount !== 3 || product.right.columnCount !== 2) {
    throw new DotPassageGap('The rectangular review supports a 2×3 by 3×2 product.');
  }
  const passage = dotPassage(product.cell(row, column));
  const storyBeats = Object.freeze([...beats, {
    id: 'placed', cue: `Place the dot product in row ${row + 1}, column ${column + 1} of the result.`,
  }]);
  return Object.freeze({ product, passage, beats: storyBeats, sample(progress: number) {
    if (!Number.isFinite(progress)) throw new DotPassageGap('Progress must be finite.');
    const p = Math.max(0, Math.min(1, progress)), phase = p * 5;
    const index = Math.ceil(phase);
    return { progress: p, index, beat: storyBeats[index]!, dotProgress: Math.min(1, phase / 4), placement: Math.max(0, phase - 4) };
  } });
}
export type RectangularContext = ReturnType<typeof rectangularContext>;
