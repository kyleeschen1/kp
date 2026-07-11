import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import {
  resolveKpTutorialCardIframeExportArtifact,
  resolveKpTutorialCardStepExportArtifact
} from "../src/tutorial/export-artifact-resolver.ts";
import {
  validateKpTutorialHostedArtifactReadiness
} from "../src/tutorial/hosted-artifact-readiness.ts";

test("hosted artifact readiness accepts iframe and static-step artifacts", () => {
  const manifest = createLinearSolveTutorialCardManifest();

  assert.deepEqual(
    validateKpTutorialHostedArtifactReadiness({
      artifact: resolveKpTutorialCardIframeExportArtifact(manifest),
      manifest
    }),
    []
  );

  assert.deepEqual(
    validateKpTutorialHostedArtifactReadiness({
      artifact: resolveKpTutorialCardStepExportArtifact(manifest),
      manifest
    }),
    []
  );
});

test("hosted artifact readiness reports dev-server assets and missing iframe policy", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const manifestWithDevAsset = {
    ...manifest,
    dependencies: {
      ...manifest.dependencies,
      critical: {
        ...manifest.dependencies.critical,
        assets: [
          {
            id: "asset.dev-font",
            kind: "font" as const,
            url: "http://localhost:5173/fonts/katex-main.woff2"
          }
        ]
      }
    }
  };
  const artifact = resolveKpTutorialCardIframeExportArtifact(
    manifestWithDevAsset
  );

  assert.deepEqual(
    validateKpTutorialHostedArtifactReadiness({
      artifact: {
        ...artifact,
        metadata: {
          ...artifact.metadata,
          sandboxTokens: [],
          permissionPolicy: []
        }
      },
      manifest: manifestWithDevAsset
    }),
    [
      {
        path: "manifest.dependencies.critical.assets[0].url",
        message:
          "Hosted artifact artifact.linear-solve.iframe asset asset.dev-font must not depend on dev-server URL http://localhost:5173/fonts/katex-main.woff2."
      },
      {
        path: "metadata.sandboxTokens",
        message:
          "Hosted iframe artifact artifact.linear-solve.iframe must declare sandbox tokens."
      },
      {
        path: "metadata.permissionPolicy",
        message:
          "Hosted iframe artifact artifact.linear-solve.iframe must declare a permission policy."
      }
    ]
  );
});
