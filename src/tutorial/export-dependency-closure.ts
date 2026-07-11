import {
  createKpTutorialCardManifest,
  type KpTutorialCardManifest
} from "./card-manifest.ts";
import {
  createKpTutorialCardDependencyPlan,
  type KpTutorialDependencyPlanPhase
} from "./dependency-planner.ts";
import type { KpTutorialCardExportArtifact } from "./export-artifact.ts";
import {
  createKpCapabilityPackageCatalog,
  defaultKpCapabilityPackageManifests
} from "../semantic/capability-package-manifest.ts";

export interface KpTutorialExportDependencyClosureInput {
  readonly artifact: KpTutorialCardExportArtifact;
  readonly manifest: KpTutorialCardManifest;
}

export interface KpTutorialExportDependencyClosureDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function validateKpTutorialExportDependencyClosure(
  input: KpTutorialExportDependencyClosureInput
): readonly KpTutorialExportDependencyClosureDiagnostic[] {
  const manifest = createKpTutorialCardManifest(input.manifest);
  const plan = createKpTutorialCardDependencyPlan(manifest);
  const diagnostics: KpTutorialExportDependencyClosureDiagnostic[] = [];

  for (const phase of input.artifact.dependencies.phases) {
    const planPhase = plan.phases.find((entry) => entry.phase === phase);

    if (planPhase === undefined) {
      diagnostics.push({
        path: "dependencies.phases",
        message: `Export artifact ${input.artifact.id} references unknown dependency phase ${phase}.`
      });
      continue;
    }

    for (const capabilityKey of planPhase.capabilityKeys) {
      if (!input.artifact.dependencies.capabilityKeys.includes(capabilityKey)) {
        diagnostics.push({
          path: "dependencies.capabilityKeys",
          message: `Export artifact ${input.artifact.id} is missing capability ${capabilityKey} from dependency phase ${phase}.`
        });
      }
    }

    if (artifactRequiresCapabilityPackageClosure(input.artifact)) {
      const packageClosure = collectPhaseCapabilityPackageClosure(planPhase);

      for (const packageId of packageClosure.packageIds) {
        if (
          !(input.artifact.dependencies.capabilityPackageIds ?? []).includes(
            packageId
          )
        ) {
          diagnostics.push({
            path: "dependencies.capabilityPackageIds",
            message: `Export artifact ${input.artifact.id} is missing capability package ${packageId} from dependency phase ${phase}.`
          });
        }
      }

      for (const packageKey of packageClosure.packageKeys) {
        if (
          !(input.artifact.dependencies.capabilityPackageKeys ?? []).includes(
            packageKey
          )
        ) {
          diagnostics.push({
            path: "dependencies.capabilityPackageKeys",
            message: `Export artifact ${input.artifact.id} is missing capability package key ${packageKey} from dependency phase ${phase}.`
          });
        }
      }
    }

    for (const assetId of planPhase.assetIds) {
      if (!input.artifact.dependencies.assetIds.includes(assetId)) {
        diagnostics.push({
          path: "dependencies.assetIds",
          message: `Export artifact ${input.artifact.id} is missing asset ${assetId} from dependency phase ${phase}.`
        });
      }
    }
  }

  for (const timelineId of input.artifact.timelineIds) {
    if (!sampleableTimelineIds(manifest).includes(timelineId)) {
      diagnostics.push({
        path: "timelineIds",
        message: `Export artifact ${input.artifact.id} references non-sampleable timeline ${timelineId}.`
      });
    }
  }

  return diagnostics;
}

function artifactRequiresCapabilityPackageClosure(
  artifact: KpTutorialCardExportArtifact
): boolean {
  return (
    artifact.artifactKind === "iframe-document" ||
    artifact.artifactKind === "static-step-sequence"
  );
}

function sampleableTimelineIds(
  manifest: KpTutorialCardManifest
): readonly string[] {
  return manifest.timelineRefs
    .filter((timeline) => timeline.sampleable === true)
    .map((timeline) => timeline.id);
}

function collectPhaseCapabilityPackageClosure(
  phase: KpTutorialDependencyPlanPhase
): {
  readonly packageIds: readonly string[];
  readonly packageKeys: readonly string[];
} {
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
