import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpMatrixVectorOperationBankContract
} from "../src/animation/matrix-vector-operation-bank.ts";

const animation = createKpAnimationAssets().find((candidate) =>
  candidate.id ===
    "animation.generated.linear-algebra.matrix-vector.two-by-two"
)!;
const contract = createKpMatrixVectorOperationBankContract(animation);

test("operation bank treats Pour as persistent information flow", () => {
  assert.equal(contract.kind, "matrix-vector-operation-bank");
  assert.deepEqual(contract.inputPolicy, {
    persistence: "persistent-reference",
    depletion: false,
    metaphor: "information-flow-not-fluid"
  });
  assert.equal(contract.traversalPolicy, "row-ranked");
  assert.equal(contract.columnMeaning, "contribution-index");
  assert.equal(contract.outputMeaning, "row-coordinate");
});

test("operation bank binds exact products to authored selectors", () => {
  assert.deepEqual(contract.rows.map((row) => ({
    semanticIndex: row.semanticIndex,
    products: row.contributions.map((contribution) => contribution.product),
    operands: row.contributions.map((contribution) => [
      contribution.matrixValue,
      contribution.vectorValue
    ]),
    selectorCount: row.contributions.flatMap((contribution) => [
      contribution.matrixSelectorId,
      contribution.vectorSelectorId
    ]).length,
    result: row.result,
    fold: row.fold
  })), [
    {
      semanticIndex: 0,
      products: [8, 5],
      operands: [[2, 4], [1, 5]],
      selectorCount: 4,
      result: 13,
      fold: {
        topology: "products-gather-collapse",
        phases: ["products", "gather", "coordinate"]
      }
    },
    {
      semanticIndex: 1,
      products: [0, 15],
      operands: [[0, 4], [3, 5]],
      selectorCount: 4,
      result: 15,
      fold: {
        topology: "products-gather-collapse",
        phases: ["products", "gather", "coordinate"]
      }
    }
  ]);
});

test("operation bank reuses each persistent vector input across rows", () => {
  assert.deepEqual(
    contract.rows[0]!.contributions.map((item) => item.vectorSelectorId),
    contract.rows[1]!.contributions.map((item) => item.vectorSelectorId)
  );
});
