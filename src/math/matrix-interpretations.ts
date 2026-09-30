import { compileExpression, type NumericScope } from "./expression.ts";
import { matrixParts, matrixProduct, MatrixProductGap } from "./matrix-product.ts";
import { transposeKpTypedMatrix, type KpTypedMatrix } from "./typed-semantic-math.ts";

type Product = ReturnType<typeof matrixProduct>;

/** Regroup the very same scalar contributions by coefficient and source column.
 * No arithmetic, scalar identities, or alternative result are minted here. */
export function columnCombinations(product: Product) {
  const resultParts = matrixParts(product.result);
  const columns = Object.freeze(product.columns.map((cells, index) => Object.freeze({
    id: `${product.id}.column-combination.${index}`, index, cells,
    result: resultParts.column(index),
    terms: Object.freeze(product.leftParts.columns.map((vector, k) => {
      const coefficient = product.rightParts.cell(k, index);
      const pairs = Object.freeze(cells.map(cell => {
        const pair = cell.dot.pairs[k];
        if (!pair || pair.right !== coefficient || pair.left !== vector.entries[cell.rowIndex]) {
          throw new MatrixProductGap("Column combinations require the product's original contribution references.");
        }
        return pair;
      }));
      return Object.freeze({ index: k, vector, coefficient, pairs,
        entries: Object.freeze(pairs.map(pair => pair.product)) });
    })),
  })));
  return Object.freeze({ product, columns, column(index: number) {
    const column = columns[index];
    if (!Number.isInteger(index) || !column) throw new MatrixProductGap("Unknown result column.");
    return column;
  } });
}

/** Q^T Q is the existing matrix-product relationship, with original Q entries
 * accessible on both sides of every pair. This is real, not Hermitian, algebra. */
export function gramMatrix<Rows extends number, Columns extends number>(input: {
  readonly id: string;
  readonly matrix: KpTypedMatrix<Rows, Columns>;
}) {
  matrixParts(input.matrix);
  const transpose = transposeKpTypedMatrix({ id: `${input.id}.transpose`, matrix: input.matrix });
  return matrixProduct({ id: input.id, left: transpose, right: input.matrix });
}

/** Numerical evidence is scoped and tolerance-explicit; it never asserts a
 * symbolic theorem or silently upgrades near-orthogonality to exact equality. */
export function inspectOrthonormality(input: {
  readonly id: string;
  readonly matrix: KpTypedMatrix;
  readonly scope: NumericScope;
  readonly tolerance: number;
}) {
  if (!Number.isFinite(input.tolerance) || input.tolerance < 0 ||
    Object.values(input.scope).some(value => !Number.isFinite(value))) {
    throw new MatrixProductGap("Numerical evidence needs finite bindings and a finite nonnegative tolerance.");
  }
  const scope = Object.freeze({ ...input.scope });
  const gram = gramMatrix(input);
  // Check the original entries too: simplification must not hide an undefined
  // source, such as a free parameter multiplied by zero.
  for (const row of input.matrix.rows) for (const entry of row) {
    if (!Number.isFinite(compileExpression(entry.expression)(scope))) {
      throw new MatrixProductGap("Orthonormality requires finite evaluated source entries.");
    }
  }
  const comparisons = Object.freeze(gram.cells.map(cell => {
    const actual = compileExpression(cell.result.expression)(scope);
    if (!Number.isFinite(actual)) throw new MatrixProductGap("The Gram matrix must evaluate to finite entries.");
    const expected = cell.rowIndex === cell.columnIndex ? 1 : 0;
    return Object.freeze({ cell, expected, actual, error: Math.abs(actual - expected) });
  }));
  return Object.freeze({
    kind: "numerical-orthonormality-check" as const, matrix: input.matrix, gram, scope,
    tolerance: input.tolerance, comparisons,
    status: comparisons.every(item => item.error <= input.tolerance) ? "within-tolerance" as const : "outside-tolerance" as const,
  });
}
