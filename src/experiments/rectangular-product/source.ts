import { constant } from '../../math/expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows } from '../../math/typed-semantic-math.ts';
import { matrixProduct } from '../../math/matrix-product.ts';
import { rectangularContext } from './model.ts';

const matrix = (id: string, rows: readonly (readonly number[])[]) => createKpTypedMatrixFromRows({ id,
  rows: rows.map((row, i) => row.map((value, j) => createKpScalarExpression({ id: `${id}.${i}.${j}`, expression: constant(value) }))),
});
export const context = rectangularContext(matrixProduct({ id: 'rectangle.product',
  left: matrix('rectangle.A', [[2, -1, 3], [0, 4, 1]]),
  right: matrix('rectangle.B', [[4, 1], [5, -2], [-2, 3]]),
}));
