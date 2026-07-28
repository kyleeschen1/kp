import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionDistributedSumComposition
} from "../src/semantic/fraction-distributed-sum-composition.ts";

test("normalized fraction branches compose into one ordered distributed sum", () => {
  const composition = createKpFractionDistributedSumComposition();

  assert.equal(composition.expression.root.kind, "sum");
  if (composition.expression.root.kind !== "sum") return;
  assert.deepEqual(
    composition.expression.root.terms.map(({ id, kind }) => [id, kind]),
    [
      ["fraction-normalization.target.x", "quotient"],
      ["fraction-normalization.target.6", "quotient"]
    ]
  );
  assert.deepEqual(composition.lineage, [
    {
      relation: "preserve",
      branchId: "term.x",
      sourceRootId: "fraction-normalization.target.x",
      targetTermId: "fraction-normalization.target.x"
    },
    {
      relation: "preserve",
      branchId: "term.6",
      sourceRootId: "fraction-normalization.target.6",
      targetTermId: "fraction-normalization.target.6"
    }
  ]);
  assert.equal(
    composition.verification.schemaVersion,
    "kp.verified-fraction-distributed-sum-composition.v1"
  );
  assert.equal(
    composition.verification.normalizationProof.schemaVersion,
    "kp.verified-fraction-numerator-normalization.v1"
  );
  assert.deepEqual(composition.verification.branchOrder, ["term.x", "term.6"]);
  assert.equal(composition.verification.composedRootId, "fraction-composition.target.sum");
  assert.deepEqual(composition.verification.targetTermIds, [
    "fraction-normalization.target.x",
    "fraction-normalization.target.6"
  ]);
});

test("distributed-sum composition preserves authored branch order", () => {
  assert.throws(
    () => createKpFractionDistributedSumComposition({ branchOrder: ["term.6", "term.x"] }),
    /must preserve normalized branch order term\.x, term\.6/
  );
});
