import { constant } from "../../math/expression.ts";
import { createKpScalarExpression, createKpTypedMatrixFromRows } from "../../math/typed-semantic-math.ts";
import { matrixProduct } from "../../math/matrix-product.ts";
import { dotPassage } from "./model.ts";

const scalar = (id: string, value: number) => createKpScalarExpression({ id, expression: constant(value) });
// A row times a column supplies the existing semantic dot relationship. This
// standalone host displays the row as a covector and the column as a vector.
const left = createKpTypedMatrixFromRows({ id: "dot-example.u", rows: [
  [2, -1, 3].map((value, i) => scalar(`dot-example.u.${i}`, value)),
] });
const right = createKpTypedMatrixFromRows({ id: "dot-example.v", rows:
  [4, 5, -2].map((value, i) => [scalar(`dot-example.v.${i}`, value)]),
});
export const product = matrixProduct({ id: "dot-example.product", left, right });
export const passage = dotPassage(product.cell(0, 0));
