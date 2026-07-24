import assert from "node:assert/strict";
import test from "node:test";

import { createCanonicalKpQuadraticSemanticFixture } from "../src/semantic/quadratic-branching-fixture.ts";
import { createCanonicalKpCompletingSquareAuthority } from "../src/semantic/quadratic-completing-square-authority.ts";
import { createCanonicalKpQuadraticFormulaAuthority } from "../src/semantic/quadratic-formula-authority.ts";
import {
  compileKpQuadraticMethodConvergence,
  validateKpQuadraticMethodConvergence,
  type KpQuadraticMethodConvergence
} from "../src/semantic/quadratic-method-convergence.ts";
import { createCanonicalKpQuadraticPlusMinusBranches } from "../src/semantic/quadratic-plus-minus-branches.ts";
import { createCanonicalKpQuadraticSolutionMethodGraph } from "../src/semantic/quadratic-solution-method-graph.ts";
import { createKpQuadraticSolutionSetFromFixture } from "../src/semantic/quadratic-solution-set.ts";

test("both methods reunite into two shared canonical root identities", () => {
  const { convergence } = canonical();
  assert.deepEqual(convergence.reunions.map(({ rootMemberId }) => rootMemberId), [
    "root:2/1",
    "root:3/1"
  ]);
  assert.ok(
    convergence.reunions.every(({ contributions }) => contributions.length === 2)
  );
});

test("reunion retains method-specific branch provenance without duplicating roots", () => {
  const { convergence } = canonical();
  for (const reunion of convergence.reunions) {
    assert.deepEqual(reunion.contributions.map(({ methodId }) => methodId), [
      "method.quadratic.completing-square",
      "method.quadratic.formula"
    ]);
    assert.equal(new Set(reunion.contributions.map(({ branchId }) => branchId)).size, 2);
    assert.ok(reunion.contributions.every(
      ({ evidenceLawId }) => evidenceLawId === "law.arithmetic.signed-offset"
    ));
  }
});

test("canonical convergence passes cross-method and exact substitution checks", () => {
  const values = canonical();
  assert.deepEqual(validateKpQuadraticMethodConvergence(values), []);
});

test("validator reports conflicting or duplicate contributions", () => {
  const values = canonical();
  const first = values.convergence.reunions[0]!;
  const broken = {
    ...values.convergence,
    reunions: [
      {
        ...first,
        contributions: [
          first.contributions[0]!,
          first.contributions[0]!
        ]
      },
      values.convergence.reunions[1]!
    ]
  } as KpQuadraticMethodConvergence;
  const codes = validateKpQuadraticMethodConvergence({
    ...values,
    convergence: broken
  }).map(({ code }) => code);
  assert.ok(codes.includes("duplicate-contribution"));
  assert.ok(codes.includes("root-conflict"));
});

test("validator rejects a canonical value that fails source substitution", () => {
  const values = canonical();
  const second = values.convergence.reunions[1]!;
  const broken = {
    ...values.convergence,
    reunions: [
      values.convergence.reunions[0]!,
      {
        ...second,
        value: { numerator: "4", denominator: "1" }
      }
    ]
  } as KpQuadraticMethodConvergence;
  const codes = validateKpQuadraticMethodConvergence({
    ...values,
    convergence: broken
  }).map(({ code }) => code);
  assert.ok(codes.includes("root-conflict"));
});

test("convergence is deeply immutable and JSON-stable", () => {
  const { convergence } = canonical();
  assert.equal(Object.isFrozen(convergence), true);
  assert.equal(Object.isFrozen(convergence.reunions), true);
  assert.equal(Object.isFrozen(convergence.reunions[0]?.contributions), true);
  assert.deepEqual(JSON.parse(JSON.stringify(convergence)), convergence);
});

function canonical() {
  const fixture = createCanonicalKpQuadraticSemanticFixture();
  const solutionSet = createKpQuadraticSolutionSetFromFixture(fixture);
  const graph = createCanonicalKpQuadraticSolutionMethodGraph({
    completingSquare: createCanonicalKpCompletingSquareAuthority(fixture),
    formula: createCanonicalKpQuadraticFormulaAuthority(fixture)
  });
  const branchSets = createCanonicalKpQuadraticPlusMinusBranches({
    graph,
    solutionSet
  });
  return {
    fixture,
    solutionSet,
    branchSets,
    convergence: compileKpQuadraticMethodConvergence({
      fixture,
      solutionSet,
      branchSets
    })
  };
}
