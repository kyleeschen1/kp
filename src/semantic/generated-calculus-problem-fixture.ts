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
import {
  createKpDerivativePowerRuleCorrespondenceMap,
  createKpDerivativePowerRuleSemanticRoles,
  type KpDerivativePowerRuleSemanticRole
} from "./derivative-power-rule-semantics.ts";
import {
  createKpDerivativeSumRuleSemantics
} from "./derivative-sum-rule-semantics.ts";
import {
  createKpAntiderivativePowerRuleSemantics
} from "./antiderivative-power-rule-semantics.ts";
import {
  createKpRational,
  type KpNormalizedRational
} from "../../domains/math/exact-rational.ts";

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
      coefficient: 1,
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
  const semanticRoles = createKpDerivativePowerRuleSemanticRoles({
    sourceObjectId: ids.initial,
    targetObjectId: ids.applied,
    differentiationVariable: input.variable,
    base: input.base,
    exponent: input.exponent
  });
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(
        ids.initial,
        "Derivative expression",
        latex.initial,
        semanticRoles.sourceRoles.map(derivativePowerRoleSelector)
      ),
      expressionObject(
        ids.applied,
        "Power rule with explicit decrement",
        latex.applied,
        semanticRoles.targetRoles.map(derivativePowerRoleSelector)
      ),
      expressionObject(
        ids.derived,
        "After evaluating the exponent decrement",
        latex.derived,
        [
          selector(ids.derived, "coefficient", "term", String(input.exponent)),
          selector(ids.derived, "base", "term", input.base),
          selector(
            ids.derived,
            "exponent",
            "term",
            String(input.exponent - 1),
            {
              successorTarget: true,
              successorRole: "evaluated-difference",
              successorRank: 0,
              successorOperationId: "kp.arithmetic.subtract"
            }
          )
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
      targetObjectIds: [ids.applied],
      preserves: ["value", "structure"],
      correspondenceMap: createKpDerivativePowerRuleCorrespondenceMap(
        semanticRoles,
        ids.transform
      ),
      correspondence: [
        {
          sourceSelectorId: `${ids.initial}.base`,
          targetSelectorId: `${ids.applied}.base`,
          preserves: ["identity", "role"],
          summary: "The base variable persists as the differentiated variable."
        },
        {
          sourceSelectorId: `${ids.initial}.exponent`,
          targetSelectorId: `${ids.applied}.coefficient`,
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
    }),
    createKpSemanticTransformation({
      id: ids.evaluateTransform,
      definitionId:
        "definition.generated.linear-solve.simplify-constant-difference",
      transformType: "simplifyConstantDifference",
      title: `Evaluate ${input.exponent} - 1`,
      sourceObjectIds: [ids.applied],
      targetObjectIds: [ids.derived],
      preserves: ["value", "structure"],
      correspondenceMap: {
        id: `${ids.evaluateTransform}.correspondence`,
        records: [
          {
            id: `${ids.evaluateTransform}.coefficient-persists`,
            relation: "identity",
            sourceSelectorIds: [`${ids.applied}.coefficient`],
            targetSelectorIds: [`${ids.derived}.coefficient`],
            summary:
              "The transmitted coefficient persists through exponent evaluation."
          },
          {
            id: `${ids.evaluateTransform}.base-persists`,
            relation: "identity",
            sourceSelectorIds: [`${ids.applied}.base`],
            targetSelectorIds: [`${ids.derived}.base`],
            summary:
              "The differentiated base persists through exponent evaluation."
          },
          {
            id: `${ids.evaluateTransform}.decrement-evaluates`,
            relation: "fan-in",
            sourceSelectorIds: [
              `${ids.applied}.exponent`,
              `${ids.applied}.decrement-operator`,
              `${ids.applied}.decrement-amount`
            ],
            targetSelectorIds: [`${ids.derived}.exponent`],
            summary:
              "The copied exponent and subtraction witness evaluate into the decremented exponent."
          }
        ]
      },
      assumptions: [
        `${input.exponent} - 1 evaluates exactly to ${input.exponent - 1}.`
      ],
      lawRefs: [{ id: "law.arithmetic.constant-difference", level: "strict" }]
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
  if (derivativeTerms.length !== input.terms.length) {
    throw new Error(
      `Generated calculus fixture ${input.id} requires explicit zero-term elimination before sum-rule fan-out.`
    );
  }
  const semantics = createKpDerivativeSumRuleSemantics({
    sourceObjectId: ids.initial,
    distributedObjectId: ids.distributed,
    targetObjectId: ids.derived,
    distributionTransformationId: ids.distributeTransform,
    resolutionTransformationId: ids.resolveTransform,
    termCount: input.terms.length
  });
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
          ...calculusTermSelectors(ids.initial, "term", input.terms),
          ...calculusConnectorSelectors(ids.initial, input.terms)
        ]
      ),
      expressionObject(
        ids.distributed,
        "Derivative distributed across the sum",
        latex.distributed,
        [
          ...input.terms.flatMap((_term, index) => [
            selector(ids.distributed, `operator.${index}`, "operator", "d/dx")
          ]),
          ...calculusTermSelectors(ids.distributed, "term", input.terms),
          ...calculusConnectorSelectors(ids.distributed, input.terms)
        ]
      ),
      expressionObject(
        ids.derived,
        "After applying the derivative sum rule",
        latex.derived,
        [
          ...calculusTermSelectors(ids.derived, "derived.term", derivativeTerms),
          ...calculusConnectorSelectors(ids.derived, derivativeTerms)
        ]
      )
    ]
  });
  const transformations = [
    createKpSemanticTransformation({
      id: ids.distributeTransform,
      definitionId: "definition.generated.calculus.derivative.sum-rule",
      transformType: "applyDerivativeSumRule",
      title: "Distribute the derivative across the sum",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.distributed],
      preserves: ["value", "structure", "identity"],
      correspondenceMap: semantics.distribution,
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
    }),
    createKpSemanticTransformation({
      id: ids.resolveTransform,
      definitionId: "definition.generated.calculus.derivative.power-rule-terms",
      transformType: "applyDerivativePowerRulesToTerms",
      title: "Resolve each local derivative",
      sourceObjectIds: [ids.distributed],
      targetObjectIds: [ids.derived],
      preserves: ["value", "structure"],
      correspondenceMap: semantics.resolution,
      assumptions: [
        "Each distributed derivative acts only on its adjacent term.",
        "Every source term has a nonzero polynomial exponent."
      ],
      lawRefs: [
        { id: "law.calculus.derivative.sum-rule", level: "strict" },
        { id: "law.calculus.derivative.power-rule", level: "strict" }
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
  const semantics = createKpAntiderivativePowerRuleSemantics({
    sourceObjectId: ids.initial,
    expandedObjectId: ids.expanded,
    targetObjectId: ids.integrated,
    expansionTransformationId: ids.expandTransform,
    resolutionTransformationId: ids.resolveTransform
  });
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
          selector(ids.initial, "exponent", "term", String(input.exponent)),
          selector(ids.initial, "differential", "operator", `d${input.variable}`)
        ]
      ),
      expressionObject(
        ids.expanded,
        "Antiderivative power rule exposed",
        latex.expanded,
        [
          selector(
            ids.expanded,
            "numerator-coefficient",
            "coefficient",
            String(input.coefficient)
          ),
          selector(
            ids.expanded,
            "denominator-exponent",
            "term",
            String(input.exponent)
          ),
          selector(ids.expanded, "denominator-increment", "constant", "1"),
          selector(ids.expanded, "base", "term", input.base),
          selector(
            ids.expanded,
            "power-exponent",
            "term",
            String(input.exponent)
          ),
          selector(ids.expanded, "power-increment", "constant", "1")
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
            formatExactRationalText(antiderivative.coefficient),
            {
              exactNumerator: antiderivative.coefficient.numerator.toString(),
              exactDenominator: antiderivative.coefficient.denominator.toString()
            }
          ),
          selector(ids.integrated, "base", "term", antiderivative.base),
          selector(ids.integrated, "exponent", "term", String(antiderivative.exponent)),
          selector(ids.integrated, "connector", "operator", "+"),
          selector(ids.integrated, "constant", "constant", "C")
        ]
      )
    ]
  });
  const transformations = [
    createKpSemanticTransformation({
      id: ids.expandTransform,
      definitionId: "definition.generated.calculus.integral.power-rule",
      transformType: "applyAntiderivativePowerRule",
      title: "Expose the antiderivative power rule",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.expanded],
      preserves: ["value", "structure"],
      correspondenceMap: semantics.expansion,
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
    }),
    createKpSemanticTransformation({
      id: ids.resolveTransform,
      definitionId: "definition.generated.calculus.integral.power-rule-resolution",
      transformType: "simplifyAntiderivativePowerRule",
      title: "Resolve the antiderivative coefficient and exponent",
      sourceObjectIds: [ids.expanded],
      targetObjectIds: [ids.integrated],
      preserves: ["value", "structure"],
      correspondenceMap: semantics.resolution,
      assumptions: [
        "The exposed successor expressions are arithmetically simplified.",
        "The constant of integration is independent of the input term."
      ],
      lawRefs: [{ id: "law.calculus.integral.power-rule", level: "strict" }]
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
  readonly applied: string;
  readonly derived: string;
  readonly transform: string;
  readonly evaluateTransform: string;
}

interface GeneratedDerivativeProblemLatex {
  readonly initial: string;
  readonly applied: string;
  readonly derived: string;
}

interface GeneratedDerivativeSumProblemIds {
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly distributed: string;
  readonly derived: string;
  readonly distributeTransform: string;
  readonly resolveTransform: string;
}

interface GeneratedDerivativeSumProblemLatex {
  readonly initial: string;
  readonly distributed: string;
  readonly derived: string;
}

interface GeneratedIntegralPowerProblemIds {
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly expanded: string;
  readonly integrated: string;
  readonly expandTransform: string;
  readonly resolveTransform: string;
}

interface GeneratedIntegralPowerProblemLatex {
  readonly initial: string;
  readonly expanded: string;
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
    applied: `expression.${input.id}.applied`,
    derived: `expression.${input.id}.derived`,
    transform: `transform.${input.id}.apply-power-rule`,
    evaluateTransform: `transform.${input.id}.evaluate-exponent-decrement`
  };
}

function generatedDerivativeProblemLatex(
  input: GeneratedDerivativeProblemFixtureSpec
): GeneratedDerivativeProblemLatex {
  return {
    initial: `\\frac{d}{d${input.variable}}${input.base}^{${input.exponent}}`,
    applied:
      `${input.exponent}${input.base}^{${input.exponent}-1}`,
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
    distributed: `expression.${input.id}.distributed`,
    derived: `expression.${input.id}.derived`,
    distributeTransform: `transform.${input.id}.distribute-sum-rule`,
    resolveTransform: `transform.${input.id}.resolve-sum-terms`
  };
}

function generatedDerivativeSumProblemLatex(
  input: GeneratedDerivativeSumProblemFixtureSpec
): GeneratedDerivativeSumProblemLatex {
  return {
    initial:
      `\\frac{d}{d${input.variable}}(${formatPolynomialTerms(input.terms)})`,
    distributed: formatDistributedDerivativeTerms(input.variable, input.terms),
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
    expanded: `expression.${input.id}.expanded`,
    integrated: `expression.${input.id}.integrated`,
    expandTransform: `transform.${input.id}.expand-integral-power-rule`,
    resolveTransform: `transform.${input.id}.resolve-integral-power-rule`
  };
}

function generatedIntegralPowerProblemLatex(
  input: GeneratedIntegralPowerProblemFixtureSpec,
  antiderivative: GeneratedIntegralPowerTermSpec
): GeneratedIntegralPowerProblemLatex {
  return {
    initial:
      `\\int ${formatUnsignedPolynomialTerm({
        coefficient: input.coefficient,
        base: input.base,
        exponent: input.exponent
      })}\\,d${input.variable}`,
    expanded: `${formatIntegralPowerRuleExpansion(input)} + C`,
    integrated: `${formatExactIntegralPowerTerm(antiderivative)} + C`
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
        id: `${ids.trace}.applied`,
        latex: latex.applied,
        transformationId: ids.transform,
        rule: "applyDerivativePowerRule"
      },
      {
        id: `${ids.trace}.derived`,
        latex: latex.derived,
        transformationId: ids.evaluateTransform,
        rule: "simplifyConstantDifference"
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
        id: `${ids.trace}.distributed`,
        latex: latex.distributed,
        transformationId: ids.distributeTransform,
        rule: "applyDerivativeSumRule"
      },
      {
        id: `${ids.trace}.derived`,
        latex: latex.derived,
        transformationId: ids.resolveTransform,
        rule: "applyDerivativePowerRulesToTerms"
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
        id: `${ids.trace}.expanded`,
        latex: latex.expanded,
        transformationId: ids.expandTransform,
        rule: "applyAntiderivativePowerRule"
      },
      {
        id: `${ids.trace}.integrated`,
        latex: latex.integrated,
        transformationId: ids.resolveTransform,
        rule: "simplifyAntiderivativePowerRule"
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
      transformationIds: [ids.transform, ids.evaluateTransform],
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
      transformationIds: [ids.distributeTransform],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.distributeTransform
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
      objectIds: [ids.initial, ids.distributed, ids.derived],
      transformationIds: [ids.distributeTransform, ids.resolveTransform],
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
  antiderivative: GeneratedIntegralPowerTermSpec
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.predict-integral-power-rule`,
      kind: "predict-next",
      title: "Predict the integral power-rule step",
      assetId: ids.asset,
      prompt: "Which transformation integrates this power expression?",
      transformationIds: [ids.expandTransform],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.expandTransform
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
        value: formatExactRationalText(antiderivative.coefficient)
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-integral-power-rule`,
      kind: "explain-transform",
      title: "Explain the integral power rule",
      assetId: ids.asset,
      prompt: "Why does the exponent increase and the coefficient divide?",
      objectIds: [ids.initial, ids.expanded, ids.integrated],
      transformationIds: [ids.expandTransform, ids.resolveTransform],
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
  label: string,
  metadata?: CreateKpAssetSelectorInput["metadata"]
): CreateKpAssetSelectorInput {
  return {
    id: `${objectId}.${suffix}`,
    kind,
    label,
    ...(metadata === undefined ? {} : { metadata })
  };
}

function derivativePowerRoleSelector(
  role: KpDerivativePowerRuleSemanticRole
): CreateKpAssetSelectorInput {
  const evaluationMetadata = role.id === "target.exponent"
    ? {
        successorContribution: "material-input",
        successorRole: "minuend",
        successorRank: 0,
        successorOperationId: "kp.arithmetic.subtract"
      }
    : role.id === "target.decrement-operator"
      ? {
          successorContribution: "catalyst",
          successorRole: "subtraction-operator",
          successorRank: 0,
          successorOperationId: "kp.arithmetic.subtract"
        }
      : role.id === "target.decrement-amount"
        ? {
            successorContribution: "material-input",
            successorRole: "subtrahend",
            successorRank: 1,
            successorOperationId: "kp.arithmetic.subtract"
          }
        : undefined;
  return {
    id: role.selectorId,
    kind: role.selectorKind,
    label: role.label,
    ...(evaluationMetadata === undefined
      ? {}
      : { metadata: evaluationMetadata })
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

function calculusConnectorSelectors(
  objectId: string,
  terms: readonly GeneratedCalculusPolynomialTermSpec[]
): readonly CreateKpAssetSelectorInput[] {
  return terms.slice(1).map((term, index) =>
    selector(
      objectId,
      `connector.${index}`,
      "operator",
      term.coefficient < 0 ? "-" : "+"
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
): GeneratedIntegralPowerTermSpec {
  return {
    coefficient: createKpRational(
      BigInt(input.coefficient),
      BigInt(input.exponent + 1)
    ),
    base: input.base,
    exponent: input.exponent + 1
  };
}

interface GeneratedIntegralPowerTermSpec {
  readonly coefficient: KpNormalizedRational;
  readonly base: string;
  readonly exponent: number;
}

function formatIntegralPowerRuleExpansion(
  input: GeneratedIntegralPowerProblemFixtureSpec
): string {
  const coefficient = Math.abs(input.coefficient);
  const coefficientText = coefficient === 1 ? "" : formatNumber(coefficient);
  const sign = input.coefficient < 0 ? "-" : "";
  return `${sign}\\frac{${coefficientText}${input.base}^{${input.exponent}+1}}{${input.exponent}+1}`;
}

function formatExactIntegralPowerTerm(
  term: GeneratedIntegralPowerTermSpec
): string {
  const negative = term.coefficient.numerator < 0n;
  const numerator = negative
    ? -term.coefficient.numerator
    : term.coefficient.numerator;
  const coefficientText = numerator === 1n ? "" : numerator.toString();
  const power = `${coefficientText}${term.base}^{${term.exponent}}`;
  if (term.coefficient.denominator === 1n) {
    return `${negative ? "-" : ""}${power}`;
  }
  return `${negative ? "-" : ""}\\frac{${power}}{${term.coefficient.denominator}}`;
}

function formatExactRationalText(value: KpNormalizedRational): string {
  return value.denominator === 1n
    ? value.numerator.toString()
    : `${value.numerator}/${value.denominator}`;
}

function formatPolynomialTerms(
  terms: readonly GeneratedCalculusPolynomialTermSpec[]
): string {
  if (terms.length === 0) {
    return "0";
  }

  return terms.map(formatSignedPolynomialTerm).join("");
}

function formatDistributedDerivativeTerms(
  variable: string,
  terms: readonly GeneratedCalculusPolynomialTermSpec[]
): string {
  return terms.map((term, index) => {
    const connector = index === 0
      ? term.coefficient < 0 ? "-" : ""
      : term.coefficient < 0 ? " - " : " + ";
    const unsigned = formatUnsignedPolynomialTerm({
      ...term,
      coefficient: Math.abs(term.coefficient)
    });
    return `${connector}\\frac{d}{d${variable}}${unsigned}`;
  }).join("");
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
