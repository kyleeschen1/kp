import { multiply } from "./expression.ts";
import {
  createKpScalarExpression, multiplyKpTypedMatrices,
  type KpScalarValue, type KpTypedMatrix,
} from "./typed-semantic-math.ts";

export class MatrixProductGap extends Error {
  readonly code = "kp.math.matrix-product.invalid";
}

export interface MatrixSelection {
  readonly kind: "matrix-row" | "matrix-column";
  readonly id: string;
  readonly matrix: KpTypedMatrix;
  readonly index: number;
  readonly entries: readonly KpScalarValue[];
}

export interface MatrixEntryPair {
  readonly index: number;
  readonly left: KpScalarValue;
  readonly right: KpScalarValue;
  readonly product: KpScalarValue;
}

export interface MatrixProductCell {
  readonly id: string;
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly row: MatrixSelection;
  readonly column: MatrixSelection;
  readonly dot: Readonly<{
    kind: "dot-product";
    id: string;
    left: MatrixSelection;
    right: MatrixSelection;
    pairs: readonly MatrixEntryPair[];
    result: KpScalarValue;
  }>;
  readonly result: KpScalarValue;
}

function at<T>(values: readonly T[], index: number, label: string): T {
  const value = values[index];
  if (!Number.isInteger(index) || value === undefined) {
    throw new MatrixProductGap(`${label} index ${index} is outside 0..${values.length - 1}.`);
  }
  return value;
}

// Keeping input references is safe only for immutable typed values. Reject
// structural lookalikes that could change the meaning of an existing operation.
function requireFrozen(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  if (!Object.isFrozen(value)) throw new MatrixProductGap("Use immutable typed matrix constructors.");
  Object.values(value).forEach(requireFrozen);
}

/** Overlapping lenses retain the same entries; selecting a column creates no copy. */
export function matrixParts(matrix: KpTypedMatrix) {
  requireFrozen(matrix);
  if (!Number.isInteger(matrix.rowCount) || !Number.isInteger(matrix.columnCount) ||
    matrix.rowCount < 1 || matrix.columnCount < 1 ||
    matrix.rows.length !== matrix.rowCount || matrix.rows.some(row => row.length !== matrix.columnCount)) {
    throw new MatrixProductGap("Matrix dimensions must match nonempty rectangular rows.");
  }
  const rows: readonly MatrixSelection[] = Object.freeze(matrix.rows.map((entries, index) => Object.freeze({
    kind: "matrix-row" as const, id: `${matrix.id}.row.${index}`, matrix, index, entries,
  })));
  const columns: readonly MatrixSelection[] = Object.freeze(Array.from({ length: matrix.columnCount }, (_, index) => Object.freeze({
    kind: "matrix-column" as const, id: `${matrix.id}.column.${index}`, matrix, index,
    entries: Object.freeze(matrix.rows.map(row => at(row, index, "Column"))),
  })));
  return Object.freeze({
    matrix, rows, columns,
    row: (index: number) => at(rows, index, "Row"),
    column: (index: number) => at(columns, index, "Column"),
    cell: (row: number, column: number) => at(at(rows, row, "Row").entries, column, "Column"),
  });
}

/** Real-scalar matrix multiplication, retaining explanation structure even when
 * the existing expression owner simplifies products and sums to constants. */
export function matrixProduct<const Left extends KpTypedMatrix, const Columns extends number>(input: {
  readonly id: string;
  readonly left: Left;
  readonly right: KpTypedMatrix<Left["columnCount"], Columns>;
}) {
  if (!input.id.trim()) throw new MatrixProductGap("A matrix product needs a stable id.");
  const { id, left, right } = input;
  const leftParts = matrixParts(left), rightParts = Object.is(left, right) ? leftParts : matrixParts(right);
  if (left.columnCount !== right.rowCount) throw new MatrixProductGap("Matrix product dimensions are incompatible.");
  const identities = new Map<string, object>();
  const identify = (value: { readonly id: string }) => {
    const previous = identities.get(value.id);
    if (!value.id.trim() || (previous !== undefined && previous !== value)) {
      throw new MatrixProductGap(`Conflicting semantic identity: ${value.id}.`);
    }
    identities.set(value.id, value);
  };
  [left, right].forEach(matrix => {
    identify(matrix);
    matrix.rows.forEach(row => row.forEach(identify));
  });
  [leftParts, rightParts].forEach(parts => [...parts.rows, ...parts.columns].forEach(identify));
  identify({ id });
  const result = multiplyKpTypedMatrices({ id: `${id}.result`, left, right });
  identify(result);
  const rows = Object.freeze(leftParts.rows.map(row => Object.freeze(rightParts.columns.map(column => {
    const cellId = `${id}.cell.${row.index}.${column.index}`;
    const target = at(at(result.rows, row.index, "Result row"), column.index, "Result column");
    identify(target);
    const pairs = Object.freeze(row.entries.map((entry, index) => {
      const other = at(column.entries, index, "Inner dimension");
      const product = createKpScalarExpression({
        id: `${cellId}.pair.${index}`,
        expression: multiply(entry.expression, other.expression),
        provenance: { kind: "derived", sourceIds: [entry.id, other.id], methodId: "kp.math.scalar-multiply.v1" },
      });
      identify(product);
      return Object.freeze({ index, left: entry, right: other, product });
    }));
    const dot = Object.freeze({ kind: "dot-product" as const, id: `${cellId}.dot`, left: row, right: column, pairs, result: target });
    identify(dot);
    const cell: MatrixProductCell = Object.freeze({
      id: cellId, rowIndex: row.index, columnIndex: column.index, row, column, dot, result: target,
    });
    identify(cell);
    return cell;
  }))));
  const cells = Object.freeze(rows.flat());
  const columns = Object.freeze(rightParts.columns.map(column => Object.freeze(rows.map(row => at(row, column.index, "Column")))));
  return Object.freeze({
    kind: "matrix-product" as const, id, left, right, result, leftParts, rightParts, cells, rows, columns,
    cell: (row: number, column: number) => at(at(rows, row, "Row"), column, "Column"),
  });
}
