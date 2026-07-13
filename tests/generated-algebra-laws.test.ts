import assert from "node:assert/strict";
import test from "node:test";

import {
  checkGeneratedAlgebraFlashcardConsistency,
  checkGeneratedAlgebraCancellationSimplificationConsistency,
  checkGeneratedAlgebraTransformDefinitionCoverage
} from "../src/semantic/generated-algebra-laws.ts";
import {
  createGeneratedAlgebraTutorialFixtures
} from "../src/semantic/generated-algebra-tutorial-fixture.ts";
import {
  listGeneratedAlgebraTransformDefinitions
} from "../src/semantic/generated-algebra-transform-definition-registry.ts";

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

test("generated algebra flashcards satisfy prompt and reference consistency law", () => {
  assert.deepEqual(
    checkGeneratedAlgebraFlashcardConsistency(
      createGeneratedAlgebraTutorialFixtures()
    ),
    {
      lawId: "generated-algebra.flashcard-consistency",
      passed: true,
      failures: []
    }
  );
});

test("generated algebra flashcard consistency law reports broken generated flashcards", () => {
  const fixture = createGeneratedAlgebraTutorialFixtures().find(
    (candidate) => candidate.id === "generated.radical.square-root-as-power"
  );

  assert.ok(fixture);

  const [card] = fixture.flashcards;

  assert.ok(card);

  const broken = {
    ...fixture,
    flashcards: [
      {
        ...card,
        id: "card.generated.radical.bad",
        assetId: "asset.generated.radical.missing",
        prompt: "",
        transformationIds: []
      }
    ]
  };

  assert.deepEqual(checkGeneratedAlgebraFlashcardConsistency([broken]), {
    lawId: "generated-algebra.flashcard-consistency",
    passed: false,
    failures: [
      {
        path: "fixtures[0].flashcards[0].id",
        message:
          "Generated algebra flashcard card.generated.radical.bad id must start with card.generated.radical.square-root-as-power."
      },
      {
        path: "fixtures[0].flashcards[0].assetId",
        message:
          "Generated algebra flashcard card.generated.radical.bad must reference asset asset.generated.radical.square-root-as-power."
      },
      {
        path: "fixtures[0].flashcards[0].prompt",
        message:
          "Generated algebra flashcard card.generated.radical.bad must have a non-empty prompt."
      },
      {
        path: "fixtures[0].flashcards[0].transformationIds",
        message:
          "Generated algebra explain-transform flashcard card.generated.radical.bad must reference at least one transformation."
      },
      {
        path: "fixtures[0].flashcards[0].assetId",
        message:
          "Flashcard card.generated.radical.bad references asset asset.generated.radical.missing but validation context is asset.generated.radical.square-root-as-power."
      }
    ]
  });
});

test("generated algebra transform definition coverage law accepts promoted linear-solve definitions", () => {
  assert.deepEqual(
    checkGeneratedAlgebraTransformDefinitionCoverage(
      createGeneratedAlgebraTutorialFixtures()
    ),
    {
      lawId: "generated-algebra.transform-definition-coverage",
      passed: true,
      failures: []
    }
  );
});

test("generated algebra transform definition coverage law reports missing definitions", () => {
  const definitions = listGeneratedAlgebraTransformDefinitions().filter(
    (definition) => definition.transformType !== "cancelAdditiveInverses"
  );

  assert.deepEqual(
    checkGeneratedAlgebraTransformDefinitionCoverage(
      createGeneratedAlgebraTutorialFixtures(),
      definitions
    ),
    {
      lawId: "generated-algebra.transform-definition-coverage",
      passed: false,
      failures: [
        {
          path: "fixtures[0].transformations[1].transformType",
          message:
            "Generated algebra transform transform.generated.linear-solve.x-plus-3.cancel-additive-inverse has no promoted definition for generated.linear-solve.cancelAdditiveInverses."
        },
        {
          path: "fixtures[1].transformations[1].transformType",
          message:
            "Generated algebra transform transform.generated.linear-solve.y-plus-5.cancel-additive-inverse has no promoted definition for generated.linear-solve.cancelAdditiveInverses."
        },
        {
          path: "fixtures[2].transformations[1].transformType",
          message:
            "Generated algebra transform transform.generated.linear-solve.z-minus-4.cancel-additive-inverse has no promoted definition for generated.linear-solve.cancelAdditiveInverses."
        },
        {
          path: "fixtures[4].transformations[1].transformType",
          message:
            "Generated algebra transform transform.generated.linear-solve.two-x-plus-3.cancel-additive-inverse has no promoted definition for generated.linear-solve.cancelAdditiveInverses."
        },
        {
          path: "fixtures[5].transformations[1].transformType",
          message:
            "Generated algebra transform transform.generated.linear-solve.x-plus-one-half.cancel-additive-inverse has no promoted definition for generated.linear-solve.cancelAdditiveInverses."
        }
      ]
    }
  );
});
