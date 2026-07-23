import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";
import {
  listGeneratedAlgebraTransformDefinitions,
  type GeneratedAlgebraTransformDefinition
} from "../semantic/generated-algebra-transform-definition-registry.ts";
import type {
  TransformTreeVisualMotifRule
} from "./visual-motif-composition.ts";
import {
  equationVisualMotifDescriptors,
  type EquationMotionPrimitiveId,
  type EquationVisualMotifDescriptor,
  type EquationVisualMotifKind,
  type EquationVisualMotifPhaseId
} from "./visual-motif.ts";
import {
  canonicalCompositionForGeneratedTransform
} from "../semantic/generated-algebra-canonical-composition.ts";
import { compileKpExecutableMotifComposition } from "./executable-motif-grammar.ts";

export type EquationTransformVisualMotifRule = TransformTreeVisualMotifRule<
  EquationVisualMotifKind,
  EquationMotionPrimitiveId,
  EquationVisualMotifPhaseId
>;

export const defaultEquationTransformVisualMotifRules:
  readonly EquationTransformVisualMotifRule[] = [
    ...generatedAlgebraEquationMotifDefaults().map(
      createGeneratedAlgebraEquationMotifRule
    ),
    {
      transformationKind: "unwrapFunction",
      descriptor: descriptorForEquationMotif("unwrap"),
      canonicalOperationIds: ["kp.core.unwrap"],
      trustedMotifIds: ["unwrap"],
      summary: "Function wrapper artifacts exit while persistent arguments shift."
    },
    {
      transformationKind: "substituteValue",
      descriptor: descriptorForEquationMotif("substitute"),
      canonicalOperationIds: ["kp.core.substitute"],
      trustedMotifIds: ["substitute"],
      summary: "The supplied value persists through transmission before replacing the prior occupant."
    },
    {
      transformationKind: "simplify-additive-identity",
      descriptor: descriptorForEquationMotif("simplify-into"),
      canonicalOperationIds: ["kp.core.persist", "kp.core.eliminate"],
      trustedMotifIds: ["simplify-into"],
      summary:
        "The additive operator folds into zero before the identity is absorbed by its persistent operand."
    },
    {
      transformationKind: "simplify-multiplicative-identity",
      descriptor: descriptorForEquationMotif("simplify-into"),
      canonicalOperationIds: ["kp.core.persist", "kp.core.eliminate"],
      trustedMotifIds: ["simplify-into"],
      summary:
        "The multiplication operator folds into one before the identity is absorbed by its persistent operand."
    },
    {
      transformationKind: "applyDerivativePowerRule",
      descriptor: descriptorForEquationMotif("derivative-power"),
      summary:
        "The exponent branches into coefficient and predecessor roles after the persistent base reflows."
    },
    {
      transformationKind: "derivativePowerRule",
      descriptor: descriptorForEquationMotif("derivative-power"),
      summary:
        "The exponent branches into coefficient and predecessor roles after the persistent base reflows."
    },
    {
      transformationKind: "convergeDifferenceQuotient",
      descriptor: descriptorForEquationMotif("limit-convergence"),
      summary:
        "The finite difference quotient remains legible while its shared parameter converges to the derivative."
    },
    {
      transformationKind: "applyDerivativeSumRule",
      descriptor: descriptorForEquationMotif("copy-fan-out"),
      summary:
        "The outer derivative branches into one local derivative per persistent addend."
    },
    {
      transformationKind: "applyDerivativePowerRulesToTerms",
      descriptor: descriptorForEquationMotif("merge-fan-in"),
      summary:
        "Each local operator, variable, and term resolves into one derivative result."
    },
    {
      transformationKind: "applyAntiderivativePowerRule",
      descriptor: descriptorForEquationMotif("copy-fan-out"),
      summary:
        "The source exponent branches into two successor expressions while the coefficient and base persist."
    },
    {
      transformationKind: "simplifyAntiderivativePowerRule",
      descriptor: descriptorForEquationMotif("merge-fan-in"),
      summary:
        "The quotient and successor groups resolve before the integration constant enters."
    },
    {
      transformationKind: "multiplyNegativeBothSidesInequality",
      descriptor: descriptorForEquationMotif("relation-flip"),
      summary: "The inequality relation turns while negative multiplication enters."
    },
    {
      transformationKind: "computeDotProduct",
      descriptor: descriptorForEquationMotif("dot-product-accumulate"),
      summary:
        "Semantic component pairs form persistent products before their partial sums resolve."
    },
    {
      transformationKind: "multiplyMatrixVector",
      descriptor: descriptorForEquationMotif("matrix-row-compose"),
      summary:
        "Rows focus and meet the shared vector before each persistent result component appears."
    },
    {
      transformationKind: "multiplyMatrices",
      descriptor: descriptorForEquationMotif("matrix-cell-compose"),
      summary:
        "Left rows and right columns focus before each persistent result cell appears."
    }
  ];

export interface CheckGeneratedAlgebraEquationVisualMotifDefaultCoverageInput {
  readonly definitions?: readonly GeneratedAlgebraTransformDefinition[] | undefined;
  readonly rules?: readonly EquationTransformVisualMotifRule[] | undefined;
}

export interface CheckEquationCancelationVisualMotifContractInput {
  readonly definitions?: readonly GeneratedAlgebraTransformDefinition[] | undefined;
  readonly rules?: readonly EquationTransformVisualMotifRule[] | undefined;
  readonly descriptors?: readonly EquationVisualMotifDescriptor[] | undefined;
}

export function checkGeneratedAlgebraEquationVisualMotifDefaultCoverage(
  input: CheckGeneratedAlgebraEquationVisualMotifDefaultCoverageInput = {}
): KpLawCheckResult {
  const definitions = input.definitions ?? listGeneratedAlgebraTransformDefinitions();
  const rules = input.rules ?? defaultEquationTransformVisualMotifRules;
  const rulesByDefinitionId = new Map<string, EquationTransformVisualMotifRule>();
  const failures: KpLawFailure[] = [];

  rules.forEach((rule) => {
    (rule.definitionIds ?? []).forEach((definitionId) => {
      rulesByDefinitionId.set(definitionId, rule);
    });
  });

  definitions
    .filter((definition) => definition.status === "promoted")
    .forEach((definition) => {
      const rule = rulesByDefinitionId.get(definition.id);

      if (rule === undefined) {
        failures.push({
          path: `definitions[${definition.id}]`,
          message:
            `Promoted generated transform definition ${definition.id} must have a default equation visual motif rule.`
        });
        return;
      }

      if (rule.transformationKind !== definition.transformType) {
        failures.push({
          path: `definitions[${definition.id}].transformType`,
          message:
            `Default visual motif rule for ${definition.id} must target transform type ${definition.transformType}.`
        });
      }
    });

  return {
    lawId: "equation-visual-motif.generated-transform-default-coverage",
    passed: failures.length === 0,
    failures
  };
}

export function checkEquationCancelationVisualMotifContract(
  input: CheckEquationCancelationVisualMotifContractInput = {}
): KpLawCheckResult {
  const definitions = input.definitions ?? listGeneratedAlgebraTransformDefinitions();
  const rules = input.rules ?? defaultEquationTransformVisualMotifRules;
  const descriptors = input.descriptors ?? equationVisualMotifDescriptors;
  const failures: KpLawFailure[] = [];
  const cancelationDescriptor = descriptors.find(
    (descriptor) => descriptor.kind === "cancelation"
  );

  if (cancelationDescriptor === undefined) {
    failures.push({
      path: "descriptors[cancelation]",
      message: "Equation visual motifs must define the cancelation descriptor."
    });
  } else {
    checkExactMotifList({
      failures,
      path: "descriptors[cancelation].motionPrimitiveIds",
      label: "motion primitives",
      actual: cancelationDescriptor.motionPrimitiveIds,
      expected: ["vanish"]
    });
    checkExactMotifList({
      failures,
      path: "descriptors[cancelation].phaseIds",
      label: "phase ids",
      actual: cancelationDescriptor.phaseIds,
      expected: ["cancel-meet", "cancel-collapse", "post-cancel-layout-shift"]
    });
  }

  const ruleByTransformationKind = new Map(
    rules.map((rule) => [rule.transformationKind, rule])
  );

  definitions
    .filter(isPromotedGeneratedCancelationDefinition)
    .forEach((definition) => {
      const rule = ruleByTransformationKind.get(definition.transformType);

      if (rule === undefined) {
        failures.push({
          path: `definitions[${definition.id}]`,
          message:
            `Generated cancelation transform definition ${definition.id} must use the cancelation visual motif.`
        });
        return;
      }

      if (rule.descriptor.kind !== "cancelation") {
        failures.push({
          path: `rules[${definition.transformType}].descriptor.kind`,
          message:
            `Generated cancelation transform definition ${definition.id} mapped to ${rule.descriptor.kind}, expected cancelation.`
        });
      }
    });

  return {
    lawId: "equation-visual-motif.cancelation-contract",
    passed: failures.length === 0,
    failures
  };
}

interface GeneratedAlgebraEquationMotifDefault {
  readonly transformType: string;
  readonly motifKind: EquationVisualMotifKind;
  readonly summary: string;
}

function generatedAlgebraEquationMotifDefaults():
  readonly GeneratedAlgebraEquationMotifDefault[] {
  return [
    {
      transformType: "subtractBothSides",
      motifKind: "append-after-shift",
      summary: "Persisted equation terms shift before inverse terms enter."
    },
    {
      transformType: "addBothSides",
      motifKind: "append-after-shift",
      summary: "Persisted equation terms shift before inverse terms enter."
    },
    {
      transformType: "cancelAdditiveInverses",
      motifKind: "cancelation",
      summary: "Additive inverse terms meet, collapse, and leave layout room."
    },
    {
      transformType: "simplifyConstantDifference",
      motifKind: "simplify-into",
      summary: "A constant difference collapses into the simplified value."
    },
    {
      transformType: "simplifyConstantSum",
      motifKind: "simplify-into",
      summary: "A constant sum collapses into the simplified value."
    },
    {
      transformType: "divideBothSides",
      motifKind: "append-after-shift",
      summary: "Persisted equation terms shift before division terms enter."
    },
    {
      transformType: "cancelMultiplicativeInverses",
      motifKind: "cancelation",
      summary: "Multiplicative inverse terms meet, collapse, and leave layout room."
    },
    {
      transformType: "simplifyConstantQuotient",
      motifKind: "simplify-into",
      summary: "A constant quotient collapses into the simplified value."
    },
    {
      transformType: "splitFractionFactors",
      motifKind: "fraction-factor-split",
      summary: "Factor structure branches from the focused fraction after continuants reflow."
    },
    {
      transformType: "mergeFractionCommonFactor",
      motifKind: "fraction-common-factor-extract",
      summary: "Repeated factor structure coalesces into one separated common factor."
    },
    {
      transformType: "simplifyUnitFractionFactor",
      motifKind: "fraction-unit-absorb",
      summary: "A unit fraction factor is absorbed after the persistent fraction reflows."
    },
    {
      transformType: "lowerExponent",
      motifKind: "exponent-factor-peel",
      summary: "The power role emits an independent factor and operator after reserving product space."
    },
    {
      transformType: "unwrapUnitExponent",
      motifKind: "exponent-unit-absorb",
      summary: "The persistent base settles before the unit exponent is absorbed."
    },
    {
      transformType: "rewritePowerAsRoot",
      motifKind: "radical-corner-transfer",
      summary: "Rational exponent fragments hand off through opposite-corner arcs into radical structure."
    },
    {
      transformType: "wrapFunction",
      motifKind: "wrap",
      summary: "The persistent argument shifts while function wrapper artifacts enter."
    },
    {
      transformType: "distributeMultiplication",
      motifKind: "copy-fan-out",
      summary: "The shared factor contracts, branches, and travels independently to both addends."
    },
    {
      transformType: "factorCommonTerm",
      motifKind: "merge-fan-in",
      summary: "Repeated factors retrace their paths and coalesce into one common factor."
    }
  ];
}

function createGeneratedAlgebraEquationMotifRule(
  motifDefault: GeneratedAlgebraEquationMotifDefault
): EquationTransformVisualMotifRule {
  const definition = findGeneratedDefinitionByTransformType(
    motifDefault.transformType
  );

  if (definition === undefined) {
    throw new Error(
      `No generated algebra transform definition for ${motifDefault.transformType}.`
    );
  }
  const composition = compileKpExecutableMotifComposition(
    canonicalCompositionForGeneratedTransform(definition.transformType)
  );

  return {
    transformationKind: definition.transformType,
    descriptor: descriptorForEquationMotif(motifDefault.motifKind),
    definitionIds: [definition.id],
    canonicalOperationIds: [...composition.operationIds],
    trustedMotifIds: composition.steps.map((step) => step.motifId),
    summary: motifDefault.summary
  };
}

function findGeneratedDefinitionByTransformType(
  transformType: string
): GeneratedAlgebraTransformDefinition | undefined {
  return listGeneratedAlgebraTransformDefinitions().find(
    (definition) => definition.transformType === transformType
  );
}

function descriptorForEquationMotif(
  kind: EquationVisualMotifKind
): EquationVisualMotifDescriptor {
  const descriptor = equationVisualMotifDescriptors.find(
    (candidate) => candidate.kind === kind
  );

  if (descriptor === undefined) {
    throw new Error(`Unknown equation visual motif kind: ${kind}`);
  }

  return descriptor;
}

function isPromotedGeneratedCancelationDefinition(
  definition: GeneratedAlgebraTransformDefinition
): boolean {
  return definition.status === "promoted" &&
    definition.transformType.startsWith("cancel") &&
    definition.transformType.endsWith("Inverses");
}

function checkExactMotifList(input: {
  readonly failures: KpLawFailure[];
  readonly path: string;
  readonly label: string;
  readonly actual: readonly string[];
  readonly expected: readonly string[];
}): void {
  if (stringListsEqual(input.actual, input.expected)) return;

  input.failures.push({
    path: input.path,
    message:
      `Equation cancelation motif ${input.label} must be ${input.expected.join(", ")}.`
  });
}

function stringListsEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}
