import assert from "node:assert/strict";
import test from "node:test";

import {
  validateKpAssetBundle
} from "../src/semantic/asset.ts";
import {
  checkKpDiagramRewindLaw,
  checkKpFlashcardReferenceClosure
} from "../src/semantic/asset-laws.ts";
import {
  kpSemanticDiagramForwardPhases
} from "../src/semantic/asset-diagram.ts";
import {
  validateKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  createGeneratedLinearSolveTutorialFixture
} from "../src/semantic/generated-algebra-tutorial-fixture.ts";

test("createGeneratedLinearSolveTutorialFixture builds a semantic tutorial asset", () => {
  const fixture = createGeneratedLinearSolveTutorialFixture({
    id: "generated.linear-solve.x-plus-3",
    title: "Generated solve x plus 3",
    variable: "x",
    addend: 3,
    solution: 4
  });

  assert.equal(fixture.id, "generated.linear-solve.x-plus-3");
  assert.equal(fixture.bundle.id, "asset.generated.linear-solve.x-plus-3");
  assert.deepEqual(
    fixture.bundle.objects.map((object) => ({
      id: object.id,
      value: object.value,
      selectorIds: object.selectors.map((selector) => selector.id)
    })),
    [
      {
        id: "equation.generated.linear-solve.x-plus-3.initial",
        value: { latex: "x + 3 = 7" },
        selectorIds: [
          "equation.generated.linear-solve.x-plus-3.initial.lhs.variable",
          "equation.generated.linear-solve.x-plus-3.initial.lhs.addend",
          "equation.generated.linear-solve.x-plus-3.initial.equals",
          "equation.generated.linear-solve.x-plus-3.initial.rhs.value"
        ]
      },
      {
        id: "equation.generated.linear-solve.x-plus-3.after-subtract",
        value: { latex: "x + 3 - 3 = 7 - 3" },
        selectorIds: [
          "equation.generated.linear-solve.x-plus-3.after-subtract.lhs.variable",
          "equation.generated.linear-solve.x-plus-3.after-subtract.lhs.addend",
          "equation.generated.linear-solve.x-plus-3.after-subtract.lhs.subtract",
          "equation.generated.linear-solve.x-plus-3.after-subtract.equals",
          "equation.generated.linear-solve.x-plus-3.after-subtract.rhs.value",
          "equation.generated.linear-solve.x-plus-3.after-subtract.rhs.subtract"
        ]
      },
      {
        id: "equation.generated.linear-solve.x-plus-3.left-simplified",
        value: { latex: "x = 7 - 3" },
        selectorIds: [
          "equation.generated.linear-solve.x-plus-3.left-simplified.lhs.variable",
          "equation.generated.linear-solve.x-plus-3.left-simplified.equals",
          "equation.generated.linear-solve.x-plus-3.left-simplified.rhs.value",
          "equation.generated.linear-solve.x-plus-3.left-simplified.rhs.subtract"
        ]
      },
      {
        id: "equation.generated.linear-solve.x-plus-3.solved",
        value: { latex: "x = 4" },
        selectorIds: [
          "equation.generated.linear-solve.x-plus-3.solved.lhs.variable",
          "equation.generated.linear-solve.x-plus-3.solved.equals",
          "equation.generated.linear-solve.x-plus-3.solved.rhs.solution"
        ]
      }
    ]
  );
  assert.deepEqual(
    fixture.transformations.map((transformation) => [
      transformation.id,
      transformation.transformType,
      transformation.sourceObjectIds,
      transformation.targetObjectIds
    ]),
    [
      [
        "transform.generated.linear-solve.x-plus-3.subtract-addend",
        "subtractBothSides",
        ["equation.generated.linear-solve.x-plus-3.initial"],
        ["equation.generated.linear-solve.x-plus-3.after-subtract"]
      ],
      [
        "transform.generated.linear-solve.x-plus-3.cancel-additive-inverse",
        "cancelAdditiveInverses",
        ["equation.generated.linear-solve.x-plus-3.after-subtract"],
        ["equation.generated.linear-solve.x-plus-3.left-simplified"]
      ],
      [
        "transform.generated.linear-solve.x-plus-3.simplify-difference",
        "simplifyConstantDifference",
        ["equation.generated.linear-solve.x-plus-3.left-simplified"],
        ["equation.generated.linear-solve.x-plus-3.solved"]
      ]
    ]
  );
  assert.deepEqual(kpSemanticDiagramForwardPhases(fixture.diagram), [
    ["transform.generated.linear-solve.x-plus-3.subtract-addend"],
    ["transform.generated.linear-solve.x-plus-3.cancel-additive-inverse"],
    ["transform.generated.linear-solve.x-plus-3.simplify-difference"]
  ]);
  assert.deepEqual(
    fixture.trace.steps.map((step) => [step.id, step.latex, step.rule]),
    [
      ["trace.generated.linear-solve.x-plus-3.initial", "x + 3 = 7", undefined],
      [
        "trace.generated.linear-solve.x-plus-3.after-subtract",
        "x + 3 - 3 = 7 - 3",
        "subtractBothSides"
      ],
      [
        "trace.generated.linear-solve.x-plus-3.left-simplified",
        "x = 7 - 3",
        "cancelAdditiveInverses"
      ],
      [
        "trace.generated.linear-solve.x-plus-3.solved",
        "x = 4",
        "simplifyConstantDifference"
      ]
    ]
  );
});

test("generated linear solve tutorial fixture satisfies asset laws", () => {
  const fixture = createGeneratedLinearSolveTutorialFixture({
    id: "generated.linear-solve.x-plus-3",
    title: "Generated solve x plus 3",
    variable: "x",
    addend: 3,
    solution: 4
  });

  assert.deepEqual(validateKpAssetBundle(fixture.bundle), []);
  assert.deepEqual(
    fixture.transformations.flatMap((transformation) =>
      validateKpSemanticTransformation(transformation, fixture.bundle)
    ),
    []
  );
  assert.deepEqual(checkKpDiagramRewindLaw(fixture.diagram), {
    lawId: "diagram.rewind",
    passed: true,
    failures: []
  });
  assert.deepEqual(
    fixture.flashcards.flatMap((card) =>
      checkKpFlashcardReferenceClosure(card, {
        bundle: fixture.bundle,
        transformations: fixture.transformations
      }).failures
    ),
    []
  );
});
