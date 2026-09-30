import { compileExpression } from "../../math/expression.ts";
import type { MatrixProductCell } from "../../math/matrix-product.ts";
import type { KpScalarValue } from "../../math/typed-semantic-math.ts";

export class DotPassageGap extends Error {
  readonly code = "kp.dot-passage.unsupported";
}
export const valueOf = (entry: KpScalarValue) => {
  const value = compileExpression(entry.expression)({});
  if (!Number.isFinite(value)) throw new DotPassageGap("The dot passage needs finite numerical operands and results.");
  return value;
};

export const beats = Object.freeze([
  { id: "vectors", cue: "Pair each entry of the row covector with the matching entry of the column vector." },
  { id: "pairs", cue: "Tilt the column into matching pairs as the row spreads to make room." },
  { id: "products", cue: "Evaluate each multiplication. Each new number is the product of its two operands." },
  { id: "sum", cue: "Add the three products, keeping their signs. This is the dot product." },
].map(beat => Object.freeze(beat)));
export const durationMs = 6300;

/** A local projection of an existing relationship. No replacement operands,
 * contributions or arithmetic are created to drive the animation. */
export function dotPassage(cell: MatrixProductCell) {
  const { dot } = cell;
  if (!Object.isFrozen(cell) || !Object.isFrozen(dot) || dot.pairs.length !== 3 ||
      cell.row.entries.length !== 3 || cell.column.entries.length !== 3) {
    throw new DotPassageGap("This review passage supports an immutable three-term dot product.");
  }
  if (dot.left !== cell.row || dot.right !== cell.column || dot.result !== cell.result ||
      dot.pairs.some((pair, i) => pair.index !== i || pair.left !== cell.row.entries[i] || pair.right !== cell.column.entries[i])) {
    throw new DotPassageGap("The passage requires the cell's original operand and result references.");
  }
  for (const pair of dot.pairs) [pair.left, pair.right, pair.product].forEach(valueOf);
  valueOf(dot.result);
  return Object.freeze({ cell, dot, beats });
}
export type DotPassage = ReturnType<typeof dotPassage>;

export function sample(progress: number) {
  if (!Number.isFinite(progress)) throw new DotPassageGap("Progress must be finite.");
  const p = Math.max(0, Math.min(1, progress)), phase = p * (beats.length - 1);
  const index = Math.ceil(phase);
  return { progress: p, index, local: index === 0 ? 1 : phase - index + 1, beat: beats[index]! };
}
