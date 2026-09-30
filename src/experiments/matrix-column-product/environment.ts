import { createGeneratedLinearAlgebraProblemFixture } from "../../semantic/generated-linear-algebra-problem-fixture.ts";
import { createGeneratedProblemAnimationAsset } from "../../animation/generated-problem-import.ts";
import { createKpMatrixMatrixCompositionChoreography } from "../../animation/matrix-matrix-composition-choreography.ts";
import { constant, compileExpression } from "../../math/expression.ts";
import { createKpScalarExpression, createKpTypedMatrixFromRows } from "../../math/typed-semantic-math.ts";
import { matrixProduct } from "../../math/matrix-product.ts";

export class MatrixColumnGap extends Error {
  readonly code = "kp.matrix-column.unsupported";
}

export function matrixEnvironment() {
  const fixture = createGeneratedLinearAlgebraProblemFixture("generated.linear-algebra.matrix-matrix.two-by-two");
  const asset = createGeneratedProblemAnimationAsset(fixture);
  // Keep authored fixture validation and selector authority at this import boundary.
  const { cells } = createKpMatrixMatrixCompositionChoreography(asset);
  if (cells.length !== 4 || cells.some(c => c.leftValues.length !== 2 || c.rightValues.length !== 2 ||
    ![...c.leftValues, ...c.rightValues, c.result].every(Number.isFinite))) {
    throw new MatrixColumnGap("This presentation requires a finite 2 by 2 product.");
  }
  const scalar = (id: string, value: number) => createKpScalarExpression({ id, expression: constant(value) });
  const A = createKpTypedMatrixFromRows({ id: `${asset.id}.left`, rows: cells.filter(c => c.columnIndex === 0)
    .map(c => c.leftValues.map((value, index) => scalar(c.leftSelectorIds[index]!, value))) });
  const firstRow = cells.filter(c => c.rowIndex === 0);
  const B = createKpTypedMatrixFromRows({ id: `${asset.id}.right`, rows: [0, 1]
    .map(index => firstRow.map(c => scalar(c.rightSelectorIds[index]!, c.rightValues[index]!))) });
  const product = matrixProduct({ id: `${asset.id}.product`, left: A, right: B });
  const valueOf = (entry: typeof A.rows[number][number]) => compileExpression(entry.expression)({});
  const projected = product.cells.map(semantic => {
    const binding = cells.find(c => c.rowIndex === semantic.rowIndex && c.columnIndex === semantic.columnIndex);
    const result = valueOf(semantic.result);
    if (!binding || binding.result !== result || semantic.dot.pairs.some((pair, index) =>
      pair.left.id !== binding.leftSelectorIds[index] || pair.right.id !== binding.rightSelectorIds[index])) {
      throw new MatrixColumnGap("The mathematical product must match authored result and selector evidence.");
    }
    // Native selectors name visual occurrences; they need not rename the derived
    // semantic result. Keep that correspondence explicit rather than matching text.
    return Object.freeze({
      semantic, row: semantic.rowIndex, col: semantic.columnIndex, result,
      left: Object.freeze(semantic.row.entries.map(valueOf)), right: Object.freeze(semantic.column.entries.map(valueOf)),
      leftIds: Object.freeze(semantic.row.entries.map(entry => entry.id)),
      rightIds: Object.freeze(semantic.column.entries.map(entry => entry.id)),
      resultId: binding.resultSelectorId, intermediateId: binding.intermediateObjectId,
    });
  });
  return Object.freeze({ assetId: asset.id, A, B, product, cells: Object.freeze(projected) });
}
export type MatrixEnvironment = ReturnType<typeof matrixEnvironment>;
export type MatrixCell = MatrixEnvironment["cells"][number];
