import {
  createKpCapabilityPackageCatalog,
  defaultKpCapabilityPackageManifests
} from "../semantic/capability-package-manifest.ts";
import type { KpTutorialDependencyPlanPhase } from "./dependency-planner.ts";

export interface KpTutorialCapabilityPackageClosure {
  readonly packageIds: readonly string[];
  readonly packageKeys: readonly string[];
}

export function collectKpTutorialCapabilityPackageClosure(
  phases: readonly KpTutorialDependencyPlanPhase[]
): KpTutorialCapabilityPackageClosure {
  const closures = phases.map(collectKpTutorialPhaseCapabilityPackageClosure);

  return {
    packageIds: unique(closures.flatMap((closure) => closure.packageIds)),
    packageKeys: unique(closures.flatMap((closure) => closure.packageKeys))
  };
}

export function collectKpTutorialPhaseCapabilityPackageClosure(
  phase: KpTutorialDependencyPlanPhase
): KpTutorialCapabilityPackageClosure {
  const packageCatalog = createKpCapabilityPackageCatalog(
    defaultKpCapabilityPackageManifests
  );
  const capabilityPackages = phase.capabilityKeys.flatMap((capabilityKey) =>
    packageCatalog.listManifestsByCapabilityKey(capabilityKey)
  );

  return {
    packageIds: unique([
      ...phase.capabilityPackageIds,
      ...capabilityPackages.map((manifest) => manifest.id)
    ]),
    packageKeys: unique([
      ...phase.capabilityPackageKeys,
      ...capabilityPackages.map((manifest) => manifest.capabilityKey)
    ])
  };
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
