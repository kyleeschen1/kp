import {
  createKpTutorialCardManifest,
  type KpTutorialCardManifest
} from "./card-manifest.ts";
import {
  createKpTutorialCardDependencyPlan,
  type KpTutorialDependencyPhase,
  type KpTutorialDependencyPlanPhase
} from "./dependency-planner.ts";
import {
  createKpTutorialCardExportArtifact,
  type KpTutorialCardExportArtifact
} from "./export-artifact.ts";
import {
  resolveKpTutorialCardIframeExportProfile,
  resolveKpTutorialCardStepExportProfile
} from "./export-profile-resolver.ts";
import {
  createKpCapabilityPackageCatalog,
  defaultKpCapabilityPackageManifests
} from "../semantic/capability-package-manifest.ts";

export function resolveKpTutorialCardIframeExportArtifact(
  input: KpTutorialCardManifest
): KpTutorialCardExportArtifact {
  const manifest = createKpTutorialCardManifest(input);
  const iframeProfile = resolveKpTutorialCardIframeExportProfile(manifest);
  const dependencyPlan = createKpTutorialCardDependencyPlan(manifest);
  const dependencyPhases = collectDependencyPhases(
    iframeProfile.dependencyPhases
  );
  const dependencyPlanPhases = dependencyPlan.phases.filter((phase) =>
    dependencyPhases.includes(phase.phase)
  );
  const capabilityPackageClosure =
    collectCapabilityPackageClosure(dependencyPlanPhases);

  return createKpTutorialCardExportArtifact({
    id: artifactIdForProfile(iframeProfile.profileId),
    manifestId: manifest.id,
    profileId: iframeProfile.profileId,
    exportKind: "iframe",
    target: "browser",
    artifactKind: "iframe-document",
    payloadKind: "html-document",
    status: "metadata",
    timelineIds: manifest.timelineRefs
      .filter((timeline) => timeline.sampleable === true)
      .map((timeline) => timeline.id),
    dependencies: {
      phases: dependencyPhases,
      capabilityKeys: unique(
        dependencyPlanPhases.flatMap((phase) => phase.capabilityKeys)
      ),
      capabilityPackageIds: capabilityPackageClosure.packageIds,
      capabilityPackageKeys: capabilityPackageClosure.packageKeys,
      assetIds: unique(dependencyPlanPhases.flatMap((phase) => phase.assetIds))
    },
    fallback: manifest.fallback,
    metadata: {
      responsive: iframeProfile.responsive,
      requiresControls: iframeProfile.requiresControls,
      fallbackStrategy: iframeProfile.fallbackStrategy,
      sandboxTokens: ["allow-scripts"],
      permissionPolicy: [
        "camera=()",
        "geolocation=()",
        "microphone=()",
        "payment=()"
      ],
      referrerPolicy: "no-referrer",
      resolver: "iframe-export-profile"
    }
  });
}

export function resolveKpTutorialCardStepExportArtifact(
  input: KpTutorialCardManifest
): KpTutorialCardExportArtifact {
  const manifest = createKpTutorialCardManifest(input);
  const stepProfile = resolveKpTutorialCardStepExportProfile(manifest);
  const dependencyPlan = createKpTutorialCardDependencyPlan(manifest);
  const dependencyPhases = collectDependencyPhases(
    stepProfile.dependencyPhases
  );
  const dependencyPlanPhases = dependencyPlan.phases.filter((phase) =>
    dependencyPhases.includes(phase.phase)
  );
  const capabilityPackageClosure =
    collectCapabilityPackageClosure(dependencyPlanPhases);

  return createKpTutorialCardExportArtifact({
    id: artifactIdForProfile(stepProfile.profileId),
    manifestId: manifest.id,
    profileId: stepProfile.profileId,
    exportKind: "step-sequence",
    target: "static",
    artifactKind: "static-step-sequence",
    payloadKind: "json-document",
    status: "metadata",
    timelineIds: stepProfile.sampleableTimelineIds,
    dependencies: {
      phases: dependencyPhases,
      capabilityKeys: unique(
        dependencyPlanPhases.flatMap((phase) => phase.capabilityKeys)
      ),
      capabilityPackageIds: capabilityPackageClosure.packageIds,
      capabilityPackageKeys: capabilityPackageClosure.packageKeys,
      assetIds: unique(dependencyPlanPhases.flatMap((phase) => phase.assetIds))
    },
    fallback: manifest.fallback,
    metadata: {
      includeCheckpoints: stepProfile.includeCheckpoints,
      fallbackStrategy: stepProfile.fallbackStrategy,
      resolver: "step-export-profile"
    }
  });
}

function artifactIdForProfile(profileId: string): string {
  return profileId.startsWith("export.")
    ? `artifact.${profileId.slice("export.".length)}`
    : `artifact.${profileId}`;
}

function collectDependencyPhases(
  phases: readonly KpTutorialDependencyPhase[]
): readonly KpTutorialDependencyPhase[] {
  return [...phases];
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function collectCapabilityPackageClosure(
  phases: readonly KpTutorialDependencyPlanPhase[]
): {
  readonly packageIds: readonly string[];
  readonly packageKeys: readonly string[];
} {
  const packageCatalog = createKpCapabilityPackageCatalog(
    defaultKpCapabilityPackageManifests
  );
  const capabilityPackages = phases.flatMap((phase) =>
    phase.capabilityKeys.flatMap((capabilityKey) =>
      packageCatalog.listManifestsByCapabilityKey(capabilityKey)
    )
  );

  return {
    packageIds: unique([
      ...phases.flatMap((phase) => phase.capabilityPackageIds),
      ...capabilityPackages.map((manifest) => manifest.id)
    ]),
    packageKeys: unique([
      ...phases.flatMap((phase) => phase.capabilityPackageKeys),
      ...capabilityPackages.map((manifest) => manifest.capabilityKey)
    ])
  };
}
