import assert from "node:assert/strict";
import test from "node:test";
import { constant, compileExpression } from "../src/math/expression.ts";
import {
  createKpScalarExpression, createKpScalarParameter, createKpTypedMatrix,
  createKpTypedMatrixFromRows, evaluateKpTypedMatrix, type KpTypedMatrix,
} from "../src/math/typed-semantic-math.ts";
import { matrixParts, matrixProduct, MatrixProductGap } from "../src/math/matrix-product.ts";

const scalar = (id: string, value: number) => createKpScalarExpression({ id, expression: constant(value) });
const matrix = (id: string, rows: readonly (readonly number[])[]) => createKpTypedMatrixFromRows({
  id, rows: rows.map((row, i) => row.map((value, j) => scalar(`${id}.${i}.${j}`, value))),
});

test("rectangular products retain operand context, each multiplication and exact destinations", () => {
  const A = matrix("A", [[1, 2, 3], [4, 5, 6]]);
  const B = matrix("B", [[7, 8], [9, 10], [11, 12]]);
  const product = matrixProduct({ id: "AB", left: A, right: B });
  assert.equal(product.left, A);
  assert.equal(product.right, B);
  assert.deepEqual(evaluateKpTypedMatrix(product.result, {}), [[58, 64], [139, 154]]);
  for (const cell of product.cells) {
    assert.equal(product.cell(cell.rowIndex, cell.columnIndex), cell);
    assert.equal(product.rows[cell.rowIndex]![cell.columnIndex], cell);
    assert.equal(product.columns[cell.columnIndex]![cell.rowIndex], cell);
    assert.equal(cell.result, product.result.rows[cell.rowIndex]![cell.columnIndex]);
    assert.equal(cell.dot.result, cell.result);
    assert.equal(cell.dot.left, cell.row);
    assert.equal(cell.dot.right, cell.column);
    assert.equal(cell.row.matrix, A);
    assert.equal(cell.column.matrix, B);
    for (const pair of cell.dot.pairs) {
      assert.equal(pair.left, A.rows[cell.rowIndex]![pair.index]);
      assert.equal(pair.right, B.rows[pair.index]![cell.columnIndex]);
      assert.deepEqual(pair.product.provenance, { kind: "derived", sourceIds: [pair.left.id, pair.right.id], methodId: "kp.math.scalar-multiply.v1" });
    }
    const sum = cell.dot.pairs.reduce((value, pair) => value + compileExpression(pair.product.expression)({}), 0);
    assert.equal(sum, compileExpression(cell.result.expression)({}));
  }
  assert.deepEqual(product.cell(0, 0).dot.pairs.map(pair => compileExpression(pair.product.expression)({})), [7, 18, 33]);
  assert.ok(Object.isFrozen(product.columns[0]));
  assert.equal(Reflect.set(product.cell(0, 0).dot.pairs[0]!, "index", 9), false);
  assert.equal(Reflect.set(A.rows[0]![0]!.expression, "value", 99), false);
});

test("row and column lenses overlap without copying or equating equal values", () => {
  const A = matrix("A", [[2, 2], [2, 2]]);
  const parts = matrixParts(A);
  assert.equal(parts.row(0).entries[1], parts.column(1).entries[0]);
  assert.equal(parts.cell(0, 1), A.rows[0]![1]);
  assert.notEqual(parts.cell(0, 0).id, parts.cell(0, 1).id);
  const product = matrixProduct({ id: "AA", left: A, right: A });
  assert.equal(product.left, product.right);
  assert.equal(new Set(product.cells.map(cell => cell.result.id)).size, 4);
  const traversed = product.columns.flat();
  assert.deepEqual(traversed.map(cell => [cell.rowIndex, cell.columnIndex]), [[0, 0], [1, 0], [0, 1], [1, 1]]);
  for (const cell of traversed.reverse()) assert.equal(cell, product.cell(cell.rowIndex, cell.columnIndex));
});

test("symbolic and zero contributions remain inspectable after arithmetic simplification", () => {
  const x = createKpScalarParameter({ id: "x", name: "x" });
  const A = createKpTypedMatrix({ id: "A", rows: [[x, scalar("a1", -2), scalar("a2", 0)]] });
  const B = createKpTypedMatrix({ id: "B", rows: [[scalar("b0", 3)], [scalar("b1", 4)], [scalar("b2", 99)]] });
  const product = matrixProduct({ id: "AB", left: A, right: B });
  const typedResult: KpTypedMatrix<1, 1> = product.result;
  assert.deepEqual(evaluateKpTypedMatrix(typedResult, { x: 5 }), [[7]]);
  assert.equal(product.cell(0, 0).dot.pairs.length, 3);
  assert.equal(product.cell(0, 0).dot.pairs[0]!.left, x);
  assert.equal(compileExpression(product.cell(0, 0).dot.pairs[2]!.product.expression)({}), 0);
  assert.deepEqual(evaluateKpTypedMatrix(A, { x: 5 }), [[5, -2, 0]]);
});

test("invalid dimensions, indices, mutable operands and identity conflicts fail at the boundary", () => {
  const A = matrix("A", [[1, 2]]), B = matrix("B", [[3], [4]]);
  const product = matrixProduct({ id: "AB", left: A, right: B });
  for (const index of [-1, 0.5, NaN, Infinity, 2]) {
    assert.throws(() => product.cell(index, 0), MatrixProductGap);
    assert.throws(() => product.cell(0, index), MatrixProductGap);
    assert.throws(() => product.leftParts.row(index), MatrixProductGap);
    assert.throws(() => product.rightParts.column(index), MatrixProductGap);
  }
  assert.throws(() => matrixProduct({ id: "bad", left: A, right: A }), MatrixProductGap);
  assert.throws(() => matrixProduct({ id: "", left: A, right: B }), MatrixProductGap);
  assert.throws(() => matrixParts({ ...A }), MatrixProductGap);
  assert.throws(() => matrixProduct({ id: "bad", left: matrix("same", [[1]]), right: matrix("same", [[2]]) }), MatrixProductGap);
  assert.throws(() => matrixProduct({ id: "AB", left: matrix("AB.result", [[1]]), right: matrix("B", [[2]]) }), MatrixProductGap);
});

// Compile-time dimension pressure, deliberately not executed by the runtime test.
function rejectsIncompatibleLiteralDimensions() {
  const A = createKpTypedMatrix({ id: "A", rows: [[scalar("a0", 1), scalar("a1", 2)]] });
  const B = createKpTypedMatrix({ id: "B", rows: [[scalar("b0", 1)]] });
  // @ts-expect-error A requires a right operand with two rows.
  matrixProduct({ id: "bad", left: A, right: B });
}
void rejectsIncompatibleLiteralDimensions;
