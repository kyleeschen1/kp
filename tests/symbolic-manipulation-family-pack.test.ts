import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpSymbolicManipulationFamilyPackDeclarations,
  createSymbolicManipulationFamilyRegistry,
  symbolicManipulationFamilyById
} from "../src/animation/symbolic-manipulation-family-registry.ts";
import {
  createKpSymbolicManipulationFamilyPackDeclaration,
  validateKpSymbolicManipulationFamilyPacks
} from "../src/animation/symbolic-manipulation-family-pack.ts";

const expectedFamilyIds = [
  "family.algebra.both-sides",
  "family.algebra.cancel-combine",
  "family.algebra.distribution-factoring",
  "family.algebra.fraction-simplification",
  "family.algebra.exponent-log-laws",
  "family.algebra.inequality",
  "family.calculus.derivative-rules",
  "family.calculus.integral-ftc",
  "family.calculus.taylor-local-linearization",
  "family.calculus.gradient-jacobian",
  "family.calculus.hessian-optimization",
  "family.linear-algebra.vector-add-scale",
  "family.linear-algebra.dot-projection",
  "family.linear-algebra.matrix-vector",
  "family.linear-algebra.matrix-matrix-composition",
  "family.linear-algebra.row-operations",
  "family.linear-algebra.determinant-inverse",
  "family.linear-algebra.basis-eigen"
] as const;

test("symbolic family packs preserve the exact registry order and lookup", () => {
  assert.deepEqual(
    kpSymbolicManipulationFamilyPackDeclarations.map(({ id }) => id),
    [
      "symbolic-family-pack.algebra",
      "symbolic-family-pack.calculus",
      "symbolic-family-pack.linear-algebra"
    ]
  );
  assert.deepEqual(
    createSymbolicManipulationFamilyRegistry().map(({ id }) => id),
    expectedFamilyIds
  );
  for (const id of expectedFamilyIds) {
    assert.equal(symbolicManipulationFamilyById(id)?.id, id);
  }
});

test("symbolic family pack validation fails closed on duplicate and drifting declarations", () => {
  const algebra = kpSymbolicManipulationFamilyPackDeclarations[0]!;
  assert.deepEqual(validateKpSymbolicManipulationFamilyPacks(
    kpSymbolicManipulationFamilyPackDeclarations
  ), []);

  assert.ok(validateKpSymbolicManipulationFamilyPacks([algebra, algebra]).some(
    ({ code }) => code === "duplicate-pack-id"
  ));
  const reversed = createKpSymbolicManipulationFamilyPackDeclaration({
    ...algebra,
    familyIds: [...algebra.familyIds].reverse()
  });
  assert.ok(validateKpSymbolicManipulationFamilyPacks([reversed]).some(
    ({ code }) => code === "family-order-mismatch"
  ));
  const wrongDomain = createKpSymbolicManipulationFamilyPackDeclaration({
    ...algebra,
    domain: "calculus"
  });
  assert.ok(validateKpSymbolicManipulationFamilyPacks([wrongDomain]).some(
    ({ code }) => code === "family-domain-mismatch"
  ));
});

test("the registry index stays thin and domain packs do not import siblings", async () => {
  const index = await readFile(
    "src/animation/symbolic-manipulation-family-registry.ts",
    "utf8"
  );
  assert.doesNotMatch(index, /createKpSemanticTransformationDefinition/);
  assert.ok(index.split("\n").length < 80);

  for (const domain of ["algebra", "calculus", "linear-algebra"] as const) {
    const source = await readFile(
      `src/animation/symbolic-manipulation-families/${domain}.ts`,
      "utf8"
    );
    for (const sibling of ["algebra", "calculus", "linear-algebra"]) {
      if (sibling === domain) continue;
      assert.doesNotMatch(
        source,
        new RegExp(`symbolic-manipulation-families/${sibling}`)
      );
    }
  }
});
