import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { resolveKpTutorialCardIframeExportArtifact } from "../src/tutorial/export-artifact-resolver.ts";
import {
  createKpIframeExportAssetManifest
} from "../src/tutorial/iframe-asset-manifest.ts";

test("iframe asset manifest serializes dependency and embed policy metadata", () => {
  const artifact = resolveKpTutorialCardIframeExportArtifact(
    createLinearSolveTutorialCardManifest()
  );

  assert.deepEqual(createKpIframeExportAssetManifest(artifact), {
    artifactId: "artifact.linear-solve.iframe",
    manifestId: "tutorial.linear-solve.card",
    profileId: "export.linear-solve.iframe",
    payloadKind: "html-document",
    dependencyPhases: ["critical", "interactive"],
    capabilityKeys: [
      "kp.semantic:document.read:*:*",
      "kp.layout:sample.synchronized-panel:*:*",
      "kp.equation:render.katex:equation:*",
      "kp.graph:render.webgl:graph-3d:surface.mesh"
    ],
    assetIds: [],
    embedPolicy: {
      sandboxTokens: ["allow-scripts"],
      permissionPolicy: [
        "camera=()",
        "geolocation=()",
        "microphone=()",
        "payment=()"
      ],
      referrerPolicy: "no-referrer"
    }
  });
});
