import assert from "node:assert/strict";
import test from "node:test";

import {
  getGeneratedAlgebraTutorialFixtureSpec,
  getGeneratedExponentTutorialFixtureSpec,
  getGeneratedFractionExpressionTutorialFixtureSpec,
  getGeneratedLinearSolveTutorialFixtureSpec,
  listGeneratedAlgebraTutorialFixtureSpecs,
  listGeneratedExponentTutorialFixtureSpecs,
  listGeneratedFractionExpressionTutorialFixtureSpecs,
  listGeneratedLinearSolveTutorialFixtureSpecs
} from "../src/semantic/generated-algebra-fixture-registry.ts";

test("generated algebra fixture registry lists linear-solve specs without building fixtures", () => {
  const specs = listGeneratedLinearSolveTutorialFixtureSpecs();

  assert.deepEqual(specs.map((spec) => spec.id), [
    "generated.linear-solve.x-plus-3",
    "generated.linear-solve.y-plus-5",
    "generated.linear-solve.z-minus-4",
    "generated.linear-solve.three-x",
    "generated.linear-solve.two-x-plus-3",
    "generated.linear-solve.x-plus-one-half"
  ]);
  assert.deepEqual(specs[0], {
    id: "generated.linear-solve.x-plus-3",
    title: "Generated solve x plus 3",
    variable: "x",
    addend: 3,
    solution: 4
  });
});

test("generated algebra fixture registry resolves specs by id", () => {
  assert.equal(
    getGeneratedLinearSolveTutorialFixtureSpec("generated.linear-solve.y-plus-5")?.solution,
    7
  );
  assert.deepEqual(
    getGeneratedLinearSolveTutorialFixtureSpec("generated.linear-solve.z-minus-4"),
    {
      id: "generated.linear-solve.z-minus-4",
      title: "Generated solve z minus 4",
      variable: "z",
      addend: -4,
      solution: 10
    }
  );
  assert.deepEqual(
    getGeneratedLinearSolveTutorialFixtureSpec("generated.linear-solve.three-x"),
    {
      id: "generated.linear-solve.three-x",
      title: "Generated solve 3x equals 12",
      variable: "x",
      coefficient: 3,
      solution: 4
    }
  );
  assert.deepEqual(
    getGeneratedLinearSolveTutorialFixtureSpec("generated.linear-solve.two-x-plus-3"),
    {
      id: "generated.linear-solve.two-x-plus-3",
      title: "Generated solve 2x plus 3",
      variable: "x",
      coefficient: 2,
      addend: 3,
      solution: 4
    }
  );
  assert.deepEqual(
    getGeneratedLinearSolveTutorialFixtureSpec("generated.linear-solve.x-plus-one-half"),
    {
      id: "generated.linear-solve.x-plus-one-half",
      title: "Generated solve x plus one half",
      variable: "x",
      addend: 1 / 2,
      solution: 2
    }
  );
  assert.equal(
    getGeneratedLinearSolveTutorialFixtureSpec("generated.linear-solve.missing"),
    undefined
  );
});

test("generated algebra fixture registry exposes family-aware specs", () => {
  const specs = listGeneratedAlgebraTutorialFixtureSpecs();

  assert.deepEqual(
    specs.map((spec) => [spec.id, spec.familyId]),
    [
      ["generated.linear-solve.x-plus-3", "generated.linear-solve"],
      ["generated.linear-solve.y-plus-5", "generated.linear-solve"],
      ["generated.linear-solve.z-minus-4", "generated.linear-solve"],
      ["generated.linear-solve.three-x", "generated.linear-solve"],
      ["generated.linear-solve.two-x-plus-3", "generated.linear-solve"],
      ["generated.linear-solve.x-plus-one-half", "generated.linear-solve"],
      [
        "generated.fraction-expression.two-fourths",
        "generated.fraction-expression"
      ],
      [
        "generated.exponent.square-as-product",
        "generated.exponent"
      ]
    ]
  );
  assert.deepEqual(
    getGeneratedAlgebraTutorialFixtureSpec(
      "generated.fraction-expression.two-fourths"
    ),
    {
      familyId: "generated.fraction-expression",
      id: "generated.fraction-expression.two-fourths",
      title: "Generated simplify two fourths",
      numerator: 2,
      denominator: 4,
      simplifiedNumerator: 1,
      simplifiedDenominator: 2
    }
  );
});

test("generated algebra fixture registry resolves exponent specs", () => {
  assert.deepEqual(listGeneratedExponentTutorialFixtureSpecs(), [
    {
      familyId: "generated.exponent",
      id: "generated.exponent.square-as-product",
      title: "Generated expand square as product",
      base: "x",
      exponent: 2
    }
  ]);
  assert.deepEqual(
    getGeneratedAlgebraTutorialFixtureSpec(
      "generated.exponent.square-as-product"
    ),
    {
      familyId: "generated.exponent",
      id: "generated.exponent.square-as-product",
      title: "Generated expand square as product",
      base: "x",
      exponent: 2
    }
  );
  assert.equal(
    getGeneratedExponentTutorialFixtureSpec("generated.exponent.missing"),
    undefined
  );
});

test("generated algebra fixture registry resolves fraction-expression specs", () => {
  assert.deepEqual(listGeneratedFractionExpressionTutorialFixtureSpecs(), [
    {
      familyId: "generated.fraction-expression",
      id: "generated.fraction-expression.two-fourths",
      title: "Generated simplify two fourths",
      numerator: 2,
      denominator: 4,
      simplifiedNumerator: 1,
      simplifiedDenominator: 2
    }
  ]);
  assert.equal(
    getGeneratedFractionExpressionTutorialFixtureSpec(
      "generated.fraction-expression.missing"
    ),
    undefined
  );
});
