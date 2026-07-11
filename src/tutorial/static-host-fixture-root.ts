import {
  createLinearSolveTutorialCardManifest
} from "./card-manifest.ts";
import type {
  KpTutorialCardExportArtifact,
  KpTutorialExportArtifactKind,
  KpTutorialExportArtifactPayloadKind
} from "./export-artifact.ts";
import {
  createLinearSolveIframeExportSmokeFixture
} from "./iframe-export-smoke-fixture.ts";
import {
  createLinearSolveStaticStepExportSmokeFixture
} from "./static-step-export-smoke-fixture.ts";
import {
  validateKpTutorialHostedArtifactReadiness,
  type KpTutorialHostedArtifactReadinessDiagnostic
} from "./hosted-artifact-readiness.ts";
import {
  validateKpTutorialExportFallbackReadiness
} from "./export-fallback-readiness.ts";

export interface KpStaticHostFixtureRootOptions {
  readonly iframeProgress?: number | undefined;
}

export interface KpStaticHostFixtureEntry {
  readonly path: string;
  readonly artifactId: string;
  readonly artifactKind: KpTutorialExportArtifactKind;
  readonly payloadKind: KpTutorialExportArtifactPayloadKind;
  readonly contentType: string;
  readonly content: string;
}

export interface KpStaticHostFixtureRoot {
  readonly id: string;
  readonly entries: readonly KpStaticHostFixtureEntry[];
  readonly fallbackReadiness: readonly KpStaticHostFallbackReadiness[];
  readonly readinessDiagnostics: readonly KpTutorialHostedArtifactReadinessDiagnostic[];
}

export interface KpStaticHostFallbackReadiness {
  readonly artifactId: string;
  readonly strategy: KpTutorialCardExportArtifact["fallback"]["strategy"];
  readonly preservesLayout: boolean;
  readonly message: string;
  readonly diagnostics: readonly KpTutorialHostedArtifactReadinessDiagnostic[];
}

export function createLinearSolveStaticHostFixtureRoot(
  options: KpStaticHostFixtureRootOptions = {}
): KpStaticHostFixtureRoot {
  const manifest = createLinearSolveTutorialCardManifest();
  const iframeFixture = createLinearSolveIframeExportSmokeFixture(
    options.iframeProgress ?? 0.5
  );
  const staticStepFixture = createLinearSolveStaticStepExportSmokeFixture();

  return {
    id: "fixture.linear-solve.static-host-root",
    entries: [
      {
        path: "linear-solve/iframe/index.html",
        artifactId: iframeFixture.artifact.id,
        artifactKind: iframeFixture.artifact.artifactKind,
        payloadKind: iframeFixture.artifact.payloadKind,
        contentType: "text/html",
        content: iframeFixture.html
      },
      {
        path: "linear-solve/static-steps/index.html",
        artifactId: staticStepFixture.sequence.artifact.id,
        artifactKind: staticStepFixture.sequence.artifact.artifactKind,
        payloadKind: staticStepFixture.sequence.artifact.payloadKind,
        contentType: "text/html",
        content: staticStepFixture.html
      }
    ],
    fallbackReadiness: [
      staticHostFallbackReadiness(iframeFixture.artifact),
      staticHostFallbackReadiness(staticStepFixture.sequence.artifact)
    ],
    readinessDiagnostics: [
      ...validateKpTutorialHostedArtifactReadiness({
        artifact: iframeFixture.artifact,
        manifest
      }),
      ...validateKpTutorialHostedArtifactReadiness({
        artifact: staticStepFixture.sequence.artifact,
        manifest
      })
    ]
  };
}

function staticHostFallbackReadiness(
  artifact: KpTutorialCardExportArtifact
): KpStaticHostFallbackReadiness {
  return {
    artifactId: artifact.id,
    strategy: artifact.fallback.strategy,
    preservesLayout: artifact.fallback.preservesLayout,
    message: artifact.fallback.message ?? "",
    diagnostics: validateKpTutorialExportFallbackReadiness(artifact)
  };
}

export function findKpStaticHostFixtureEntry(
  root: KpStaticHostFixtureRoot,
  path: string
): KpStaticHostFixtureEntry | undefined {
  return root.entries.find((entry) => entry.path === path);
}
