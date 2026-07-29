import {
  createKpSemanticTransformation,
  createKpSemanticTransformationDefinition,
  validateKpSemanticTransformationDefinition,
  type CreateKpSemanticTransformationDefinitionInput,
  type KpSelectorCorrespondence,
  type KpSemanticTransformationDefinition,
  type KpTransformationValidationIssue
} from "./asset-transformation.ts";
import type {
  KpLawCheckResult,
  KpLawFailure
} from "./asset-laws.ts";
import type { GeneratedAlgebraFixtureFamilyId } from "./generated-algebra-fixture-registry.ts";
import {
  mintKpCompilerGeneratedAlgebraTransformation,
  type KpCompilerGeneratedAlgebraTransformation
} from "./generated-algebra-transformation-authority.ts";
import type { CorrespondenceMap } from "./correspondence.ts";

export type GeneratedAlgebraTransformDefinitionStatus = "seed" | "promoted";

export type GeneratedAlgebraTransformArtifactPolicy =
  | "none"
  | "source-only"
  | "target-only"
  | "mixed";

export interface GeneratedAlgebraTransformDefinition
  extends KpSemanticTransformationDefinition {
  readonly familyId: GeneratedAlgebraFixtureFamilyId;
  readonly templateId: string;
  readonly status: GeneratedAlgebraTransformDefinitionStatus;
  readonly artifactPolicy: GeneratedAlgebraTransformArtifactPolicy;
}

export interface CreateGeneratedAlgebraTransformDefinitionInput
  extends CreateKpSemanticTransformationDefinitionInput {
  readonly familyId: GeneratedAlgebraFixtureFamilyId;
  readonly templateId: string;
  readonly status?: GeneratedAlgebraTransformDefinitionStatus | undefined;
  readonly artifactPolicy?: GeneratedAlgebraTransformArtifactPolicy | undefined;
}

export interface CreateGeneratedAlgebraSemanticTransformationInput {
  readonly familyId: GeneratedAlgebraFixtureFamilyId;
  readonly transformType: string;
  readonly id: string;
  readonly title?: string | undefined;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly correspondenceMap?: CorrespondenceMap | undefined;
  readonly correspondence?: readonly KpSelectorCorrespondence[] | undefined;
}

export interface GeneratedFractionExpressionTransformExpectation {
  readonly transformType: string;
  readonly definitionId: string;
  readonly artifactPolicy: GeneratedAlgebraTransformArtifactPolicy;
  readonly preserves: readonly string[];
}

export const generatedFractionExpressionTransformExpectations:
  readonly GeneratedFractionExpressionTransformExpectation[] = [
    {
      transformType: "splitFractionFactors",
      definitionId: "definition.generated.fraction-expression.split-fraction-factors",
      artifactPolicy: "mixed",
      preserves: ["value", "structure"]
    },
    {
      transformType: "mergeFractionCommonFactor",
      definitionId: "definition.generated.fraction-expression.merge-common-factor",
      artifactPolicy: "mixed",
      preserves: ["identity", "value", "structure"]
    },
    {
      transformType: "simplifyUnitFractionFactor",
      definitionId: "definition.generated.fraction-expression.simplify-unit-factor",
      artifactPolicy: "source-only",
      preserves: ["identity", "value"]
    }
  ];

export interface GeneratedExponentRadicalTransformExpectation {
  readonly transformType: string;
  readonly definitionId: string;
  readonly familyId: GeneratedAlgebraFixtureFamilyId;
  readonly artifactPolicy: GeneratedAlgebraTransformArtifactPolicy;
  readonly preserves: readonly string[];
}

export const generatedExponentRadicalTransformExpectations:
  readonly GeneratedExponentRadicalTransformExpectation[] = [
    {
      transformType: "lowerExponent",
      definitionId: "definition.generated.exponent.lower-exponent",
      familyId: "generated.exponent",
      artifactPolicy: "mixed",
      preserves: ["identity", "value"]
    },
    {
      transformType: "unwrapUnitExponent",
      definitionId: "definition.generated.exponent.unwrap-unit-exponent",
      familyId: "generated.exponent",
      artifactPolicy: "source-only",
      preserves: ["identity", "value"]
    },
    {
      transformType: "rewritePowerAsRoot",
      definitionId: "definition.generated.radical.rewrite-power-as-root",
      familyId: "generated.radical",
      artifactPolicy: "mixed",
      preserves: ["identity", "value"]
    }
  ];

export interface GeneratedFunctionWrapTransformExpectation {
  readonly transformType: string;
  readonly definitionId: string;
  readonly artifactPolicy: GeneratedAlgebraTransformArtifactPolicy;
  readonly preserves: readonly string[];
}

export const generatedFunctionWrapTransformExpectations:
  readonly GeneratedFunctionWrapTransformExpectation[] = [
    {
      transformType: "wrapFunction",
      definitionId: "definition.generated.function-wrap.wrap-function",
      artifactPolicy: "target-only",
      preserves: ["identity", "role"]
    }
  ];

export const generatedAlgebraTransformDefinitions:
  readonly GeneratedAlgebraTransformDefinition[] = [
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.linear-solve.subtract-both-sides",
      familyId: "generated.linear-solve",
      templateId: "linear-solve.subtract-both-sides",
      status: "promoted",
      transformType: "subtractBothSides",
      title: "Subtract the same value from both sides",
      sourceObjectRoles: ["initial-equation"],
      targetObjectRoles: ["with-inverse-terms"],
      preserves: ["value", "structure"],
      artifactPolicy: "target-only",
      assumptions: ["Subtracting equal quantities preserves equality."],
      lawRefs: [{ id: "law.equation.subtract-both-sides", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "initial-equation",
          sourceSelectorRole: "lhs.variable",
          targetObjectRole: "with-inverse-terms",
          targetSelectorRole: "lhs.variable",
          preserves: ["identity", "role"],
          summary: "The unknown persists while inverse terms are introduced."
        },
        {
          sourceObjectRole: "initial-equation",
          sourceSelectorRole: "lhs.addend",
          targetObjectRole: "with-inverse-terms",
          targetSelectorRole: "lhs.addend",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "initial-equation",
          sourceSelectorRole: "equals",
          targetObjectRole: "with-inverse-terms",
          targetSelectorRole: "equals",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "initial-equation",
          sourceSelectorRole: "rhs.value",
          targetObjectRole: "with-inverse-terms",
          targetSelectorRole: "rhs.value",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.linear-solve.add-both-sides",
      familyId: "generated.linear-solve",
      templateId: "linear-solve.add-both-sides",
      status: "promoted",
      transformType: "addBothSides",
      title: "Add the same value to both sides",
      sourceObjectRoles: ["initial-equation"],
      targetObjectRoles: ["with-inverse-terms"],
      preserves: ["value", "structure"],
      artifactPolicy: "target-only",
      assumptions: ["Adding equal quantities preserves equality."],
      lawRefs: [{ id: "law.equation.add-both-sides", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "initial-equation",
          sourceSelectorRole: "lhs.variable",
          targetObjectRole: "with-inverse-terms",
          targetSelectorRole: "lhs.variable",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "initial-equation",
          sourceSelectorRole: "lhs.addend",
          targetObjectRole: "with-inverse-terms",
          targetSelectorRole: "lhs.addend",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "initial-equation",
          sourceSelectorRole: "equals",
          targetObjectRole: "with-inverse-terms",
          targetSelectorRole: "equals",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "initial-equation",
          sourceSelectorRole: "rhs.value",
          targetObjectRole: "with-inverse-terms",
          targetSelectorRole: "rhs.value",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.linear-solve.cancel-additive-inverses",
      familyId: "generated.linear-solve",
      templateId: "linear-solve.cancel-additive-inverses",
      status: "promoted",
      transformType: "cancelAdditiveInverses",
      title: "Cancel additive inverses",
      sourceObjectRoles: ["with-inverse-terms"],
      targetObjectRoles: ["left-simplified-equation"],
      preserves: ["value"],
      artifactPolicy: "source-only",
      assumptions: ["A term plus its additive inverse simplifies to zero."],
      lawRefs: [{ id: "law.algebra.additive-inverse", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "with-inverse-terms",
          sourceSelectorRole: "lhs.variable",
          targetObjectRole: "left-simplified-equation",
          targetSelectorRole: "lhs.variable",
          preserves: ["identity", "role"],
          summary: "The unknown persists after inverse terms cancel."
        },
        {
          sourceObjectRole: "with-inverse-terms",
          sourceSelectorRole: "equals",
          targetObjectRole: "left-simplified-equation",
          targetSelectorRole: "equals",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "with-inverse-terms",
          sourceSelectorRole: "rhs.constant",
          targetObjectRole: "left-simplified-equation",
          targetSelectorRole: "rhs.constant",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "with-inverse-terms",
          sourceSelectorRole: "rhs.inverse-term",
          targetObjectRole: "left-simplified-equation",
          targetSelectorRole: "rhs.inverse-term",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.linear-solve.simplify-constant-difference",
      familyId: "generated.linear-solve",
      templateId: "linear-solve.simplify-constant-difference",
      status: "promoted",
      transformType: "simplifyConstantDifference",
      title: "Simplify the constant difference",
      sourceObjectRoles: ["constant-expression-equation"],
      targetObjectRoles: ["solved-equation"],
      preserves: ["value"],
      artifactPolicy: "mixed",
      assumptions: ["The right-hand constant difference evaluates to the solution."],
      lawRefs: [{ id: "law.arithmetic.constant-difference", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "constant-expression-equation",
          sourceSelectorRole: "lhs.variable",
          targetObjectRole: "solved-equation",
          targetSelectorRole: "lhs.variable",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "constant-expression-equation",
          sourceSelectorRole: "equals",
          targetObjectRole: "solved-equation",
          targetSelectorRole: "equals",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.linear-solve.simplify-constant-sum",
      familyId: "generated.linear-solve",
      templateId: "linear-solve.simplify-constant-sum",
      status: "promoted",
      transformType: "simplifyConstantSum",
      title: "Simplify the constant sum",
      sourceObjectRoles: ["constant-expression-equation"],
      targetObjectRoles: ["solved-equation"],
      preserves: ["value"],
      artifactPolicy: "mixed",
      assumptions: ["The right-hand constant sum evaluates to the solution."],
      lawRefs: [{ id: "law.arithmetic.constant-sum", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "constant-expression-equation",
          sourceSelectorRole: "lhs.variable",
          targetObjectRole: "solved-equation",
          targetSelectorRole: "lhs.variable",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "constant-expression-equation",
          sourceSelectorRole: "equals",
          targetObjectRole: "solved-equation",
          targetSelectorRole: "equals",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.linear-solve.divide-both-sides",
      familyId: "generated.linear-solve",
      templateId: "linear-solve.divide-both-sides",
      status: "promoted",
      transformType: "divideBothSides",
      title: "Divide both sides by the coefficient",
      sourceObjectRoles: ["coefficient-equation"],
      targetObjectRoles: ["with-division-terms"],
      preserves: ["value", "structure"],
      artifactPolicy: "target-only",
      assumptions: [
        "Dividing equal quantities by the same non-zero value preserves equality."
      ],
      lawRefs: [{ id: "law.equation.divide-both-sides", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "coefficient-equation",
          sourceSelectorRole: "lhs.coefficient",
          targetObjectRole: "with-division-terms",
          targetSelectorRole: "lhs.coefficient",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "coefficient-equation",
          sourceSelectorRole: "lhs.variable",
          targetObjectRole: "with-division-terms",
          targetSelectorRole: "lhs.variable",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "coefficient-equation",
          sourceSelectorRole: "equals",
          targetObjectRole: "with-division-terms",
          targetSelectorRole: "equals",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "coefficient-equation",
          sourceSelectorRole: "rhs.constant",
          targetObjectRole: "with-division-terms",
          targetSelectorRole: "rhs.constant",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.linear-solve.cancel-multiplicative-inverses",
      familyId: "generated.linear-solve",
      templateId: "linear-solve.cancel-multiplicative-inverses",
      status: "promoted",
      transformType: "cancelMultiplicativeInverses",
      title: "Cancel multiplicative inverses",
      sourceObjectRoles: ["with-division-terms"],
      targetObjectRoles: ["coefficient-canceled-equation"],
      preserves: ["value"],
      artifactPolicy: "source-only",
      assumptions: ["A non-zero factor divided by itself simplifies to one."],
      lawRefs: [{ id: "law.algebra.multiplicative-inverse", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "with-division-terms",
          sourceSelectorRole: "lhs.variable",
          targetObjectRole: "coefficient-canceled-equation",
          targetSelectorRole: "lhs.variable",
          preserves: ["identity", "role"],
          summary: "The variable persists after its coefficient cancels."
        },
        {
          sourceObjectRole: "with-division-terms",
          sourceSelectorRole: "equals",
          targetObjectRole: "coefficient-canceled-equation",
          targetSelectorRole: "equals",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "with-division-terms",
          sourceSelectorRole: "rhs.constant",
          targetObjectRole: "coefficient-canceled-equation",
          targetSelectorRole: "rhs.constant",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "with-division-terms",
          sourceSelectorRole: "rhs.divisor",
          targetObjectRole: "coefficient-canceled-equation",
          targetSelectorRole: "rhs.divisor",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.linear-solve.simplify-constant-quotient",
      familyId: "generated.linear-solve",
      templateId: "linear-solve.simplify-constant-quotient",
      status: "promoted",
      transformType: "simplifyConstantQuotient",
      title: "Simplify the constant quotient",
      sourceObjectRoles: ["quotient-expression-equation"],
      targetObjectRoles: ["solved-equation"],
      preserves: ["value"],
      artifactPolicy: "mixed",
      assumptions: ["The right-hand constant quotient evaluates to the solution."],
      lawRefs: [{ id: "law.arithmetic.constant-quotient", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "quotient-expression-equation",
          sourceSelectorRole: "lhs.variable",
          targetObjectRole: "solved-equation",
          targetSelectorRole: "lhs.variable",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "quotient-expression-equation",
          sourceSelectorRole: "equals",
          targetObjectRole: "solved-equation",
          targetSelectorRole: "equals",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.fraction-expression.split-fraction-factors",
      familyId: "generated.fraction-expression",
      templateId: "fraction-expression.split-fraction-factors",
      status: "promoted",
      transformType: "splitFractionFactors",
      title: "Split numerator and denominator into common factors",
      sourceObjectRoles: ["fraction-expression"],
      targetObjectRoles: ["factored-fraction-expression"],
      preserves: ["value", "structure"],
      artifactPolicy: "mixed",
      assumptions: [
        "A numerator and denominator can be rewritten as products with a shared factor."
      ],
      lawRefs: [{ id: "law.arithmetic.factor-fraction", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "fraction-expression",
          sourceSelectorRole: "fraction-line",
          targetObjectRole: "factored-fraction-expression",
          targetSelectorRole: "fraction-line",
          preserves: ["structure"],
          summary: "The fraction relationship persists as factors are exposed."
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.fraction-expression.merge-common-factor",
      familyId: "generated.fraction-expression",
      templateId: "fraction-expression.merge-common-factor",
      status: "promoted",
      transformType: "mergeFractionCommonFactor",
      title: "Separate the common fraction factor",
      sourceObjectRoles: ["factored-fraction-expression"],
      targetObjectRoles: ["separated-common-factor-expression"],
      preserves: ["identity", "value", "structure"],
      artifactPolicy: "mixed",
      assumptions: [
        "A fraction of products can be grouped into a base fraction times a unit fraction."
      ],
      lawRefs: [
        { id: "law.arithmetic.fraction-factorization", level: "strict" }
      ],
      correspondenceTemplates: [
        {
          sourceObjectRole: "factored-fraction-expression",
          sourceSelectorRole: "base-numerator",
          targetObjectRole: "separated-common-factor-expression",
          targetSelectorRole: "base-numerator",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "factored-fraction-expression",
          sourceSelectorRole: "base-denominator",
          targetObjectRole: "separated-common-factor-expression",
          targetSelectorRole: "base-denominator",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.fraction-expression.simplify-unit-factor",
      familyId: "generated.fraction-expression",
      templateId: "fraction-expression.simplify-unit-factor",
      status: "promoted",
      transformType: "simplifyUnitFractionFactor",
      title: "Simplify the unit fraction factor",
      sourceObjectRoles: ["separated-common-factor-expression"],
      targetObjectRoles: ["simplified-fraction-expression"],
      preserves: ["identity", "value"],
      artifactPolicy: "source-only",
      assumptions: [
        "A non-zero value divided by itself is one, so multiplying by it does not change the base fraction."
      ],
      lawRefs: [
        { id: "law.arithmetic.unit-fraction-factor", level: "strict" }
      ],
      correspondenceTemplates: [
        {
          sourceObjectRole: "separated-common-factor-expression",
          sourceSelectorRole: "base-numerator",
          targetObjectRole: "simplified-fraction-expression",
          targetSelectorRole: "numerator",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "separated-common-factor-expression",
          sourceSelectorRole: "base-denominator",
          targetObjectRole: "simplified-fraction-expression",
          targetSelectorRole: "denominator",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.exponent.lower-exponent",
      familyId: "generated.exponent",
      templateId: "exponent.lower-exponent",
      status: "promoted",
      transformType: "lowerExponent",
      title: "Lower the exponent by one factor",
      sourceObjectRoles: ["power-expression"],
      targetObjectRoles: ["lowered-product-expression"],
      preserves: ["identity", "value"],
      artifactPolicy: "mixed",
      assumptions: [
        "A positive integer exponent can be lowered by exposing one copied base factor."
      ],
      lawRefs: [{ id: "law.arithmetic.exponent-lowering", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "power-expression",
          sourceSelectorRole: "base",
          targetObjectRole: "lowered-product-expression",
          targetSelectorRole: "factor-1",
          preserves: ["identity", "role"],
          summary: "The base contributes one explicit factor."
        },
        {
          sourceObjectRole: "power-expression",
          sourceSelectorRole: "base",
          targetObjectRole: "lowered-product-expression",
          targetSelectorRole: "residual-base",
          preserves: ["identity", "role"],
          summary: "The same base persists inside the remaining power."
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.exponent.unwrap-unit-exponent",
      familyId: "generated.exponent",
      templateId: "exponent.unwrap-unit-exponent",
      status: "promoted",
      transformType: "unwrapUnitExponent",
      title: "Unwrap the unit exponent",
      sourceObjectRoles: ["lowered-product-expression"],
      targetObjectRoles: ["expanded-product-expression"],
      preserves: ["identity", "value"],
      artifactPolicy: "source-only",
      assumptions: ["A base raised to the first power is the base itself."],
      lawRefs: [{ id: "law.arithmetic.unit-exponent", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "lowered-product-expression",
          sourceSelectorRole: "factor-1",
          targetObjectRole: "expanded-product-expression",
          targetSelectorRole: "factor-1",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "lowered-product-expression",
          sourceSelectorRole: "residual-base",
          targetObjectRole: "expanded-product-expression",
          targetSelectorRole: "factor-2",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.radical.rewrite-power-as-root",
      familyId: "generated.radical",
      templateId: "radical.rewrite-power-as-root",
      status: "promoted",
      transformType: "rewritePowerAsRoot",
      title: "Rewrite the rational exponent as a radical",
      sourceObjectRoles: ["rational-power-expression"],
      targetObjectRoles: ["radical-expression"],
      preserves: ["identity", "value"],
      artifactPolicy: "mixed",
      assumptions: [
        "A rational exponent with numerator one can be represented as a root."
      ],
      lawRefs: [
        { id: "law.arithmetic.rational-exponent-as-root", level: "strict" }
      ],
      correspondenceTemplates: [
        {
          sourceObjectRole: "rational-power-expression",
          sourceSelectorRole: "base",
          targetObjectRole: "radical-expression",
          targetSelectorRole: "radicand",
          preserves: ["identity", "role"],
          summary: "The base persists as the radicand while notation artifacts change."
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.function-wrap.wrap-function",
      familyId: "generated.function-wrap",
      templateId: "function-wrap.wrap-function",
      status: "promoted",
      transformType: "wrapFunction",
      title: "Wrap the expression in a function application",
      sourceObjectRoles: ["input-expression"],
      targetObjectRoles: ["function-application"],
      preserves: ["identity", "role"],
      artifactPolicy: "target-only",
      assumptions: [
        "The input expression persists as the argument of the function application."
      ],
      lawRefs: [{ id: "law.notation.function-application", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "input-expression",
          sourceSelectorRole: "value",
          targetObjectRole: "function-application",
          targetSelectorRole: "argument",
          preserves: ["identity", "role"],
          summary: "The input value persists as the function argument."
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.distribution.distribute-multiplication",
      familyId: "generated.distribution",
      templateId: "distribution.distribute-multiplication",
      status: "promoted",
      transformType: "distributeMultiplication",
      title: "Distribute multiplication over addition",
      sourceObjectRoles: ["factored-expression"],
      targetObjectRoles: ["expanded-expression"],
      preserves: ["identity", "value", "structure"],
      artifactPolicy: "mixed",
      assumptions: [
        "Multiplication distributes over addition and duplicates the common factor into each term."
      ],
      lawRefs: [{ id: "law.algebra.distributive-property", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "factored-expression",
          sourceSelectorRole: "factor",
          targetObjectRole: "expanded-expression",
          targetSelectorRole: "left-factor",
          preserves: ["identity", "role"],
          summary: "The common factor is copied into the left product."
        },
        {
          sourceObjectRole: "factored-expression",
          sourceSelectorRole: "factor",
          targetObjectRole: "expanded-expression",
          targetSelectorRole: "right-factor",
          preserves: ["identity", "role"],
          summary: "The common factor is copied into the right product."
        },
        {
          sourceObjectRole: "factored-expression",
          sourceSelectorRole: "left-term",
          targetObjectRole: "expanded-expression",
          targetSelectorRole: "left-term",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "factored-expression",
          sourceSelectorRole: "right-term",
          targetObjectRole: "expanded-expression",
          targetSelectorRole: "right-term",
          preserves: ["identity", "role"]
        }
      ]
    }),
    createGeneratedAlgebraTransformDefinition({
      id: "definition.generated.distribution.factor-common-term",
      familyId: "generated.distribution",
      templateId: "distribution.factor-common-term",
      status: "promoted",
      transformType: "factorCommonTerm",
      title: "Factor the common term",
      sourceObjectRoles: ["expanded-expression"],
      targetObjectRoles: ["factored-expression"],
      preserves: ["identity", "value", "structure"],
      artifactPolicy: "mixed",
      assumptions: [
        "The distributive property can be read backward to factor a common term."
      ],
      lawRefs: [{ id: "law.algebra.distributive-property", level: "strict" }],
      correspondenceTemplates: [
        {
          sourceObjectRole: "expanded-expression",
          sourceSelectorRole: "left-factor",
          targetObjectRole: "factored-expression",
          targetSelectorRole: "factor",
          preserves: ["identity", "role"],
          summary: "The left factor contributes to the shared factored term."
        },
        {
          sourceObjectRole: "expanded-expression",
          sourceSelectorRole: "right-factor",
          targetObjectRole: "factored-expression",
          targetSelectorRole: "factor",
          preserves: ["identity", "role"],
          summary: "The right factor contributes to the shared factored term."
        },
        {
          sourceObjectRole: "expanded-expression",
          sourceSelectorRole: "left-term",
          targetObjectRole: "factored-expression",
          targetSelectorRole: "left-term",
          preserves: ["identity", "role"]
        },
        {
          sourceObjectRole: "expanded-expression",
          sourceSelectorRole: "right-term",
          targetObjectRole: "factored-expression",
          targetSelectorRole: "right-term",
          preserves: ["identity", "role"]
        }
      ]
    })
  ];

export function createGeneratedAlgebraTransformDefinition(
  input: CreateGeneratedAlgebraTransformDefinitionInput
): GeneratedAlgebraTransformDefinition {
  assertNonEmpty(input.templateId, `Generated transform definition ${input.id} template`);
  const definition = createKpSemanticTransformationDefinition(input);

  return {
    ...definition,
    familyId: input.familyId,
    templateId: input.templateId,
    status: input.status ?? "seed",
    artifactPolicy: input.artifactPolicy ?? "none"
  };
}

export function listGeneratedAlgebraTransformDefinitions():
  readonly GeneratedAlgebraTransformDefinition[] {
  return generatedAlgebraTransformDefinitions.map(cloneGeneratedAlgebraTransformDefinition);
}

export function listGeneratedAlgebraTransformDefinitionsByFamily(
  familyId: GeneratedAlgebraFixtureFamilyId
): readonly GeneratedAlgebraTransformDefinition[] {
  return listGeneratedAlgebraTransformDefinitions().filter(
    (definition) => definition.familyId === familyId
  );
}

export function listGeneratedFractionExpressionTransformDefinitions(
  definitions: readonly GeneratedAlgebraTransformDefinition[] =
    listGeneratedAlgebraTransformDefinitions()
): readonly GeneratedAlgebraTransformDefinition[] {
  const expectationOrder = new Map(
    generatedFractionExpressionTransformExpectations.map(
      (expectation, index) => [expectation.transformType, index]
    )
  );

  return definitions
    .filter((definition) => definition.familyId === "generated.fraction-expression")
    .filter((definition) => expectationOrder.has(definition.transformType))
    .sort(
      (left, right) =>
        (expectationOrder.get(left.transformType) ?? 0) -
        (expectationOrder.get(right.transformType) ?? 0)
    )
    .map(cloneGeneratedAlgebraTransformDefinition);
}

export function checkGeneratedFractionExpressionTransformDefinitionCoverage(
  definitions: readonly GeneratedAlgebraTransformDefinition[] =
    listGeneratedAlgebraTransformDefinitions()
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const definitionsByType = new Map(
    listGeneratedFractionExpressionTransformDefinitions(definitions).map(
      (definition) => [definition.transformType, definition]
    )
  );

  generatedFractionExpressionTransformExpectations.forEach((expectation) => {
    const definition = definitionsByType.get(expectation.transformType);

    if (definition === undefined) {
      failures.push({
        path: `definitions[${expectation.transformType}]`,
        message:
          `Generated fraction-expression transform ${expectation.transformType} must be defined.`
      });
      return;
    }

    if (definition.id !== expectation.definitionId) {
      failures.push({
        path: `definitions[${expectation.transformType}].id`,
        message:
          `Generated fraction-expression transform ${expectation.transformType} expected definition id ${expectation.definitionId}.`
      });
    }

    if (definition.status !== "promoted") {
      failures.push({
        path: `definitions[${definition.id}].status`,
        message:
          `Generated fraction-expression transform ${definition.id} must be promoted.`
      });
    }

    if (definition.artifactPolicy !== expectation.artifactPolicy) {
      failures.push({
        path: `definitions[${definition.id}].artifactPolicy`,
        message:
          `Generated fraction-expression transform ${definition.id} expected artifact policy ${expectation.artifactPolicy} but received ${definition.artifactPolicy}.`
      });
    }

    if (!stringListsEqual(definition.preserves, expectation.preserves)) {
      failures.push({
        path: `definitions[${definition.id}].preserves`,
        message:
          `Generated fraction-expression transform ${definition.id} must preserve ${expectation.preserves.join(", ")}.`
      });
    }
  });

  return {
    lawId: "generated-fraction-expression.transform-definition-coverage",
    passed: failures.length === 0,
    failures
  };
}

export function listGeneratedExponentRadicalTransformDefinitions(
  definitions: readonly GeneratedAlgebraTransformDefinition[] =
    listGeneratedAlgebraTransformDefinitions()
): readonly GeneratedAlgebraTransformDefinition[] {
  const expectationOrder = new Map(
    generatedExponentRadicalTransformExpectations.map(
      (expectation, index) => [expectation.transformType, index]
    )
  );

  return definitions
    .filter((definition) =>
      definition.familyId === "generated.exponent" ||
      definition.familyId === "generated.radical"
    )
    .filter((definition) => expectationOrder.has(definition.transformType))
    .sort(
      (left, right) =>
        (expectationOrder.get(left.transformType) ?? 0) -
        (expectationOrder.get(right.transformType) ?? 0)
    )
    .map(cloneGeneratedAlgebraTransformDefinition);
}

export function checkGeneratedExponentRadicalTransformDefinitionCoverage(
  definitions: readonly GeneratedAlgebraTransformDefinition[] =
    listGeneratedAlgebraTransformDefinitions()
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const definitionsByType = new Map(
    listGeneratedExponentRadicalTransformDefinitions(definitions).map(
      (definition) => [definition.transformType, definition]
    )
  );

  generatedExponentRadicalTransformExpectations.forEach((expectation) => {
    const definition = definitionsByType.get(expectation.transformType);

    if (definition === undefined) {
      failures.push({
        path: `definitions[${expectation.transformType}]`,
        message:
          `Generated exponent/radical transform ${expectation.transformType} must be defined.`
      });
      return;
    }

    if (definition.id !== expectation.definitionId) {
      failures.push({
        path: `definitions[${expectation.transformType}].id`,
        message:
          `Generated exponent/radical transform ${expectation.transformType} expected definition id ${expectation.definitionId}.`
      });
    }

    if (definition.familyId !== expectation.familyId) {
      failures.push({
        path: `definitions[${definition.id}].familyId`,
        message:
          `Generated exponent/radical transform ${definition.id} expected family ${expectation.familyId}.`
      });
    }

    if (definition.status !== "promoted") {
      failures.push({
        path: `definitions[${definition.id}].status`,
        message:
          `Generated exponent/radical transform ${definition.id} must be promoted.`
      });
    }

    if (definition.artifactPolicy !== expectation.artifactPolicy) {
      failures.push({
        path: `definitions[${definition.id}].artifactPolicy`,
        message:
          `Generated exponent/radical transform ${definition.id} expected artifact policy ${expectation.artifactPolicy} but received ${definition.artifactPolicy}.`
      });
    }

    if (!stringListsEqual(definition.preserves, expectation.preserves)) {
      failures.push({
        path: `definitions[${definition.id}].preserves`,
        message:
          `Generated exponent/radical transform ${definition.id} must preserve ${expectation.preserves.join(", ")}.`
      });
    }
  });

  return {
    lawId: "generated-exponent-radical.transform-definition-coverage",
    passed: failures.length === 0,
    failures
  };
}

export function listGeneratedFunctionWrapTransformDefinitions(
  definitions: readonly GeneratedAlgebraTransformDefinition[] =
    listGeneratedAlgebraTransformDefinitions()
): readonly GeneratedAlgebraTransformDefinition[] {
  const expectationOrder = new Map(
    generatedFunctionWrapTransformExpectations.map(
      (expectation, index) => [expectation.transformType, index]
    )
  );

  return definitions
    .filter((definition) => definition.familyId === "generated.function-wrap")
    .filter((definition) => expectationOrder.has(definition.transformType))
    .sort(
      (left, right) =>
        (expectationOrder.get(left.transformType) ?? 0) -
        (expectationOrder.get(right.transformType) ?? 0)
    )
    .map(cloneGeneratedAlgebraTransformDefinition);
}

export function checkGeneratedFunctionWrapTransformDefinitionCoverage(
  definitions: readonly GeneratedAlgebraTransformDefinition[] =
    listGeneratedAlgebraTransformDefinitions()
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const definitionsByType = new Map(
    listGeneratedFunctionWrapTransformDefinitions(definitions).map(
      (definition) => [definition.transformType, definition]
    )
  );

  generatedFunctionWrapTransformExpectations.forEach((expectation) => {
    const definition = definitionsByType.get(expectation.transformType);

    if (definition === undefined) {
      failures.push({
        path: `definitions[${expectation.transformType}]`,
        message:
          `Generated function-wrap transform ${expectation.transformType} must be defined.`
      });
      return;
    }

    if (definition.id !== expectation.definitionId) {
      failures.push({
        path: `definitions[${expectation.transformType}].id`,
        message:
          `Generated function-wrap transform ${expectation.transformType} expected definition id ${expectation.definitionId}.`
      });
    }

    if (definition.status !== "promoted") {
      failures.push({
        path: `definitions[${definition.id}].status`,
        message:
          `Generated function-wrap transform ${definition.id} must be promoted.`
      });
    }

    if (definition.artifactPolicy !== expectation.artifactPolicy) {
      failures.push({
        path: `definitions[${definition.id}].artifactPolicy`,
        message:
          `Generated function-wrap transform ${definition.id} expected artifact policy ${expectation.artifactPolicy} but received ${definition.artifactPolicy}.`
      });
    }

    if (!stringListsEqual(definition.preserves, expectation.preserves)) {
      failures.push({
        path: `definitions[${definition.id}].preserves`,
        message:
          `Generated function-wrap transform ${definition.id} must preserve ${expectation.preserves.join(", ")}.`
      });
    }
  });

  return {
    lawId: "generated-function-wrap.transform-definition-coverage",
    passed: failures.length === 0,
    failures
  };
}

export function findGeneratedAlgebraTransformDefinition(
  id: string
): GeneratedAlgebraTransformDefinition | undefined {
  const definition = generatedAlgebraTransformDefinitions.find(
    (candidate) => candidate.id === id
  );

  return definition === undefined
    ? undefined
    : cloneGeneratedAlgebraTransformDefinition(definition);
}

export function findGeneratedAlgebraTransformDefinitionByFamilyAndType(
  familyId: GeneratedAlgebraFixtureFamilyId,
  transformType: string
): GeneratedAlgebraTransformDefinition | undefined {
  const definition = generatedAlgebraTransformDefinitions.find(
    (candidate) =>
      candidate.familyId === familyId && candidate.transformType === transformType
  );

  return definition === undefined
    ? undefined
    : cloneGeneratedAlgebraTransformDefinition(definition);
}

export function getGeneratedAlgebraTransformDefinition(
  id: string
): GeneratedAlgebraTransformDefinition {
  const definition = findGeneratedAlgebraTransformDefinition(id);

  if (definition === undefined) {
    throw new Error(`Unknown generated algebra transform definition: ${id}`);
  }

  return definition;
}

export function createGeneratedAlgebraSemanticTransformation(
  input: CreateGeneratedAlgebraSemanticTransformationInput
): KpCompilerGeneratedAlgebraTransformation {
  const definition = findGeneratedAlgebraTransformDefinitionByFamilyAndType(
    input.familyId,
    input.transformType
  );

  if (definition === undefined) {
    throw new Error(
      `Unknown generated algebra transform definition for ${input.familyId}.${input.transformType}`
    );
  }

  const generatedCancellationMap =
    createGeneratedLinearSolveCancellationMap(input);
  if (
    generatedCancellationMap !== undefined &&
    input.correspondenceMap !== undefined
  ) {
    throw new Error(
      `Generated cancellation ${input.id} correspondence is compiler-owned.`
    );
  }
  return mintKpCompilerGeneratedAlgebraTransformation({
    familyId: input.familyId,
    transformation: createKpSemanticTransformation({
      id: input.id,
      definitionId: definition.id,
      transformType: definition.transformType,
      title: input.title ?? definition.title,
      sourceObjectIds: input.sourceObjectIds,
      targetObjectIds: input.targetObjectIds,
      preserves: definition.preserves,
      assumptions: definition.assumptions,
      lawRefs: definition.lawRefs,
      correspondenceMap:
        generatedCancellationMap ?? input.correspondenceMap,
      correspondence: input.correspondence
    })
  });
}

function createGeneratedLinearSolveCancellationMap(
  input: CreateGeneratedAlgebraSemanticTransformationInput
): CorrespondenceMap | undefined {
  if (input.familyId !== "generated.linear-solve") return undefined;
  const inverseSuffixes = input.transformType === "cancelAdditiveInverses"
    ? ["lhs.addend", "lhs.subtract"] as const
    : input.transformType === "cancelMultiplicativeInverses"
      ? ["lhs.coefficient", "lhs.divide"] as const
      : undefined;
  if (inverseSuffixes === undefined) return undefined;
  if (
    input.sourceObjectIds.length !== 1 ||
    input.targetObjectIds.length !== 1
  ) {
    throw new Error(
      `Generated cancellation ${input.id} requires one source and one target.`
    );
  }
  const sourceObjectId = input.sourceObjectIds[0]!;
  const correspondence = input.correspondence ?? [];
  if (correspondence.some(({ preserves }) => !preserves.includes("identity"))) {
    throw new Error(
      `Generated cancellation ${input.id} continuants must preserve identity.`
    );
  }

  // These selector roles are part of the registered algebra operation
  // template. Numeric values and glyph labels never decide inverse pairing.
  return {
    id: `correspondence.${input.id}`,
    records: [
      ...correspondence.map((entry, index) => ({
        id: `continuant-${index + 1}`,
        relation: "identity" as const,
        sourceSelectorIds: [entry.sourceSelectorId],
        targetSelectorIds: [entry.targetSelectorId],
        summary: "The generated semantic entity persists through cancellation."
      })),
      {
        id: input.transformType === "cancelAdditiveInverses"
          ? "generated-additive-inverses-cancel"
          : "generated-multiplicative-inverses-cancel",
        relation: "cancelation",
        sourceSelectorIds: inverseSuffixes.map(
          (suffix) => `${sourceObjectId}.${suffix}`
        ),
        targetSelectorIds: [],
        summary:
          "The registered inverse pair retires through cancellation."
      }
    ]
  };
}

export function validateGeneratedAlgebraTransformDefinitionRegistry(
  definitions: readonly GeneratedAlgebraTransformDefinition[] =
    generatedAlgebraTransformDefinitions
): readonly KpTransformationValidationIssue[] {
  const issues: KpTransformationValidationIssue[] = [];
  const ids = new Set<string>();
  const templateIds = new Set<string>();

  definitions.forEach((definition, index) => {
    if (ids.has(definition.id)) {
      issues.push({
        path: `definitions[${index}].id`,
        message: `Duplicate generated algebra transform definition id: ${definition.id}.`
      });
    } else {
      ids.add(definition.id);
    }

    if (templateIds.has(definition.templateId)) {
      issues.push({
        path: `definitions[${index}].templateId`,
        message: `Duplicate generated algebra transform template id: ${definition.templateId}.`
      });
    } else {
      templateIds.add(definition.templateId);
    }

    validateKpSemanticTransformationDefinition(definition).forEach((issue) => {
      issues.push({
        path: `definitions[${index}].${issue.path}`,
        message: issue.message
      });
    });
  });

  return issues;
}

function cloneGeneratedAlgebraTransformDefinition(
  definition: GeneratedAlgebraTransformDefinition
): GeneratedAlgebraTransformDefinition {
  return {
    ...createKpSemanticTransformationDefinition(definition),
    familyId: definition.familyId,
    templateId: definition.templateId,
    status: definition.status,
    artifactPolicy: definition.artifactPolicy
  };
}

function stringListsEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
