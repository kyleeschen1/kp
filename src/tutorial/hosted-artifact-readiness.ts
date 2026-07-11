import type {
  KpTutorialAssetDependency,
  KpTutorialCardManifest,
  KpTutorialDependencyManifest
} from "./card-manifest.ts";
import {
  validateKpTutorialCardExportArtifact,
  type KpTutorialCardExportArtifact
} from "./export-artifact.ts";
import {
  validateKpTutorialExportDependencyClosure
} from "./export-dependency-closure.ts";
import {
  validateKpTutorialExportFallbackReadiness
} from "./export-fallback-readiness.ts";
import { createKpIframeExportAssetManifest } from "./iframe-asset-manifest.ts";

export interface KpTutorialHostedArtifactReadinessInput {
  readonly artifact: KpTutorialCardExportArtifact;
  readonly manifest: KpTutorialCardManifest;
}

export interface KpTutorialHostedArtifactReadinessDiagnostic {
  readonly path: string;
  readonly message: string;
}

const dependencyPhases = [
  "critical",
  "prefetch",
  "interactive",
  "optional",
  "authorOnly"
] as const satisfies readonly (keyof KpTutorialDependencyManifest)[];

export function validateKpTutorialHostedArtifactReadiness(
  input: KpTutorialHostedArtifactReadinessInput
): readonly KpTutorialHostedArtifactReadinessDiagnostic[] {
  return [
    ...validateKpTutorialCardExportArtifact(input.artifact),
    ...validateKpTutorialExportDependencyClosure(input),
    ...validateKpTutorialExportFallbackReadiness(input.artifact),
    ...validateHostedAssetUrls(input),
    ...validateHostedIframePolicy(input.artifact)
  ];
}

function validateHostedAssetUrls(
  input: KpTutorialHostedArtifactReadinessInput
): readonly KpTutorialHostedArtifactReadinessDiagnostic[] {
  return dependencyPhases.flatMap((phase) => {
    const assets = input.manifest.dependencies[phase]?.assets ?? [];

    return assets.flatMap((asset, index) =>
      hostedAssetUrlDiagnostics({
        artifact: input.artifact,
        asset,
        path: `manifest.dependencies.${phase}.assets[${index}].url`
      })
    );
  });
}

function hostedAssetUrlDiagnostics(input: {
  readonly artifact: KpTutorialCardExportArtifact;
  readonly asset: KpTutorialAssetDependency;
  readonly path: string;
}): readonly KpTutorialHostedArtifactReadinessDiagnostic[] {
  if (input.asset.url === undefined || !isDevServerUrl(input.asset.url)) {
    return [];
  }

  return [
    {
      path: input.path,
      message: `Hosted artifact ${input.artifact.id} asset ${input.asset.id} must not depend on dev-server URL ${input.asset.url}.`
    }
  ];
}

function validateHostedIframePolicy(
  artifact: KpTutorialCardExportArtifact
): readonly KpTutorialHostedArtifactReadinessDiagnostic[] {
  if (artifact.artifactKind !== "iframe-document") return [];

  const manifest = createKpIframeExportAssetManifest(artifact);
  const diagnostics: KpTutorialHostedArtifactReadinessDiagnostic[] = [];

  if (manifest.embedPolicy.sandboxTokens.length === 0) {
    diagnostics.push({
      path: "metadata.sandboxTokens",
      message: `Hosted iframe artifact ${artifact.id} must declare sandbox tokens.`
    });
  }

  if (manifest.embedPolicy.permissionPolicy.length === 0) {
    diagnostics.push({
      path: "metadata.permissionPolicy",
      message: `Hosted iframe artifact ${artifact.id} must declare a permission policy.`
    });
  }

  if (manifest.embedPolicy.referrerPolicy.trim() === "") {
    diagnostics.push({
      path: "metadata.referrerPolicy",
      message: `Hosted iframe artifact ${artifact.id} must declare a referrer policy.`
    });
  }

  return diagnostics;
}

function isDevServerUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return isDevServerHostname(url.hostname);
  } catch {
    return false;
  }
}

function isDevServerHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::1"
  );
}
