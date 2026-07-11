import {
  createKpCapabilityPackageCatalog,
  defaultKpCapabilityPackageManifests,
  type KpCapabilityPackageCatalog,
  type KpCapabilityPackageLoadPhase,
  type KpCapabilityPackageManifest,
  type KpCapabilityPackageTarget
} from "./capability-package-manifest.ts";
import {
  createDefaultSemanticObjectRegistry,
  type SemanticObjectCapabilityId,
  type SemanticObjectRegistry
} from "./object-registry.ts";

export interface KpCapabilityLoadPlanDiagnostic {
  readonly path: string;
  readonly message: string;
}

export interface CreateKpCapabilityLoadPlanInput {
  readonly objectTypes: readonly string[];
  readonly semanticCapabilities?: readonly SemanticObjectCapabilityId[];
  readonly targets?: readonly KpCapabilityPackageTarget[];
  readonly registry?: SemanticObjectRegistry;
  readonly catalog?: KpCapabilityPackageCatalog;
}

export interface KpCapabilityLoadPlan {
  readonly objectTypes: readonly string[];
  readonly packageIds: readonly string[];
  readonly capabilityKeys: readonly string[];
  readonly loadPhases: readonly KpCapabilityPackageLoadPhase[];
  readonly packages: readonly KpCapabilityPackageManifest[];
  readonly diagnostics: readonly KpCapabilityLoadPlanDiagnostic[];
}

export function createKpCapabilityLoadPlan(
  input: CreateKpCapabilityLoadPlanInput
): KpCapabilityLoadPlan {
  const registry = input.registry ?? createDefaultSemanticObjectRegistry();
  const catalog =
    input.catalog ??
    createKpCapabilityPackageCatalog(defaultKpCapabilityPackageManifests);
  const requestedCapabilities = new Set(input.semanticCapabilities ?? []);
  const requestedTargets = new Set(input.targets ?? []);
  const selectedPackageIds = new Set<string>();
  const packages: KpCapabilityPackageManifest[] = [];
  const diagnostics: KpCapabilityLoadPlanDiagnostic[] = [];

  for (const [objectTypeIndex, objectType] of input.objectTypes.entries()) {
    const definition = registry.getDefinition(objectType);

    if (definition === undefined) {
      diagnostics.push({
        path: `objectTypes[${objectTypeIndex}]`,
        message: `Unknown semantic object type ${objectType}.`
      });
      continue;
    }

    const packageIds = registry.listCapabilityPackageIdsForType(objectType);

    for (const [packageIdIndex, packageId] of packageIds.entries()) {
      const capabilityPackage = catalog.getManifest(packageId);

      if (capabilityPackage === undefined) {
        diagnostics.push({
          path: `${objectType}.capabilityPackageIds[${packageIdIndex}]`,
          message:
            `Capability package ${packageId} for ${objectType} is not in the catalog.`
        });
        continue;
      }

      if (
        selectedPackageIds.has(capabilityPackage.id) ||
        !matchesRequestedCapabilities(
          capabilityPackage,
          requestedCapabilities
        ) ||
        !matchesRequestedTargets(capabilityPackage, requestedTargets)
      ) {
        continue;
      }

      selectedPackageIds.add(capabilityPackage.id);
      packages.push(capabilityPackage);
    }
  }

  return {
    objectTypes: [...input.objectTypes],
    packageIds: packages.map((capabilityPackage) => capabilityPackage.id),
    capabilityKeys: uniqueOrdered(
      packages.map((capabilityPackage) => capabilityPackage.capabilityKey)
    ),
    loadPhases: uniqueOrdered(
      packages.map((capabilityPackage) => capabilityPackage.loadPhase)
    ),
    packages,
    diagnostics
  };
}

function matchesRequestedCapabilities(
  capabilityPackage: KpCapabilityPackageManifest,
  requestedCapabilities: ReadonlySet<SemanticObjectCapabilityId>
): boolean {
  if (requestedCapabilities.size === 0) {
    return true;
  }

  return capabilityPackage.semanticCapabilities.some((capability) =>
    requestedCapabilities.has(capability)
  );
}

function matchesRequestedTargets(
  capabilityPackage: KpCapabilityPackageManifest,
  requestedTargets: ReadonlySet<KpCapabilityPackageTarget>
): boolean {
  return requestedTargets.size === 0 || requestedTargets.has(capabilityPackage.target);
}

function uniqueOrdered<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
