import { constant } from "../expression.ts";
import { createKpScalarExpression, createKpTypedMatrixFromRows, type KpTypedMatrix } from "../typed-semantic-math.ts";

export { matrixProduct as product, matrixParts as parts, MatrixProductGap } from "../matrix-product.ts";
export { evaluateKpTypedMatrix as evaluate } from "../typed-semantic-math.ts";

type NumericRows = readonly [readonly [number, ...number[]], ...(readonly number[])[]];
type Rectangular<Rows extends NumericRows> = {
  readonly [Index in keyof Rows]: Rows[Index] & { readonly length: Rows[0]["length"] };
};

/** Numeric literals acquire stable entry identities once, before any view is
 * selected. The overload retains tuple dimensions; the existing constructor
 * verifies the runtime shape without asserting a mapped array is a tuple. */
export function matrix<const Rows extends NumericRows>(
  id: string, rows: Rows & Rectangular<Rows>
): KpTypedMatrix<Rows["length"], Rows[0]["length"]>;
export function matrix(id: string, rows: readonly (readonly number[])[]): KpTypedMatrix {
  return createKpTypedMatrixFromRows({ id, rows: rows.map((row, i) => row.map((value, j) => {
    if (!Number.isFinite(value)) throw new RangeError(`Matrix ${id} entry [${i}, ${j}] must be finite.`);
    return createKpScalarExpression({ id: `${id}.${i}.${j}`, expression: constant(value) });
  })) });
}
