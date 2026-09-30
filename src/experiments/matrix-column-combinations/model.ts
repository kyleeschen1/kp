import { matrixEnvironment, MatrixColumnGap } from "../matrix-column-product/environment.ts";
import { columnCombinations } from "../../math/matrix-interpretations.ts";
import { compileExpression } from "../../math/expression.ts";
import type { KpScalarValue } from "../../math/typed-semantic-math.ts";

export const env = matrixEnvironment();
export const combination = columnCombinations(env.product).column(0);
export const numberOf = (entry: KpScalarValue) => {
  const value = compileExpression(entry.expression)({});
  if (!Number.isFinite(value)) throw new MatrixColumnGap("This exemplar requires finite numerical entries.");
  return value;
};
export const beats = Object.freeze([
  { id: "initial", cue: "One column of B supplies the weights for a whole result column." },
  { id: "columns", cue: "Separate the columns of A. These are copies of the same entries." },
  { id: "weights", cue: "The first column of B says: two copies of the first column, one of the second." },
  { id: "distribute", cue: "Apply the scalar to every entry. Each copy of 2 is the same scalar; each copy of 1 is the same scalar." },
  { id: "scaled", cue: "Multiply each column by its weight. Each entry is the same product used in a row–column dot product." },
  { id: "sum", cue: "Add the weighted columns entry by entry: 4 above 10." },
  { id: "placed", cue: "The sum is the first column of AB. The other column is a separate combination." },
].map(beat => Object.freeze(beat)));

// Local discovery cadence, borrowing the accepted copy/evaluate/place envelope.
export const durationMs = 12600;
export function sample(progress: number) {
  if (!Number.isFinite(progress)) throw new MatrixColumnGap("Progress must be finite.");
  const p = Math.min(1, Math.max(0, progress));
  const phase = p * (beats.length - 1), index = Math.ceil(phase);
  return { progress: p, index, local: index === 0 ? 1 : phase - index + 1, beat: beats[index]! };
}
