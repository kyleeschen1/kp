import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { resolveKpTutorialCardIframeExportArtifact } from "../src/tutorial/export-artifact-resolver.ts";
import {
  createKpIframeStaticAssetPathClosure
} from "../src/tutorial/iframe-asset-manifest.ts";
import {
  createLinearSolveStaticHostFixtureRoot
} from "../src/tutorial/static-host-fixture-root.ts";

test("iframe static asset path closure accepts relative hosted fixture paths", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const artifact = resolveKpTutorialCardIframeExportArtifact(manifest);
  const root = createLinearSolveStaticHostFixtureRoot();

  assert.deepEqual(
    createKpIframeStaticAssetPathClosure({
      artifact,
      staticHostRoot: root
    }),
    {
      artifactId: "artifact.linear-solve.iframe",
      documentPath: "linear-solve/iframe/index.html",
      assetPaths: [],
      diagnostics: []
    }
  );
});

test("iframe static asset path closure reports missing and nonportable asset paths", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const artifact = resolveKpTutorialCardIframeExportArtifact(manifest);
  const artifactWithAssets = {
    ...artifact,
    dependencies: {
      ...artifact.dependencies,
      assetIds: ["asset.missing", "asset.dev-script", "asset.absolute"]
    }
  };

  assert.deepEqual(
    createKpIframeStaticAssetPathClosure({
      artifact: artifactWithAssets,
      staticHostRoot: createLinearSolveStaticHostFixtureRoot(),
      assetPathById: {
        "asset.dev-script": "http://localhost:5173/runtime.js",
        "asset.absolute": "/assets/runtime.js"
      }
    }).diagnostics,
    [
      {
        path: "assetPathById.asset.missing",
        message:
          "Iframe artifact artifact.linear-solve.iframe asset asset.missing must map to a hosted relative path."
      },
      {
        path: "assetPathById.asset.dev-script",
        message:
          "Iframe artifact artifact.linear-solve.iframe asset asset.dev-script path http://localhost:5173/runtime.js must be relative for static hosting."
      },
      {
        path: "assetPathById.asset.absolute",
        message:
          "Iframe artifact artifact.linear-solve.iframe asset asset.absolute path /assets/runtime.js must be relative for static hosting."
      }
    ]
  );
});
