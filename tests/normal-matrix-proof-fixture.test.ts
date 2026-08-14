import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpNormalMatrixProofFixture,
  kpNormalMatrixProofClaimIds,
  kpNormalMatrixProofFixture
} from "../src/semantic/normal-matrix-proof-fixture.ts";

test("normal-matrix proof fixture closes the theorem and induction spine", () => {
  assert.deepEqual(checkKpNormalMatrixProofFixture(kpNormalMatrixProofFixture), []);
  assert.deepEqual(
    kpNormalMatrixProofFixture.claims.map(({ id }) => id),
    kpNormalMatrixProofClaimIds
  );
  assert.match(
    kpNormalMatrixProofFixture.claims.find(
      ({ id }) => id === "unitary-basis-invariance"
    )?.statement ?? "",
    /preserves/
  );
  assert.equal(
    kpNormalMatrixProofFixture.claims.at(-1)?.statement,
    "Composing the two unitary basis changes diagonalizes M."
  );
});

test("row and column products expose exactly one unmatched contribution", () => {
  const fixture = kpNormalMatrixProofFixture;

  assert.deepEqual(fixture.blockForm.firstRow, ["lambda", "r"]);
  assert.deepEqual(fixture.blockForm.firstColumn, ["lambda", "zero"]);
  assert.deepEqual(fixture.firstEntryComparison, {
    leftProduct: "M M†",
    leftEntry: "|lambda|² + ||r||²",
    rightProduct: "M† M",
    rightEntry: "|lambda|²",
    unmatchedContribution: "||r||²",
    conclusion: "r = 0"
  });
});

test("fixture states the dimension decrease and the complex-only dependency", () => {
  const fixture = kpNormalMatrixProofFixture;

  assert.equal(fixture.field, "complex");
  assert.equal(fixture.dimensions.rowRemainder, "1 × (n − 1)");
  assert.equal(fixture.dimensions.zeroColumn, "(n − 1) × 1");
  assert.equal(fixture.dimensions.lowerBlock, "(n − 1) × (n − 1)");
  assert.equal(fixture.induction.recursiveDimension, "n − 1");
  assert.match(fixture.complexScalarDependency, /root in the scalar field/);
});

test("fixture validation rejects a corrupted eigenvector-first block", () => {
  const corrupted = {
    ...kpNormalMatrixProofFixture,
    blockForm: {
      ...kpNormalMatrixProofFixture.blockForm,
      firstColumn: ["lambda", "r"] as unknown as readonly ["lambda", "zero"]
    }
  };

  assert.deepEqual(checkKpNormalMatrixProofFixture(corrupted), [
    "The eigenvector-first block form must distinguish the unknown row from the forced zero column."
  ]);
});
