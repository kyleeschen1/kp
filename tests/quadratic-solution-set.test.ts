import assert from "node:assert/strict";
import test from "node:test";

import { createCanonicalKpQuadraticSemanticFixture } from "../src/semantic/quadratic-branching-fixture.ts";
import {
  classifyKpQuadraticDiscriminant,
  createKpQuadraticSolutionSet,
  createKpQuadraticSolutionSetFromFixture,
  sameKpQuadraticSolutionSet
} from "../src/semantic/quadratic-solution-set.ts";

test("canonical fixture produces an exact ordered solution set", () => {
  const solutionSet = createKpQuadraticSolutionSetFromFixture(
    createCanonicalKpQuadraticSemanticFixture()
  );

  assert.equal(
    solutionSet.discriminant.classification,
    "two-distinct-real-roots"
  );
  assert.deepEqual(solutionSet.members, [
    {
      id: "root:2/1",
      value: { numerator: "2", denominator: "1" },
      multiplicity: 1
    },
    {
      id: "root:3/1",
      value: { numerator: "3", denominator: "1" },
      multiplicity: 1
    }
  ]);
});

test("solution-set equality is independent of authored root order and scale", () => {
  const left = createKpQuadraticSolutionSet({
    id: "left",
    variable: "x",
    discriminant: { numerator: "1", denominator: "1" },
    roots: [
      { numerator: "3", denominator: "1" },
      { numerator: "4", denominator: "2" }
    ]
  });
  const right = createKpQuadraticSolutionSet({
    id: "right",
    variable: "x",
    discriminant: { numerator: "2", denominator: "2" },
    roots: [
      { numerator: "2", denominator: "1" },
      { numerator: "6", denominator: "2" }
    ]
  });

  assert.equal(sameKpQuadraticSolutionSet(left, right), true);
  assert.deepEqual(left.members.map((member) => member.id), [
    "root:2/1",
    "root:3/1"
  ]);
});

test("zero discriminant requires one root with multiplicity two", () => {
  const solutionSet = createKpQuadraticSolutionSet({
    id: "repeated",
    variable: "x",
    discriminant: { numerator: "0", denominator: "9" },
    roots: [
      { numerator: "-2", denominator: "-2" },
      { numerator: "1", denominator: "1" }
    ]
  });

  assert.deepEqual(solutionSet.members, [
    {
      id: "root:1/1",
      value: { numerator: "1", denominator: "1" },
      multiplicity: 2
    }
  ]);
});

test("negative discriminant has an empty real solution set", () => {
  const solutionSet = createKpQuadraticSolutionSet({
    id: "complex-roots",
    variable: "x",
    discriminant: { numerator: "-4", denominator: "2" },
    roots: []
  });

  assert.equal(solutionSet.discriminant.classification, "no-real-roots");
  assert.deepEqual(solutionSet.members, []);
});

test("discriminant classification uses normalized exact sign", () => {
  assert.equal(
    classifyKpQuadraticDiscriminant({ numerator: "-1", denominator: "-7" }),
    "two-distinct-real-roots"
  );
  assert.equal(
    classifyKpQuadraticDiscriminant({ numerator: "0", denominator: "-3" }),
    "one-repeated-real-root"
  );
  assert.equal(
    classifyKpQuadraticDiscriminant({ numerator: "-1", denominator: "7" }),
    "no-real-roots"
  );
});

test("discriminant and root multiplicity cannot disagree", () => {
  assert.throws(
    () =>
      createKpQuadraticSolutionSet({
        id: "invalid-distinct",
        variable: "x",
        discriminant: { numerator: "1", denominator: "1" },
        roots: [
          { numerator: "2", denominator: "1" },
          { numerator: "2", denominator: "1" }
        ]
      }),
    /does not match/
  );
  assert.throws(
    () =>
      createKpQuadraticSolutionSet({
        id: "invalid-negative",
        variable: "x",
        discriminant: { numerator: "-1", denominator: "1" },
        roots: [{ numerator: "2", denominator: "1" }]
      }),
    /does not match/
  );
});

test("solution set is deeply immutable and JSON-stable", () => {
  const solutionSet = createKpQuadraticSolutionSetFromFixture(
    createCanonicalKpQuadraticSemanticFixture()
  );
  assert.equal(Object.isFrozen(solutionSet), true);
  assert.equal(Object.isFrozen(solutionSet.discriminant), true);
  assert.equal(Object.isFrozen(solutionSet.members), true);
  assert.equal(Object.isFrozen(solutionSet.members[0]), true);
  assert.equal(Object.isFrozen(solutionSet.members[0]?.value), true);
  assert.deepEqual(JSON.parse(JSON.stringify(solutionSet)), solutionSet);
});
