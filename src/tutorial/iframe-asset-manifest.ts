import type {
  KpTutorialCardExportArtifact,
  KpTutorialExportArtifactPayloadKind
} from "./export-artifact.ts";
import type { KpTutorialDependencyPhase } from "./dependency-planner.ts";
import type { KpStaticHostFixtureRoot } from "./static-host-fixture-root.ts";

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

export interface KpIframeStaticAssetPathEntry {
  readonly assetId: string;
  readonly path: string;
}

export interface KpIframeStaticAssetPathClosure {
  readonly artifactId: string;
  readonly documentPath: string;
  readonly assetPaths: readonly KpIframeStaticAssetPathEntry[];
  readonly diagnostics: readonly KpIframeStaticAssetPathClosureDiagnostic[];
}

export interface KpIframeStaticAssetPathClosureDiagnostic {
  readonly path: string;
  readonly message: string;
}

export interface KpIframeStaticAssetPathClosureInput {
  readonly artifact: KpTutorialCardExportArtifact;
  readonly staticHostRoot: KpStaticHostFixtureRoot;
  readonly assetPathById?: Readonly<Record<string, string>> | undefined;
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

export function createKpIframeStaticAssetPathClosure(
  input: KpIframeStaticAssetPathClosureInput
): KpIframeStaticAssetPathClosure {
  const manifest = createKpIframeExportAssetManifest(input.artifact);
  const documentEntry = input.staticHostRoot.entries.find(
    (entry) =>
      entry.artifactId === input.artifact.id &&
      entry.artifactKind === "iframe-document"
  );
  const documentPath = documentEntry?.path ?? "";
  const assetPathById = input.assetPathById ?? {};
  const assetPaths = manifest.assetIds.flatMap((assetId) => {
    const path = assetPathById[assetId];
    return path === undefined ? [] : [{ assetId, path }];
  });

  return {
    artifactId: manifest.artifactId,
    documentPath,
    assetPaths,
    diagnostics: [
      ...documentPathDiagnostics(input.artifact, documentPath),
      ...manifest.assetIds.flatMap((assetId) =>
        assetPathDiagnostics(input.artifact, assetId, assetPathById[assetId])
      )
    ]
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

function documentPathDiagnostics(
  artifact: KpTutorialCardExportArtifact,
  path: string
): readonly KpIframeStaticAssetPathClosureDiagnostic[] {
  if (isPortableStaticPath(path)) return [];

  return [
    {
      path: "staticHostRoot.entries",
      message: `Iframe artifact ${artifact.id} must map to a hosted relative document path.`
    }
  ];
}

function assetPathDiagnostics(
  artifact: KpTutorialCardExportArtifact,
  assetId: string,
  path: string | undefined
): readonly KpIframeStaticAssetPathClosureDiagnostic[] {
  if (path === undefined) {
    return [
      {
        path: `assetPathById.${assetId}`,
        message: `Iframe artifact ${artifact.id} asset ${assetId} must map to a hosted relative path.`
      }
    ];
  }

  if (isPortableStaticPath(path)) return [];

  return [
    {
      path: `assetPathById.${assetId}`,
      message: `Iframe artifact ${artifact.id} asset ${assetId} path ${path} must be relative for static hosting.`
    }
  ];
}

function isPortableStaticPath(path: string): boolean {
  const trimmed = path.trim();

  return (
    trimmed !== "" &&
    !trimmed.startsWith("/") &&
    !/^[a-z][a-z0-9+.-]*:/iu.test(trimmed) &&
    !trimmed.split("/").includes("..")
  );
}
