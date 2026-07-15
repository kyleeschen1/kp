import type { CorrespondenceMap } from "./correspondence.ts";
import type {
  KpSemanticTransformation,
  KpSemanticTransformationDefinition
} from "./asset-transformation.ts";

export interface KpTransformationObjectRoleBinding {
  readonly objectRole: string;
  readonly objectId: string;
  readonly selectorIdsByRole: Readonly<Record<string, string>>;
}

export interface KpTransformationDefinitionBindings {
  readonly source: readonly KpTransformationObjectRoleBinding[];
  readonly target: readonly KpTransformationObjectRoleBinding[];
}

export function bindKpTransformationDefinitionCorrespondence(input: {
  readonly transformation: KpSemanticTransformation;
  readonly definition: KpSemanticTransformationDefinition;
  readonly bindings: KpTransformationDefinitionBindings;
}): CorrespondenceMap {
  if (input.transformation.definitionId !== input.definition.id) {
    throw new Error(
      `Transformation ${input.transformation.id} definition ${input.transformation.definitionId ?? "<missing>"} does not match ${input.definition.id}.`
    );
  }
  if (input.transformation.transformType !== input.definition.transformType) {
    throw new Error(
      `Transformation ${input.transformation.id} type ${input.transformation.transformType} does not match definition type ${input.definition.transformType}.`
    );
  }

  const sourceBindings = indexBindings(
    input.transformation,
    "source",
    input.definition.sourceObjectRoles,
    input.bindings.source
  );
  const targetBindings = indexBindings(
    input.transformation,
    "target",
    input.definition.targetObjectRoles,
    input.bindings.target
  );

  return {
    id: `${input.transformation.id}.definition-correspondence`,
    records: input.definition.correspondenceTemplates.map((template, index) => {
      const source = requiredBinding(
        input.transformation.id,
        "source",
        sourceBindings,
        template.sourceObjectRole
      );
      const target = requiredBinding(
        input.transformation.id,
        "target",
        targetBindings,
        template.targetObjectRole
      );
      const sourceSelectorId = requiredSelectorBinding(
        input.transformation.id,
        "source",
        source,
        template.sourceSelectorRole
      );
      const targetSelectorId = requiredSelectorBinding(
        input.transformation.id,
        "target",
        target,
        template.targetSelectorRole
      );

      return {
        id: `template.${index}.${idPart(template.sourceObjectRole)}.${idPart(template.sourceSelectorRole)}.to.${idPart(template.targetObjectRole)}.${idPart(template.targetSelectorRole)}`,
        relation: template.preserves.includes("role") ? "identity" : "role-change",
        sourceSelectorIds: [sourceSelectorId],
        targetSelectorIds: [targetSelectorId],
        summary: template.summary ??
          `Definition binding from ${template.sourceSelectorRole} to ${template.targetSelectorRole}.`
      };
    })
  };
}

function indexBindings(
  transformation: KpSemanticTransformation,
  side: "source" | "target",
  expectedRoles: readonly string[],
  bindings: readonly KpTransformationObjectRoleBinding[]
): ReadonlyMap<string, KpTransformationObjectRoleBinding> {
  const index = new Map<string, KpTransformationObjectRoleBinding>();
  const allowedObjectIds = new Set(
    side === "source"
      ? transformation.sourceObjectIds
      : transformation.targetObjectIds
  );
  for (const binding of bindings) {
    if (index.has(binding.objectRole)) {
      throw new Error(
        `Transformation ${transformation.id} repeats ${side} object role binding ${binding.objectRole}.`
      );
    }
    if (!expectedRoles.includes(binding.objectRole)) {
      throw new Error(
        `Transformation ${transformation.id} binds unexpected ${side} object role ${binding.objectRole}.`
      );
    }
    if (!allowedObjectIds.has(binding.objectId)) {
      throw new Error(
        `Transformation ${transformation.id} ${side} role ${binding.objectRole} references object ${binding.objectId} outside its ${side} boundary.`
      );
    }
    index.set(binding.objectRole, binding);
  }
  for (const role of expectedRoles) {
    if (!index.has(role)) {
      throw new Error(
        `Transformation ${transformation.id} is missing ${side} object role binding ${role}.`
      );
    }
  }
  return index;
}

function requiredBinding(
  transformationId: string,
  side: "source" | "target",
  bindings: ReadonlyMap<string, KpTransformationObjectRoleBinding>,
  role: string
): KpTransformationObjectRoleBinding {
  const binding = bindings.get(role);
  if (binding === undefined) {
    throw new Error(`Transformation ${transformationId} is missing ${side} object role binding ${role}.`);
  }
  return binding;
}

function requiredSelectorBinding(
  transformationId: string,
  side: "source" | "target",
  binding: KpTransformationObjectRoleBinding,
  selectorRole: string
): string {
  const selectorId = binding.selectorIdsByRole[selectorRole];
  if (selectorId === undefined || selectorId.trim().length === 0) {
    throw new Error(
      `Transformation ${transformationId} is missing ${side} selector role binding ${binding.objectRole}.${selectorRole}.`
    );
  }
  return selectorId;
}

function idPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}
