import {
  createKpSemanticTransformationDefinition,
  validateKpSemanticTransformationDefinition,
  type CreateKpSemanticTransformationDefinitionInput,
  type KpSemanticTransformationDefinition,
  type KpTransformationValidationIssue
} from "./asset-transformation.ts";
import type { GeneratedAlgebraFixtureFamilyId } from "./generated-algebra-fixture-registry.ts";

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

export function getGeneratedAlgebraTransformDefinition(
  id: string
): GeneratedAlgebraTransformDefinition {
  const definition = findGeneratedAlgebraTransformDefinition(id);

  if (definition === undefined) {
    throw new Error(`Unknown generated algebra transform definition: ${id}`);
  }

  return definition;
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

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
