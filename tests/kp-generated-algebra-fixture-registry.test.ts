import assert from "node:assert/strict";
import test from "node:test";

import {
  getGeneratedLinearSolveTutorialFixtureSpec,
  listGeneratedLinearSolveTutorialFixtureSpecs
} from "../src/semantic/generated-algebra-fixture-registry.ts";

test("generated algebra fixture registry lists linear-solve specs without building fixtures", () => {
  const specs = listGeneratedLinearSolveTutorialFixtureSpecs();

  assert.deepEqual(specs.map((spec) => spec.id), [
    "generated.linear-solve.x-plus-3",
    "generated.linear-solve.y-plus-5",
    "generated.linear-solve.z-minus-4",
    "generated.linear-solve.three-x"
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
  assert.equal(
    getGeneratedLinearSolveTutorialFixtureSpec("generated.linear-solve.missing"),
    undefined
  );
});
