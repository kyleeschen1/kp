import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpNormalMatrixProofSemanticRegistry,
  findKpNormalMatrixProofSemanticEntity,
  kpNormalMatrixProofObjectPaths,
  kpNormalMatrixProofSemanticRegistry
} from "../src/semantic/normal-matrix-proof-semantics.ts";

test("normal-matrix proof registry closes every specified semantic address", () => {
  assert.deepEqual(checkKpNormalMatrixProofSemanticRegistry(), []);
  assert.deepEqual(
    kpNormalMatrixProofSemanticRegistry.map(({ path }) => path),
    kpNormalMatrixProofObjectPaths
  );
  assert.equal(
    new Set(kpNormalMatrixProofSemanticRegistry.map(({ address }) => address)).size,
    kpNormalMatrixProofObjectPaths.length
  );
});

test("semantic identity and provenance do not depend on repeated glyph labels", () => {
  const repeatedFirstEntries = kpNormalMatrixProofSemanticRegistry.filter(
    ({ label }) => label === "first entry"
  );

  assert.equal(repeatedFirstEntries.length, 2);
  assert.notEqual(repeatedFirstEntries[0]?.path, repeatedFirstEntries[1]?.path);
  assert.ok(
    kpNormalMatrixProofSemanticRegistry.every(
      ({ provenance }) => provenance.claimIds.length > 0
    )
  );
  assert.equal(
    findKpNormalMatrixProofSemanticEntity("matrix/row-remainder").continuityRole,
    "decisive-target"
  );
});

test("semantic registry rejects duplicate paths and missing parents", () => {
  const duplicate = kpNormalMatrixProofSemanticRegistry[0]!;
  const orphan = {
    ...kpNormalMatrixProofSemanticRegistry[1]!,
    path: "matrix/eigenvalue" as const,
    address: "normal-proof/matrix/eigenvalue" as const,
    parentPath: "matrix/lower-block" as const
  };
  const withoutLowerBlock = kpNormalMatrixProofSemanticRegistry.filter(
    ({ path }) => path !== "matrix/lower-block"
  );

  assert.match(
    checkKpNormalMatrixProofSemanticRegistry([
      ...kpNormalMatrixProofSemanticRegistry,
      duplicate
    ])[0] ?? "",
    /Duplicate/
  );
  assert.ok(
    checkKpNormalMatrixProofSemanticRegistry([
      ...withoutLowerBlock,
      orphan
    ]).some((issue) => issue.includes("unknown parent matrix/lower-block"))
  );
});
