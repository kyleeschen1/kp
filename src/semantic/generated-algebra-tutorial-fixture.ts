import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type CreateKpAssetSelectorInput,
  type KpAssetBundle
} from "./asset.ts";
import {
  createKpSemanticDiagramSequence,
  createKpTransformationDiagramLeaf,
  type KpSemanticDiagramSequence
} from "./asset-diagram.ts";
import {
  createKpTransformationDrillDownHook,
  type KpTransformationDrillDownHook
} from "./asset-decomposition.ts";
import {
  createKpFlashcardSpec,
  type KpFlashcardSpec
} from "./asset-flashcard.ts";
import type { KpSemanticTransformation } from "./asset-transformation.ts";
import type { AlgebraTraceFixture } from "./algebra-trace-port-fixture.ts";
import {
  createGeneratedAlgebraSemanticTransformation
} from "./generated-algebra-transform-definition-registry.ts";
import {
  getGeneratedAlgebraTutorialFixtureSpec,
  generatedDistributionTutorialFixtureSpecs,
  generatedExponentTutorialFixtureSpecs,
  generatedFractionExpressionTutorialFixtureSpecs,
  generatedFunctionWrapTutorialFixtureSpecs,
  generatedLinearSolveTutorialFixtureSpecs,
  generatedRadicalTutorialFixtureSpecs,
  type GeneratedAlgebraFixtureFamilyId,
  type GeneratedAlgebraTutorialFixtureSpec,
  type GeneratedDistributionTutorialFixtureSpec,
  type GeneratedExponentTutorialFixtureSpec,
  type GeneratedFractionExpressionTutorialFixtureSpec,
  type GeneratedFunctionWrapTutorialFixtureSpec,
  type GeneratedLinearSolveTutorialFixtureSpec,
  type GeneratedRadicalTutorialFixtureSpec
} from "./generated-algebra-fixture-registry.ts";

export type {
  GeneratedAlgebraFixtureFamilyId,
  GeneratedAlgebraLinearSolveTutorialFixtureSpec,
  GeneratedAlgebraTutorialFixtureSpec,
  GeneratedDistributionTutorialFixtureSpec,
  GeneratedExponentTutorialFixtureSpec,
  GeneratedFractionExpressionTutorialFixtureSpec,
  GeneratedFunctionWrapTutorialFixtureSpec,
  GeneratedLinearSolveTutorialFixtureSpec,
  GeneratedRadicalTutorialFixtureSpec,
  GeneratedLinearSolveTutorialFixtureSpec as CreateGeneratedLinearSolveTutorialFixtureInput
} from "./generated-algebra-fixture-registry.ts";

export {
  generatedExponentTutorialFixtureSpecs,
  generatedFractionExpressionTutorialFixtureSpecs,
  generatedLinearSolveTutorialFixtureSpecs,
  getGeneratedAlgebraTutorialFixtureSpec,
  getGeneratedDistributionTutorialFixtureSpec,
  getGeneratedExponentTutorialFixtureSpec,
  getGeneratedFractionExpressionTutorialFixtureSpec,
  getGeneratedFunctionWrapTutorialFixtureSpec,
  getGeneratedLinearSolveTutorialFixtureSpec,
  getGeneratedRadicalTutorialFixtureSpec,
  listGeneratedAlgebraTutorialFixtureSpecs,
  listGeneratedDistributionTutorialFixtureSpecs,
  listGeneratedExponentTutorialFixtureSpecs,
  listGeneratedFractionExpressionTutorialFixtureSpecs,
  listGeneratedFunctionWrapTutorialFixtureSpecs,
  listGeneratedLinearSolveTutorialFixtureSpecs,
  listGeneratedRadicalTutorialFixtureSpecs
} from "./generated-algebra-fixture-registry.ts";

export interface GeneratedAlgebraTutorialFixture {
  readonly id: string;
  readonly familyId: GeneratedAlgebraFixtureFamilyId;
  readonly title: string;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly diagram: KpSemanticDiagramSequence;
  readonly trace: AlgebraTraceFixture;
  readonly drillDownHooks: readonly KpTransformationDrillDownHook[];
  readonly flashcards: readonly KpFlashcardSpec[];
}

export interface GeneratedLinearSolveTutorialFixture
  extends GeneratedAlgebraTutorialFixture {
  readonly familyId: "generated.linear-solve";
}

export interface GeneratedFractionExpressionTutorialFixture
  extends GeneratedAlgebraTutorialFixture {
  readonly familyId: "generated.fraction-expression";
}

export interface GeneratedExponentTutorialFixture
  extends GeneratedAlgebraTutorialFixture {
  readonly familyId: "generated.exponent";
}

export interface GeneratedRadicalTutorialFixture
  extends GeneratedAlgebraTutorialFixture {
  readonly familyId: "generated.radical";
}

export interface GeneratedFunctionWrapTutorialFixture
  extends GeneratedAlgebraTutorialFixture {
  readonly familyId: "generated.function-wrap";
}

export interface GeneratedDistributionTutorialFixture
  extends GeneratedAlgebraTutorialFixture {
  readonly familyId: "generated.distribution";
}

export function createGeneratedAlgebraTutorialFixtures():
  readonly GeneratedAlgebraTutorialFixture[] {
  return [
    ...createGeneratedLinearSolveTutorialFixtures(),
    ...createGeneratedFractionExpressionTutorialFixtures(),
    ...createGeneratedExponentTutorialFixtures(),
    ...createGeneratedRadicalTutorialFixtures(),
    ...createGeneratedFunctionWrapTutorialFixtures(),
    ...createGeneratedDistributionTutorialFixtures()
  ];
}

export function createGeneratedAlgebraTutorialFixture(
  fixtureOrId: GeneratedAlgebraTutorialFixtureSpec | string
): GeneratedAlgebraTutorialFixture {
  const spec =
    typeof fixtureOrId === "string"
      ? getGeneratedAlgebraTutorialFixtureSpec(fixtureOrId)
      : fixtureOrId;

  if (spec === undefined) {
    throw new Error(`Unknown generated algebra fixture: ${fixtureOrId}`);
  }

  if (spec.familyId === "generated.fraction-expression") {
    return createGeneratedFractionExpressionTutorialFixture(spec);
  }

  if (spec.familyId === "generated.exponent") {
    return createGeneratedExponentTutorialFixture(spec);
  }

  if (spec.familyId === "generated.radical") {
    return createGeneratedRadicalTutorialFixture(spec);
  }

  if (spec.familyId === "generated.function-wrap") {
    return createGeneratedFunctionWrapTutorialFixture(spec);
  }

  if (spec.familyId === "generated.distribution") {
    return createGeneratedDistributionTutorialFixture(spec);
  }

  return createGeneratedLinearSolveTutorialFixture(spec);
}

export function createGeneratedLinearSolveTutorialFixtures():
  readonly GeneratedLinearSolveTutorialFixture[] {
  return generatedLinearSolveTutorialFixtureSpecs.map(
    createGeneratedLinearSolveTutorialFixture
  );
}

export function createGeneratedFractionExpressionTutorialFixtures():
  readonly GeneratedFractionExpressionTutorialFixture[] {
  return generatedFractionExpressionTutorialFixtureSpecs.map(
    createGeneratedFractionExpressionTutorialFixture
  );
}

export function createGeneratedExponentTutorialFixtures():
  readonly GeneratedExponentTutorialFixture[] {
  return generatedExponentTutorialFixtureSpecs.map(
    createGeneratedExponentTutorialFixture
  );
}

export function createGeneratedRadicalTutorialFixtures():
  readonly GeneratedRadicalTutorialFixture[] {
  return generatedRadicalTutorialFixtureSpecs.map(
    createGeneratedRadicalTutorialFixture
  );
}

export function createGeneratedFunctionWrapTutorialFixtures():
  readonly GeneratedFunctionWrapTutorialFixture[] {
  return generatedFunctionWrapTutorialFixtureSpecs.map(
    createGeneratedFunctionWrapTutorialFixture
  );
}

export function createGeneratedDistributionTutorialFixtures():
  readonly GeneratedDistributionTutorialFixture[] {
  return generatedDistributionTutorialFixtureSpecs.map(
    createGeneratedDistributionTutorialFixture
  );
}

export function createGeneratedLinearSolveTutorialFixture(
  input: GeneratedLinearSolveTutorialFixtureSpec
): GeneratedLinearSolveTutorialFixture {
  assertNonEmpty(input.id, "Generated algebra fixture id");
  assertNonEmpty(input.title, `Generated algebra fixture ${input.id} title`);
  assertNonEmpty(input.variable, `Generated algebra fixture ${input.id} variable`);

  if (input.coefficient !== undefined) {
    if (input.addend !== undefined) {
      return createGeneratedTwoStepLinearSolveTutorialFixture({
        ...input,
        coefficient: input.coefficient,
        addend: input.addend
      });
    }

    return createGeneratedCoefficientLinearSolveTutorialFixture({
      ...input,
      coefficient: input.coefficient
    });
  }

  if (input.addend === undefined) {
    throw new Error(
      `Generated algebra fixture ${input.id} must define addend or coefficient.`
    );
  }

  assertNonZeroNumber(input.addend, `Generated algebra fixture ${input.id} addend`);
  const additiveInput = { ...input, addend: input.addend };

  const ids = generatedLinearSolveIds(additiveInput);
  const latex = generatedLinearSolveLatex(additiveInput);
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      equationObject(ids.initial, "Initial equation", latex.initial, [
        selector(ids.initial, "lhs.variable", "term", input.variable),
        selector(ids.initial, "lhs.addend", "term", formatSignedTerm(additiveInput.addend)),
        selector(ids.initial, "equals", "relation", "="),
        selector(ids.initial, "rhs.value", "term", String(latex.rhs))
      ]),
      equationObject(
        ids.afterSubtract,
        "After subtracting the addend",
        latex.afterSubtract,
        [
          selector(ids.afterSubtract, "lhs.variable", "term", input.variable),
          selector(ids.afterSubtract, "lhs.addend", "term", formatSignedTerm(additiveInput.addend)),
          selector(ids.afterSubtract, "lhs.subtract", "term", formatSignedTerm(-additiveInput.addend)),
          selector(ids.afterSubtract, "equals", "relation", "="),
          selector(ids.afterSubtract, "rhs.value", "term", String(latex.rhs)),
          selector(ids.afterSubtract, "rhs.subtract", "term", formatSignedTerm(-additiveInput.addend))
        ]
      ),
      equationObject(
        ids.leftSimplified,
        "After cancellation",
        latex.leftSimplified,
        [
          selector(ids.leftSimplified, "lhs.variable", "term", input.variable),
          selector(ids.leftSimplified, "equals", "relation", "="),
          selector(ids.leftSimplified, "rhs.value", "term", String(latex.rhs)),
          selector(ids.leftSimplified, "rhs.subtract", "term", formatSignedTerm(-additiveInput.addend))
        ]
      ),
      equationObject(ids.solved, "Solved equation", latex.solved, [
        selector(ids.solved, "lhs.variable", "term", input.variable),
        selector(ids.solved, "equals", "relation", "="),
        selector(ids.solved, "rhs.solution", "term", String(input.solution))
      ])
    ]
  });
  const transformations = createGeneratedLinearSolveTransformations(ids);
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.linear-solve",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedLinearSolveTrace(additiveInput, ids, latex),
    drillDownHooks: [
      createGeneratedAdditiveCancellationDrillDownHook(additiveInput, ids.cancel)
    ],
    flashcards: createGeneratedLinearSolveFlashcards(additiveInput, ids)
  };
}

function createGeneratedCoefficientLinearSolveTutorialFixture(
  input: GeneratedLinearSolveTutorialFixtureSpec & { readonly coefficient: number }
): GeneratedLinearSolveTutorialFixture {
  assertNonZeroInteger(
    input.coefficient,
    `Generated algebra fixture ${input.id} coefficient`
  );

  const ids = generatedCoefficientSolveIds(input);
  const rhs = input.coefficient * input.solution;
  const latex = {
    rhs,
    initial: `${input.coefficient}${input.variable} = ${rhs}`,
    afterSubtract: `${input.coefficient}${input.variable} / ${input.coefficient} = ${rhs} / ${input.coefficient}`,
    leftSimplified: `${input.variable} = ${rhs} / ${input.coefficient}`,
    solved: `${input.variable} = ${input.solution}`
  };
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      equationObject(ids.initial, "Initial equation", latex.initial, [
        selector(ids.initial, "lhs.coefficient", "factor", String(input.coefficient)),
        selector(ids.initial, "lhs.variable", "term", input.variable),
        selector(ids.initial, "equals", "relation", "="),
        selector(ids.initial, "rhs.value", "term", String(rhs))
      ]),
      equationObject(ids.afterSubtract, "After dividing by the coefficient", latex.afterSubtract, [
        selector(ids.afterSubtract, "lhs.coefficient", "factor", String(input.coefficient)),
        selector(ids.afterSubtract, "lhs.variable", "term", input.variable),
        selector(ids.afterSubtract, "lhs.divide", "term", `/${input.coefficient}`),
        selector(ids.afterSubtract, "equals", "relation", "="),
        selector(ids.afterSubtract, "rhs.value", "term", String(rhs)),
        selector(ids.afterSubtract, "rhs.divide", "term", `/${input.coefficient}`)
      ]),
      equationObject(ids.leftSimplified, "After cancellation", latex.leftSimplified, [
        selector(ids.leftSimplified, "lhs.variable", "term", input.variable),
        selector(ids.leftSimplified, "equals", "relation", "="),
        selector(ids.leftSimplified, "rhs.value", "term", String(rhs)),
        selector(ids.leftSimplified, "rhs.divide", "term", `/${input.coefficient}`)
      ]),
      equationObject(ids.solved, "Solved equation", latex.solved, [
        selector(ids.solved, "lhs.variable", "term", input.variable),
        selector(ids.solved, "equals", "relation", "="),
        selector(ids.solved, "rhs.solution", "term", String(input.solution))
      ])
    ]
  });
  const transformations = createGeneratedCoefficientSolveTransformations(ids);
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.linear-solve",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedCoefficientSolveTrace(input, ids, latex),
    drillDownHooks: [
      createGeneratedMultiplicativeCancellationDrillDownHook(input, ids.cancel)
    ],
    flashcards: createGeneratedCoefficientSolveFlashcards(input, ids)
  };
}

function createGeneratedTwoStepLinearSolveTutorialFixture(
  input: GeneratedLinearSolveTutorialFixtureSpec & {
    readonly addend: number;
    readonly coefficient: number;
  }
): GeneratedLinearSolveTutorialFixture {
  assertNonZeroNumber(input.addend, `Generated algebra fixture ${input.id} addend`);
  assertNonZeroInteger(
    input.coefficient,
    `Generated algebra fixture ${input.id} coefficient`
  );

  const ids = generatedTwoStepSolveIds(input);
  const reducedRhs = input.coefficient * input.solution;
  const rhs = reducedRhs + input.addend;
  const addendTerm = formatLatexSignedTerm(input.addend);
  const inverseTerm = formatLatexSignedTerm(-input.addend);
  const latex = {
    initial: `${input.coefficient}${input.variable} ${addendTerm} = ${rhs}`,
    afterSubtract: `${input.coefficient}${input.variable} ${addendTerm} ${inverseTerm} = ${rhs} ${inverseTerm}`,
    addendCanceled: `${input.coefficient}${input.variable} = ${rhs} ${inverseTerm}`,
    constantSimplified: `${input.coefficient}${input.variable} = ${reducedRhs}`,
    afterDivide: `${input.coefficient}${input.variable} / ${input.coefficient} = ${reducedRhs} / ${input.coefficient}`,
    coefficientCanceled: `${input.variable} = ${reducedRhs} / ${input.coefficient}`,
    solved: `${input.variable} = ${formatLatexNumber(input.solution)}`
  };
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      equationObject(ids.initial, "Initial equation", latex.initial, [
        selector(ids.initial, "lhs.coefficient", "factor", String(input.coefficient)),
        selector(ids.initial, "lhs.variable", "term", input.variable),
        selector(ids.initial, "lhs.addend", "term", formatSignedTerm(input.addend)),
        selector(ids.initial, "equals", "relation", "="),
        selector(ids.initial, "rhs.value", "term", String(rhs))
      ]),
      equationObject(ids.afterSubtract, "After applying additive inverse", latex.afterSubtract, [
        selector(ids.afterSubtract, "lhs.coefficient", "factor", String(input.coefficient)),
        selector(ids.afterSubtract, "lhs.variable", "term", input.variable),
        selector(ids.afterSubtract, "lhs.addend", "term", formatSignedTerm(input.addend)),
        selector(ids.afterSubtract, "lhs.subtract", "term", formatSignedTerm(-input.addend)),
        selector(ids.afterSubtract, "equals", "relation", "="),
        selector(ids.afterSubtract, "rhs.value", "term", String(rhs)),
        selector(ids.afterSubtract, "rhs.subtract", "term", formatSignedTerm(-input.addend))
      ]),
      equationObject(ids.addendCanceled, "After additive cancellation", latex.addendCanceled, [
        selector(ids.addendCanceled, "lhs.coefficient", "factor", String(input.coefficient)),
        selector(ids.addendCanceled, "lhs.variable", "term", input.variable),
        selector(ids.addendCanceled, "equals", "relation", "="),
        selector(ids.addendCanceled, "rhs.value", "term", String(rhs)),
        selector(ids.addendCanceled, "rhs.subtract", "term", formatSignedTerm(-input.addend))
      ]),
      equationObject(ids.constantSimplified, "After simplifying the constant", latex.constantSimplified, [
        selector(ids.constantSimplified, "lhs.coefficient", "factor", String(input.coefficient)),
        selector(ids.constantSimplified, "lhs.variable", "term", input.variable),
        selector(ids.constantSimplified, "equals", "relation", "="),
        selector(ids.constantSimplified, "rhs.reduced", "term", String(reducedRhs))
      ]),
      equationObject(ids.afterDivide, "After dividing by the coefficient", latex.afterDivide, [
        selector(ids.afterDivide, "lhs.coefficient", "factor", String(input.coefficient)),
        selector(ids.afterDivide, "lhs.variable", "term", input.variable),
        selector(ids.afterDivide, "lhs.divide", "term", `/${input.coefficient}`),
        selector(ids.afterDivide, "equals", "relation", "="),
        selector(ids.afterDivide, "rhs.reduced", "term", String(reducedRhs)),
        selector(ids.afterDivide, "rhs.divide", "term", `/${input.coefficient}`)
      ]),
      equationObject(ids.coefficientCanceled, "After coefficient cancellation", latex.coefficientCanceled, [
        selector(ids.coefficientCanceled, "lhs.variable", "term", input.variable),
        selector(ids.coefficientCanceled, "equals", "relation", "="),
        selector(ids.coefficientCanceled, "rhs.reduced", "term", String(reducedRhs)),
        selector(ids.coefficientCanceled, "rhs.divide", "term", `/${input.coefficient}`)
      ]),
      equationObject(ids.solved, "Solved equation", latex.solved, [
        selector(ids.solved, "lhs.variable", "term", input.variable),
        selector(ids.solved, "equals", "relation", "="),
        selector(ids.solved, "rhs.solution", "term", String(input.solution))
      ])
    ]
  });
  const transformations = createGeneratedTwoStepSolveTransformations(ids);
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.linear-solve",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedTwoStepSolveTrace(input, ids, latex),
    drillDownHooks: [
      createGeneratedAdditiveCancellationDrillDownHook(
        input,
        ids.cancelAddend
      ),
      createGeneratedMultiplicativeCancellationDrillDownHook(
        input,
        ids.cancelCoefficient
      )
    ],
    flashcards: createGeneratedTwoStepSolveFlashcards(input, ids)
  };
}

export function createGeneratedFractionExpressionTutorialFixture(
  input: GeneratedFractionExpressionTutorialFixtureSpec
): GeneratedFractionExpressionTutorialFixture {
  assertNonEmpty(input.id, "Generated fraction fixture id");
  assertNonEmpty(input.title, `Generated fraction fixture ${input.id} title`);
  assertNonZeroInteger(input.numerator, `Generated fraction fixture ${input.id} numerator`);
  assertNonZeroInteger(input.denominator, `Generated fraction fixture ${input.id} denominator`);
  assertNonZeroInteger(
    input.simplifiedNumerator,
    `Generated fraction fixture ${input.id} simplified numerator`
  );
  assertNonZeroInteger(
    input.simplifiedDenominator,
    `Generated fraction fixture ${input.id} simplified denominator`
  );

  const ids = generatedFractionExpressionIds(input);
  const commonFactor = generatedFractionCommonFactor(input);
  const latex = {
    initial: fractionLatex(input.numerator, input.denominator),
    factored: fractionProductLatex(
      input.simplifiedNumerator,
      commonFactor,
      input.simplifiedDenominator,
      commonFactor
    ),
    commonFactor: `${fractionLatex(
      input.simplifiedNumerator,
      input.simplifiedDenominator
    )} \\cdot ${fractionLatex(commonFactor, commonFactor)}`,
    simplified: fractionLatex(
      input.simplifiedNumerator,
      input.simplifiedDenominator
    )
  };
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(ids.initial, "Initial fraction", latex.initial, [
        selector(ids.initial, "numerator", "term", String(input.numerator)),
        selector(ids.initial, "fraction-line", "artifact", "/"),
        selector(ids.initial, "denominator", "term", String(input.denominator))
      ]),
      expressionObject(ids.factored, "Factored fraction", latex.factored, [
        selector(
          ids.factored,
          "base-numerator",
          "term",
          String(input.simplifiedNumerator)
        ),
        selector(ids.factored, "numerator-times", "operator", "\\cdot"),
        selector(
          ids.factored,
          "common-numerator-factor",
          "factor",
          String(commonFactor)
        ),
        selector(ids.factored, "fraction-line", "artifact", "/"),
        selector(
          ids.factored,
          "base-denominator",
          "term",
          String(input.simplifiedDenominator)
        ),
        selector(ids.factored, "denominator-times", "operator", "\\cdot"),
        selector(
          ids.factored,
          "common-denominator-factor",
          "factor",
          String(commonFactor)
        )
      ]),
      expressionObject(
        ids.commonFactor,
        "Common factor separated",
        latex.commonFactor,
        [
          selector(
            ids.commonFactor,
            "base-numerator",
            "term",
            String(input.simplifiedNumerator)
          ),
          selector(ids.commonFactor, "base-fraction-line", "artifact", "/"),
          selector(
            ids.commonFactor,
            "base-denominator",
            "term",
            String(input.simplifiedDenominator)
          ),
          selector(ids.commonFactor, "times", "operator", "\\cdot"),
          selector(
            ids.commonFactor,
            "unit-numerator",
            "term",
            String(commonFactor)
          ),
          selector(ids.commonFactor, "unit-fraction-line", "artifact", "/"),
          selector(
            ids.commonFactor,
            "unit-denominator",
            "term",
            String(commonFactor)
          )
        ]
      ),
      expressionObject(ids.simplified, "Simplified fraction", latex.simplified, [
        selector(
          ids.simplified,
          "numerator",
          "term",
          String(input.simplifiedNumerator)
        ),
        selector(ids.simplified, "fraction-line", "artifact", "/"),
        selector(
          ids.simplified,
          "denominator",
          "term",
          String(input.simplifiedDenominator)
        )
      ])
    ]
  });
  const transformations = createGeneratedFractionExpressionTransformations(ids);
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.fraction-expression",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedFractionExpressionTrace(ids, latex),
    drillDownHooks: [],
    flashcards: createGeneratedFractionExpressionFlashcards(input, ids)
  };
}

function createGeneratedFractionExpressionTransformations(
  ids: GeneratedFractionExpressionIds
): readonly KpSemanticTransformation[] {
  return [
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.fraction-expression",
      id: ids.split,
      transformType: "splitFractionFactors",
      title: "Split numerator and denominator into common factors",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.factored],
      correspondenceMap: {
        id: `${ids.split}.correspondence`,
        records: [
          lifecycle("numerator-splits", "fan-out", [selectorId(ids.initial, "numerator")], [selectorId(ids.factored, "base-numerator"), selectorId(ids.factored, "common-numerator-factor")], "The numerator splits into its base and common factors."),
          lifecycle("denominator-splits", "fan-out", [selectorId(ids.initial, "denominator")], [selectorId(ids.factored, "base-denominator"), selectorId(ids.factored, "common-denominator-factor")], "The denominator splits into its base and common factors."),
          lifecycle("fraction-line-persists", "identity", [selectorId(ids.initial, "fraction-line")], [selectorId(ids.factored, "fraction-line")], "The fraction relationship persists."),
          lifecycle("product-signs-enter", "introduction", [], [selectorId(ids.factored, "numerator-times"), selectorId(ids.factored, "denominator-times")], "Product signs enter with the exposed factors.")
        ]
      },
      correspondence: [
        {
          sourceSelectorId: `${ids.initial}.fraction-line`,
          targetSelectorId: `${ids.factored}.fraction-line`,
          preserves: ["structure"]
        }
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.fraction-expression",
      id: ids.merge,
      transformType: "mergeFractionCommonFactor",
      title: "Separate the common fraction factor",
      sourceObjectIds: [ids.factored],
      targetObjectIds: [ids.commonFactor],
      correspondenceMap: {
        id: `${ids.merge}.correspondence`,
        records: [
          lifecycle("base-numerator-persists", "identity", [selectorId(ids.factored, "base-numerator")], [selectorId(ids.commonFactor, "base-numerator")], "The base numerator persists."),
          lifecycle("base-denominator-persists", "identity", [selectorId(ids.factored, "base-denominator")], [selectorId(ids.commonFactor, "base-denominator")], "The base denominator persists."),
          lifecycle("common-numerator-moves", "identity", [selectorId(ids.factored, "common-numerator-factor")], [selectorId(ids.commonFactor, "unit-numerator")], "The common numerator factor moves into the unit fraction."),
          lifecycle("common-denominator-moves", "identity", [selectorId(ids.factored, "common-denominator-factor")], [selectorId(ids.commonFactor, "unit-denominator")], "The common denominator factor moves into the unit fraction."),
          lifecycle("fraction-line-splits", "fan-out", [selectorId(ids.factored, "fraction-line")], [selectorId(ids.commonFactor, "base-fraction-line"), selectorId(ids.commonFactor, "unit-fraction-line")], "One fraction structure separates into base and unit fractions."),
          lifecycle("product-signs-merge", "fan-in", [selectorId(ids.factored, "numerator-times"), selectorId(ids.factored, "denominator-times")], [selectorId(ids.commonFactor, "times")], "The two internal products become one product between fractions.")
        ]
      },
      correspondence: [
        correspondence(
          ids.factored,
          "base-numerator",
          ids.commonFactor,
          "base-numerator"
        ),
        correspondence(
          ids.factored,
          "base-denominator",
          ids.commonFactor,
          "base-denominator"
        )
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.fraction-expression",
      id: ids.simplify,
      transformType: "simplifyUnitFractionFactor",
      title: "Simplify the unit fraction factor",
      sourceObjectIds: [ids.commonFactor],
      targetObjectIds: [ids.simplified],
      correspondenceMap: {
        id: `${ids.simplify}.correspondence`,
        records: [
          lifecycle("base-numerator-persists", "identity", [selectorId(ids.commonFactor, "base-numerator")], [selectorId(ids.simplified, "numerator")], "The simplified numerator persists."),
          lifecycle("base-denominator-persists", "identity", [selectorId(ids.commonFactor, "base-denominator")], [selectorId(ids.simplified, "denominator")], "The simplified denominator persists."),
          lifecycle("base-fraction-line-persists", "identity", [selectorId(ids.commonFactor, "base-fraction-line")], [selectorId(ids.simplified, "fraction-line")], "The base fraction relationship persists."),
          lifecycle("unit-factor-cancels", "cancelation", [selectorId(ids.commonFactor, "times"), selectorId(ids.commonFactor, "unit-numerator"), selectorId(ids.commonFactor, "unit-fraction-line"), selectorId(ids.commonFactor, "unit-denominator")], [], "The unit fraction factor cancels as one.")
        ]
      },
      correspondence: [
        correspondence(
          ids.commonFactor,
          "base-numerator",
          ids.simplified,
          "numerator"
        ),
        correspondence(
          ids.commonFactor,
          "base-denominator",
          ids.simplified,
          "denominator"
        )
      ]
    })
  ];
}

function createGeneratedFractionExpressionTrace(
  ids: GeneratedFractionExpressionIds,
  latex: GeneratedFractionExpressionLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${ids.baseId} generated fraction trace`,
    steps: [
      {
        id: `${ids.trace}.initial`,
        latex: latex.initial
      },
      {
        id: `${ids.trace}.factored`,
        latex: latex.factored,
        transformationId: ids.split,
        rule: "splitFractionFactors"
      },
      {
        id: `${ids.trace}.common-factor`,
        latex: latex.commonFactor,
        transformationId: ids.merge,
        rule: "mergeFractionCommonFactor"
      },
      {
        id: `${ids.trace}.simplified`,
        latex: latex.simplified,
        transformationId: ids.simplify,
        rule: "simplifyUnitFractionFactor"
      }
    ]
  };
}

function createGeneratedFractionExpressionFlashcards(
  input: GeneratedFractionExpressionTutorialFixtureSpec,
  ids: GeneratedFractionExpressionIds
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-equivalent-fraction`,
      kind: "explain-transform",
      title: "Explain fraction simplification",
      assetId: ids.asset,
      prompt: "Why does simplifying this fraction preserve its value?",
      objectIds: [ids.initial, ids.simplified],
      transformationIds: [ids.split, ids.merge, ids.simplify],
      timeMs: 600,
      answer: {
        kind: "text",
        value:
          "Dividing numerator and denominator by the same non-zero factor gives an equivalent fraction."
      }
    })
  ];
}

export function createGeneratedExponentTutorialFixture(
  input: GeneratedExponentTutorialFixtureSpec
): GeneratedExponentTutorialFixture {
  assertNonEmpty(input.id, "Generated exponent fixture id");
  assertNonEmpty(input.title, `Generated exponent fixture ${input.id} title`);
  assertNonEmpty(input.base, `Generated exponent fixture ${input.id} base`);

  if (!Number.isInteger(input.exponent) || input.exponent < 2) {
    throw new Error(
      `Generated exponent fixture ${input.id} exponent must be an integer greater than one.`
    );
  }

  const ids = generatedExponentIds(input);
  const latex = {
    initial: `${input.base}^{${input.exponent}}`,
    lowered: `${input.base} \\cdot ${input.base}^{${input.exponent - 1}}`,
    expanded: Array.from({ length: input.exponent }, () => input.base).join(
      " \\cdot "
    )
  };
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(ids.initial, "Initial exponent", latex.initial, [
        selector(ids.initial, "base", "term", input.base),
        selector(ids.initial, "exponent", "exponent", String(input.exponent))
      ]),
      expressionObject(ids.lowered, "Lowered exponent", latex.lowered, [
        selector(ids.lowered, "factor-1", "factor", input.base),
        selector(ids.lowered, "times-1", "operator", "\\cdot"),
        selector(ids.lowered, "residual-base", "term", input.base),
        selector(
          ids.lowered,
          "residual-exponent",
          "exponent",
          String(input.exponent - 1)
        )
      ]),
      expressionObject(ids.expanded, "Expanded product", latex.expanded, [
        ...Array.from({ length: input.exponent }, (_, index) =>
          selector(
            ids.expanded,
            `factor-${index + 1}`,
            "factor",
            input.base
          )
        ).flatMap((factorSelector, index) =>
          index === input.exponent - 1
            ? [factorSelector]
            : [
                factorSelector,
                selector(
                  ids.expanded,
                  `times-${index + 1}`,
                  "operator",
                  "\\cdot"
                )
              ]
        )
      ])
    ]
  });
  const transformations = createGeneratedExponentTransformations(
    ids,
    input.exponent
  );
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.exponent",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedExponentTrace(ids, latex),
    drillDownHooks: [],
    flashcards: createGeneratedExponentFlashcards(input, ids)
  };
}

function createGeneratedExponentTransformations(
  ids: GeneratedExponentIds,
  exponent: number
): readonly KpSemanticTransformation[] {
  const expandedTailSelectorIds = Array.from(
    { length: exponent - 1 },
    (_, index) => index + 2
  ).flatMap((factorIndex) => factorIndex === 2
    ? [selectorId(ids.expanded, `factor-${factorIndex}`)]
    : [
        selectorId(ids.expanded, `times-${factorIndex - 1}`),
        selectorId(ids.expanded, `factor-${factorIndex}`)
      ]);
  return [
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.exponent",
      id: ids.lower,
      transformType: "lowerExponent",
      title: "Lower the exponent by one factor",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.lowered],
      correspondenceMap: {
        id: `${ids.lower}.correspondence`,
        records: [
          lifecycle("base-splits", "fan-out", [selectorId(ids.initial, "base")], [selectorId(ids.lowered, "factor-1"), selectorId(ids.lowered, "residual-base")], "The base splits into an exposed factor and a residual power."),
          lifecycle("exponent-lowers", "fan-out", [selectorId(ids.initial, "exponent")], [selectorId(ids.lowered, "times-1"), selectorId(ids.lowered, "residual-exponent")], "The exponent produces multiplication and a lowered exponent.")
        ]
      },
      correspondence: [
        correspondence(ids.initial, "base", ids.lowered, "factor-1"),
        correspondence(ids.initial, "base", ids.lowered, "residual-base")
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.exponent",
      id: ids.unwrap,
      transformType: "unwrapUnitExponent",
      title: "Unwrap the unit exponent",
      sourceObjectIds: [ids.lowered],
      targetObjectIds: [ids.expanded],
      correspondenceMap: {
        id: `${ids.unwrap}.correspondence`,
        records: [
          lifecycle("first-factor-persists", "identity", [selectorId(ids.lowered, "factor-1")], [selectorId(ids.expanded, "factor-1")], "The exposed first factor persists."),
          lifecycle("first-product-persists", "identity", [selectorId(ids.lowered, "times-1")], [selectorId(ids.expanded, "times-1")], "The first product operator persists."),
          ...(exponent === 2
            ? [
                lifecycle("residual-base-persists", "identity", [selectorId(ids.lowered, "residual-base")], [selectorId(ids.expanded, "factor-2")], "The residual base becomes the second factor."),
                lifecycle("unit-exponent-exits", "removal", [selectorId(ids.lowered, "residual-exponent")], [], "The unit exponent exits.")
              ]
            : [
                lifecycle("residual-power-expands", "fan-out", [selectorId(ids.lowered, "residual-base")], expandedTailSelectorIds, "The residual power expands into the remaining product."),
                lifecycle("residual-exponent-exits", "removal", [selectorId(ids.lowered, "residual-exponent")], [], "The residual exponent exits after expansion.")
              ])
        ]
      },
      correspondence: [
        correspondence(ids.lowered, "factor-1", ids.expanded, "factor-1"),
        correspondence(ids.lowered, "residual-base", ids.expanded, "factor-2")
      ]
    })
  ];
}

function createGeneratedExponentTrace(
  ids: GeneratedExponentIds,
  latex: GeneratedExponentLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${ids.baseId} generated exponent trace`,
    steps: [
      {
        id: `${ids.trace}.initial`,
        latex: latex.initial
      },
      {
        id: `${ids.trace}.lowered`,
        latex: latex.lowered,
        transformationId: ids.lower,
        rule: "lowerExponent"
      },
      {
        id: `${ids.trace}.expanded`,
        latex: latex.expanded,
        transformationId: ids.unwrap,
        rule: "unwrapUnitExponent"
      }
    ]
  };
}

function createGeneratedExponentFlashcards(
  input: GeneratedExponentTutorialFixtureSpec,
  ids: GeneratedExponentIds
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-exponent-product`,
      kind: "explain-transform",
      title: "Explain exponent expansion",
      assetId: ids.asset,
      prompt: "What does this positive integer exponent mean?",
      objectIds: [ids.initial, ids.expanded],
      transformationIds: [ids.lower, ids.unwrap],
      timeMs: 600,
      answer: {
        kind: "text",
        value: "A positive integer exponent means repeated multiplication."
      }
    })
  ];
}

export function createGeneratedRadicalTutorialFixture(
  input: GeneratedRadicalTutorialFixtureSpec
): GeneratedRadicalTutorialFixture {
  assertNonEmpty(input.id, "Generated radical fixture id");
  assertNonEmpty(input.title, `Generated radical fixture ${input.id} title`);
  assertNonEmpty(input.base, `Generated radical fixture ${input.id} base`);

  if (!Number.isInteger(input.index) || input.index < 2) {
    throw new Error(
      `Generated radical fixture ${input.id} index must be an integer greater than one.`
    );
  }

  if (!Number.isInteger(input.exponentNumerator) || input.exponentNumerator < 1) {
    throw new Error(
      `Generated radical fixture ${input.id} exponent numerator must be a positive integer.`
    );
  }

  const ids = generatedRadicalIds(input);
  const latex = generatedRadicalLatex(input);
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(ids.power, "Power form", latex.power, [
        selector(ids.power, "base", "term", input.base),
        selector(
          ids.power,
          "exponent-numerator",
          "term",
          formatLatexNumber(input.exponentNumerator)
        ),
        selector(ids.power, "exponent-fraction-line", "operator", "\\frac"),
        selector(
          ids.power,
          "exponent-denominator",
          "term",
          formatLatexNumber(input.index)
        )
      ]),
      expressionObject(ids.radical, "Radical form", latex.radical, [
        selector(ids.radical, "radical-symbol", "operator", "\\sqrt"),
        selector(ids.radical, "radicand", "term", input.base)
      ])
    ]
  });
  const transformations = createGeneratedRadicalTransformations(ids);
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.radical",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedRadicalTrace(ids, latex),
    drillDownHooks: [],
    flashcards: createGeneratedRadicalFlashcards(input, ids)
  };
}

function createGeneratedRadicalTransformations(
  ids: GeneratedRadicalIds
): readonly KpSemanticTransformation[] {
  return [
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.radical",
      id: ids.rewrite,
      transformType: "rewritePowerAsRoot",
      title: "Rewrite the rational exponent as a radical",
      sourceObjectIds: [ids.power],
      targetObjectIds: [ids.radical],
      correspondenceMap: {
        id: `${ids.rewrite}.correspondence`,
        records: [
          lifecycle("base-becomes-radicand", "role-change", [selectorId(ids.power, "base")], [selectorId(ids.radical, "radicand")], "The base persists as the radicand."),
          lifecycle("exponent-becomes-radical", "fan-in", [selectorId(ids.power, "exponent-numerator"), selectorId(ids.power, "exponent-fraction-line"), selectorId(ids.power, "exponent-denominator")], [selectorId(ids.radical, "radical-symbol")], "The rational exponent derives the radical structure.")
        ]
      },
      correspondence: [
        correspondence(ids.power, "base", ids.radical, "radicand")
      ]
    })
  ];
}

function createGeneratedRadicalTrace(
  ids: GeneratedRadicalIds,
  latex: GeneratedRadicalLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${ids.baseId} generated radical trace`,
    steps: [
      {
        id: `${ids.trace}.power`,
        latex: latex.power
      },
      {
        id: `${ids.trace}.radical`,
        latex: latex.radical,
        transformationId: ids.rewrite,
        rule: "rewritePowerAsRoot"
      }
    ]
  };
}

function createGeneratedRadicalFlashcards(
  input: GeneratedRadicalTutorialFixtureSpec,
  ids: GeneratedRadicalIds
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-radical-power`,
      kind: "explain-transform",
      title: "Explain radical power notation",
      assetId: ids.asset,
      prompt: "How does this rational exponent become a radical?",
      objectIds: [ids.power, ids.radical],
      transformationIds: [ids.rewrite],
      timeMs: 600,
      answer: {
        kind: "text",
        value:
          "A denominator in a rational exponent gives the root index, so a one-half exponent is a square root."
      }
    })
  ];
}

export function createGeneratedFunctionWrapTutorialFixture(
  input: GeneratedFunctionWrapTutorialFixtureSpec
): GeneratedFunctionWrapTutorialFixture {
  assertNonEmpty(input.id, "Generated function-wrap fixture id");
  assertNonEmpty(
    input.title,
    `Generated function-wrap fixture ${input.id} title`
  );
  assertNonEmpty(input.input, `Generated function-wrap fixture ${input.id} input`);
  assertNonEmpty(
    input.functionName,
    `Generated function-wrap fixture ${input.id} function name`
  );

  const ids = generatedFunctionWrapIds(input);
  const latex = generatedFunctionWrapLatex(input);
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(ids.input, "Input expression", latex.input, [
        selector(ids.input, "value", "term", input.input)
      ]),
      expressionObject(ids.wrapped, "Function application", latex.wrapped, [
        selector(ids.wrapped, "function", "function", input.functionName),
        selector(ids.wrapped, "left-paren", "delimiter", "("),
        selector(ids.wrapped, "argument", "term", input.input),
        selector(ids.wrapped, "right-paren", "delimiter", ")")
      ])
    ]
  });
  const transformations = createGeneratedFunctionWrapTransformations(ids);
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.function-wrap",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedFunctionWrapTrace(ids, latex),
    drillDownHooks: [],
    flashcards: []
  };
}

function createGeneratedFunctionWrapTransformations(
  ids: GeneratedFunctionWrapIds
): readonly KpSemanticTransformation[] {
  return [
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.function-wrap",
      id: ids.wrap,
      transformType: "wrapFunction",
      title: "Wrap the expression in a function application",
      sourceObjectIds: [ids.input],
      targetObjectIds: [ids.wrapped],
      correspondenceMap: {
        id: `${ids.wrap}.correspondence`,
        records: [
          lifecycle(
            "value-becomes-argument",
            "role-change",
            [selectorId(ids.input, "value")],
            [selectorId(ids.wrapped, "argument")],
            "The input persists while taking the argument role."
          ),
          lifecycle(
            "wrapper-enters",
            "introduction",
            [],
            [
              selectorId(ids.wrapped, "function"),
              selectorId(ids.wrapped, "left-paren"),
              selectorId(ids.wrapped, "right-paren")
            ],
            "The function and delimiters enter around the argument."
          )
        ]
      },
      correspondence: [
        correspondence(ids.input, "value", ids.wrapped, "argument")
      ]
    })
  ];
}

function createGeneratedFunctionWrapTrace(
  ids: GeneratedFunctionWrapIds,
  latex: GeneratedFunctionWrapLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${ids.baseId} generated function-wrap trace`,
    steps: [
      {
        id: `${ids.trace}.input`,
        latex: latex.input
      },
      {
        id: `${ids.trace}.wrapped`,
        latex: latex.wrapped,
        transformationId: ids.wrap,
        rule: "wrapFunction"
      }
    ]
  };
}

export function createGeneratedDistributionTutorialFixture(
  input: GeneratedDistributionTutorialFixtureSpec
): GeneratedDistributionTutorialFixture {
  assertNonEmpty(input.id, "Generated distribution fixture id");
  assertNonEmpty(
    input.title,
    `Generated distribution fixture ${input.id} title`
  );
  assertNonEmpty(input.factor, `Generated distribution fixture ${input.id} factor`);
  assertNonEmpty(
    input.leftTerm,
    `Generated distribution fixture ${input.id} left term`
  );
  assertNonEmpty(
    input.rightTerm,
    `Generated distribution fixture ${input.id} right term`
  );

  const ids = generatedDistributionIds(input);
  const latex = generatedDistributionLatex(input);
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(ids.factored, "Factored expression", latex.factored, [
        selector(ids.factored, "factor", "factor", input.factor),
        selector(ids.factored, "left-paren", "delimiter", "("),
        selector(ids.factored, "left-term", "term", input.leftTerm),
        selector(ids.factored, "plus", "operator", "+"),
        selector(ids.factored, "right-term", "term", input.rightTerm),
        selector(ids.factored, "right-paren", "delimiter", ")")
      ]),
      expressionObject(ids.expanded, "Expanded expression", latex.expanded, [
        selector(ids.expanded, "left-factor", "factor", input.factor),
        selector(ids.expanded, "left-term", "term", input.leftTerm),
        selector(ids.expanded, "plus", "operator", "+"),
        selector(ids.expanded, "right-factor", "factor", input.factor),
        selector(ids.expanded, "right-term", "term", input.rightTerm)
      ])
    ]
  });
  const transformations = createGeneratedDistributionTransformations(input, ids);
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.distribution",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedDistributionTrace(input, ids, latex),
    drillDownHooks: [],
    flashcards: []
  };
}

function createGeneratedDistributionTransformations(
  input: GeneratedDistributionTutorialFixtureSpec,
  ids: GeneratedDistributionIds
): readonly KpSemanticTransformation[] {
  const distributing = input.direction === "distribute";

  return [
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.distribution",
      id: ids.transform,
      transformType: distributing
        ? "distributeMultiplication"
        : "factorCommonTerm",
      title: distributing
        ? "Distribute multiplication over addition"
        : "Factor the common term",
      sourceObjectIds: [distributing ? ids.factored : ids.expanded],
      targetObjectIds: [distributing ? ids.expanded : ids.factored],
      correspondenceMap: distributing
        ? {
            id: `${ids.transform}.correspondence`,
            records: [
              lifecycle("factor-distributes", "fan-out", [selectorId(ids.factored, "factor")], [selectorId(ids.expanded, "left-factor"), selectorId(ids.expanded, "right-factor")], "The shared factor distributes to both terms."),
              lifecycle("left-term-persists", "identity", [selectorId(ids.factored, "left-term")], [selectorId(ids.expanded, "left-term")], "The left term persists."),
              lifecycle("right-term-persists", "identity", [selectorId(ids.factored, "right-term")], [selectorId(ids.expanded, "right-term")], "The right term persists."),
              lifecycle("plus-persists", "identity", [selectorId(ids.factored, "plus")], [selectorId(ids.expanded, "plus")], "Addition persists."),
              lifecycle("grouping-exits", "removal", [selectorId(ids.factored, "left-paren"), selectorId(ids.factored, "right-paren")], [], "The grouping delimiters exit after distribution.")
            ]
          }
        : {
            id: `${ids.transform}.correspondence`,
            records: [
              lifecycle("factors-merge", "fan-in", [selectorId(ids.expanded, "left-factor"), selectorId(ids.expanded, "right-factor")], [selectorId(ids.factored, "factor")], "The repeated factors merge into one shared factor."),
              lifecycle("left-term-persists", "identity", [selectorId(ids.expanded, "left-term")], [selectorId(ids.factored, "left-term")], "The left term persists."),
              lifecycle("right-term-persists", "identity", [selectorId(ids.expanded, "right-term")], [selectorId(ids.factored, "right-term")], "The right term persists."),
              lifecycle("plus-persists", "identity", [selectorId(ids.expanded, "plus")], [selectorId(ids.factored, "plus")], "Addition persists."),
              lifecycle("grouping-enters", "introduction", [], [selectorId(ids.factored, "left-paren"), selectorId(ids.factored, "right-paren")], "Grouping delimiters enter around the sum.")
            ]
          },
      correspondence: distributing
        ? [
            correspondence(ids.factored, "factor", ids.expanded, "left-factor"),
            correspondence(ids.factored, "factor", ids.expanded, "right-factor"),
            correspondence(ids.factored, "left-term", ids.expanded, "left-term"),
            correspondence(ids.factored, "right-term", ids.expanded, "right-term")
          ]
        : [
            correspondence(ids.expanded, "left-factor", ids.factored, "factor"),
            correspondence(ids.expanded, "right-factor", ids.factored, "factor"),
            correspondence(ids.expanded, "left-term", ids.factored, "left-term"),
            correspondence(ids.expanded, "right-term", ids.factored, "right-term")
          ]
    })
  ];
}

function createGeneratedDistributionTrace(
  input: GeneratedDistributionTutorialFixtureSpec,
  ids: GeneratedDistributionIds,
  latex: GeneratedDistributionLatex
): AlgebraTraceFixture {
  const distributing = input.direction === "distribute";

  return {
    id: ids.trace,
    title: `${ids.baseId} generated distribution trace`,
    steps: distributing
      ? [
          {
            id: `${ids.trace}.factored`,
            latex: latex.factored
          },
          {
            id: `${ids.trace}.expanded`,
            latex: latex.expanded,
            transformationId: ids.transform,
            rule: "distributeMultiplication"
          }
        ]
      : [
          {
            id: `${ids.trace}.expanded`,
            latex: latex.expanded
          },
          {
            id: `${ids.trace}.factored`,
            latex: latex.factored,
            transformationId: ids.transform,
            rule: "factorCommonTerm"
          }
        ]
  };
}

function createGeneratedLinearSolveTransformations(
  ids: GeneratedLinearSolveIds
): readonly KpSemanticTransformation[] {
  return [
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.subtract,
      transformType: ids.firstTransformType,
      title: ids.firstTransformTitle,
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.afterSubtract],
      correspondence: [
        correspondence(ids.initial, "lhs.variable", ids.afterSubtract, "lhs.variable"),
        correspondence(ids.initial, "lhs.addend", ids.afterSubtract, "lhs.addend"),
        correspondence(ids.initial, "equals", ids.afterSubtract, "equals"),
        correspondence(ids.initial, "rhs.value", ids.afterSubtract, "rhs.value")
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.cancel,
      transformType: "cancelAdditiveInverses",
      title: "Cancel additive inverses",
      sourceObjectIds: [ids.afterSubtract],
      targetObjectIds: [ids.leftSimplified],
      correspondence: [
        correspondence(ids.afterSubtract, "lhs.variable", ids.leftSimplified, "lhs.variable"),
        correspondence(ids.afterSubtract, "equals", ids.leftSimplified, "equals"),
        correspondence(ids.afterSubtract, "rhs.value", ids.leftSimplified, "rhs.value"),
        correspondence(ids.afterSubtract, "rhs.subtract", ids.leftSimplified, "rhs.subtract")
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.simplify,
      transformType: ids.simplifyTransformType,
      title: ids.simplifyTransformTitle,
      sourceObjectIds: [ids.leftSimplified],
      targetObjectIds: [ids.solved],
      correspondence: [
        correspondence(ids.leftSimplified, "lhs.variable", ids.solved, "lhs.variable"),
        correspondence(ids.leftSimplified, "equals", ids.solved, "equals")
      ]
    })
  ];
}

function createGeneratedCoefficientSolveTransformations(
  ids: GeneratedLinearSolveIds
): readonly KpSemanticTransformation[] {
  return [
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.subtract,
      transformType: "divideBothSides",
      title: "Divide both sides by the coefficient",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.afterSubtract],
      correspondence: [
        correspondence(ids.initial, "lhs.coefficient", ids.afterSubtract, "lhs.coefficient"),
        correspondence(ids.initial, "lhs.variable", ids.afterSubtract, "lhs.variable"),
        correspondence(ids.initial, "equals", ids.afterSubtract, "equals"),
        correspondence(ids.initial, "rhs.value", ids.afterSubtract, "rhs.value")
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.cancel,
      transformType: "cancelMultiplicativeInverses",
      title: "Cancel multiplicative inverses",
      sourceObjectIds: [ids.afterSubtract],
      targetObjectIds: [ids.leftSimplified],
      correspondence: [
        correspondence(ids.afterSubtract, "lhs.variable", ids.leftSimplified, "lhs.variable"),
        correspondence(ids.afterSubtract, "equals", ids.leftSimplified, "equals"),
        correspondence(ids.afterSubtract, "rhs.value", ids.leftSimplified, "rhs.value"),
        correspondence(ids.afterSubtract, "rhs.divide", ids.leftSimplified, "rhs.divide")
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.simplify,
      transformType: "simplifyConstantQuotient",
      title: "Simplify the constant quotient",
      sourceObjectIds: [ids.leftSimplified],
      targetObjectIds: [ids.solved],
      correspondence: [
        correspondence(ids.leftSimplified, "lhs.variable", ids.solved, "lhs.variable"),
        correspondence(ids.leftSimplified, "equals", ids.solved, "equals")
      ]
    })
  ];
}

function createGeneratedTwoStepSolveTransformations(
  ids: GeneratedTwoStepSolveIds
): readonly KpSemanticTransformation[] {
  return [
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.subtract,
      transformType: "subtractBothSides",
      title: "Subtract the addend from both sides",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.afterSubtract],
      correspondence: [
        correspondence(ids.initial, "lhs.coefficient", ids.afterSubtract, "lhs.coefficient"),
        correspondence(ids.initial, "lhs.variable", ids.afterSubtract, "lhs.variable"),
        correspondence(ids.initial, "lhs.addend", ids.afterSubtract, "lhs.addend"),
        correspondence(ids.initial, "equals", ids.afterSubtract, "equals"),
        correspondence(ids.initial, "rhs.value", ids.afterSubtract, "rhs.value")
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.cancelAddend,
      transformType: "cancelAdditiveInverses",
      title: "Cancel additive inverses",
      sourceObjectIds: [ids.afterSubtract],
      targetObjectIds: [ids.addendCanceled],
      correspondence: [
        correspondence(ids.afterSubtract, "lhs.coefficient", ids.addendCanceled, "lhs.coefficient"),
        correspondence(ids.afterSubtract, "lhs.variable", ids.addendCanceled, "lhs.variable"),
        correspondence(ids.afterSubtract, "equals", ids.addendCanceled, "equals"),
        correspondence(ids.afterSubtract, "rhs.value", ids.addendCanceled, "rhs.value"),
        correspondence(ids.afterSubtract, "rhs.subtract", ids.addendCanceled, "rhs.subtract")
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.simplifyDifference,
      transformType: "simplifyConstantDifference",
      title: "Simplify the constant difference",
      sourceObjectIds: [ids.addendCanceled],
      targetObjectIds: [ids.constantSimplified],
      correspondence: [
        correspondence(ids.addendCanceled, "lhs.coefficient", ids.constantSimplified, "lhs.coefficient"),
        correspondence(ids.addendCanceled, "lhs.variable", ids.constantSimplified, "lhs.variable"),
        correspondence(ids.addendCanceled, "equals", ids.constantSimplified, "equals")
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.divide,
      transformType: "divideBothSides",
      title: "Divide both sides by the coefficient",
      sourceObjectIds: [ids.constantSimplified],
      targetObjectIds: [ids.afterDivide],
      correspondence: [
        correspondence(ids.constantSimplified, "lhs.coefficient", ids.afterDivide, "lhs.coefficient"),
        correspondence(ids.constantSimplified, "lhs.variable", ids.afterDivide, "lhs.variable"),
        correspondence(ids.constantSimplified, "equals", ids.afterDivide, "equals"),
        correspondence(ids.constantSimplified, "rhs.reduced", ids.afterDivide, "rhs.reduced")
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.cancelCoefficient,
      transformType: "cancelMultiplicativeInverses",
      title: "Cancel multiplicative inverses",
      sourceObjectIds: [ids.afterDivide],
      targetObjectIds: [ids.coefficientCanceled],
      correspondence: [
        correspondence(ids.afterDivide, "lhs.variable", ids.coefficientCanceled, "lhs.variable"),
        correspondence(ids.afterDivide, "equals", ids.coefficientCanceled, "equals"),
        correspondence(ids.afterDivide, "rhs.reduced", ids.coefficientCanceled, "rhs.reduced"),
        correspondence(ids.afterDivide, "rhs.divide", ids.coefficientCanceled, "rhs.divide")
      ]
    }),
    createGeneratedAlgebraSemanticTransformation({
      familyId: "generated.linear-solve",
      id: ids.simplifyQuotient,
      transformType: "simplifyConstantQuotient",
      title: "Simplify the constant quotient",
      sourceObjectIds: [ids.coefficientCanceled],
      targetObjectIds: [ids.solved],
      correspondence: [
        correspondence(ids.coefficientCanceled, "lhs.variable", ids.solved, "lhs.variable"),
        correspondence(ids.coefficientCanceled, "equals", ids.solved, "equals")
      ]
    })
  ];
}

function createGeneratedLinearSolveTrace(
  input: GeneratedLinearSolveTutorialFixtureSpec & { readonly addend: number },
  ids: GeneratedLinearSolveIds,
  latex: GeneratedLinearSolveLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${input.title} generated algebra trace`,
    steps: [
      {
        id: `${ids.trace}.initial`,
        latex: latex.initial
      },
      {
        id: `${ids.trace}.after-subtract`,
        latex: latex.afterSubtract,
        transformationId: ids.subtract,
        rule: ids.firstTransformType
      },
      {
        id: `${ids.trace}.left-simplified`,
        latex: latex.leftSimplified,
        transformationId: ids.cancel,
        rule: "cancelAdditiveInverses"
      },
      {
        id: `${ids.trace}.solved`,
        latex: latex.solved,
        transformationId: ids.simplify,
        rule: ids.simplifyTransformType
      }
    ]
  };
}

function createGeneratedCoefficientSolveTrace(
  input: GeneratedLinearSolveTutorialFixtureSpec & { readonly coefficient: number },
  ids: GeneratedLinearSolveIds,
  latex: GeneratedLinearSolveLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${input.title} generated coefficient trace`,
    steps: [
      {
        id: `${ids.trace}.initial`,
        latex: latex.initial
      },
      {
        id: `${ids.trace}.after-divide`,
        latex: latex.afterSubtract,
        transformationId: ids.subtract,
        rule: "divideBothSides"
      },
      {
        id: `${ids.trace}.left-simplified`,
        latex: latex.leftSimplified,
        transformationId: ids.cancel,
        rule: "cancelMultiplicativeInverses"
      },
      {
        id: `${ids.trace}.solved`,
        latex: latex.solved,
        transformationId: ids.simplify,
        rule: "simplifyConstantQuotient"
      }
    ]
  };
}

function createGeneratedTwoStepSolveTrace(
  input: GeneratedLinearSolveTutorialFixtureSpec & {
    readonly addend: number;
    readonly coefficient: number;
  },
  ids: GeneratedTwoStepSolveIds,
  latex: GeneratedTwoStepSolveLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${input.title} generated two-step trace`,
    steps: [
      { id: `${ids.trace}.initial`, latex: latex.initial },
      {
        id: `${ids.trace}.after-subtract`,
        latex: latex.afterSubtract,
        transformationId: ids.subtract,
        rule: "subtractBothSides"
      },
      {
        id: `${ids.trace}.addend-canceled`,
        latex: latex.addendCanceled,
        transformationId: ids.cancelAddend,
        rule: "cancelAdditiveInverses"
      },
      {
        id: `${ids.trace}.constant-simplified`,
        latex: latex.constantSimplified,
        transformationId: ids.simplifyDifference,
        rule: "simplifyConstantDifference"
      },
      {
        id: `${ids.trace}.after-divide`,
        latex: latex.afterDivide,
        transformationId: ids.divide,
        rule: "divideBothSides"
      },
      {
        id: `${ids.trace}.coefficient-canceled`,
        latex: latex.coefficientCanceled,
        transformationId: ids.cancelCoefficient,
        rule: "cancelMultiplicativeInverses"
      },
      {
        id: `${ids.trace}.solved`,
        latex: latex.solved,
        transformationId: ids.simplifyQuotient,
        rule: "simplifyConstantQuotient"
      }
    ]
  };
}

function createGeneratedLinearSolveFlashcards(
  input: GeneratedLinearSolveTutorialFixtureSpec & { readonly addend: number },
  ids: GeneratedLinearSolveIds
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.cloze-addend`,
      kind: "cloze",
      title: "Hide the addend",
      assetId: ids.asset,
      prompt: "What term must be removed to isolate the variable?",
      selectorIds: [`${ids.initial}.lhs.addend`],
      answer: {
        kind: "text",
        value: formatSignedTerm(input.addend)
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.predict-subtract`,
      kind: "predict-next",
      title: "Predict the first transformation",
      assetId: ids.asset,
      prompt: "Which transformation preserves equality first?",
      transformationIds: [ids.subtract],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.subtract
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-cancel`,
      kind: "explain-transform",
      title: "Explain cancellation",
      assetId: ids.asset,
      prompt: "Why can the inverse terms disappear?",
      objectIds: [ids.afterSubtract, ids.leftSimplified],
      transformationIds: [ids.cancel],
      timeMs: 1200,
      answer: {
        kind: "text",
        value: "A term combined with its additive inverse simplifies to zero."
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.focus-variable-persistence`,
      kind: "focus-relationship",
      title: "Follow the variable",
      assetId: ids.asset,
      prompt: "Which selector represents the same variable in the solved equation?",
      selectorIds: [`${ids.initial}.lhs.variable`, `${ids.solved}.lhs.variable`],
      transformationIds: [ids.subtract, ids.cancel, ids.simplify],
      answer: {
        kind: "selector",
        value: `${ids.solved}.lhs.variable`
      }
    })
  ];
}

function createGeneratedCoefficientSolveFlashcards(
  input: GeneratedLinearSolveTutorialFixtureSpec & { readonly coefficient: number },
  ids: GeneratedLinearSolveIds
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.cloze-coefficient`,
      kind: "cloze",
      title: "Hide the coefficient",
      assetId: ids.asset,
      prompt: "What coefficient must be divided away to isolate the variable?",
      selectorIds: [`${ids.initial}.lhs.coefficient`],
      answer: {
        kind: "text",
        value: String(input.coefficient)
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.predict-divide`,
      kind: "predict-next",
      title: "Predict the first transformation",
      assetId: ids.asset,
      prompt: "Which transformation preserves equality first?",
      transformationIds: [ids.subtract],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.subtract
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-coefficient-cancel`,
      kind: "explain-transform",
      title: "Explain coefficient cancellation",
      assetId: ids.asset,
      prompt: "Why does dividing by the coefficient isolate the variable?",
      objectIds: [ids.afterSubtract, ids.leftSimplified],
      transformationIds: [ids.cancel],
      timeMs: 1200,
      answer: {
        kind: "text",
        value: "A non-zero factor divided by itself simplifies to one."
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.focus-variable-persistence`,
      kind: "focus-relationship",
      title: "Follow the variable",
      assetId: ids.asset,
      prompt: "Which selector represents the same variable in the solved equation?",
      selectorIds: [`${ids.initial}.lhs.variable`, `${ids.solved}.lhs.variable`],
      transformationIds: [ids.subtract, ids.cancel, ids.simplify],
      answer: {
        kind: "selector",
        value: `${ids.solved}.lhs.variable`
      }
    })
  ];
}

function createGeneratedTwoStepSolveFlashcards(
  input: GeneratedLinearSolveTutorialFixtureSpec & {
    readonly addend: number;
    readonly coefficient: number;
  },
  ids: GeneratedTwoStepSolveIds
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.cloze-addend`,
      kind: "cloze",
      title: "Hide the addend",
      assetId: ids.asset,
      prompt: "What term must be removed before dividing?",
      selectorIds: [`${ids.initial}.lhs.addend`],
      answer: {
        kind: "text",
        value: formatSignedTerm(input.addend)
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.cloze-coefficient`,
      kind: "cloze",
      title: "Hide the coefficient",
      assetId: ids.asset,
      prompt: "What coefficient must be divided away?",
      selectorIds: [`${ids.constantSimplified}.lhs.coefficient`],
      answer: {
        kind: "text",
        value: String(input.coefficient)
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.predict-subtract`,
      kind: "predict-next",
      title: "Predict the first transformation",
      assetId: ids.asset,
      prompt: "Which transformation preserves equality first?",
      transformationIds: [ids.subtract],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.subtract
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-additive-cancel`,
      kind: "explain-transform",
      title: "Explain additive cancellation",
      assetId: ids.asset,
      prompt: "Why can the addend and its inverse disappear?",
      objectIds: [ids.afterSubtract, ids.addendCanceled],
      transformationIds: [ids.cancelAddend],
      timeMs: 1200,
      answer: {
        kind: "text",
        value: "A term combined with its additive inverse simplifies to zero."
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.focus-variable-persistence`,
      kind: "focus-relationship",
      title: "Follow the variable",
      assetId: ids.asset,
      prompt: "Which selector represents the same variable in the solved equation?",
      selectorIds: [`${ids.initial}.lhs.variable`, `${ids.solved}.lhs.variable`],
      transformationIds: [
        ids.subtract,
        ids.cancelAddend,
        ids.simplifyDifference,
        ids.divide,
        ids.cancelCoefficient,
        ids.simplifyQuotient
      ],
      answer: {
        kind: "selector",
        value: `${ids.solved}.lhs.variable`
      }
    })
  ];
}

function createGeneratedAdditiveCancellationDrillDownHook(
  input: GeneratedLinearSolveTutorialFixtureSpec & { readonly addend: number },
  transformationId: string
): KpTransformationDrillDownHook {
  const lawObjectId = `equation.${input.id}.cancel-additive-inverse-law`;
  const instantiatedObjectId =
    `equation.${input.id}.cancel-additive-inverse-instantiated`;
  const addend = formatLatexNumber(input.addend);
  const inverse = formatLatexNumber(-input.addend);

  return createKpTransformationDrillDownHook({
    id: `drilldown.${input.id}.cancel-additive-inverse`,
    transformationId,
    title: "Explain additive inverse cancellation",
    summary:
      "Shows why a term and its additive inverse can collapse to zero.",
    asset: createKpAssetBundle({
      id: `asset.${input.id}.cancel-additive-inverse-explainer`,
      title: "Why additive inverses cancel",
      objects: [
        equationObject(lawObjectId, "Additive inverse identity", "a + (-a) = 0", [
          selector(lawObjectId, "lhs.term", "term", "a"),
          selector(lawObjectId, "lhs.inverse", "term", "-a"),
          selector(lawObjectId, "rhs.zero", "term", "0")
        ]),
        equationObject(
          instantiatedObjectId,
          "Generated additive inverse cancellation",
          `${addend} + (${inverse}) = 0`,
          [
            selector(instantiatedObjectId, "lhs.term", "term", addend),
            selector(instantiatedObjectId, "lhs.inverse", "term", inverse),
            selector(instantiatedObjectId, "rhs.zero", "term", "0")
          ]
        )
      ]
    })
  });
}

function createGeneratedMultiplicativeCancellationDrillDownHook(
  input: GeneratedLinearSolveTutorialFixtureSpec & {
    readonly coefficient: number;
  },
  transformationId: string
): KpTransformationDrillDownHook {
  const lawObjectId = `equation.${input.id}.cancel-multiplicative-inverse-law`;
  const instantiatedObjectId =
    `equation.${input.id}.cancel-multiplicative-inverse-instantiated`;
  const coefficient = formatLatexNumber(input.coefficient);

  return createKpTransformationDrillDownHook({
    id: `drilldown.${input.id}.cancel-multiplicative-inverse`,
    transformationId,
    title: "Explain multiplicative inverse cancellation",
    summary:
      "Shows why a non-zero factor divided by itself leaves the variable isolated.",
    asset: createKpAssetBundle({
      id: `asset.${input.id}.cancel-multiplicative-inverse-explainer`,
      title: "Why multiplicative inverses cancel",
      objects: [
        equationObject(lawObjectId, "Multiplicative inverse identity", "a / a = 1", [
          selector(lawObjectId, "lhs.factor", "factor", "a"),
          selector(lawObjectId, "lhs.inverse", "factor", "/a"),
          selector(lawObjectId, "rhs.one", "term", "1")
        ]),
        equationObject(
          instantiatedObjectId,
          "Generated coefficient cancellation",
          `${coefficient}${input.variable} / ${coefficient} = ${input.variable}`,
          [
            selector(
              instantiatedObjectId,
              "lhs.coefficient",
              "factor",
              coefficient
            ),
            selector(
              instantiatedObjectId,
              "lhs.variable",
              "term",
              input.variable
            ),
            selector(
              instantiatedObjectId,
              "lhs.inverse",
              "factor",
              `/${coefficient}`
            ),
            selector(
              instantiatedObjectId,
              "rhs.variable",
              "term",
              input.variable
            )
          ]
        )
      ]
    })
  });
}

interface GeneratedLinearSolveIds {
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly afterSubtract: string;
  readonly leftSimplified: string;
  readonly solved: string;
  readonly subtract: string;
  readonly cancel: string;
  readonly simplify: string;
  readonly firstTransformType: string;
  readonly firstTransformTitle: string;
  readonly firstTransformAssumption: string;
  readonly firstTransformLawId: string;
  readonly simplifyTransformType: string;
  readonly simplifyTransformTitle: string;
  readonly simplifyTransformAssumption: string;
  readonly simplifyTransformLawId: string;
}

function generatedLinearSolveIds(
  input: GeneratedLinearSolveTutorialFixtureSpec & { readonly addend: number }
): GeneratedLinearSolveIds {
  const id = input.id;
  const positiveAddend = input.addend > 0;

  return {
    asset: `asset.${id}`,
    diagram: `diagram.${id}.sequence`,
    trace: `trace.${id}`,
    initial: `equation.${id}.initial`,
    afterSubtract: `equation.${id}.after-subtract`,
    leftSimplified: `equation.${id}.left-simplified`,
    solved: `equation.${id}.solved`,
    subtract: `transform.${id}.${positiveAddend ? "subtract-addend" : "add-inverse"}`,
    cancel: `transform.${id}.cancel-additive-inverse`,
    simplify: `transform.${id}.${positiveAddend ? "simplify-difference" : "simplify-sum"}`,
    firstTransformType: positiveAddend ? "subtractBothSides" : "addBothSides",
    firstTransformTitle: positiveAddend
      ? "Subtract the addend from both sides"
      : "Add the inverse to both sides",
    firstTransformAssumption: positiveAddend
      ? "Subtracting equal quantities preserves equality."
      : "Adding equal quantities preserves equality.",
    firstTransformLawId: positiveAddend
      ? "law.equation.subtract-both-sides"
      : "law.equation.add-both-sides",
    simplifyTransformType: positiveAddend
      ? "simplifyConstantDifference"
      : "simplifyConstantSum",
    simplifyTransformTitle: positiveAddend
      ? "Simplify the constant difference"
      : "Simplify the constant sum",
    simplifyTransformAssumption: positiveAddend
      ? "The right-hand constant difference evaluates to the solution."
      : "The right-hand constant sum evaluates to the solution.",
    simplifyTransformLawId: positiveAddend
      ? "law.arithmetic.constant-difference"
      : "law.arithmetic.constant-sum"
  };
}

function generatedCoefficientSolveIds(
  input: GeneratedLinearSolveTutorialFixtureSpec & { readonly coefficient: number }
): GeneratedLinearSolveIds {
  const id = input.id;

  return {
    asset: `asset.${id}`,
    diagram: `diagram.${id}.sequence`,
    trace: `trace.${id}`,
    initial: `equation.${id}.initial`,
    afterSubtract: `equation.${id}.after-divide`,
    leftSimplified: `equation.${id}.left-simplified`,
    solved: `equation.${id}.solved`,
    subtract: `transform.${id}.divide-coefficient`,
    cancel: `transform.${id}.cancel-multiplicative-inverse`,
    simplify: `transform.${id}.simplify-quotient`,
    firstTransformType: "divideBothSides",
    firstTransformTitle: "Divide both sides by the coefficient",
    firstTransformAssumption:
      "Dividing equal quantities by the same non-zero value preserves equality.",
    firstTransformLawId: "law.equation.divide-both-sides",
    simplifyTransformType: "simplifyConstantQuotient",
    simplifyTransformTitle: "Simplify the constant quotient",
    simplifyTransformAssumption:
      "The right-hand constant quotient evaluates to the solution.",
    simplifyTransformLawId: "law.arithmetic.constant-quotient"
  };
}

interface GeneratedTwoStepSolveIds {
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly afterSubtract: string;
  readonly addendCanceled: string;
  readonly constantSimplified: string;
  readonly afterDivide: string;
  readonly coefficientCanceled: string;
  readonly solved: string;
  readonly subtract: string;
  readonly cancelAddend: string;
  readonly simplifyDifference: string;
  readonly divide: string;
  readonly cancelCoefficient: string;
  readonly simplifyQuotient: string;
}

function generatedTwoStepSolveIds(
  input: GeneratedLinearSolveTutorialFixtureSpec & {
    readonly addend: number;
    readonly coefficient: number;
  }
): GeneratedTwoStepSolveIds {
  const id = input.id;

  return {
    asset: `asset.${id}`,
    diagram: `diagram.${id}.sequence`,
    trace: `trace.${id}`,
    initial: `equation.${id}.initial`,
    afterSubtract: `equation.${id}.after-subtract`,
    addendCanceled: `equation.${id}.addend-canceled`,
    constantSimplified: `equation.${id}.constant-simplified`,
    afterDivide: `equation.${id}.after-divide`,
    coefficientCanceled: `equation.${id}.coefficient-canceled`,
    solved: `equation.${id}.solved`,
    subtract: `transform.${id}.subtract-addend`,
    cancelAddend: `transform.${id}.cancel-additive-inverse`,
    simplifyDifference: `transform.${id}.simplify-difference`,
    divide: `transform.${id}.divide-coefficient`,
    cancelCoefficient: `transform.${id}.cancel-multiplicative-inverse`,
    simplifyQuotient: `transform.${id}.simplify-quotient`
  };
}

interface GeneratedFractionExpressionIds {
  readonly baseId: string;
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly factored: string;
  readonly commonFactor: string;
  readonly simplified: string;
  readonly split: string;
  readonly merge: string;
  readonly simplify: string;
}

function generatedFractionExpressionIds(
  input: GeneratedFractionExpressionTutorialFixtureSpec
): GeneratedFractionExpressionIds {
  const id = input.id;

  return {
    baseId: id,
    asset: `asset.${id}`,
    diagram: `diagram.${id}.sequence`,
    trace: `trace.${id}`,
    initial: `expression.${id}.initial`,
    factored: `expression.${id}.factored`,
    commonFactor: `expression.${id}.common-factor`,
    simplified: `expression.${id}.simplified`,
    split: `transform.${id}.split-factors`,
    merge: `transform.${id}.merge-common-factor`,
    simplify: `transform.${id}.simplify-unit-factor`
  };
}

interface GeneratedExponentIds {
  readonly baseId: string;
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly lowered: string;
  readonly expanded: string;
  readonly lower: string;
  readonly unwrap: string;
}

function generatedExponentIds(
  input: GeneratedExponentTutorialFixtureSpec
): GeneratedExponentIds {
  const id = input.id;

  return {
    baseId: id,
    asset: `asset.${id}`,
    diagram: `diagram.${id}.sequence`,
    trace: `trace.${id}`,
    initial: `expression.${id}.initial`,
    lowered: `expression.${id}.lowered`,
    expanded: `expression.${id}.expanded`,
    lower: `transform.${id}.lower-exponent`,
    unwrap: `transform.${id}.unwrap-unit-exponent`
  };
}

interface GeneratedRadicalIds {
  readonly baseId: string;
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly power: string;
  readonly radical: string;
  readonly rewrite: string;
}

function generatedRadicalIds(
  input: GeneratedRadicalTutorialFixtureSpec
): GeneratedRadicalIds {
  const id = input.id;

  return {
    baseId: id,
    asset: `asset.${id}`,
    diagram: `diagram.${id}.sequence`,
    trace: `trace.${id}`,
    power: `expression.${id}.power`,
    radical: `expression.${id}.radical`,
    rewrite: `transform.${id}.rewrite-power-as-root`
  };
}

interface GeneratedFunctionWrapIds {
  readonly baseId: string;
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly input: string;
  readonly wrapped: string;
  readonly wrap: string;
}

function generatedFunctionWrapIds(
  input: GeneratedFunctionWrapTutorialFixtureSpec
): GeneratedFunctionWrapIds {
  const id = input.id;

  return {
    baseId: id,
    asset: `asset.${id}`,
    diagram: `diagram.${id}.sequence`,
    trace: `trace.${id}`,
    input: `expression.${id}.input`,
    wrapped: `expression.${id}.wrapped`,
    wrap: `transform.${id}.wrap-function`
  };
}

interface GeneratedDistributionIds {
  readonly baseId: string;
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly factored: string;
  readonly expanded: string;
  readonly transform: string;
}

function generatedDistributionIds(
  input: GeneratedDistributionTutorialFixtureSpec
): GeneratedDistributionIds {
  const id = input.id;

  return {
    baseId: id,
    asset: `asset.${id}`,
    diagram: `diagram.${id}.sequence`,
    trace: `trace.${id}`,
    factored: `expression.${id}.factored`,
    expanded: `expression.${id}.expanded`,
    transform: `transform.${id}.${input.direction === "distribute" ? "distribute" : "factor"}`
  };
}

interface GeneratedLinearSolveLatex {
  readonly rhs: number;
  readonly initial: string;
  readonly afterSubtract: string;
  readonly leftSimplified: string;
  readonly solved: string;
}

function generatedLinearSolveLatex(
  input: GeneratedLinearSolveTutorialFixtureSpec & { readonly addend: number }
): GeneratedLinearSolveLatex {
  const rhs = input.solution + input.addend;
  const rhsLatex = formatLatexNumber(rhs);
  const addendTerm = formatLatexSignedTerm(input.addend);
  const inverseTerm = formatLatexSignedTerm(-input.addend);

  return {
    rhs,
    initial: `${input.variable} ${addendTerm} = ${rhsLatex}`,
    afterSubtract: `${input.variable} ${addendTerm} ${inverseTerm} = ${rhsLatex} ${inverseTerm}`,
    leftSimplified: `${input.variable} = ${rhsLatex} ${inverseTerm}`,
    solved: `${input.variable} = ${formatLatexNumber(input.solution)}`
  };
}

interface GeneratedTwoStepSolveLatex {
  readonly initial: string;
  readonly afterSubtract: string;
  readonly addendCanceled: string;
  readonly constantSimplified: string;
  readonly afterDivide: string;
  readonly coefficientCanceled: string;
  readonly solved: string;
}

interface GeneratedFractionExpressionLatex {
  readonly initial: string;
  readonly factored: string;
  readonly commonFactor: string;
  readonly simplified: string;
}

interface GeneratedExponentLatex {
  readonly initial: string;
  readonly lowered: string;
  readonly expanded: string;
}

interface GeneratedRadicalLatex {
  readonly power: string;
  readonly radical: string;
}

function generatedRadicalLatex(
  input: GeneratedRadicalTutorialFixtureSpec
): GeneratedRadicalLatex {
  const numerator = formatLatexNumber(input.exponentNumerator);
  const denominator = formatLatexNumber(input.index);
  const power = `${input.base}^{\\frac{${numerator}}{${denominator}}}`;

  if (input.index === 2 && input.exponentNumerator === 1) {
    return {
      power,
      radical: `\\sqrt{${input.base}}`
    };
  }

  if (input.exponentNumerator === 1) {
    return {
      power,
      radical: `\\sqrt[${denominator}]{${input.base}}`
    };
  }

  return {
    power,
    radical: `\\sqrt[${denominator}]{${input.base}^{${numerator}}}`
  };
}

interface GeneratedFunctionWrapLatex {
  readonly input: string;
  readonly wrapped: string;
}

function generatedFunctionWrapLatex(
  input: GeneratedFunctionWrapTutorialFixtureSpec
): GeneratedFunctionWrapLatex {
  return {
    input: input.input,
    wrapped: `${input.functionName}(${input.input})`
  };
}

interface GeneratedDistributionLatex {
  readonly factored: string;
  readonly expanded: string;
}

function generatedDistributionLatex(
  input: GeneratedDistributionTutorialFixtureSpec
): GeneratedDistributionLatex {
  return {
    factored: `${input.factor}(${input.leftTerm} + ${input.rightTerm})`,
    expanded: `${input.factor}${input.leftTerm} + ${input.factor}${input.rightTerm}`
  };
}

function equationObject(
  id: string,
  title: string,
  latex: string,
  selectors: readonly CreateKpAssetSelectorInput[]
) {
  return createKpSemanticAssetObject({
    id,
    objectType: "equation",
    title,
    value: { latex },
    selectors
  });
}

function expressionObject(
  id: string,
  title: string,
  latex: string,
  selectors: readonly CreateKpAssetSelectorInput[]
) {
  return createKpSemanticAssetObject({
    id,
    objectType: "expression",
    title,
    value: { latex },
    selectors
  });
}

function selector(
  objectId: string,
  suffix: string,
  kind: string,
  label: string
): CreateKpAssetSelectorInput {
  return {
    id: `${objectId}.${suffix}`,
    kind,
    label
  };
}

function correspondence(
  sourceObjectId: string,
  sourceSuffix: string,
  targetObjectId: string,
  targetSuffix: string
) {
  return {
    sourceSelectorId: `${sourceObjectId}.${sourceSuffix}`,
    targetSelectorId: `${targetObjectId}.${targetSuffix}`,
    preserves: ["identity" as const]
  };
}

function selectorId(objectId: string, suffix: string): string {
  return `${objectId}.${suffix}`;
}

function lifecycle(
  id: string,
  relation: "identity" | "role-change" | "introduction" | "removal" | "cancelation" | "fan-in" | "fan-out",
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[],
  summary: string
) {
  return { id, relation, sourceSelectorIds, targetSelectorIds, summary };
}

function formatSignedTerm(value: number): string {
  return `${value > 0 ? "+" : "-"}${formatPlainNumber(Math.abs(value))}`;
}

function formatLatexSignedTerm(value: number): string {
  return `${value > 0 ? "+" : "-"} ${formatLatexNumber(Math.abs(value))}`;
}

function formatLatexNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  const doubled = value * 2;

  if (Number.isInteger(doubled)) {
    return `\\frac{${doubled}}{2}`;
  }

  return String(value);
}

function formatPlainNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  const doubled = value * 2;

  if (Number.isInteger(doubled)) {
    return `${doubled}/2`;
  }

  return String(value);
}

function fractionLatex(numerator: number, denominator: number): string {
  return `\\frac{${formatLatexNumber(numerator)}}{${formatLatexNumber(denominator)}}`;
}

function fractionProductLatex(
  numeratorBase: number,
  numeratorFactor: number,
  denominatorBase: number,
  denominatorFactor: number
): string {
  return `\\frac{${formatLatexNumber(numeratorBase)} \\cdot ${formatLatexNumber(numeratorFactor)}}{${formatLatexNumber(denominatorBase)} \\cdot ${formatLatexNumber(denominatorFactor)}}`;
}

function generatedFractionCommonFactor(
  input: GeneratedFractionExpressionTutorialFixtureSpec
): number {
  const numeratorFactor = input.numerator / input.simplifiedNumerator;
  const denominatorFactor = input.denominator / input.simplifiedDenominator;

  if (
    !Number.isInteger(numeratorFactor) ||
    !Number.isInteger(denominatorFactor) ||
    numeratorFactor !== denominatorFactor ||
    numeratorFactor === 0
  ) {
    throw new Error(
      `Generated fraction fixture ${input.id} must simplify by one non-zero integer common factor.`
    );
  }

  return numeratorFactor;
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

function assertNonZeroInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value === 0) {
    throw new Error(`${label} must be a non-zero integer.`);
  }
}

function assertNonZeroNumber(value: number, label: string): void {
  if (!Number.isFinite(value) || value === 0) {
    throw new Error(`${label} must be a non-zero number.`);
  }
}
