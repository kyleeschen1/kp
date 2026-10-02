import { constant } from "../../../src/math/expression.ts";
import { createKpScalarExpression, createKpTypedMatrixFromRows } from "../../../src/math/typed-semantic-math.ts";
import { matrixProduct } from "../../../src/math/matrix-product.ts";

type Matrix2 = readonly [readonly [number, number], readonly [number, number]];
const matrix = (id: string, rows: Matrix2) => createKpTypedMatrixFromRows({ id,
  rows: rows.map((row, i) => row.map((value, j) => createKpScalarExpression({
    id: `${id}.${i}.${j}`, expression: constant(value)
  })))
});

// Source authors choose values and relationships. No layout, timing or paint
// instructions are needed to reuse the existing column-combination presentation.
export const matrixInputs = ([
  { id: "signed", left: [[-2, 3], [4, -1]], right: [[-1, 2], [2, -3]] },
  { id: "zero", left: [[0, 2], [3, 0]], right: [[1, 0], [0, 1]] },
  { id: "larger", left: [[12, -5], [7, 10]], right: [[3, -2], [4, 1]] }
] satisfies readonly { id: string; left: Matrix2; right: Matrix2 }[]).map(({ id, left, right }) => Object.freeze({
  id,
  product: matrixProduct({ id: `convergence.${id}.product`,
    left: matrix(`convergence.${id}.A`, left), right: matrix(`convergence.${id}.B`, right) })
}));
