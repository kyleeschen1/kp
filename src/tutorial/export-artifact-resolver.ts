import {
  createKpTutorialCardManifest,
  type KpTutorialCardManifest
} from "./card-manifest.ts";
import {
  createKpTutorialCardDependencyPlan,
  type KpTutorialDependencyPhase
} from "./dependency-planner.ts";
import {
  createKpTutorialCardExportArtifact,
  type KpTutorialCardExportArtifact
} from "./export-artifact.ts";
import { resolveKpTutorialCardIframeExportProfile } from "./export-profile-resolver.ts";

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
      assetIds: unique(dependencyPlanPhases.flatMap((phase) => phase.assetIds))
    },
    fallback: manifest.fallback,
    metadata: {
      responsive: iframeProfile.responsive,
      requiresControls: iframeProfile.requiresControls,
      fallbackStrategy: iframeProfile.fallbackStrategy,
      resolver: "iframe-export-profile"
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
