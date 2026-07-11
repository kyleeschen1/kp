import type {
  KpTutorialCardExportArtifact,
  KpTutorialExportArtifactPayloadKind
} from "./export-artifact.ts";
import type { KpTutorialDependencyPhase } from "./dependency-planner.ts";

export interface KpIframeExportEmbedPolicyManifest {
  readonly sandboxTokens: readonly string[];
  readonly permissionPolicy: readonly string[];
  readonly referrerPolicy: string;
}

export interface KpIframeExportAssetManifest {
  readonly artifactId: string;
  readonly manifestId: string;
  readonly profileId: string;
  readonly payloadKind: KpTutorialExportArtifactPayloadKind;
  readonly dependencyPhases: readonly KpTutorialDependencyPhase[];
  readonly capabilityKeys: readonly string[];
  readonly assetIds: readonly string[];
  readonly embedPolicy: KpIframeExportEmbedPolicyManifest;
}

export function createKpIframeExportAssetManifest(
  artifact: KpTutorialCardExportArtifact
): KpIframeExportAssetManifest {
  if (artifact.artifactKind !== "iframe-document") {
    throw new Error(
      `Export artifact ${artifact.id} is not an iframe document artifact.`
    );
  }

  return {
    artifactId: artifact.id,
    manifestId: artifact.manifestId,
    profileId: artifact.profileId,
    payloadKind: artifact.payloadKind,
    dependencyPhases: [...artifact.dependencies.phases],
    capabilityKeys: [...artifact.dependencies.capabilityKeys],
    assetIds: [...artifact.dependencies.assetIds],
    embedPolicy: {
      sandboxTokens: metadataStringList(artifact, "sandboxTokens"),
      permissionPolicy: metadataStringList(artifact, "permissionPolicy"),
      referrerPolicy: metadataString(artifact, "referrerPolicy")
    }
  };
}

function metadataStringList(
  artifact: KpTutorialCardExportArtifact,
  key: string
): readonly string[] {
  const value = artifact.metadata?.[key];

  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function metadataString(
  artifact: KpTutorialCardExportArtifact,
  key: string
): string {
  const value = artifact.metadata?.[key];

  return typeof value === "string" ? value : "";
}
