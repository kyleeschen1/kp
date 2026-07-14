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
      summary: "Function wrapper artifacts exit while persistent arguments shift."
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
      motifKind: "artifact-replace",
      summary: "A compact fraction expression is replaced by factored structure."
    },
    {
      transformType: "mergeFractionCommonFactor",
      motifKind: "artifact-replace",
      summary: "Common factor structure is reorganized into a separated factor."
    },
    {
      transformType: "simplifyUnitFractionFactor",
      motifKind: "simplify-into",
      summary: "A unit fraction factor collapses away to the simplified fraction."
    },
    {
      transformType: "lowerExponent",
      motifKind: "append-after-shift",
      summary: "The persistent base shifts while the next factor enters."
    },
    {
      transformType: "unwrapUnitExponent",
      motifKind: "unwrap",
      summary: "The unit exponent artifact exits while the base persists."
    },
    {
      transformType: "rewritePowerAsRoot",
      motifKind: "artifact-replace",
      summary: "Rational exponent artifacts are replaced by radical structure."
    },
    {
      transformType: "wrapFunction",
      motifKind: "wrap",
      summary: "The persistent argument shifts while function wrapper artifacts enter."
    },
    {
      transformType: "distributeMultiplication",
      motifKind: "artifact-replace",
      summary: "Factored structure is replaced by expanded distributed terms."
    },
    {
      transformType: "factorCommonTerm",
      motifKind: "simplify-into",
      summary: "Duplicated factors collapse into a single factored expression."
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

  return {
    transformationKind: definition.transformType,
    descriptor: descriptorForEquationMotif(motifDefault.motifKind),
    definitionIds: [definition.id],
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
