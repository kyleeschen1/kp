import { matrixEnvironment, matrixEnvironmentFromProduct, MatrixColumnGap } from "../matrix-column-product/environment.ts";
import { columnCombinations, inspectOrthonormality } from "../../math/matrix-interpretations.ts";
import { constant, compileExpression } from "../../math/expression.ts";
import { createKpScalarExpression, createKpTypedMatrixFromRows, type KpScalarValue } from "../../math/typed-semantic-math.ts";

import { matrixProduct } from "../../math/matrix-product.ts";
import type { ColumnBeatId, ColumnReading } from "../../authoring/matrix-columns/source.ts";
export type { ColumnBeatId, ColumnReading } from "../../authoring/matrix-columns/source.ts";

export const env = matrixEnvironment();
export const combination = columnCombinations(env.product).column(0);
export const numberOf = (entry: KpScalarValue) => {
  const value = compileExpression(entry.expression)({});
  if (!Number.isFinite(value)) throw new MatrixColumnGap("This exemplar requires finite numerical entries.");
  return value;
};
export const beats: readonly { readonly id: ColumnBeatId; readonly cue: string }[] = Object.freeze(([
  { id: "initial", cue: "One column of B supplies the weights for a whole result column." },
  { id: "columns", cue: "Separate the columns of A. These are copies of the same entries." },
  { id: "weights", cue: "The first column of B says: two copies of the first column, one of the second." },
  { id: "distribute", cue: "Apply the scalar to every entry. Each copy of 2 is the same scalar; each copy of 1 is the same scalar." },
  { id: "scaled", cue: "Multiply each column by its weight. Each entry is the same product used in a row–column dot product." },
  { id: "sum", cue: "Add the weighted columns entry by entry: 4 above 10." },
  { id: "placed", cue: "The sum is the first column of AB. The other column is a separate combination." },
] satisfies { id: ColumnBeatId; cue: string }[]).map(beat => Object.freeze(beat)));

// Local discovery cadence, borrowing the accepted copy/evaluate/place envelope.
export const durationMs = 12600;
export function sample(progress: number, sequence = beats) {
  if (!Number.isFinite(progress)) throw new MatrixColumnGap("Progress must be finite.");
  const p = Math.min(1, Math.max(0, progress));
  const phase = p * (sequence.length - 1), index = Math.ceil(phase);
  return { progress: p, index, local: index === 0 ? 1 : phase - index + 1, beat: sequence[index]! };
}

// Only the demonstrated finite 2×2 cases enter this local presentation.
// Mathematical relationships stay with matrixProduct and its interpretations.
export function example(kind = "columns", column = 0) {
  if (!["columns", "identity", "orthonormality"].includes(kind) || ![0, 1].includes(column)) {
    throw new MatrixColumnGap("Choose columns, identity or orthonormality, and result column 0 or 1.");
  }
  const matrix = (id: string, values: readonly (readonly number[])[]) => createKpTypedMatrixFromRows({ id,
    rows: values.map((row, i) => row.map((value, j) => createKpScalarExpression({ id: `${id}.${i}.${j}`, expression: constant(value) }))),
  });
  const evidence = kind === "orthonormality" ? inspectOrthonormality({ id: "example.gram",
    matrix: matrix("example.Q", [[.6, -.8], [.8, .6]]), scope: {}, tolerance: 1e-12 }) : undefined;
  const product = evidence?.gram ?? (kind === "identity" ? matrixProduct({ id: "example.AI", left: env.A,
    right: matrix("example.I", [[1, 0], [0, 1]]) }) : env.product);
  return projectExample(product, column, kind, evidence, kind === "columns" && column === 0);
}

/** Additional examples supply mathematics and selection, not presentation code.
 * Keep the demonstrated size/number boundary explicit rather than silently
 * routing unsupported inputs to unrelated choreography. */
export function columnExampleFromProduct(product: ReturnType<typeof matrixProduct>, column = 0, reading?: ColumnReading) {
  matrixEnvironmentFromProduct(product);
  if (![0, 1].includes(column)) throw new MatrixColumnGap("Choose result column 0 or 1.");
  return projectExample(product, column, "columns", undefined, false, reading);
}

/** A vector supplies one real result column. Admit the complete paint path
 * before mounting; no second column or replacement scalar identity is created. */
export function columnExampleFromVectorProduct(product: ReturnType<typeof matrixProduct>): ColumnExample {
  if (product.left.rowCount !== 2 || product.left.columnCount !== 2 ||
      product.right.rowCount !== 2 || product.right.columnCount !== 1 ||
      product.result.rowCount !== 2 || product.result.columnCount !== 1) {
    throw new MatrixColumnGap("This explanation requires a 2 by 2 matrix applied to a 2 by 1 vector.");
  }
  const entries = [...product.left.rows.flat(), ...product.right.rows.flat(), ...product.result.rows.flat(),
    ...product.cells.flatMap(cell => cell.dot.pairs.map(pair => pair.product))];
  for (const entry of entries) {
    let value: number;
    try { value = numberOf(entry); }
    catch { throw new MatrixColumnGap("This explanation requires finite numerical entries with no unresolved parameters."); }
    if (!/^-?\d+(?:\.\d+)?$/.test(String(value))) {
      throw new MatrixColumnGap("Use ordinary decimal entries, products and sums; scientific notation is unsupported.");
    }
  }
  return projectExample(product, 0, "vector", undefined, false);
}

function projectExample(product: ReturnType<typeof matrixProduct>, column: number, kind: string,
  evidence: ReturnType<typeof inspectOrthonormality> | undefined, legacyCues: boolean, reading?: ColumnReading) {
  const combination = columnCombinations(product).column(column);
  const vector = kind === "vector";
  const labels = vector ? ["A", "v", "Av"] : kind === "identity" ? ["A", "I", "AI"] : evidence ? ["Qᵀ", "Q", "QᵀQ"] : ["A", "B", "AB"];
  const ordinal = column === 0 ? "first" : "second";
  // Editorial text describes existing milestones; it cannot add/reorder motion
  // or change the mathematical objects inspected at those milestones.
  const cues = reading ? beats.map(beat => Object.freeze({ ...beat, cue: reading.cues[column === 0 ? 0 : 1][beat.id] })) : legacyCues ? beats : beats.map(beat => ({ ...beat, cue: ({
    initial: vector ? "The two entries of v supply the weights for the two columns of A." : evidence ? "QᵀQ compares the columns of Q with one another." : `The ${ordinal} column of ${labels[1]} supplies the weights for one result column.`,
    columns: `Separate the columns of ${labels[0]}. The entries retain their original references.`,
    weights: vector ? `Use v₁ = ${numberOf(combination.terms[0]!.coefficient)} and v₂ = ${numberOf(combination.terms[1]!.coefficient)} as the column weights.` : kind === "identity" ? `Column ${column + 1} of I selects column ${column + 1} of A: its weight is 1; the other weight is 0.` : `Use the ${ordinal} column of ${labels[1]} as the weights.`,
    distribute: "Apply each scalar to every entry. The copies refer to the same coefficient.",
    scaled: "Evaluate every product, including negative and zero contributions.",
    sum: `Add entry by entry: ${combination.result.entries.map(numberOf).join(" above ")}.`,
    placed: vector ? "The weighted columns sum to the output vector Av." : evidence ? `Column ${column + 1} of QᵀQ: a column dotted with itself gives 1; with the other column, 0.` : kind === "identity" ? `The result is column ${column + 1} of A. Zero contributes nothing; one preserves every value.` : `The sum is the ${ordinal} column of AB.`,
  } as Record<string, string>)[beat.id]! }));
  // Titles are authored presentation text, not a closed set of mathematical kinds.
  const title: string = vector ? "A vector weights the matrix columns" : evidence ? "Orthonormal columns produce the identity" : kind === "identity" ? "Identity selects each column" : "Columns, weighted and added";
  return Object.freeze({ kind, column, env: { A: product.left, B: product.right, product }, combination, labels,
    beats: Object.freeze(cues), evidence, reading,
    title: reading?.title ?? title,
  });
}
export type ColumnExample = ReturnType<typeof example>;
