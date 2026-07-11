import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import {
  validateKpTutorialExportFallbackReadiness
} from "../src/tutorial/export-fallback-readiness.ts";
import {
  resolveKpTutorialCardIframeExportArtifact,
  resolveKpTutorialCardStepExportArtifact
} from "../src/tutorial/export-artifact-resolver.ts";

test("export fallback readiness accepts iframe and static-step artifacts", () => {
  const manifest = createLinearSolveTutorialCardManifest();

  assert.deepEqual(
    validateKpTutorialExportFallbackReadiness(
      resolveKpTutorialCardIframeExportArtifact(manifest)
    ),
    []
  );
  assert.deepEqual(
    validateKpTutorialExportFallbackReadiness(
      resolveKpTutorialCardStepExportArtifact(manifest)
    ),
    []
  );
});

test("export fallback readiness reports incomplete fallback metadata", () => {
  const artifact = resolveKpTutorialCardIframeExportArtifact(
    createLinearSolveTutorialCardManifest()
  );

  assert.deepEqual(
    validateKpTutorialExportFallbackReadiness({
      ...artifact,
      fallback: {
        strategy: "static-snapshot",
        preservesLayout: false,
        message: ""
      }
    }),
    [
      {
        path: "fallback.preservesLayout",
        message:
          "Export artifact artifact.linear-solve.iframe fallback must preserve layout."
      },
      {
        path: "fallback.message",
        message:
          "Export artifact artifact.linear-solve.iframe fallback message is required."
      }
    ]
  );
});
