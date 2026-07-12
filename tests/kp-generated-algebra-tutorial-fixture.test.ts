import assert from "node:assert/strict";
import test from "node:test";

import {
  validateKpAssetBundle
} from "../src/semantic/asset.ts";
import {
  validateKpTransformationDrillDownHooks
} from "../src/semantic/asset-decomposition.ts";
import {
  checkKpAssetFixtureReferenceClosure,
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
  createGeneratedAlgebraTutorialFixture,
  createGeneratedAlgebraTutorialFixtures,
  createGeneratedExponentTutorialFixture,
  createGeneratedFractionExpressionTutorialFixture,
  createGeneratedLinearSolveTutorialFixture,
  createGeneratedLinearSolveTutorialFixtures
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

test("createGeneratedLinearSolveTutorialFixtures exposes multiple generated examples", () => {
  const fixtures = createGeneratedLinearSolveTutorialFixtures();

  assert.deepEqual(fixtures.map((fixture) => fixture.id), [
    "generated.linear-solve.x-plus-3",
    "generated.linear-solve.y-plus-5",
    "generated.linear-solve.z-minus-4",
    "generated.linear-solve.three-x",
    "generated.linear-solve.two-x-plus-3",
    "generated.linear-solve.x-plus-one-half"
  ]);
  assert.deepEqual(
    fixtures[1]?.bundle.objects.map((object) => object.value),
    [
      { latex: "y + 5 = 12" },
      { latex: "y + 5 - 5 = 12 - 5" },
      { latex: "y = 12 - 5" },
      { latex: "y = 7" }
    ]
  );
  assert.deepEqual(
    fixtures[2]?.bundle.objects.map((object) => object.value),
    [
      { latex: "z - 4 = 6" },
      { latex: "z - 4 + 4 = 6 + 4" },
      { latex: "z = 6 + 4" },
      { latex: "z = 10" }
    ]
  );
  assert.deepEqual(
    fixtures[2]?.transformations.map((transformation) => [
      transformation.id,
      transformation.transformType,
      transformation.lawRefs
    ]),
    [
      [
        "transform.generated.linear-solve.z-minus-4.add-inverse",
        "addBothSides",
        [{ id: "law.equation.add-both-sides", level: "strict" }]
      ],
      [
        "transform.generated.linear-solve.z-minus-4.cancel-additive-inverse",
        "cancelAdditiveInverses",
        [{ id: "law.algebra.additive-inverse", level: "strict" }]
      ],
      [
        "transform.generated.linear-solve.z-minus-4.simplify-sum",
        "simplifyConstantSum",
        [{ id: "law.arithmetic.constant-sum", level: "strict" }]
      ]
    ]
  );
  assert.deepEqual(
    fixtures[3]?.bundle.objects.map((object) => object.value),
    [
      { latex: "3x = 12" },
      { latex: "3x / 3 = 12 / 3" },
      { latex: "x = 12 / 3" },
      { latex: "x = 4" }
    ]
  );
  assert.deepEqual(
    fixtures[3]?.transformations.map((transformation) => [
      transformation.id,
      transformation.transformType,
      transformation.lawRefs
    ]),
    [
      [
        "transform.generated.linear-solve.three-x.divide-coefficient",
        "divideBothSides",
        [{ id: "law.equation.divide-both-sides", level: "strict" }]
      ],
      [
        "transform.generated.linear-solve.three-x.cancel-multiplicative-inverse",
        "cancelMultiplicativeInverses",
        [{ id: "law.algebra.multiplicative-inverse", level: "strict" }]
      ],
      [
        "transform.generated.linear-solve.three-x.simplify-quotient",
        "simplifyConstantQuotient",
        [{ id: "law.arithmetic.constant-quotient", level: "strict" }]
      ]
    ]
  );
  assert.deepEqual(
    fixtures[4]?.bundle.objects.map((object) => object.value),
    [
      { latex: "2x + 3 = 11" },
      { latex: "2x + 3 - 3 = 11 - 3" },
      { latex: "2x = 11 - 3" },
      { latex: "2x = 8" },
      { latex: "2x / 2 = 8 / 2" },
      { latex: "x = 8 / 2" },
      { latex: "x = 4" }
    ]
  );
  assert.deepEqual(
    fixtures[4]?.transformations.map((transformation) => [
      transformation.id,
      transformation.transformType
    ]),
    [
      [
        "transform.generated.linear-solve.two-x-plus-3.subtract-addend",
        "subtractBothSides"
      ],
      [
        "transform.generated.linear-solve.two-x-plus-3.cancel-additive-inverse",
        "cancelAdditiveInverses"
      ],
      [
        "transform.generated.linear-solve.two-x-plus-3.simplify-difference",
        "simplifyConstantDifference"
      ],
      [
        "transform.generated.linear-solve.two-x-plus-3.divide-coefficient",
        "divideBothSides"
      ],
      [
        "transform.generated.linear-solve.two-x-plus-3.cancel-multiplicative-inverse",
        "cancelMultiplicativeInverses"
      ],
      [
        "transform.generated.linear-solve.two-x-plus-3.simplify-quotient",
        "simplifyConstantQuotient"
      ]
    ]
  );
  assert.deepEqual(
    fixtures[5]?.bundle.objects.map((object) => object.value),
    [
      { latex: "x + \\frac{1}{2} = \\frac{5}{2}" },
      {
        latex:
          "x + \\frac{1}{2} - \\frac{1}{2} = \\frac{5}{2} - \\frac{1}{2}"
      },
      { latex: "x = \\frac{5}{2} - \\frac{1}{2}" },
      { latex: "x = 2" }
    ]
  );
  assert.deepEqual(
    fixtures.flatMap((fixture) =>
      fixture.transformations.flatMap((transformation) =>
        validateKpSemanticTransformation(transformation, fixture.bundle)
      )
    ),
    []
  );
});

test("generated linear solve fixtures expose a standard flashcard family", () => {
  const fixtures = createGeneratedLinearSolveTutorialFixtures();

  for (const fixture of fixtures) {
    assert.deepEqual(
      [...new Set(fixture.flashcards.map((card) => card.kind))].sort(),
      ["cloze", "explain-transform", "focus-relationship", "predict-next"]
    );
    assert.deepEqual(
      fixture.flashcards.flatMap((card) =>
        checkKpFlashcardReferenceClosure(card, {
          bundle: fixture.bundle,
          transformations: fixture.transformations
        }).failures
      ),
      []
    );
  }
});

test("generated linear solve fixtures expose cancellation drill-down hooks", () => {
  const fixtures = createGeneratedLinearSolveTutorialFixtures();

  for (const fixture of fixtures) {
    assert.ok(Array.isArray(fixture.drillDownHooks));
    assert.deepEqual(
      validateKpTransformationDrillDownHooks(fixture.drillDownHooks, {
        transformations: fixture.transformations
      }),
      []
    );
  }

  assert.deepEqual(
    fixtures[0]?.drillDownHooks.map((hook) => [
      hook.id,
      hook.transformationId,
      hook.asset.id
    ]),
    [
      [
        "drilldown.generated.linear-solve.x-plus-3.cancel-additive-inverse",
        "transform.generated.linear-solve.x-plus-3.cancel-additive-inverse",
        "asset.generated.linear-solve.x-plus-3.cancel-additive-inverse-explainer"
      ]
    ]
  );
  assert.deepEqual(
    fixtures[3]?.drillDownHooks.map((hook) => [
      hook.id,
      hook.transformationId,
      hook.asset.id
    ]),
    [
      [
        "drilldown.generated.linear-solve.three-x.cancel-multiplicative-inverse",
        "transform.generated.linear-solve.three-x.cancel-multiplicative-inverse",
        "asset.generated.linear-solve.three-x.cancel-multiplicative-inverse-explainer"
      ]
    ]
  );
  assert.deepEqual(
    fixtures[4]?.drillDownHooks.map((hook) => [
      hook.id,
      hook.transformationId,
      hook.asset.id
    ]),
    [
      [
        "drilldown.generated.linear-solve.two-x-plus-3.cancel-additive-inverse",
        "transform.generated.linear-solve.two-x-plus-3.cancel-additive-inverse",
        "asset.generated.linear-solve.two-x-plus-3.cancel-additive-inverse-explainer"
      ],
      [
        "drilldown.generated.linear-solve.two-x-plus-3.cancel-multiplicative-inverse",
        "transform.generated.linear-solve.two-x-plus-3.cancel-multiplicative-inverse",
        "asset.generated.linear-solve.two-x-plus-3.cancel-multiplicative-inverse-explainer"
      ]
    ]
  );
});

test("generated linear solve fixtures satisfy bundled reference closure", () => {
  const fixtures = createGeneratedLinearSolveTutorialFixtures();

  for (const fixture of fixtures) {
    assert.deepEqual(
      checkKpAssetFixtureReferenceClosure({
        bundle: fixture.bundle,
        transformations: fixture.transformations,
        diagram: fixture.diagram,
        drillDownHooks: fixture.drillDownHooks,
        flashcards: fixture.flashcards,
        trace: fixture.trace
      }),
      {
        lawId: "asset-fixture.reference-closure",
        passed: true,
        failures: []
      }
    );
  }
});

test("createGeneratedFractionExpressionTutorialFixture builds a semantic fraction asset", () => {
  const fixture = createGeneratedFractionExpressionTutorialFixture({
    familyId: "generated.fraction-expression",
    id: "generated.fraction-expression.two-fourths",
    title: "Generated simplify two fourths",
    numerator: 2,
    denominator: 4,
    simplifiedNumerator: 1,
    simplifiedDenominator: 2
  });

  assert.equal(fixture.familyId, "generated.fraction-expression");
  assert.equal(fixture.bundle.id, "asset.generated.fraction-expression.two-fourths");
  assert.deepEqual(
    fixture.bundle.objects.map((object) => ({
      id: object.id,
      objectType: object.objectType,
      value: object.value,
      selectorIds: object.selectors.map((selector) => selector.id)
    })),
    [
      {
        id: "expression.generated.fraction-expression.two-fourths.initial",
        objectType: "expression",
        value: { latex: "\\frac{2}{4}" },
        selectorIds: [
          "expression.generated.fraction-expression.two-fourths.initial.numerator",
          "expression.generated.fraction-expression.two-fourths.initial.fraction-line",
          "expression.generated.fraction-expression.two-fourths.initial.denominator"
        ]
      },
      {
        id: "expression.generated.fraction-expression.two-fourths.factored",
        objectType: "expression",
        value: { latex: "\\frac{1 \\cdot 2}{2 \\cdot 2}" },
        selectorIds: [
          "expression.generated.fraction-expression.two-fourths.factored.base-numerator",
          "expression.generated.fraction-expression.two-fourths.factored.numerator-times",
          "expression.generated.fraction-expression.two-fourths.factored.common-numerator-factor",
          "expression.generated.fraction-expression.two-fourths.factored.fraction-line",
          "expression.generated.fraction-expression.two-fourths.factored.base-denominator",
          "expression.generated.fraction-expression.two-fourths.factored.denominator-times",
          "expression.generated.fraction-expression.two-fourths.factored.common-denominator-factor"
        ]
      },
      {
        id: "expression.generated.fraction-expression.two-fourths.common-factor",
        objectType: "expression",
        value: { latex: "\\frac{1}{2} \\cdot \\frac{2}{2}" },
        selectorIds: [
          "expression.generated.fraction-expression.two-fourths.common-factor.base-numerator",
          "expression.generated.fraction-expression.two-fourths.common-factor.base-fraction-line",
          "expression.generated.fraction-expression.two-fourths.common-factor.base-denominator",
          "expression.generated.fraction-expression.two-fourths.common-factor.times",
          "expression.generated.fraction-expression.two-fourths.common-factor.unit-numerator",
          "expression.generated.fraction-expression.two-fourths.common-factor.unit-fraction-line",
          "expression.generated.fraction-expression.two-fourths.common-factor.unit-denominator"
        ]
      },
      {
        id: "expression.generated.fraction-expression.two-fourths.simplified",
        objectType: "expression",
        value: { latex: "\\frac{1}{2}" },
        selectorIds: [
          "expression.generated.fraction-expression.two-fourths.simplified.numerator",
          "expression.generated.fraction-expression.two-fourths.simplified.fraction-line",
          "expression.generated.fraction-expression.two-fourths.simplified.denominator"
        ]
      }
    ]
  );
  assert.deepEqual(
    fixture.transformations.map((transformation) => [
      transformation.id,
      transformation.transformType,
      transformation.sourceObjectIds,
      transformation.targetObjectIds,
      transformation.lawRefs
    ]),
    [
      [
        "transform.generated.fraction-expression.two-fourths.split-factors",
        "splitFractionFactors",
        ["expression.generated.fraction-expression.two-fourths.initial"],
        ["expression.generated.fraction-expression.two-fourths.factored"],
        [{ id: "law.arithmetic.factor-fraction", level: "strict" }]
      ],
      [
        "transform.generated.fraction-expression.two-fourths.merge-common-factor",
        "mergeFractionCommonFactor",
        ["expression.generated.fraction-expression.two-fourths.factored"],
        ["expression.generated.fraction-expression.two-fourths.common-factor"],
        [{ id: "law.arithmetic.fraction-factorization", level: "strict" }]
      ],
      [
        "transform.generated.fraction-expression.two-fourths.simplify-unit-factor",
        "simplifyUnitFractionFactor",
        ["expression.generated.fraction-expression.two-fourths.common-factor"],
        ["expression.generated.fraction-expression.two-fourths.simplified"],
        [{ id: "law.arithmetic.unit-fraction-factor", level: "strict" }]
      ]
    ]
  );
  assert.deepEqual(kpSemanticDiagramForwardPhases(fixture.diagram), [
    ["transform.generated.fraction-expression.two-fourths.split-factors"],
    ["transform.generated.fraction-expression.two-fourths.merge-common-factor"],
    ["transform.generated.fraction-expression.two-fourths.simplify-unit-factor"]
  ]);
  const correspondenceMatrix = fixture.transformations.map((transformation) =>
    transformation.correspondence.map((entry) => [
      entry.sourceSelectorId,
      entry.targetSelectorId,
      entry.preserves
    ])
  );

  assert.deepEqual(
    correspondenceMatrix,
    [
      [
        [
          "expression.generated.fraction-expression.two-fourths.initial.fraction-line",
          "expression.generated.fraction-expression.two-fourths.factored.fraction-line",
          ["structure"]
        ]
      ],
      [
        [
          "expression.generated.fraction-expression.two-fourths.factored.base-numerator",
          "expression.generated.fraction-expression.two-fourths.common-factor.base-numerator",
          ["identity"]
        ],
        [
          "expression.generated.fraction-expression.two-fourths.factored.base-denominator",
          "expression.generated.fraction-expression.two-fourths.common-factor.base-denominator",
          ["identity"]
        ]
      ],
      [
        [
          "expression.generated.fraction-expression.two-fourths.common-factor.base-numerator",
          "expression.generated.fraction-expression.two-fourths.simplified.numerator",
          ["identity"]
        ],
        [
          "expression.generated.fraction-expression.two-fourths.common-factor.base-denominator",
          "expression.generated.fraction-expression.two-fourths.simplified.denominator",
          ["identity"]
        ]
      ]
    ]
  );
  assert.deepEqual(
    fixture.trace.steps.map((step) => [step.id, step.latex, step.rule]),
    [
      [
        "trace.generated.fraction-expression.two-fourths.initial",
        "\\frac{2}{4}",
        undefined
      ],
      [
        "trace.generated.fraction-expression.two-fourths.factored",
        "\\frac{1 \\cdot 2}{2 \\cdot 2}",
        "splitFractionFactors"
      ],
      [
        "trace.generated.fraction-expression.two-fourths.common-factor",
        "\\frac{1}{2} \\cdot \\frac{2}{2}",
        "mergeFractionCommonFactor"
      ],
      [
        "trace.generated.fraction-expression.two-fourths.simplified",
        "\\frac{1}{2}",
        "simplifyUnitFractionFactor"
      ]
    ]
  );
  assert.deepEqual(
    checkKpAssetFixtureReferenceClosure({
      bundle: fixture.bundle,
      transformations: fixture.transformations,
      diagram: fixture.diagram,
      drillDownHooks: fixture.drillDownHooks,
      flashcards: fixture.flashcards,
      trace: fixture.trace
    }),
    {
      lawId: "asset-fixture.reference-closure",
      passed: true,
      failures: []
    }
  );
});

test("generated algebra fixture helpers include linear-solve and fraction families", () => {
  const fixtures = createGeneratedAlgebraTutorialFixtures();

  assert.deepEqual(
    fixtures.map((fixture) => [fixture.id, fixture.familyId]),
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
    createGeneratedAlgebraTutorialFixture(
      "generated.fraction-expression.two-fourths"
    ).bundle.objects.at(-1)?.value,
    { latex: "\\frac{1}{2}" }
  );
});

test("createGeneratedExponentTutorialFixture builds a semantic exponent asset", () => {
  const fixture = createGeneratedExponentTutorialFixture({
    familyId: "generated.exponent",
    id: "generated.exponent.square-as-product",
    title: "Generated expand square as product",
    base: "x",
    exponent: 2
  });

  assert.equal(fixture.familyId, "generated.exponent");
  assert.equal(fixture.bundle.id, "asset.generated.exponent.square-as-product");
  assert.deepEqual(
    fixture.bundle.objects.map((object) => ({
      id: object.id,
      objectType: object.objectType,
      value: object.value,
      selectorIds: object.selectors.map((selector) => selector.id)
    })),
    [
      {
        id: "expression.generated.exponent.square-as-product.initial",
        objectType: "expression",
        value: { latex: "x^{2}" },
        selectorIds: [
          "expression.generated.exponent.square-as-product.initial.base",
          "expression.generated.exponent.square-as-product.initial.exponent"
        ]
      },
      {
        id: "expression.generated.exponent.square-as-product.lowered",
        objectType: "expression",
        value: { latex: "x \\cdot x^{1}" },
        selectorIds: [
          "expression.generated.exponent.square-as-product.lowered.factor-1",
          "expression.generated.exponent.square-as-product.lowered.times-1",
          "expression.generated.exponent.square-as-product.lowered.residual-base",
          "expression.generated.exponent.square-as-product.lowered.residual-exponent"
        ]
      },
      {
        id: "expression.generated.exponent.square-as-product.expanded",
        objectType: "expression",
        value: { latex: "x \\cdot x" },
        selectorIds: [
          "expression.generated.exponent.square-as-product.expanded.factor-1",
          "expression.generated.exponent.square-as-product.expanded.times-1",
          "expression.generated.exponent.square-as-product.expanded.factor-2"
        ]
      }
    ]
  );
  assert.deepEqual(
    fixture.transformations.map((transformation) => [
      transformation.id,
      transformation.transformType,
      transformation.sourceObjectIds,
      transformation.targetObjectIds,
      transformation.lawRefs
    ]),
    [
      [
        "transform.generated.exponent.square-as-product.lower-exponent",
        "lowerExponent",
        ["expression.generated.exponent.square-as-product.initial"],
        ["expression.generated.exponent.square-as-product.lowered"],
        [{ id: "law.arithmetic.exponent-lowering", level: "strict" }]
      ],
      [
        "transform.generated.exponent.square-as-product.unwrap-unit-exponent",
        "unwrapUnitExponent",
        ["expression.generated.exponent.square-as-product.lowered"],
        ["expression.generated.exponent.square-as-product.expanded"],
        [{ id: "law.arithmetic.unit-exponent", level: "strict" }]
      ]
    ]
  );
  assert.deepEqual(kpSemanticDiagramForwardPhases(fixture.diagram), [
    ["transform.generated.exponent.square-as-product.lower-exponent"],
    ["transform.generated.exponent.square-as-product.unwrap-unit-exponent"]
  ]);
  assert.deepEqual(
    fixture.transformations.map((transformation) =>
      transformation.correspondence.map((entry) => [
        entry.sourceSelectorId,
        entry.targetSelectorId,
        entry.preserves
      ])
    ),
    [
      [
        [
          "expression.generated.exponent.square-as-product.initial.base",
          "expression.generated.exponent.square-as-product.lowered.factor-1",
          ["identity"]
        ],
        [
          "expression.generated.exponent.square-as-product.initial.base",
          "expression.generated.exponent.square-as-product.lowered.residual-base",
          ["identity"]
        ]
      ],
      [
        [
          "expression.generated.exponent.square-as-product.lowered.factor-1",
          "expression.generated.exponent.square-as-product.expanded.factor-1",
          ["identity"]
        ],
        [
          "expression.generated.exponent.square-as-product.lowered.residual-base",
          "expression.generated.exponent.square-as-product.expanded.factor-2",
          ["identity"]
        ]
      ]
    ]
  );
  assert.deepEqual(
    fixture.trace.steps.map((step) => [step.id, step.latex, step.rule]),
    [
      ["trace.generated.exponent.square-as-product.initial", "x^{2}", undefined],
      [
        "trace.generated.exponent.square-as-product.lowered",
        "x \\cdot x^{1}",
        "lowerExponent"
      ],
      [
        "trace.generated.exponent.square-as-product.expanded",
        "x \\cdot x",
        "unwrapUnitExponent"
      ]
    ]
  );
  assert.deepEqual(
    checkKpAssetFixtureReferenceClosure({
      bundle: fixture.bundle,
      transformations: fixture.transformations,
      diagram: fixture.diagram,
      drillDownHooks: fixture.drillDownHooks,
      flashcards: fixture.flashcards,
      trace: fixture.trace
    }),
    {
      lawId: "asset-fixture.reference-closure",
      passed: true,
      failures: []
    }
  );
});
