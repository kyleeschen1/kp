import assert from "node:assert/strict";
import test from "node:test";

import { createCanonicalKpQuadraticSemanticFixture } from "../src/semantic/quadratic-branching-fixture.ts";
import { createCanonicalKpCompletingSquareAuthority } from "../src/semantic/quadratic-completing-square-authority.ts";
import { createCanonicalKpQuadraticFormulaAuthority } from "../src/semantic/quadratic-formula-authority.ts";
import {
  createCanonicalKpQuadraticPlusMinusBranches,
  validateKpQuadraticPlusMinusBranchSet,
  type KpQuadraticPlusMinusBranchSet
} from "../src/semantic/quadratic-plus-minus-branches.ts";
import { createCanonicalKpQuadraticSolutionMethodGraph } from "../src/semantic/quadratic-solution-method-graph.ts";
import { createKpQuadraticSolutionSetFromFixture } from "../src/semantic/quadratic-solution-set.ts";

test("both methods create stable plus and minus branch identities", () => {
  const { branchSets } = canonical();
  assert.equal(branchSets.length, 2);
  for (const branchSet of branchSets) {
    assert.deepEqual(branchSet.branches.map(({ sign }) => sign), ["minus", "plus"]);
    assert.deepEqual(branchSet.branches.map(({ rootMemberId }) => rootMemberId), [
      "root:2/1",
      "root:3/1"
    ]);
    assert.deepEqual(branchSet.branches.map(({ id, sign }) => id.endsWith(sign)), [
      true,
      true
    ]);
  }
});

test("branch-local evidence derives roots from symmetric exact offsets", () => {
  const { branchSets } = canonical();
  for (const branchSet of branchSets) {
    assert.deepEqual(branchSet.branches.map(({ evidence }) => evidence), [
      {
        center: { numerator: "5", denominator: "2" },
        signedOffset: { numerator: "-1", denominator: "2" },
        result: { numerator: "2", denominator: "1" },
        lawId: "law.arithmetic.signed-offset"
      },
      {
        center: { numerator: "5", denominator: "2" },
        signedOffset: { numerator: "1", denominator: "2" },
        result: { numerator: "3", denominator: "1" },
        lawId: "law.arithmetic.signed-offset"
      }
    ]);
  }
});

test("completing-square candidates retain the exact post-factor operation chain", () => {
  const completing = canonical().branchSets.find(
    ({ methodId }) => methodId === "method.quadratic.completing-square"
  )!;
  assert.deepEqual(
    completing.derivation.map(
      ({ id, lawId, sourceExpression, targetExpression, dependsOn }) => ({
        id,
        lawId,
        sourceExpression,
        targetExpression,
        dependsOn
      })
    ),
    [
      {
        id: "operation.quadratic.take-square-roots-and-branch-sign",
        lawId: "law.equation.square-root-both-sides",
        sourceExpression: "(x-5/2)^2=1/4",
        targetExpression: "x-5/2=±sqrt(1/4)",
        dependsOn: [
          "authority.quadratic.canonical.completing-square.verify-solution-set"
        ]
      },
      {
        id: "operation.quadratic.evaluate-principal-square-root",
        lawId: "law.arithmetic.principal-square-root",
        sourceExpression: "x-5/2=±sqrt(1/4)",
        targetExpression: "x-5/2=±1/2",
        dependsOn: [
          "operation.quadratic.take-square-roots-and-branch-sign"
        ]
      },
      {
        id: "operation.quadratic.isolate-signed-candidates",
        lawId: "law.equation.add-both-sides",
        sourceExpression: "x-5/2=±1/2",
        targetExpression: "x=5/2±1/2",
        dependsOn: [
          "operation.quadratic.evaluate-principal-square-root"
        ]
      },
      {
        id: "operation.quadratic.normalize-signed-candidates",
        lawId: "law.arithmetic.equivalent-fractions",
        sourceExpression: "x=5/2±1/2",
        targetExpression: "x=(5±1)/2",
        dependsOn: [
          "operation.quadratic.isolate-signed-candidates"
        ]
      }
    ]
  );
  assert.ok(completing.branches.every(
    ({ dependsOn }) =>
      dependsOn[0] === "operation.quadratic.normalize-signed-candidates"
  ));
});

test("branch validity is independent of authored or screen order", () => {
  const { branchSets, graph, solutionSet } = canonical();
  const original = branchSets[0]!;
  const reordered = {
    ...original,
    branches: [...original.branches].reverse()
  } as KpQuadraticPlusMinusBranchSet;
  assert.deepEqual(
    validateKpQuadraticPlusMinusBranchSet(reordered, graph, solutionSet),
    []
  );
});

test("split and reunion prerequisites name the complete branch set", () => {
  const { branchSets } = canonical();
  for (const branchSet of branchSets) {
    const ids = branchSet.branches.map(({ id }) => id);
    assert.equal(branchSet.split.relation, "one-to-many");
    assert.deepEqual(branchSet.split.targetBranchIds, ids);
    assert.deepEqual(branchSet.reunionPrerequisite.requiredBranchIds, ids);
    assert.equal(branchSet.reunionPrerequisite.relation, "complete-exact-set");
  }
});

test("validator rejects duplicate root ownership and missing reunion evidence", () => {
  const { branchSets, graph, solutionSet } = canonical();
  const original = branchSets[0]!;
  const broken = {
    ...original,
    branches: [
      original.branches[0]!,
      {
        ...original.branches[1]!,
        rootMemberId: original.branches[0]!.rootMemberId,
        evidence: original.branches[0]!.evidence
      }
    ],
    reunionPrerequisite: {
      ...original.reunionPrerequisite,
      requiredBranchIds: [original.branches[0]!.id]
    }
  } as KpQuadraticPlusMinusBranchSet;
  const codes = validateKpQuadraticPlusMinusBranchSet(
    broken,
    graph,
    solutionSet
  ).map(({ code }) => code);
  assert.ok(codes.includes("asymmetry"));
  assert.ok(codes.includes("reunion-prerequisite"));
});

test("branch contracts are deeply immutable and JSON-stable", () => {
  const { branchSets } = canonical();
  assert.equal(Object.isFrozen(branchSets), true);
  assert.equal(Object.isFrozen(branchSets[0]), true);
  assert.equal(Object.isFrozen(branchSets[0]?.branches), true);
  assert.equal(Object.isFrozen(branchSets[0]?.branches[0]?.evidence), true);
  assert.deepEqual(JSON.parse(JSON.stringify(branchSets)), branchSets);
});

function canonical() {
  const fixture = createCanonicalKpQuadraticSemanticFixture();
  const solutionSet = createKpQuadraticSolutionSetFromFixture(fixture);
  const graph = createCanonicalKpQuadraticSolutionMethodGraph({
    completingSquare: createCanonicalKpCompletingSquareAuthority(fixture),
    formula: createCanonicalKpQuadraticFormulaAuthority(fixture)
  });
  return {
    graph,
    solutionSet,
    branchSets: createCanonicalKpQuadraticPlusMinusBranches({
      graph,
      solutionSet
    })
  };
}
