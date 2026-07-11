import type {
  KpTutorialExportKind,
  KpTutorialExportTarget,
  KpTutorialFallbackSpec
} from "./card-manifest.ts";
import type { KpTutorialDependencyPhase } from "./dependency-planner.ts";

export type KpTutorialExportArtifactKind =
  | "frame-sequence"
  | "iframe-document"
  | "media-encoding"
  | "static-step-sequence";

export type KpTutorialExportArtifactPayloadKind =
  | "binary-asset"
  | "html-document"
  | "json-document"
  | "metadata";

export type KpTutorialExportArtifactStatus =
  | "metadata"
  | "packaged"
  | "renderable";

export type KpTutorialExportArtifactMetadataValue =
  | boolean
  | null
  | number
  | string
  | readonly string[];

export interface KpTutorialExportArtifactDependencies {
  readonly phases: readonly KpTutorialDependencyPhase[];
  readonly capabilityKeys: readonly string[];
  readonly capabilityPackageIds?: readonly string[] | undefined;
  readonly capabilityPackageKeys?: readonly string[] | undefined;
  readonly assetIds: readonly string[];
}

export interface KpTutorialCardExportArtifact {
  readonly id: string;
  readonly manifestId: string;
  readonly profileId: string;
  readonly exportKind: KpTutorialExportKind;
  readonly target: KpTutorialExportTarget;
  readonly artifactKind: KpTutorialExportArtifactKind;
  readonly payloadKind: KpTutorialExportArtifactPayloadKind;
  readonly status: KpTutorialExportArtifactStatus;
  readonly timelineIds: readonly string[];
  readonly dependencies: KpTutorialExportArtifactDependencies;
  readonly fallback: KpTutorialFallbackSpec;
  readonly metadata?:
    | Readonly<Record<string, KpTutorialExportArtifactMetadataValue>>
    | undefined;
}

export interface KpTutorialExportArtifactDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function createKpTutorialCardExportArtifact(
  input: KpTutorialCardExportArtifact
): KpTutorialCardExportArtifact {
  return {
    id: input.id,
    manifestId: input.manifestId,
    profileId: input.profileId,
    exportKind: input.exportKind,
    target: input.target,
    artifactKind: input.artifactKind,
    payloadKind: input.payloadKind,
    status: input.status,
    timelineIds: [...input.timelineIds],
    dependencies: {
      phases: [...input.dependencies.phases],
      capabilityKeys: [...input.dependencies.capabilityKeys],
      ...(input.dependencies.capabilityPackageIds === undefined
        ? {}
        : {
            capabilityPackageIds: [
              ...input.dependencies.capabilityPackageIds
            ]
          }),
      ...(input.dependencies.capabilityPackageKeys === undefined
        ? {}
        : {
            capabilityPackageKeys: [
              ...input.dependencies.capabilityPackageKeys
            ]
          }),
      assetIds: [...input.dependencies.assetIds]
    },
    fallback: { ...input.fallback },
    ...(input.metadata === undefined
      ? {}
      : { metadata: cloneMetadata(input.metadata) })
  };
}

export function validateKpTutorialCardExportArtifact(
  artifact: KpTutorialCardExportArtifact
): readonly KpTutorialExportArtifactDiagnostic[] {
  const diagnostics: KpTutorialExportArtifactDiagnostic[] = [];

  if (artifact.id.trim() === "") {
    diagnostics.push({
      path: "id",
      message: "Export artifact id is required."
    });
  }

  if (artifact.manifestId.trim() === "") {
    diagnostics.push({
      path: "manifestId",
      message: "Export artifact manifestId is required."
    });
  }

  if (artifact.profileId.trim() === "") {
    diagnostics.push({
      path: "profileId",
      message: "Export artifact profileId is required."
    });
  }

  if (artifact.timelineIds.length === 0) {
    diagnostics.push({
      path: "timelineIds",
      message: "Export artifact must reference at least one timeline."
    });
  }

  return diagnostics;
}

function cloneMetadata(
  metadata: Readonly<Record<string, KpTutorialExportArtifactMetadataValue>>
): Readonly<Record<string, KpTutorialExportArtifactMetadataValue>> {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value
    ])
  );
}
