import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type CreateKpAssetSelectorInput
} from "./asset.ts";
import {
  createKpSemanticDiagramSequence,
  createKpTransformationDiagramLeaf
} from "./asset-diagram.ts";
import { createKpFlashcardSpec, type KpFlashcardSpec } from "./asset-flashcard.ts";
import { createKpSemanticTransformation } from "./asset-transformation.ts";
import type { AlgebraTraceFixture } from "./algebra-trace-port-fixture.ts";
import type { GeneratedProblemAnimationFixture } from "./generated-problem-fixture.ts";

export type GeneratedCalculusProblemFamilyId =
  | "generated.calculus.derivative"
  | "generated.calculus.integral";

export interface GeneratedDerivativeProblemFixtureSpec {
  readonly familyId: "generated.calculus.derivative";
  readonly id: string;
  readonly title: string;
  readonly variable: string;
  readonly base: string;
  readonly exponent: number;
}

export interface GeneratedCalculusPolynomialTermSpec {
  readonly coefficient: number;
  readonly base: string;
  readonly exponent: number;
}

export interface GeneratedDerivativeSumProblemFixtureSpec {
  readonly familyId: "generated.calculus.derivative";
  readonly id: string;
  readonly title: string;
  readonly variable: string;
  readonly terms: readonly GeneratedCalculusPolynomialTermSpec[];
}

export interface GeneratedIntegralPowerProblemFixtureSpec {
  readonly familyId: "generated.calculus.integral";
  readonly id: string;
  readonly title: string;
  readonly variable: string;
  readonly base: string;
  readonly coefficient: number;
  readonly exponent: number;
}

export type GeneratedCalculusProblemFixtureSpec =
  | GeneratedDerivativeProblemFixtureSpec
  | GeneratedDerivativeSumProblemFixtureSpec
  | GeneratedIntegralPowerProblemFixtureSpec;

export interface GeneratedCalculusProblemFixture
  extends GeneratedProblemAnimationFixture {
  readonly familyId: GeneratedCalculusProblemFamilyId;
}

export const generatedCalculusProblemFixtureSpecs:
  readonly GeneratedCalculusProblemFixtureSpec[] = [
    {
      familyId: "generated.calculus.derivative",
      id: "generated.calculus.derivative.power-rule-x-cubed",
      title: "Generated derivative power rule for x cubed",
      variable: "x",
      base: "x",
      exponent: 3
    },
    {
      familyId: "generated.calculus.derivative",
      id: "generated.calculus.derivative.sum-rule-polynomial",
      title: "Generated derivative sum rule for a polynomial",
      variable: "x",
      terms: [
        { coefficient: 1, base: "x", exponent: 3 },
        { coefficient: 2, base: "x", exponent: 1 }
      ]
    },
    {
      familyId: "generated.calculus.integral",
      id: "generated.calculus.integral.power-rule-quadratic",
      title: "Generated integral power rule for a quadratic",
      variable: "x",
      base: "x",
      coefficient: 6,
      exponent: 2
    }
  ];

export function listGeneratedCalculusProblemFixtureSpecs():
  readonly GeneratedCalculusProblemFixtureSpec[] {
  return generatedCalculusProblemFixtureSpecs;
}

export function getGeneratedCalculusProblemFixtureSpec(
  id: string
): GeneratedCalculusProblemFixtureSpec | undefined {
  return generatedCalculusProblemFixtureSpecs.find((spec) => spec.id === id);
}

export function createGeneratedCalculusProblemFixtures():
  readonly GeneratedCalculusProblemFixture[] {
  return generatedCalculusProblemFixtureSpecs.map(
    createGeneratedCalculusProblemFixture
  );
}

export function createGeneratedCalculusProblemFixture(
  fixtureOrId: GeneratedCalculusProblemFixtureSpec | string
): GeneratedCalculusProblemFixture {
  const spec =
    typeof fixtureOrId === "string"
      ? getGeneratedCalculusProblemFixtureSpec(fixtureOrId)
      : fixtureOrId;

  if (spec === undefined) {
    throw new Error(`Unknown generated calculus fixture: ${fixtureOrId}`);
  }

  if (spec.familyId === "generated.calculus.integral") {
    return createGeneratedIntegralPowerProblemFixture(spec);
  }

  if ("terms" in spec) {
    return createGeneratedDerivativeSumProblemFixture(spec);
  }

  return createGeneratedDerivativeProblemFixture(spec);
}

function createGeneratedDerivativeProblemFixture(
  input: GeneratedDerivativeProblemFixtureSpec
): GeneratedCalculusProblemFixture {
  assertNonEmpty(input.id, "Generated calculus fixture id");
  assertNonEmpty(input.title, `Generated calculus fixture ${input.id} title`);
  assertNonEmpty(input.variable, `Generated calculus fixture ${input.id} variable`);
  assertNonEmpty(input.base, `Generated calculus fixture ${input.id} base`);

  if (!Number.isInteger(input.exponent) || input.exponent < 2) {
    throw new Error(
      `Generated calculus fixture ${input.id} exponent must be an integer greater than one.`
    );
  }

  const ids = generatedDerivativeProblemIds(input);
  const latex = generatedDerivativeProblemLatex(input);
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(
        ids.initial,
        "Derivative expression",
        latex.initial,
        [
          selector(ids.initial, "operator", "operator", "d/dx"),
          selector(ids.initial, "operator-variable", "term", input.variable),
          selector(ids.initial, "base", "term", input.base),
          selector(ids.initial, "exponent", "term", String(input.exponent))
        ]
      ),
      expressionObject(
        ids.derived,
        "After applying the power rule",
        latex.derived,
        [
          selector(ids.derived, "coefficient", "term", String(input.exponent)),
          selector(ids.derived, "base", "term", input.base),
          selector(ids.derived, "exponent", "term", String(input.exponent - 1))
        ]
      )
    ]
  });
  const transformations = [
    createKpSemanticTransformation({
      id: ids.transform,
      definitionId: "definition.generated.calculus.derivative.power-rule",
      transformType: "applyDerivativePowerRule",
      title: "Apply the derivative power rule",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.derived],
      preserves: ["value", "structure"],
      correspondence: [
        {
          sourceSelectorId: `${ids.initial}.base`,
          targetSelectorId: `${ids.derived}.base`,
          preserves: ["identity", "role"],
          summary: "The base variable persists as the differentiated variable."
        },
        {
          sourceSelectorId: `${ids.initial}.exponent`,
          targetSelectorId: `${ids.derived}.coefficient`,
          preserves: ["value"],
          summary: "The original exponent becomes the coefficient."
        }
      ],
      assumptions: [
        "The exponent is a positive integer.",
        "The derivative is taken with respect to the base variable."
      ],
      lawRefs: [
        {
          id: "law.calculus.derivative.power-rule",
          level: "strict"
        }
      ]
    })
  ];
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.calculus.derivative",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedDerivativeProblemTrace(ids, latex),
    drillDownHooks: [],
    flashcards: createGeneratedDerivativeProblemFlashcards(input, ids)
  };
}

function createGeneratedDerivativeSumProblemFixture(
  input: GeneratedDerivativeSumProblemFixtureSpec
): GeneratedCalculusProblemFixture {
  assertNonEmpty(input.id, "Generated calculus fixture id");
  assertNonEmpty(input.title, `Generated calculus fixture ${input.id} title`);
  assertNonEmpty(input.variable, `Generated calculus fixture ${input.id} variable`);
  validatePolynomialTerms(input);

  const ids = generatedDerivativeSumProblemIds(input);
  const latex = generatedDerivativeSumProblemLatex(input);
  const derivativeTerms = derivativeTermsFor(input.terms);
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(
        ids.initial,
        "Derivative of a sum",
        latex.initial,
        [
          selector(ids.initial, "operator", "operator", "d/dx"),
          ...calculusTermSelectors(ids.initial, "term", input.terms)
        ]
      ),
      expressionObject(
        ids.derived,
        "After applying the derivative sum rule",
        latex.derived,
        calculusTermSelectors(ids.derived, "derived.term", derivativeTerms)
      )
    ]
  });
  const transformations = [
    createKpSemanticTransformation({
      id: ids.transform,
      definitionId: "definition.generated.calculus.derivative.sum-rule",
      transformType: "applyDerivativeSumRule",
      title: "Apply the derivative sum rule",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.derived],
      preserves: ["value", "structure"],
      correspondence: derivativeTerms.map((_, index) => ({
        sourceSelectorId: `${ids.initial}.term.${index}`,
        targetSelectorId: `${ids.derived}.derived.term.${index}`,
        preserves: ["role" as const],
        summary:
          `Term ${index + 1} is differentiated independently before recombining.`
      })),
      assumptions: [
        "The derivative is linear over finite sums.",
        "Each term is a polynomial power of the differentiation variable."
      ],
      lawRefs: [
        {
          id: "law.calculus.derivative.sum-rule",
          level: "strict"
        }
      ]
    })
  ];
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.calculus.derivative",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedDerivativeSumProblemTrace(ids, latex),
    drillDownHooks: [],
    flashcards: createGeneratedDerivativeSumProblemFlashcards(input, ids)
  };
}

function createGeneratedIntegralPowerProblemFixture(
  input: GeneratedIntegralPowerProblemFixtureSpec
): GeneratedCalculusProblemFixture {
  assertNonEmpty(input.id, "Generated calculus fixture id");
  assertNonEmpty(input.title, `Generated calculus fixture ${input.id} title`);
  assertNonEmpty(input.variable, `Generated calculus fixture ${input.id} variable`);
  assertNonEmpty(input.base, `Generated calculus fixture ${input.id} base`);
  assertNonZeroInteger(
    input.coefficient,
    `Generated calculus fixture ${input.id} coefficient`
  );

  if (!Number.isInteger(input.exponent) || input.exponent < 0) {
    throw new Error(
      `Generated calculus fixture ${input.id} exponent must be a non-negative integer.`
    );
  }

  const ids = generatedIntegralPowerProblemIds(input);
  const antiderivative = integralPowerTermFor(input);
  const latex = generatedIntegralPowerProblemLatex(input, antiderivative);
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(
        ids.initial,
        "Integral expression",
        latex.initial,
        [
          selector(ids.initial, "operator", "operator", "\\int"),
          selector(ids.initial, "coefficient", "coefficient", String(input.coefficient)),
          selector(ids.initial, "base", "term", input.base),
          selector(ids.initial, "exponent", "term", String(input.exponent))
        ]
      ),
      expressionObject(
        ids.integrated,
        "After applying the integral power rule",
        latex.integrated,
        [
          selector(
            ids.integrated,
            "coefficient",
            "coefficient",
            formatNumber(antiderivative.coefficient)
          ),
          selector(ids.integrated, "base", "term", antiderivative.base),
          selector(ids.integrated, "exponent", "term", String(antiderivative.exponent)),
          selector(ids.integrated, "constant", "constant", "C")
        ]
      )
    ]
  });
  const transformations = [
    createKpSemanticTransformation({
      id: ids.transform,
      definitionId: "definition.generated.calculus.integral.power-rule",
      transformType: "applyAntiderivativePowerRule",
      title: "Apply the integral power rule",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.integrated],
      preserves: ["value", "structure"],
      correspondence: [
        {
          sourceSelectorId: `${ids.initial}.base`,
          targetSelectorId: `${ids.integrated}.base`,
          preserves: ["identity", "role"],
          summary: "The base variable persists in the antiderivative."
        },
        {
          sourceSelectorId: `${ids.initial}.exponent`,
          targetSelectorId: `${ids.integrated}.exponent`,
          preserves: ["structure"],
          summary: "The exponent increases by one under the power rule."
        }
      ],
      assumptions: [
        "The exponent is not -1.",
        "The constant of integration records the family of antiderivatives."
      ],
      lawRefs: [
        {
          id: "law.calculus.integral.power-rule",
          level: "strict"
        }
      ]
    })
  ];
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.calculus.integral",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedIntegralPowerProblemTrace(ids, latex),
    drillDownHooks: [],
    flashcards: createGeneratedIntegralPowerProblemFlashcards(
      input,
      ids,
      antiderivative
    )
  };
}

interface GeneratedDerivativeProblemIds {
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly derived: string;
  readonly transform: string;
}

interface GeneratedDerivativeProblemLatex {
  readonly initial: string;
  readonly derived: string;
}

interface GeneratedDerivativeSumProblemIds {
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly derived: string;
  readonly transform: string;
}

interface GeneratedDerivativeSumProblemLatex {
  readonly initial: string;
  readonly derived: string;
}

interface GeneratedIntegralPowerProblemIds {
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly integrated: string;
  readonly transform: string;
}

interface GeneratedIntegralPowerProblemLatex {
  readonly initial: string;
  readonly integrated: string;
}

function generatedDerivativeProblemIds(
  input: GeneratedDerivativeProblemFixtureSpec
): GeneratedDerivativeProblemIds {
  return {
    asset: `asset.${input.id}`,
    diagram: `diagram.${input.id}.sequence`,
    trace: `trace.${input.id}`,
    initial: `expression.${input.id}.initial`,
    derived: `expression.${input.id}.derived`,
    transform: `transform.${input.id}.apply-power-rule`
  };
}

function generatedDerivativeProblemLatex(
  input: GeneratedDerivativeProblemFixtureSpec
): GeneratedDerivativeProblemLatex {
  return {
    initial: `\\frac{d}{d${input.variable}}${input.base}^{${input.exponent}}`,
    derived: `${input.exponent}${input.base}^{${input.exponent - 1}}`
  };
}

function generatedDerivativeSumProblemIds(
  input: GeneratedDerivativeSumProblemFixtureSpec
): GeneratedDerivativeSumProblemIds {
  return {
    asset: `asset.${input.id}`,
    diagram: `diagram.${input.id}.sequence`,
    trace: `trace.${input.id}`,
    initial: `expression.${input.id}.initial`,
    derived: `expression.${input.id}.derived`,
    transform: `transform.${input.id}.apply-sum-rule`
  };
}

function generatedDerivativeSumProblemLatex(
  input: GeneratedDerivativeSumProblemFixtureSpec
): GeneratedDerivativeSumProblemLatex {
  return {
    initial:
      `\\frac{d}{d${input.variable}}(${formatPolynomialTerms(input.terms)})`,
    derived: formatPolynomialTerms(derivativeTermsFor(input.terms))
  };
}

function generatedIntegralPowerProblemIds(
  input: GeneratedIntegralPowerProblemFixtureSpec
): GeneratedIntegralPowerProblemIds {
  return {
    asset: `asset.${input.id}`,
    diagram: `diagram.${input.id}.sequence`,
    trace: `trace.${input.id}`,
    initial: `expression.${input.id}.initial`,
    integrated: `expression.${input.id}.integrated`,
    transform: `transform.${input.id}.apply-integral-power-rule`
  };
}

function generatedIntegralPowerProblemLatex(
  input: GeneratedIntegralPowerProblemFixtureSpec,
  antiderivative: GeneratedCalculusPolynomialTermSpec
): GeneratedIntegralPowerProblemLatex {
  return {
    initial:
      `\\int ${formatUnsignedPolynomialTerm({
        coefficient: input.coefficient,
        base: input.base,
        exponent: input.exponent
      })}\\,d${input.variable}`,
    integrated: `${formatUnsignedPolynomialTerm(antiderivative)} + C`
  };
}

function createGeneratedDerivativeProblemTrace(
  ids: GeneratedDerivativeProblemIds,
  latex: GeneratedDerivativeProblemLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${ids.trace} generated calculus trace`,
    steps: [
      {
        id: `${ids.trace}.initial`,
        latex: latex.initial
      },
      {
        id: `${ids.trace}.derived`,
        latex: latex.derived,
        transformationId: ids.transform,
        rule: "applyDerivativePowerRule"
      }
    ]
  };
}

function createGeneratedDerivativeSumProblemTrace(
  ids: GeneratedDerivativeSumProblemIds,
  latex: GeneratedDerivativeSumProblemLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${ids.trace} generated calculus trace`,
    steps: [
      {
        id: `${ids.trace}.initial`,
        latex: latex.initial
      },
      {
        id: `${ids.trace}.derived`,
        latex: latex.derived,
        transformationId: ids.transform,
        rule: "applyDerivativeSumRule"
      }
    ]
  };
}

function createGeneratedIntegralPowerProblemTrace(
  ids: GeneratedIntegralPowerProblemIds,
  latex: GeneratedIntegralPowerProblemLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${ids.trace} generated calculus trace`,
    steps: [
      {
        id: `${ids.trace}.initial`,
        latex: latex.initial
      },
      {
        id: `${ids.trace}.integrated`,
        latex: latex.integrated,
        transformationId: ids.transform,
        rule: "applyAntiderivativePowerRule"
      }
    ]
  };
}

function createGeneratedDerivativeProblemFlashcards(
  input: GeneratedDerivativeProblemFixtureSpec,
  ids: GeneratedDerivativeProblemIds
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.predict-power-rule`,
      kind: "predict-next",
      title: "Predict the power-rule step",
      assetId: ids.asset,
      prompt: "Which transformation differentiates this power expression?",
      transformationIds: [ids.transform],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.transform
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.cloze-coefficient`,
      kind: "cloze",
      title: "Hide the coefficient",
      assetId: ids.asset,
      prompt: "What coefficient appears after applying the power rule?",
      selectorIds: [`${ids.derived}.coefficient`],
      timeMs: 1200,
      answer: {
        kind: "text",
        value: String(input.exponent)
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-power-rule`,
      kind: "explain-transform",
      title: "Explain the derivative power rule",
      assetId: ids.asset,
      prompt: "Why does the exponent move into the coefficient position?",
      objectIds: [ids.initial, ids.derived],
      transformationIds: [ids.transform],
      timeMs: 1200,
      answer: {
        kind: "text",
        value:
          "For a power x^n, the derivative is n times x raised to one less power."
      }
    })
  ];
}

function createGeneratedDerivativeSumProblemFlashcards(
  input: GeneratedDerivativeSumProblemFixtureSpec,
  ids: GeneratedDerivativeSumProblemIds
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.predict-sum-rule`,
      kind: "predict-next",
      title: "Predict the derivative sum-rule step",
      assetId: ids.asset,
      prompt: "Which transformation differentiates this polynomial sum?",
      transformationIds: [ids.transform],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.transform
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.cloze-first-derived-term`,
      kind: "cloze",
      title: "Hide the first derivative term",
      assetId: ids.asset,
      prompt: "What does the first polynomial term become?",
      selectorIds: [`${ids.derived}.derived.term.0`],
      timeMs: 1200,
      answer: {
        kind: "text",
        value: formatUnsignedPolynomialTerm(derivativeTermsFor(input.terms)[0]!)
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-sum-rule`,
      kind: "explain-transform",
      title: "Explain the derivative sum rule",
      assetId: ids.asset,
      prompt: "Why can each term be differentiated separately?",
      objectIds: [ids.initial, ids.derived],
      transformationIds: [ids.transform],
      timeMs: 1200,
      answer: {
        kind: "text",
        value:
          "Differentiation is linear, so the derivative of a finite sum is the sum of the derivatives."
      }
    })
  ];
}

function createGeneratedIntegralPowerProblemFlashcards(
  input: GeneratedIntegralPowerProblemFixtureSpec,
  ids: GeneratedIntegralPowerProblemIds,
  antiderivative: GeneratedCalculusPolynomialTermSpec
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.predict-integral-power-rule`,
      kind: "predict-next",
      title: "Predict the integral power-rule step",
      assetId: ids.asset,
      prompt: "Which transformation integrates this power expression?",
      transformationIds: [ids.transform],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.transform
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.cloze-antiderivative-coefficient`,
      kind: "cloze",
      title: "Hide the antiderivative coefficient",
      assetId: ids.asset,
      prompt: "What coefficient appears after applying the integral power rule?",
      selectorIds: [`${ids.integrated}.coefficient`],
      timeMs: 1200,
      answer: {
        kind: "text",
        value: formatNumber(antiderivative.coefficient)
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-integral-power-rule`,
      kind: "explain-transform",
      title: "Explain the integral power rule",
      assetId: ids.asset,
      prompt: "Why does the exponent increase and the coefficient divide?",
      objectIds: [ids.initial, ids.integrated],
      transformationIds: [ids.transform],
      timeMs: 1200,
      answer: {
        kind: "text",
        value:
          "For x^n, an antiderivative is x^(n+1)/(n+1), plus a constant of integration."
      }
    })
  ];
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

function calculusTermSelectors(
  objectId: string,
  prefix: string,
  terms: readonly GeneratedCalculusPolynomialTermSpec[]
): readonly CreateKpAssetSelectorInput[] {
  return terms.map((term, index) =>
    selector(
      objectId,
      `${prefix}.${index}`,
      term.exponent === 0 ? "constant" : "term",
      formatUnsignedPolynomialTerm(term)
    )
  );
}

function derivativeTermsFor(
  terms: readonly GeneratedCalculusPolynomialTermSpec[]
): readonly GeneratedCalculusPolynomialTermSpec[] {
  return terms.flatMap((term) =>
    term.exponent === 0
      ? []
      : [
          {
            coefficient: term.coefficient * term.exponent,
            base: term.base,
            exponent: term.exponent - 1
          }
        ]
  );
}

function integralPowerTermFor(
  input: GeneratedIntegralPowerProblemFixtureSpec
): GeneratedCalculusPolynomialTermSpec {
  return {
    coefficient: input.coefficient / (input.exponent + 1),
    base: input.base,
    exponent: input.exponent + 1
  };
}

function formatPolynomialTerms(
  terms: readonly GeneratedCalculusPolynomialTermSpec[]
): string {
  if (terms.length === 0) {
    return "0";
  }

  return terms.map(formatSignedPolynomialTerm).join("");
}

function formatSignedPolynomialTerm(
  term: GeneratedCalculusPolynomialTermSpec,
  index: number
): string {
  const unsigned = formatUnsignedPolynomialTerm({
    ...term,
    coefficient: Math.abs(term.coefficient)
  });

  if (index === 0) {
    return term.coefficient < 0 ? `-${unsigned}` : unsigned;
  }

  return term.coefficient < 0 ? ` - ${unsigned}` : ` + ${unsigned}`;
}

function formatUnsignedPolynomialTerm(
  term: GeneratedCalculusPolynomialTermSpec
): string {
  const coefficient = Math.abs(term.coefficient);

  if (term.exponent === 0) {
    return formatNumber(coefficient);
  }

  const coefficientText = coefficient === 1 ? "" : formatNumber(coefficient);

  if (term.exponent === 1) {
    return `${coefficientText}${term.base}`;
  }

  return `${coefficientText}${term.base}^{${term.exponent}}`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
}

function validatePolynomialTerms(input: {
  readonly id: string;
  readonly terms: readonly GeneratedCalculusPolynomialTermSpec[];
}): void {
  if (input.terms.length === 0) {
    throw new Error(
      `Generated calculus fixture ${input.id} must include at least one term.`
    );
  }

  input.terms.forEach((term, index) => {
    assertNonZeroInteger(
      term.coefficient,
      `Generated calculus fixture ${input.id} term ${index} coefficient`
    );
    assertNonEmpty(
      term.base,
      `Generated calculus fixture ${input.id} term ${index} base`
    );

    if (!Number.isInteger(term.exponent) || term.exponent < 0) {
      throw new Error(
        `Generated calculus fixture ${input.id} term ${index} exponent must be a non-negative integer.`
      );
    }
  });
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
