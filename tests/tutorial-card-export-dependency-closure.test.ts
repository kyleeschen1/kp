import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import {
  validateKpTutorialExportDependencyClosure
} from "../src/tutorial/export-dependency-closure.ts";
import { resolveKpTutorialCardIframeExportArtifact } from "../src/tutorial/export-artifact-resolver.ts";

test("iframe export dependency closure accepts declared dependency phases", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const artifact = resolveKpTutorialCardIframeExportArtifact(manifest);

  assert.deepEqual(
    validateKpTutorialExportDependencyClosure({ artifact, manifest }),
    []
  );
});

test("iframe export dependency closure reports missing phase capabilities", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const artifact = resolveKpTutorialCardIframeExportArtifact(manifest);

  assert.deepEqual(
    validateKpTutorialExportDependencyClosure({
      artifact: {
        ...artifact,
        dependencies: {
          ...artifact.dependencies,
          capabilityKeys: artifact.dependencies.capabilityKeys.filter(
            (key) => key !== "kp.graph:render.webgl:graph-3d:surface.mesh"
          )
        }
      },
      manifest
    }),
    [
      {
        path: "dependencies.capabilityKeys",
        message:
          "Export artifact artifact.linear-solve.iframe is missing capability kp.graph:render.webgl:graph-3d:surface.mesh from dependency phase interactive."
      }
    ]
  );
});
