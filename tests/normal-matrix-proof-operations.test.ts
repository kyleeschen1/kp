import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpNormalMatrixProofOperationSet,
  createKpNormalMatrixProofOperationSet,
  kpNormalMatrixProofSelectorId,
  kpNormalMatrixProofTransformationPaths
} from "../src/semantic/normal-matrix-proof-operations.ts";

test("normal-proof operations close all six authored transformations", () => {
  const operations = createKpNormalMatrixProofOperationSet();

  assert.deepEqual(checkKpNormalMatrixProofOperationSet(operations), []);
  assert.deepEqual(
    operations.transformations.map(({ id }) =>
      id.replace("transform.normal-proof.", "")
    ),
    kpNormalMatrixProofTransformationPaths
  );
  assert.equal(operations.relations.length, 6);
});

test("product-entry transformations preserve factor provenance", () => {
  const operations = createKpNormalMatrixProofOperationSet();
  const left = operations.transformations[0]?.correspondenceMap?.records[0];
  const right = operations.transformations[1]?.correspondenceMap?.records[0];

  assert.deepEqual(left?.sourceSelectorIds, [
    kpNormalMatrixProofSelectorId("matrix/eigenvalue"),
    kpNormalMatrixProofSelectorId("matrix/row-remainder")
  ]);
  assert.deepEqual(left?.targetSelectorIds, [
    kpNormalMatrixProofSelectorId("product-left/first-entry")
  ]);
  assert.deepEqual(right?.sourceSelectorIds, [
    kpNormalMatrixProofSelectorId("matrix/eigenvalue"),
    kpNormalMatrixProofSelectorId("matrix/zero-column")
  ]);
});

test("zero-row and recursive relations remain mathematical, not visual", () => {
  const operations = createKpNormalMatrixProofOperationSet();
  const zero = operations.relations.find(({ kind }) => kind === "forces");
  const recursion = operations.relations.find(({ kind }) => kind === "transmits");

  assert.deepEqual(zero?.to, ["inference/remainder-zero"]);
  assert.deepEqual(recursion?.from, ["normality", "matrix/block-diagonal"]);
  assert.deepEqual(recursion?.to, ["proof/recursive-subproblem"]);
  assert.ok(
    operations.transformations.every(
      ({ correspondenceMap }) => correspondenceMap !== undefined
    )
  );
});
