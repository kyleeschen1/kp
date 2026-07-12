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
  createKpFlashcardSpec,
  type KpFlashcardSpec
} from "./asset-flashcard.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import type { AlgebraTraceFixture } from "./algebra-trace-port-fixture.ts";
import {
  generatedLinearSolveTutorialFixtureSpecs,
  type GeneratedLinearSolveTutorialFixtureSpec
} from "./generated-algebra-fixture-registry.ts";

export type {
  GeneratedLinearSolveTutorialFixtureSpec,
  GeneratedLinearSolveTutorialFixtureSpec as CreateGeneratedLinearSolveTutorialFixtureInput
} from "./generated-algebra-fixture-registry.ts";

export {
  generatedLinearSolveTutorialFixtureSpecs,
  getGeneratedLinearSolveTutorialFixtureSpec,
  listGeneratedLinearSolveTutorialFixtureSpecs
} from "./generated-algebra-fixture-registry.ts";

export interface GeneratedLinearSolveTutorialFixture {
  readonly id: string;
  readonly title: string;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly diagram: KpSemanticDiagramSequence;
  readonly trace: AlgebraTraceFixture;
  readonly flashcards: readonly KpFlashcardSpec[];
}

export function createGeneratedLinearSolveTutorialFixtures():
  readonly GeneratedLinearSolveTutorialFixture[] {
  return generatedLinearSolveTutorialFixtureSpecs.map(
    createGeneratedLinearSolveTutorialFixture
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
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedLinearSolveTrace(additiveInput, ids, latex),
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
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedCoefficientSolveTrace(input, ids, latex),
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
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedTwoStepSolveTrace(input, ids, latex),
    flashcards: createGeneratedTwoStepSolveFlashcards(input, ids)
  };
}

function createGeneratedLinearSolveTransformations(
  ids: GeneratedLinearSolveIds
): readonly KpSemanticTransformation[] {
  return [
    createKpSemanticTransformation({
      id: ids.subtract,
      transformType: ids.firstTransformType,
      title: ids.firstTransformTitle,
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.afterSubtract],
      preserves: ["value", "structure"],
      assumptions: [ids.firstTransformAssumption],
      lawRefs: [{ id: ids.firstTransformLawId, level: "strict" }],
      correspondence: [
        correspondence(ids.initial, "lhs.variable", ids.afterSubtract, "lhs.variable"),
        correspondence(ids.initial, "lhs.addend", ids.afterSubtract, "lhs.addend"),
        correspondence(ids.initial, "equals", ids.afterSubtract, "equals"),
        correspondence(ids.initial, "rhs.value", ids.afterSubtract, "rhs.value")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.cancel,
      transformType: "cancelAdditiveInverses",
      title: "Cancel additive inverses",
      sourceObjectIds: [ids.afterSubtract],
      targetObjectIds: [ids.leftSimplified],
      preserves: ["value"],
      assumptions: ["A term plus its additive inverse simplifies to zero."],
      lawRefs: [{ id: "law.algebra.additive-inverse", level: "strict" }],
      correspondence: [
        correspondence(ids.afterSubtract, "lhs.variable", ids.leftSimplified, "lhs.variable"),
        correspondence(ids.afterSubtract, "equals", ids.leftSimplified, "equals"),
        correspondence(ids.afterSubtract, "rhs.value", ids.leftSimplified, "rhs.value"),
        correspondence(ids.afterSubtract, "rhs.subtract", ids.leftSimplified, "rhs.subtract")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.simplify,
      transformType: ids.simplifyTransformType,
      title: ids.simplifyTransformTitle,
      sourceObjectIds: [ids.leftSimplified],
      targetObjectIds: [ids.solved],
      preserves: ["value"],
      assumptions: [ids.simplifyTransformAssumption],
      lawRefs: [{ id: ids.simplifyTransformLawId, level: "strict" }],
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
    createKpSemanticTransformation({
      id: ids.subtract,
      transformType: "divideBothSides",
      title: "Divide both sides by the coefficient",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.afterSubtract],
      preserves: ["value", "structure"],
      assumptions: ["Dividing equal quantities by the same non-zero value preserves equality."],
      lawRefs: [{ id: "law.equation.divide-both-sides", level: "strict" }],
      correspondence: [
        correspondence(ids.initial, "lhs.coefficient", ids.afterSubtract, "lhs.coefficient"),
        correspondence(ids.initial, "lhs.variable", ids.afterSubtract, "lhs.variable"),
        correspondence(ids.initial, "equals", ids.afterSubtract, "equals"),
        correspondence(ids.initial, "rhs.value", ids.afterSubtract, "rhs.value")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.cancel,
      transformType: "cancelMultiplicativeInverses",
      title: "Cancel multiplicative inverses",
      sourceObjectIds: [ids.afterSubtract],
      targetObjectIds: [ids.leftSimplified],
      preserves: ["value"],
      assumptions: ["A non-zero factor divided by itself simplifies to one."],
      lawRefs: [{ id: "law.algebra.multiplicative-inverse", level: "strict" }],
      correspondence: [
        correspondence(ids.afterSubtract, "lhs.variable", ids.leftSimplified, "lhs.variable"),
        correspondence(ids.afterSubtract, "equals", ids.leftSimplified, "equals"),
        correspondence(ids.afterSubtract, "rhs.value", ids.leftSimplified, "rhs.value"),
        correspondence(ids.afterSubtract, "rhs.divide", ids.leftSimplified, "rhs.divide")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.simplify,
      transformType: "simplifyConstantQuotient",
      title: "Simplify the constant quotient",
      sourceObjectIds: [ids.leftSimplified],
      targetObjectIds: [ids.solved],
      preserves: ["value"],
      assumptions: ["The right-hand constant quotient evaluates to the solution."],
      lawRefs: [{ id: "law.arithmetic.constant-quotient", level: "strict" }],
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
    createKpSemanticTransformation({
      id: ids.subtract,
      transformType: "subtractBothSides",
      title: "Subtract the addend from both sides",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.afterSubtract],
      preserves: ["value", "structure"],
      assumptions: ["Subtracting equal quantities preserves equality."],
      lawRefs: [{ id: "law.equation.subtract-both-sides", level: "strict" }],
      correspondence: [
        correspondence(ids.initial, "lhs.coefficient", ids.afterSubtract, "lhs.coefficient"),
        correspondence(ids.initial, "lhs.variable", ids.afterSubtract, "lhs.variable"),
        correspondence(ids.initial, "lhs.addend", ids.afterSubtract, "lhs.addend"),
        correspondence(ids.initial, "equals", ids.afterSubtract, "equals"),
        correspondence(ids.initial, "rhs.value", ids.afterSubtract, "rhs.value")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.cancelAddend,
      transformType: "cancelAdditiveInverses",
      title: "Cancel additive inverses",
      sourceObjectIds: [ids.afterSubtract],
      targetObjectIds: [ids.addendCanceled],
      preserves: ["value"],
      assumptions: ["A term plus its additive inverse simplifies to zero."],
      lawRefs: [{ id: "law.algebra.additive-inverse", level: "strict" }],
      correspondence: [
        correspondence(ids.afterSubtract, "lhs.coefficient", ids.addendCanceled, "lhs.coefficient"),
        correspondence(ids.afterSubtract, "lhs.variable", ids.addendCanceled, "lhs.variable"),
        correspondence(ids.afterSubtract, "equals", ids.addendCanceled, "equals"),
        correspondence(ids.afterSubtract, "rhs.value", ids.addendCanceled, "rhs.value"),
        correspondence(ids.afterSubtract, "rhs.subtract", ids.addendCanceled, "rhs.subtract")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.simplifyDifference,
      transformType: "simplifyConstantDifference",
      title: "Simplify the constant difference",
      sourceObjectIds: [ids.addendCanceled],
      targetObjectIds: [ids.constantSimplified],
      preserves: ["value"],
      assumptions: ["The right-hand constant difference evaluates to the remaining product."],
      lawRefs: [{ id: "law.arithmetic.constant-difference", level: "strict" }],
      correspondence: [
        correspondence(ids.addendCanceled, "lhs.coefficient", ids.constantSimplified, "lhs.coefficient"),
        correspondence(ids.addendCanceled, "lhs.variable", ids.constantSimplified, "lhs.variable"),
        correspondence(ids.addendCanceled, "equals", ids.constantSimplified, "equals")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.divide,
      transformType: "divideBothSides",
      title: "Divide both sides by the coefficient",
      sourceObjectIds: [ids.constantSimplified],
      targetObjectIds: [ids.afterDivide],
      preserves: ["value", "structure"],
      assumptions: ["Dividing equal quantities by the same non-zero value preserves equality."],
      lawRefs: [{ id: "law.equation.divide-both-sides", level: "strict" }],
      correspondence: [
        correspondence(ids.constantSimplified, "lhs.coefficient", ids.afterDivide, "lhs.coefficient"),
        correspondence(ids.constantSimplified, "lhs.variable", ids.afterDivide, "lhs.variable"),
        correspondence(ids.constantSimplified, "equals", ids.afterDivide, "equals"),
        correspondence(ids.constantSimplified, "rhs.reduced", ids.afterDivide, "rhs.reduced")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.cancelCoefficient,
      transformType: "cancelMultiplicativeInverses",
      title: "Cancel multiplicative inverses",
      sourceObjectIds: [ids.afterDivide],
      targetObjectIds: [ids.coefficientCanceled],
      preserves: ["value"],
      assumptions: ["A non-zero factor divided by itself simplifies to one."],
      lawRefs: [{ id: "law.algebra.multiplicative-inverse", level: "strict" }],
      correspondence: [
        correspondence(ids.afterDivide, "lhs.variable", ids.coefficientCanceled, "lhs.variable"),
        correspondence(ids.afterDivide, "equals", ids.coefficientCanceled, "equals"),
        correspondence(ids.afterDivide, "rhs.reduced", ids.coefficientCanceled, "rhs.reduced"),
        correspondence(ids.afterDivide, "rhs.divide", ids.coefficientCanceled, "rhs.divide")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.simplifyQuotient,
      transformType: "simplifyConstantQuotient",
      title: "Simplify the constant quotient",
      sourceObjectIds: [ids.coefficientCanceled],
      targetObjectIds: [ids.solved],
      preserves: ["value"],
      assumptions: ["The right-hand constant quotient evaluates to the solution."],
      lawRefs: [{ id: "law.arithmetic.constant-quotient", level: "strict" }],
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
    })
  ];
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
