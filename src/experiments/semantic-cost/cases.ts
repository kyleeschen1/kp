import { constant } from '../../math/expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows } from '../../math/typed-semantic-math.ts';
import { matrixProduct } from '../../math/matrix-product.ts';

export type Reading = 'dot' | 'rows' | 'columns';
export function costExample(index: number, reading: Reading) {
  const matrix = (name: string, rows: readonly (readonly number[])[]) => {
    const id = `cost.${index}.${name}`;
    return createKpTypedMatrixFromRows({ id, rows: rows.map((row, i) => row.map((value, j) =>
      createKpScalarExpression({ id: `${id}.${i}.${j}`, expression: constant(value) }))) });
  };
  const a = reading === 'dot' ? [[2 + index, -1, 3]] : [[1 + index, -2], [0, 4 - index]];
  const b = reading === 'dot' ? [[4], [5 - index], [-2]] : [[2, 0], [-1 - index, 3]];
  return matrixProduct({ id: `cost.${index}.product`, left: matrix('A', a), right: matrix('B', b) });
}
export type CostProduct = ReturnType<typeof costExample>;
export interface MountedReading {
  seek(progress: number): void;
  play(): void;
  pause(): void;
  dispose(): void;
}
