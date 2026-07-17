import {
  findKpCanonicalOperationCoreDescriptor,
  kpCanonicalOperationCore,
  type KpCanonicalOperationId,
  type KpCanonicalOperationCoreDescriptor,
  type KpCanonicalOperationRole,
  type KpCanonicalOperationRoleCardinality
} from "./canonical-operation.ts";
import {
  createKpCanonicalOperationPack,
  kpCanonicalOperationCorePack,
  kpCanonicalOperationPackMatchesPin,
  type KpCanonicalOperationPack,
  type KpCanonicalOperationProjectPins
} from "./canonical-operation-pack.ts";
import {
  listGeneratedAlgebraTransformDefinitions,
  type GeneratedAlgebraTransformDefinition
} from "./generated-algebra-transform-definition-registry.ts";
import {
  kpDistributionCanonicalOperationSpec
} from "./distribution-canonical-operation.ts";
import {
  kpSemanticMotionOperationDefinitions,
  kpSemanticMotionOperationPack,
  type KpSemanticMotionOperationDefinition
} from "./semantic-motion-operation-pack.ts";
import {
  createKpCanonicalOperationContract,
  type KpCanonicalOperationContract,
  type KpCanonicalOperationOwnershipMode
} from "./canonical-operation-contract.ts";
import {
  canonicalCompositionForGeneratedTransform
} from "./generated-algebra-canonical-composition.ts";
import {
  cancellationWitnessIdsForOperation
} from "./cancellation-operation-authority.ts";

export interface KpCanonicalOperationRegistryEntry {
  readonly id: string;
  readonly packId: string;
  readonly canonicalComposition: readonly KpCanonicalOperationId[];
  readonly operationSpecId?: string | undefined;
  readonly sourceDefinitionId?: string | undefined;
  readonly sourceTransformType?: string | undefined;
  readonly authoringSummary?: string | undefined;
  readonly contract: KpCanonicalOperationContract;
}

export interface KpCanonicalOperationRegistry {
  readonly kind: "canonical-operation-registry";
  readonly packs: readonly KpCanonicalOperationPack[];
  readonly entries: readonly KpCanonicalOperationRegistryEntry[];
}

export type KpCanonicalOperationResolution =
  | {
      readonly status: "resolved";
      readonly pack: KpCanonicalOperationPack;
      readonly entry: KpCanonicalOperationRegistryEntry;
    }
  | {
      readonly status: "unknown-operation" | "missing-pin" | "version-mismatch";
      readonly operationId: string;
      readonly message: string;
    };

const generatedAlgebraDefinitions = listGeneratedAlgebraTransformDefinitions();

export const kpGeneratedAlgebraOperationEntries:
  readonly KpCanonicalOperationRegistryEntry[] = generatedAlgebraDefinitions.map(
    migrateGeneratedAlgebraTransformDefinition
  );

export const kpGeneratedAlgebraOperationPack = createKpCanonicalOperationPack({
  id: "kp.algebra",
  scope: "shared-domain",
  version: "0.1.0",
  title: "KP generated algebra compatibility operations",
  operationIds: kpGeneratedAlgebraOperationEntries.map((entry) => entry.id),
  dependencies: [{ packId: kpCanonicalOperationCorePack.id, version: kpCanonicalOperationCorePack.version }]
});

export const kpSemanticMotionOperationEntries:
  readonly KpCanonicalOperationRegistryEntry[] =
  kpSemanticMotionOperationDefinitions.map((definition) => ({
    id: definition.id,
    packId: kpSemanticMotionOperationPack.id,
    canonicalComposition: definition.canonicalComposition,
    sourceTransformType: definition.transformType,
    authoringSummary: definition.summary,
    contract: semanticMotionContract(definition)
  }));

export const kpCanonicalOperationRegistry = createKpCanonicalOperationRegistry({
  packs: [
    kpCanonicalOperationCorePack,
    kpGeneratedAlgebraOperationPack,
    kpSemanticMotionOperationPack
  ],
  entries: [
    ...kpCanonicalOperationCore.map((operation) => ({
      id: operation.id,
      packId: kpCanonicalOperationCorePack.id,
      canonicalComposition: [operation.id],
      contract: coreOperationContract(operation)
    })),
    ...kpGeneratedAlgebraOperationEntries,
    ...kpSemanticMotionOperationEntries
  ]
});

export function createKpCanonicalOperationRegistry(input: {
  readonly packs: readonly KpCanonicalOperationPack[];
  readonly entries: readonly KpCanonicalOperationRegistryEntry[];
}): KpCanonicalOperationRegistry {
  const packsById = new Map<string, KpCanonicalOperationPack>();
  input.packs.forEach((pack) => {
    if (packsById.has(pack.id)) throw new Error(`Duplicate canonical operation pack ${pack.id}.`);
    packsById.set(pack.id, pack);
  });
  input.packs.forEach((pack) => {
    pack.dependencies.forEach((dependency) => {
      const resolved = packsById.get(dependency.packId);
      if (resolved === undefined || !kpCanonicalOperationPackMatchesPin(resolved, dependency)) {
        throw new Error(
          `Operation pack ${pack.id}@${pack.version} requires exact dependency ` +
          `${dependency.packId}@${dependency.version}.`
        );
      }
    });
  });
  const entryIds = new Set<string>();
  input.entries.forEach((entry) => {
    if (entryIds.has(entry.id)) throw new Error(`Duplicate canonical operation ${entry.id}.`);
    entryIds.add(entry.id);
    const pack = packsById.get(entry.packId);
    if (pack === undefined) throw new Error(`Canonical operation ${entry.id} references missing pack ${entry.packId}.`);
    if (!pack.operationIds.includes(entry.id)) {
      throw new Error(`Canonical operation ${entry.id} is not declared by pack ${entry.packId}.`);
    }
    entry.canonicalComposition.forEach((operationId) =>
      findKpCanonicalOperationCoreDescriptor(operationId)
    );
    createKpCanonicalOperationContract(entry.contract);
  });
  input.entries.forEach((entry) => {
    const reverseOperationId = entry.contract.reverse.operationId;
    if (reverseOperationId !== undefined && !entryIds.has(reverseOperationId)) {
      throw new Error(
        `Canonical operation ${entry.id} references missing reverse operation ${reverseOperationId}.`
      );
    }
  });
  return {
    kind: "canonical-operation-registry",
    packs: input.packs.map((pack) => ({
      ...pack,
      operationIds: [...pack.operationIds],
      dependencies: pack.dependencies.map((dependency) => ({ ...dependency }))
    })),
    entries: input.entries.map((entry) => ({
      ...entry,
      canonicalComposition: [...entry.canonicalComposition],
      contract: createKpCanonicalOperationContract(entry.contract)
    }))
  };
}

export function resolveKpCanonicalOperation(input: {
  readonly registry?: KpCanonicalOperationRegistry | undefined;
  readonly pins: KpCanonicalOperationProjectPins;
  readonly operationId: string;
}): KpCanonicalOperationResolution {
  const registry = input.registry ?? kpCanonicalOperationRegistry;
  const entry = registry.entries.find((candidate) => candidate.id === input.operationId);
  if (entry === undefined) {
    return {
      status: "unknown-operation",
      operationId: input.operationId,
      message: `Unknown canonical operation ${input.operationId}.`
    };
  }
  const pack = registry.packs.find((candidate) => candidate.id === entry.packId)!;
  const pin = input.pins.packs.find((candidate) => candidate.packId === pack.id);
  if (pin === undefined) {
    return {
      status: "missing-pin",
      operationId: input.operationId,
      message: `Canonical operation ${input.operationId} requires a project pin for ${pack.id}.`
    };
  }
  if (!kpCanonicalOperationPackMatchesPin(pack, pin)) {
    return {
      status: "version-mismatch",
      operationId: input.operationId,
      message:
        `Canonical operation ${input.operationId} requires ${pack.id}@${pack.version}, ` +
        `but the project pins ${pin.version}.`
    };
  }
  return { status: "resolved", pack, entry };
}

export function migrateGeneratedAlgebraTransformDefinition(
  definition: GeneratedAlgebraTransformDefinition
): KpCanonicalOperationRegistryEntry {
  return {
    id: `kp.algebra.${kebabCase(definition.transformType)}`,
    packId: "kp.algebra",
    canonicalComposition: canonicalCompositionForGeneratedTransform(definition.transformType),
    ...(definition.transformType === "distributeMultiplication"
      ? { operationSpecId: kpDistributionCanonicalOperationSpec.id }
      : {}),
    sourceDefinitionId: definition.id,
    sourceTransformType: definition.transformType,
    authoringSummary: definition.title,
    contract: generatedTransformContract(definition)
  };
}

function coreOperationContract(
  operation: KpCanonicalOperationCoreDescriptor
): KpCanonicalOperationContract {
  return operationContract({
    authority: { kind: "core-descriptor", refId: operation.id },
    roles: operation.roles,
    canonicalComposition: [operation.id],
    lineageRelationIds: operation.correspondenceRelations,
    ownershipMode: ownershipForOperation(operation.id, [operation.id]),
    lawIds: [`law.${operation.id}`],
    witnessIds: cancellationWitnessIdsForOperation(operation.id),
    reverse: operation.reversibleAs === undefined
      ? { kind: "one-way" }
      : operation.reversibleAs === operation.id
        ? { kind: "self", operationId: operation.id }
        : { kind: "inverse", operationId: operation.reversibleAs },
    fixtureIds: [`fixture.${operation.id}`]
  });
}

function generatedTransformContract(
  definition: GeneratedAlgebraTransformDefinition
): KpCanonicalOperationContract {
  const id = `kp.algebra.${kebabCase(definition.transformType)}`;
  const roles = generatedTransformAuthoringRoles(definition.transformType);
  const canonicalComposition = canonicalCompositionForGeneratedTransform(
    definition.transformType
  );
  return operationContract({
    authority: definition.transformType === "distributeMultiplication"
      ? { kind: "operation-spec", refId: kpDistributionCanonicalOperationSpec.id }
      : { kind: "transformation-definition", refId: definition.id },
    roles,
    canonicalComposition,
    lineageRelationIds: coreRelations(canonicalComposition),
    ownershipMode: ownershipForOperation(id, canonicalComposition),
    lawIds: definition.lawRefs?.map((law) => law.id) ?? [],
    witnessIds: cancellationWitnessIdsForOperation(id),
    reverse: reverseForGeneratedOperation(id),
    fixtureIds: [definition.templateId]
  });
}

function semanticMotionContract(
  definition: KpSemanticMotionOperationDefinition
): KpCanonicalOperationContract {
  return operationContract({
    authority: {
      kind: "transformation-definition",
      refId: `transform-type.${definition.transformType}`
    },
    roles: definition.authoringRoles,
    canonicalComposition: definition.canonicalComposition,
    lineageRelationIds: coreRelations(definition.canonicalComposition),
    ownershipMode: ownershipForOperation(
      definition.id,
      definition.canonicalComposition
    ),
    lawIds: [`law.${definition.transformType}`],
    witnessIds: cancellationWitnessIdsForOperation(definition.id),
    reverse: { kind: "one-way" },
    fixtureIds: [`fixture.${definition.transformType}`]
  });
}

function operationContract(input: {
  readonly authority: KpCanonicalOperationContract["authority"];
  readonly roles: readonly KpCanonicalOperationRole[];
  readonly canonicalComposition: readonly KpCanonicalOperationId[];
  readonly lineageRelationIds: KpCanonicalOperationContract["lineageRelationIds"];
  readonly ownershipMode: KpCanonicalOperationOwnershipMode;
  readonly lawIds: readonly string[];
  readonly witnessIds: readonly string[];
  readonly reverse: KpCanonicalOperationContract["reverse"];
  readonly fixtureIds: readonly string[];
}): KpCanonicalOperationContract {
  const unitRoleId = pacingRole(input.authority.refId, input.roles);
  const pacingKind = pacingKindFor(input.authority.refId);
  const structuralRoleIds = input.roles
    .filter((role) => role.kind === "structural-artifact")
    .map((role) => role.id);
  return createKpCanonicalOperationContract({
    authority: input.authority,
    roles: input.roles,
    lineageRelationIds: input.lineageRelationIds,
    ownershipMode: input.ownershipMode,
    lawIds: input.lawIds,
    witnessIds: input.witnessIds,
    reverse: input.reverse,
    motifRequirementIds: input.authority.refId === kpDistributionCanonicalOperationSpec.id
      ? kpDistributionCanonicalOperationSpec.motif.map((step) => step.id)
      : input.canonicalComposition.map((id) => `motif.${id}`),
    pacing: {
      kind: pacingKind,
      ...(pacingKind === "single" ? {} : { unitRoleId: unitRoleId! })
    },
    cost: {
      tokenRoleIds: input.roles
        .filter((role) => role.kind === "semantic-entity")
        .map((role) => role.id),
      simultaneousGroupRoleIds: input.roles
        .filter((role) => role.cardinality === "one-or-more")
        .map((role) => role.id),
      fragmentRoleIds: structuralRoleIds,
      shadowPolicy: "optional",
      threeDPolicy: "optional"
    },
    fixtureIds: input.fixtureIds
  });
}

function coreRelations(
  composition: readonly KpCanonicalOperationId[]
): KpCanonicalOperationContract["lineageRelationIds"] {
  return [...new Set(composition.flatMap((id) =>
    findKpCanonicalOperationCoreDescriptor(id).correspondenceRelations
  ))];
}

function ownershipForOperation(
  operationId: string,
  composition: readonly KpCanonicalOperationId[]
): KpCanonicalOperationOwnershipMode {
  if (operationId.includes("substitute")) return "replacement";
  if (operationId === "kp.core.copy") return "persistent-source-copying";
  if (
    operationId.includes("distribut") ||
    operationId.includes("factor-common") ||
    composition.includes("kp.core.fan-out") ||
    composition.includes("kp.core.merge")
  ) return "fission-fusion";
  return "continuant";
}

function reverseForGeneratedOperation(
  operationId: string
): KpCanonicalOperationContract["reverse"] {
  const inverse = new Map<string, string>([
    ["kp.algebra.subtract-both-sides", "kp.algebra.add-both-sides"],
    ["kp.algebra.add-both-sides", "kp.algebra.subtract-both-sides"],
    ["kp.algebra.split-fraction-factors", "kp.algebra.merge-fraction-common-factor"],
    ["kp.algebra.merge-fraction-common-factor", "kp.algebra.split-fraction-factors"],
    ["kp.algebra.distribute-multiplication", "kp.algebra.factor-common-term"],
    ["kp.algebra.factor-common-term", "kp.algebra.distribute-multiplication"]
  ]).get(operationId);
  return inverse === undefined
    ? { kind: "one-way" }
    : { kind: "inverse", operationId: inverse };
}

function pacingKindFor(
  authorityRef: string
): KpCanonicalOperationContract["pacing"]["kind"] {
  if (authorityRef.includes("multiplyMatrices")) return "per-cell";
  if (
    authorityRef.includes("DotProduct") ||
    authorityRef.includes("multiplyMatrixVector")
  ) return "per-index";
  if (authorityRef.includes("distribute") || authorityRef.includes("fan-out")) {
    return "per-descendant";
  }
  return "single";
}

function pacingRole(
  authorityRef: string,
  roles: readonly KpCanonicalOperationRole[]
): string | undefined {
  const preferred = authorityRef.includes("multiplyMatrices")
    ? "result-cells"
    : authorityRef.includes("multiplyMatrixVector")
      ? "result-entries"
      : authorityRef.includes("DotProduct")
        ? "products"
        : authorityRef.includes("distribute")
          ? "factor-copies"
          : authorityRef.includes("fan-out")
            ? "destinations"
            : undefined;
  return roles.find((role) => role.id === preferred)?.id;
}

function generatedTransformAuthoringRoles(
  transformType: string
): readonly KpCanonicalOperationRole[] {
  switch (transformType) {
    case "subtractBothSides":
    case "addBothSides":
    case "divideBothSides":
      return [
        entityRole("equation-before", "source"),
        entityRole("operation-value", "source", "zero-or-one"),
        entityRole("equation-after", "target"),
        entityRole("introduced-terms", "target", "one-or-more")
      ];
    case "cancelAdditiveInverses":
    case "cancelMultiplicativeInverses":
      return [
        entityRole("context-before", "source"),
        entityRole("inverse-terms", "source", "one-or-more"),
        entityRole("context-after", "target")
      ];
    case "simplifyConstantDifference":
    case "simplifyConstantSum":
    case "simplifyConstantQuotient":
      return [
        entityRole("operands-before", "source", "one-or-more"),
        entityRole("result-after", "target")
      ];
    case "splitFractionFactors":
      return [
        entityRole("fraction-before", "source"),
        entityRole("factors-after", "target", "one-or-more"),
        artifactRole("fraction-structure-after", "target", "one-or-more")
      ];
    case "mergeFractionCommonFactor":
      return [
        entityRole("factors-before", "source", "one-or-more"),
        entityRole("common-factor-after", "target"),
        entityRole("fraction-after", "target")
      ];
    case "simplifyUnitFractionFactor":
      return [
        entityRole("fraction-before", "source"),
        entityRole("unit-factor", "source"),
        entityRole("fraction-after", "target")
      ];
    case "lowerExponent":
      return [
        entityRole("base-before", "source"),
        entityRole("exponent-before", "source"),
        entityRole("base-after", "target"),
        entityRole("factors-after", "target", "one-or-more")
      ];
    case "unwrapUnitExponent":
      return [
        entityRole("base-before", "source"),
        entityRole("unit-exponent", "source"),
        entityRole("base-after", "target")
      ];
    case "rewritePowerAsRoot":
      return [
        entityRole("base-before", "source"),
        entityRole("exponent-fragments", "source", "one-or-more"),
        entityRole("radicand-after", "target"),
        artifactRole("radical-fragments", "target", "one-or-more")
      ];
    case "wrapFunction":
      return [
        entityRole("content-before", "source"),
        entityRole("content-after", "target"),
        artifactRole("wrapper", "target", "one-or-more")
      ];
    case "distributeMultiplication":
      return [
        entityRole("factor-before", "source"),
        entityRole("addends-before", "source", "one-or-more"),
        entityRole("factor-copies", "target", "one-or-more"),
        entityRole("products-after", "target", "one-or-more")
      ];
    case "factorCommonTerm":
      return [
        entityRole("products-before", "source", "one-or-more"),
        entityRole("common-factor-after", "target"),
        entityRole("grouped-terms-after", "target", "one-or-more")
      ];
    default:
      throw new Error(`Generated transform ${transformType} has no LLM authoring role contract.`);
  }
}

function entityRole(
  id: string,
  endpoint: "source" | "target",
  cardinality: KpCanonicalOperationRoleCardinality = "exactly-one"
): KpCanonicalOperationRole {
  return {
    id,
    endpoint,
    kind: "semantic-entity",
    cardinality,
    summary: `${endpoint} semantic entity role ${id}`
  };
}

function artifactRole(
  id: string,
  endpoint: "source" | "target",
  cardinality: KpCanonicalOperationRoleCardinality
): KpCanonicalOperationRole {
  return {
    id,
    endpoint,
    kind: "structural-artifact",
    cardinality,
    summary: `${endpoint} structural artifact role ${id}`
  };
}

function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
