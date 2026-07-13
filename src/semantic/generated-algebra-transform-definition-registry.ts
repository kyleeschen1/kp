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
