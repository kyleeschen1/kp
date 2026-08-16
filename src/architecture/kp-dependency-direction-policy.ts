import {
  kpModuleOwnershipZoneIds,
  resolveKpModuleOwnershipZone,
  type KpModuleOwnershipZoneId
} from "./kp-module-ownership.ts";

export type KpDependencyCouplingKind = "runtime" | "type-only";

export interface KpDependencyDirectionPolicy {
  readonly sourceZone: KpModuleOwnershipZoneId;
  readonly sourceMayDependOn: readonly KpModuleOwnershipZoneId[];
  readonly runtimeMayDependOn: readonly KpModuleOwnershipZoneId[];
}

export interface KpModuleDependencyReference {
  readonly importer: string;
  readonly target: string;
  readonly kind: KpDependencyCouplingKind;
  readonly line: number;
  readonly column: number;
}

export interface KpDependencyDirectionViolation
  extends KpModuleDependencyReference {
  readonly sourceZone: KpModuleOwnershipZoneId;
  readonly targetZone: KpModuleOwnershipZoneId;
  readonly violatesSourcePolicy: boolean;
  readonly violatesRuntimePolicy: boolean;
}

const lowerLibraryZones = [
  "neutral-core",
  "presentation",
  "renderer",
  "integration",
  "governance"
] as const satisfies readonly KpModuleOwnershipZoneId[];

const rendererZones = [
  "neutral-core",
  "presentation",
  "renderer",
  "experience",
  "integration",
  "governance"
] as const satisfies readonly KpModuleOwnershipZoneId[];

const publicApiZones = [
  "neutral-core",
  "presentation",
  "renderer",
  "integration",
  "public-api"
] as const satisfies readonly KpModuleOwnershipZoneId[];

const allProductionZones = kpModuleOwnershipZoneIds.filter(
  (zoneId) => zoneId !== "experiment"
);

/**
 * Source coupling stays at least as strict as runtime coupling so `import type`
 * cannot hide an ownership inversion that later becomes executable.
 */
export const kpDependencyDirectionPolicies = Object.freeze({
  "neutral-core": policy("neutral-core", lowerLibraryZones),
  presentation: policy("presentation", lowerLibraryZones),
  renderer: policy("renderer", rendererZones),
  experience: policy("experience", allProductionZones),
  integration: policy("integration", publicApiZones),
  "public-api": policy("public-api", publicApiZones),
  application: policy("application", allProductionZones),
  governance: policy("governance", kpModuleOwnershipZoneIds),
  experiment: policy("experiment", kpModuleOwnershipZoneIds)
} satisfies Readonly<
  Record<KpModuleOwnershipZoneId, KpDependencyDirectionPolicy>
>);

export function evaluateKpDependencyDirection(
  reference: KpModuleDependencyReference
): KpDependencyDirectionViolation | undefined {
  const sourceZone = resolveKpModuleOwnershipZone(reference.importer)?.id;
  const targetZone = resolveKpModuleOwnershipZone(reference.target)?.id;
  if (sourceZone === undefined || targetZone === undefined) return undefined;

  const policyDefinition = kpDependencyDirectionPolicies[sourceZone];
  const violatesSourcePolicy = !policyDefinition.sourceMayDependOn.includes(
    targetZone
  );
  const violatesRuntimePolicy =
    reference.kind === "runtime" &&
    !policyDefinition.runtimeMayDependOn.includes(targetZone);
  if (!violatesSourcePolicy && !violatesRuntimePolicy) return undefined;

  return Object.freeze({
    ...reference,
    sourceZone,
    targetZone,
    violatesSourcePolicy,
    violatesRuntimePolicy
  });
}

function policy(
  sourceZone: KpModuleOwnershipZoneId,
  allowedDependencies: readonly KpModuleOwnershipZoneId[]
): KpDependencyDirectionPolicy {
  const sourceMayDependOn = Object.freeze([...allowedDependencies]);
  return Object.freeze({
    sourceZone,
    sourceMayDependOn,
    runtimeMayDependOn: sourceMayDependOn
  });
}
