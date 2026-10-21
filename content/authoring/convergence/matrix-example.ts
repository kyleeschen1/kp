import { dependentColumns } from "../linear-algebra/dependent-columns.ts";
import { evaluate } from "../../../src/math/authoring/matrices.ts";

/** One accepted source owns the starter's values and prose. This adapter has no
 * renderer or checker dependency and does not invent another lesson fixture. */
export function example() {
  return { schemaVersion: "kp.matrix-columns.v1", id: dependentColumns.id,
    left: evaluate(dependentColumns.product.left, {}).map(row => [...row]),
    right: evaluate(dependentColumns.product.right, {}).map(row => [...row]),
    reading: structuredClone(dependentColumns.reading) };
}
