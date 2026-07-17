import {
  findKpCanonicalOperationCoreDescriptor,
  kpCanonicalOperationCore,
  type KpCanonicalOperationId
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

export interface KpCanonicalOperationRegistryEntry {
  readonly id: string;
  readonly packId: string;
  readonly canonicalComposition: readonly KpCanonicalOperationId[];
  readonly operationSpecId?: string | undefined;
  readonly sourceDefinitionId?: string | undefined;
  readonly sourceTransformType?: string | undefined;
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

export const kpCanonicalOperationRegistry = createKpCanonicalOperationRegistry({
  packs: [kpCanonicalOperationCorePack, kpGeneratedAlgebraOperationPack],
  entries: [
    ...kpCanonicalOperationCore.map((operation) => ({
      id: operation.id,
      packId: kpCanonicalOperationCorePack.id,
      canonicalComposition: [operation.id]
    })),
    ...kpGeneratedAlgebraOperationEntries
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
      canonicalComposition: [...entry.canonicalComposition]
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
    sourceTransformType: definition.transformType
  };
}

function canonicalCompositionForGeneratedTransform(
  transformType: string
): readonly KpCanonicalOperationId[] {
  switch (transformType) {
    case "subtractBothSides":
    case "addBothSides":
      return ["kp.core.persist", "kp.core.introduce"];
    case "divideBothSides":
      return ["kp.core.persist", "kp.core.wrap"];
    case "cancelAdditiveInverses":
    case "cancelMultiplicativeInverses":
    case "simplifyUnitFractionFactor":
      return ["kp.core.persist", "kp.core.eliminate"];
    case "simplifyConstantDifference":
    case "simplifyConstantSum":
    case "simplifyConstantQuotient":
    case "mergeFractionCommonFactor":
      return ["kp.core.merge"];
    case "splitFractionFactors":
      return ["kp.core.persist", "kp.core.reorder", "kp.core.wrap"];
    case "lowerExponent":
      return ["kp.core.persist", "kp.core.reorder"];
    case "unwrapUnitExponent":
      return ["kp.core.unwrap", "kp.core.eliminate"];
    case "rewritePowerAsRoot":
      return ["kp.core.persist", "kp.core.substitute", "kp.core.wrap"];
    case "wrapFunction":
      return ["kp.core.wrap"];
    case "distributeMultiplication":
      return ["kp.core.persist", "kp.core.fan-out", "kp.core.eliminate", "kp.core.reorder"];
    case "factorCommonTerm":
      return ["kp.core.persist", "kp.core.merge", "kp.core.group"];
    default:
      throw new Error(`Generated transform ${transformType} has no canonical operation composition.`);
  }
}

function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
