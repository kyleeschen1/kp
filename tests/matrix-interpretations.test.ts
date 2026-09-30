import assert from "node:assert/strict";
import test from "node:test";
import { constant, compileExpression } from "../src/math/expression.ts";
import { createKpScalarExpression, createKpScalarParameter, createKpTypedMatrix, createKpTypedMatrixFromRows,
  evaluateKpTypedMatrix, transposeKpTypedMatrix, type KpTypedMatrix, type KpScalarValue } from "../src/math/typed-semantic-math.ts";
import { matrixProduct, MatrixProductGap } from "../src/math/matrix-product.ts";
import { columnCombinations, gramMatrix, inspectOrthonormality } from "../src/math/matrix-interpretations.ts";

const scalar = (id: string, value: number) => createKpScalarExpression({ id, expression: constant(value) });
const matrix = (id: string, values: readonly (readonly number[])[]) => createKpTypedMatrixFromRows({
  id, rows: values.map((row, i) => row.map((value, j) => scalar(`${id}.${i}.${j}`, value))),
});
const value = (entry: KpScalarValue) => compileExpression(entry.expression)({});

test("column combinations reuse dot-product contributions and destinations across rectangular shapes", () => {
  for (const [m, n, p] of [[2, 3, 2], [3, 2, 1], [1, 1, 3]]) {
    const A = matrix("A", Array.from({ length: m! }, (_, i) => Array.from({ length: n! }, (_, k) => i - k)));
    const B = matrix("B", Array.from({ length: n! }, (_, k) => Array.from({ length: p! }, (_, j) => k + j)));
    const product = matrixProduct({ id: "AB", left: A, right: B });
    const interpretation = columnCombinations(product);
    assert.equal(interpretation.product, product);
    for (const column of interpretation.columns) {
      assert.equal(column.cells, product.columns[column.index]);
      assert.equal(column.result.matrix, product.result);
      for (const term of column.terms) {
        assert.equal(term.vector, product.leftParts.column(term.index));
        assert.equal(term.coefficient, B.rows[term.index]![column.index]);
        for (const [i, pair] of term.pairs.entries()) {
          assert.equal(pair, product.cell(i, column.index).dot.pairs[term.index]);
          assert.equal(term.entries[i], pair.product);
          assert.equal(pair.left, A.rows[i]![term.index]);
        }
      }
      for (const [i, target] of column.result.entries.entries()) {
        assert.equal(column.terms.reduce((sum, term) => sum + value(term.entries[i]!), 0), value(target));
      }
      assert.ok(Object.isFrozen(column.terms));
    }
    for (const index of [-1, .5, NaN, p!]) assert.throws(() => interpretation.column(index), MatrixProductGap);
  }
});

test("identity selects original columns while retaining zero contributions and derived result identity", () => {
  const A = matrix("A", [[1, 2], [3, 4], [5, 6]]), I = matrix("I", [[1, 0], [0, 1]]);
  const product = matrixProduct({ id: "AI", left: A, right: I });
  assert.deepEqual(evaluateKpTypedMatrix(product.result, {}), evaluateKpTypedMatrix(A, {}));
  for (const column of columnCombinations(product).columns) {
    assert.deepEqual(column.terms.map(term => value(term.coefficient)), column.index === 0 ? [1, 0] : [0, 1]);
    assert.equal(column.terms[column.index]!.vector, product.leftParts.column(column.index));
    assert.notEqual(column.result.entries[0]!.id, A.rows[0]![column.index]!.id);
    assert.equal(column.terms.length, 2);
  }
});

test("transpose and Gram matrix retain scalar identities and literal dimensions", () => {
  const Q = createKpTypedMatrix({ id: "Q", rows: [[scalar("q0", 1), scalar("q1", 0)],
    [scalar("q2", 0), scalar("q3", 1)], [scalar("q4", 0), scalar("q5", 0)]] });
  const T: KpTypedMatrix<2, 3> = transposeKpTypedMatrix({ id: "QT", matrix: Q });
  assert.equal(T.rows[1]![2], Q.rows[2]![1]);
  const gram = gramMatrix({ id: "gram", matrix: Q });
  const result: KpTypedMatrix<2, 2> = gram.result;
  assert.deepEqual(evaluateKpTypedMatrix(result, {}), [[1, 0], [0, 1]]);
  for (const cell of gram.cells) for (const pair of cell.dot.pairs) {
    assert.equal(pair.left, Q.rows[pair.index]![cell.rowIndex]);
    assert.equal(pair.right, Q.rows[pair.index]![cell.columnIndex]);
  }
});

test("orthonormality is numerical evidence with retained scope and explicit tolerance", () => {
  const check = (values: readonly (readonly number[])[], tolerance = 0) => inspectOrthonormality({
    id: "check", matrix: matrix("Q", values), scope: {}, tolerance,
  });
  assert.equal(check([[0, -1], [1, 0]]).status, "within-tolerance");
  assert.equal(check([[1, 0], [0, 1], [0, 0]]).status, "within-tolerance");
  assert.equal(check([[1, 1], [0, 1]]).status, "outside-tolerance");
  assert.equal(check([[2, 0], [0, 1]]).status, "outside-tolerance");
  assert.equal(check([[1, 1, 0], [0, 0, 1]]).status, "outside-tolerance");
  assert.equal(check([[1 + 1e-8, 0], [0, 1]], 1e-6).status, "within-tolerance");
  assert.equal(check([[1 + 1e-8, 0], [0, 1]], 0).status, "outside-tolerance");
  for (const tolerance of [-1, Infinity, NaN]) assert.throws(() => check([[1]], tolerance), MatrixProductGap);
  assert.throws(() => check([[Infinity]]), MatrixProductGap);
  const x = createKpScalarParameter({ id: "x", name: "x" });
  const Q = createKpTypedMatrix({ id: "Q", rows: [[x]] });
  const scope = { x: 1 };
  const evidence = inspectOrthonormality({ id: "check", matrix: Q, scope, tolerance: 0 });
  scope.x = 2;
  assert.equal(evidence.scope["x"], 1);
  assert.equal(evidence.status, "within-tolerance");
  assert.throws(() => inspectOrthonormality({ id: "check", matrix: Q, scope: {}, tolerance: 0 }));
});
