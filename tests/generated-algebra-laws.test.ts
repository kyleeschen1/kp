import assert from "node:assert/strict";
import test from "node:test";

import {
  checkGeneratedAlgebraCancellationSimplificationConsistency
} from "../src/semantic/generated-algebra-laws.ts";
import {
  createGeneratedAlgebraTutorialFixtures
} from "../src/semantic/generated-algebra-tutorial-fixture.ts";

test("generated algebra cancellation and simplification transforms satisfy consistency law", () => {
  assert.deepEqual(
    checkGeneratedAlgebraCancellationSimplificationConsistency(
      createGeneratedAlgebraTutorialFixtures()
    ),
    {
      lawId: "generated-algebra.cancellation-simplification-consistency",
      passed: true,
      failures: []
    }
  );
});

test("generated algebra cancellation and simplification law reports missing value preservation and laws", () => {
  const [fixture] = createGeneratedAlgebraTutorialFixtures();

  assert.ok(fixture);

  const broken = {
    ...fixture,
    transformations: fixture.transformations.map((transformation) =>
      transformation.transformType === "simplifyConstantDifference"
        ? {
            ...transformation,
            preserves: [],
            lawRefs: []
          }
        : transformation
    )
  };

  assert.deepEqual(
    checkGeneratedAlgebraCancellationSimplificationConsistency([broken]),
    {
      lawId: "generated-algebra.cancellation-simplification-consistency",
      passed: false,
      failures: [
        {
          path: "fixtures[0].transformations[2].preserves",
          message:
            "Generated algebra simplification transform transform.generated.linear-solve.x-plus-3.simplify-difference must preserve value."
        },
        {
          path: "fixtures[0].transformations[2].lawRefs",
          message:
            "Generated algebra simplification transform transform.generated.linear-solve.x-plus-3.simplify-difference must cite at least one law."
        }
      ]
    }
  );
});
