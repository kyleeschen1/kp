import type { CorrespondenceMap, SelectorCorrespondenceRelationId } from "./correspondence.ts";
import type {
  KpSemanticTransformation,
  KpSemanticTransformationDefinition
} from "./asset-transformation.ts";
import type { KpCanonicalOperationSpec } from "./canonical-operation-spec.ts";
import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageGraph,
  type KpSemanticLineageRelation
} from "./semantic-lineage-graph.ts";

export interface KpTransformationObjectRoleBinding {
  readonly objectRole: string;
  readonly objectId: string;
  readonly selectorIdsByRole: Readonly<Record<string, string>>;
}

export interface KpTransformationDefinitionBindings {
  readonly source: readonly KpTransformationObjectRoleBinding[];
  readonly target: readonly KpTransformationObjectRoleBinding[];
}

export type KpCanonicalOperationRoleBindings = Readonly<
  Record<string, string | readonly string[]>
>;

export interface KpCanonicalOperationExecutionResult {
  readonly kind: "canonical-operation-execution";
  readonly transformationId: string;
  readonly operationSpecId: string;
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly lineageGraph: KpSemanticLineageGraph;
  readonly correspondenceMap: CorrespondenceMap;
}

export function executeKpCanonicalOperationBinding(input: {
  readonly transformation: KpSemanticTransformation;
  readonly operationSpec: KpCanonicalOperationSpec;
  readonly roleBindings: KpCanonicalOperationRoleBindings;
}): KpCanonicalOperationExecutionResult {
  const roleBindings = normalizeCanonicalRoleBindings(input.operationSpec, input.roleBindings);
  const sourceEntityIds = endpointBindings(input.operationSpec, roleBindings, "source");
  const targetEntityIds = endpointBindings(input.operationSpec, roleBindings, "target");
  const lineageGraph = createKpSemanticLineageGraph({
    id: `${input.transformation.id}.lineage`,
    sourceEntityIds,
    targetEntityIds,
    edges: input.operationSpec.lineage
      .filter((template) => template.relation !== "focus")
      .map((template) => ({
        id: `${input.transformation.id}.${template.id}`,
        relation: lineageRelation(template.relation, template.sourceRoleIds, template.targetRoleIds),
        sourceEntityIds: template.sourceRoleIds.flatMap((roleId) => roleBindings[roleId] ?? []),
        targetEntityIds: template.targetRoleIds.flatMap((roleId) => roleBindings[roleId] ?? []),
        summary: template.summary
      }))
  });
  const correspondenceMap: CorrespondenceMap = {
    id: `${input.transformation.id}.operation-correspondence`,
    records: input.operationSpec.lineage.map((template) => ({
      id: `${input.transformation.id}.${template.id}`,
      relation: template.relation,
      sourceSelectorIds: template.sourceRoleIds.flatMap((roleId) => roleBindings[roleId] ?? []),
      targetSelectorIds: template.targetRoleIds.flatMap((roleId) => roleBindings[roleId] ?? []),
      summary: template.summary
    }))
  };
  return {
    kind: "canonical-operation-execution",
    transformationId: input.transformation.id,
    operationSpecId: input.operationSpec.id,
    roleBindings,
    lineageGraph,
    correspondenceMap
  };
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

function normalizeCanonicalRoleBindings(
  spec: KpCanonicalOperationSpec,
  bindings: KpCanonicalOperationRoleBindings
): Readonly<Record<string, readonly string[]>> {
  const roleIds = new Set(spec.roles.map((role) => role.id));
  Object.keys(bindings).forEach((roleId) => {
    if (!roleIds.has(roleId)) throw new Error(`Operation ${spec.id} binds unknown role ${roleId}.`);
  });
  return Object.fromEntries(spec.roles.map((role) => {
    const raw = bindings[role.id];
    const values = raw === undefined ? [] : typeof raw === "string" ? [raw] : [...raw];
    if (values.some((value) => value.trim().length === 0)) {
      throw new Error(`Operation ${spec.id} role ${role.id} contains an empty entity id.`);
    }
    const cardinalityValid = role.cardinality === "exactly-one"
      ? values.length === 1
      : role.cardinality === "zero-or-one"
        ? values.length <= 1
        : values.length >= 1;
    if (!cardinalityValid) {
      throw new Error(
        `Operation ${spec.id} role ${role.id} requires ${role.cardinality}; received ${values.length}.`
      );
    }
    return [role.id, values];
  }));
}

function endpointBindings(
  spec: KpCanonicalOperationSpec,
  bindings: Readonly<Record<string, readonly string[]>>,
  endpoint: "source" | "target"
): readonly string[] {
  return [...new Set(spec.roles
    .filter((role) => role.endpoint === endpoint)
    .flatMap((role) => bindings[role.id] ?? []))];
}

function lineageRelation(
  relation: SelectorCorrespondenceRelationId,
  sourceRoleIds: readonly string[],
  targetRoleIds: readonly string[]
): KpSemanticLineageRelation {
  switch (relation) {
    case "identity":
    case "role-change":
      return "persist";
    case "introduction":
      return "introduction";
    case "removal":
    case "cancelation":
      return "removal";
    case "fan-in":
      return "merge";
    case "fan-out":
      return "split";
    case "artifact":
      return sourceRoleIds.length === 0
        ? "introduction"
        : targetRoleIds.length === 0
          ? "removal"
          : "persist";
    case "focus":
      return "persist";
  }
}
