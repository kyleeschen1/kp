import * as M from "../../../src/math/authoring/matrices.ts";
import type { ColumnReading } from "../../../src/experiments/matrix-column-combinations/model.ts";
import { projectionLoss } from "../linear-algebra/projection-loss.ts";
import { dependentColumns } from "../linear-algebra/dependent-columns.ts";

type Matrix2 = readonly [readonly [number, number], readonly [number, number]];

// Source authors choose values and relationships. No layout, timing or paint
// instructions are needed to reuse the existing column-combination presentation.
export const matrixInputs = ([
  { id: "signed", left: [[-2, 3], [4, -1]], right: [[-1, 2], [2, -3]] },
  { id: "zero", left: [[0, 2], [3, 0]], right: [[1, 0], [0, 1]] },
  { id: "larger", left: [[12, -5], [7, 10]], right: [[3, -2], [4, 1]] }
] satisfies readonly { id: string; left: Matrix2; right: Matrix2 }[]).map(({ id, left, right }) => Object.freeze({
  id,
  product: M.product({ id: `convergence.${id}.product`,
    left: M.matrix(`convergence.${id}.A`, left), right: M.matrix(`convergence.${id}.B`, right) })
}));

/** Selection and navigation share one registry. The legacy numeric trials
 * retain their fixed preservation cohort separately from authored lessons. */
export const matrixSources: readonly {
  readonly id: string;
  readonly product: ReturnType<typeof M.product>;
  readonly reading?: ColumnReading;
}[] = Object.freeze([...matrixInputs, projectionLoss, dependentColumns]);
