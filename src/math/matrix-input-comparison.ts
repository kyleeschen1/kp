import { add, negate, compileExpression } from "./expression.ts";
import { createKpScalarExpression, createKpTypedMatrixFromRows, type KpScalarValue } from "./typed-semantic-math.ts";
import { matrixParts, matrixProduct, MatrixProductGap, type MatrixSelection } from "./matrix-product.ts";
import { columnCombinations } from "./matrix-interpretations.ts";

export class InputComparisonGap extends MatrixProductGap {}

/** Exact, bounded evidence for two numerical inputs to one 2×2 map. The
 * differences are derived objects; original inputs and contributions keep their
 * references. This is not a symbolic theorem prover or an approximate zero test. */
export function compareInputs(product: ReturnType<typeof matrixProduct>, from = 0, to = 1) {
  if (product.left.rowCount !== 2 || product.left.columnCount !== 2 || product.right.rowCount !== 2 || product.right.columnCount !== 2)
    throw new InputComparisonGap("Input comparison currently requires a 2×2 map and two input columns.");
  const exact = (entry: KpScalarValue): bigint => {
    let value: number;
    try { value = compileExpression(entry.expression)({}); }
    catch { throw new InputComparisonGap(`Unbound numerical entry: ${entry.id}.`); }
    if (!Number.isSafeInteger(value)) throw new InputComparisonGap(`Exact safe-integer entry required: ${entry.id}.`);
    return BigInt(value);
  };
  const check = (entry: KpScalarValue, expected: bigint) => {
    if (expected > BigInt(Number.MAX_SAFE_INTEGER) || expected < BigInt(Number.MIN_SAFE_INTEGER) || exact(entry) !== expected)
      throw new InputComparisonGap(`Arithmetic exceeds the exact safe-integer boundary: ${entry.id}.`);
  };
  const verify = (value: ReturnType<typeof matrixProduct>) => {
    [...value.left.rows.flat(), ...value.right.rows.flat()].forEach(exact);
    for (const cell of value.cells) {
      let sum = 0n;
      for (const pair of cell.dot.pairs) {
        const contribution = exact(pair.left) * exact(pair.right);
        check(pair.product, contribution); sum += contribution;
      }
      check(cell.result, sum);
    }
  };
  verify(product);
  const inputs = Object.freeze({ before: product.rightParts.column(from), after: product.rightParts.column(to) });
  const result = matrixParts(product.result);
  const outputs = Object.freeze({ before: result.column(from), after: result.column(to) });
  const id = `${product.id}.compare.${from}.${to}`;
  const difference = (name: string, before: MatrixSelection, after: MatrixSelection) => createKpTypedMatrixFromRows({
    id: `${id}.${name}`, provenance: { kind: "derived", sourceIds: [after.id, before.id], methodId: "kp.math.vector-subtract.v1" },
    rows: after.entries.map((entry, i) => {
      const other = before.entries[i]!;
      const scalar = createKpScalarExpression({ id: `${id}.${name}.${i}`,
        expression: add(entry.expression, negate(other.expression)),
        provenance: { kind: "derived", sourceIds: [entry.id, other.id], methodId: "kp.math.scalar-subtract.v1" } });
      check(scalar, exact(entry) - exact(other));
      return [scalar];
    })
  });
  const inputDifference = difference("input-difference", inputs.before, inputs.after);
  const outputDifference = difference("output-difference", outputs.before, outputs.after);
  const image = matrixProduct({ id: `${id}.image`, left: product.left, right: inputDifference });
  verify(image);
  const combination = columnCombinations(image).column(0);
  combination.result.entries.forEach((entry, row) => check(entry, exact(outputDifference.rows[row]![0]!)));
  const nonzeroInput = inputDifference.rows.some(row => exact(row[0]!) !== 0n);
  const zeroOutput = combination.result.entries.every(entry => exact(entry) === 0n);
  const kind = !nonzeroInput ? "identical-inputs" : zeroOutput ? "lost-difference" : "distinguished-inputs";
  return Object.freeze({ id, kind, product, inputs, outputs, inputDifference, outputDifference, image, combination });
}
export type InputComparison = ReturnType<typeof compareInputs>;
