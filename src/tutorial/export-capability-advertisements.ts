import type { KpTutorialCardManifest } from "./card-manifest.ts";
import {
  createKpTutorialCardDependencyPlan,
  type KpTutorialDependencyLoadStage,
  type KpTutorialDependencyPhase,
  type KpTutorialDependencyPlanPhase
} from "./dependency-planner.ts";
import type { KpTutorialCardExportArtifact } from "./export-artifact.ts";
import {
  validateKpTutorialHostedArtifactReadiness,
  type KpTutorialHostedArtifactReadinessDiagnostic
} from "./hosted-artifact-readiness.ts";
import { parseKpCapabilityKey } from "../semantic/capability-key.ts";
import {
  createKpCapabilityPackageCatalog,
  defaultKpCapabilityPackageManifests,
  type KpCapabilityPackageLoadPhase,
  type KpCapabilityPackageTarget
} from "../semantic/capability-package-manifest.ts";

export type KpTutorialExportCapabilityHostedReadiness =
  | "diagnostic"
  | "ready";

export interface KpTutorialExportCapabilityAdvertisement {
  readonly capabilityKey: string;
  readonly library: string;
  readonly capability: string;
  readonly objectType: string;
  readonly mode: string;
  readonly capabilityPackageIds: readonly string[];
  readonly capabilityPackageTargets: readonly KpCapabilityPackageTarget[];
  readonly capabilityPackageLoadPhases: readonly KpCapabilityPackageLoadPhase[];
  readonly dependencyPhases: readonly KpTutorialDependencyPhase[];
  readonly loadStages: readonly KpTutorialDependencyLoadStage[];
  readonly requiredForInitialRender: boolean;
  readonly hostedReadiness: KpTutorialExportCapabilityHostedReadiness;
  readonly diagnostics: readonly KpTutorialHostedArtifactReadinessDiagnostic[];
  readonly summary: string;
}

export interface CreateKpTutorialExportCapabilityAdvertisementsInput {
  readonly artifact: KpTutorialCardExportArtifact;
  readonly manifest: KpTutorialCardManifest;
}

export function createKpTutorialExportCapabilityAdvertisements(
  input: CreateKpTutorialExportCapabilityAdvertisementsInput
): readonly KpTutorialExportCapabilityAdvertisement[] {
  const plan = createKpTutorialCardDependencyPlan(input.manifest);
  const hostedDiagnostics = validateKpTutorialHostedArtifactReadiness(input);
  const hostedReadiness =
    hostedDiagnostics.length === 0 ? "ready" : "diagnostic";
  const phasesByCapabilityKey = groupArtifactPhasesByCapabilityKey({
    artifact: input.artifact,
    phases: plan.phases
  });
  const packageCatalog = createKpCapabilityPackageCatalog(
    defaultKpCapabilityPackageManifests
  );

  return input.artifact.dependencies.capabilityKeys.map((capabilityKey) => {
    const parsed = parseKpCapabilityKey(capabilityKey);
    const phases = phasesByCapabilityKey.get(capabilityKey) ?? [];
    const capabilityPackages =
      packageCatalog.listManifestsByCapabilityKey(capabilityKey);

    return {
      capabilityKey,
      ...parsed,
      capabilityPackageIds: capabilityPackages.map((manifest) => manifest.id),
      capabilityPackageTargets: unique(
        capabilityPackages.map((manifest) => manifest.target)
      ),
      capabilityPackageLoadPhases: unique(
        capabilityPackages.map((manifest) => manifest.loadPhase)
      ),
      dependencyPhases: phases.map((phase) => phase.phase),
      loadStages: phases.map((phase) => phase.loadStage),
      requiredForInitialRender: phases.some(
        (phase) => phase.requiredForInitialRender
      ),
      hostedReadiness,
      diagnostics: hostedDiagnostics,
      summary: `${input.artifact.id} advertises ${capabilityKey} for ${phaseNames(phases)}; hosted readiness ${hostedReadiness}.`
    };
  });
}

function groupArtifactPhasesByCapabilityKey(input: {
  readonly artifact: KpTutorialCardExportArtifact;
  readonly phases: readonly KpTutorialDependencyPlanPhase[];
}): ReadonlyMap<string, readonly KpTutorialDependencyPlanPhase[]> {
  const advertisedKeys = new Set(input.artifact.dependencies.capabilityKeys);
  const advertisedPhases = new Set(input.artifact.dependencies.phases);
  const grouped = new Map<string, KpTutorialDependencyPlanPhase[]>();

  for (const phase of input.phases) {
    if (!advertisedPhases.has(phase.phase)) continue;

    for (const capabilityKey of phase.capabilityKeys) {
      if (!advertisedKeys.has(capabilityKey)) continue;

      grouped.set(capabilityKey, [
        ...(grouped.get(capabilityKey) ?? []),
        phase
      ]);
    }
  }

  return grouped;
}

function phaseNames(phases: readonly KpTutorialDependencyPlanPhase[]): string {
  return phases.length === 0
    ? "declared artifact dependencies"
    : phases.map((phase) => phase.phase).join(", ");
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
