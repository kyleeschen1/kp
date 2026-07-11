import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { createLinearSolveTutorialCardFrameSampler } from "../src/tutorial/card-frame-sampler.ts";
import {
  validateKpTutorialExportDependencyClosure
} from "../src/tutorial/export-dependency-closure.ts";
import {
  resolveKpTutorialCardIframeExportArtifact,
  resolveKpTutorialCardStepExportArtifact
} from "../src/tutorial/export-artifact-resolver.ts";
import { createKpTutorialParentTimelineFrameExportContract } from "../src/tutorial/frame-export-contract.ts";

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

test("iframe export dependency closure reports missing capability packages", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const artifact = resolveKpTutorialCardIframeExportArtifact(manifest);

  assert.deepEqual(
    validateKpTutorialExportDependencyClosure({
      artifact: {
        ...artifact,
        dependencies: {
          ...artifact.dependencies,
          capabilityPackageIds:
            artifact.dependencies.capabilityPackageIds?.filter(
              (packageId) =>
                packageId !==
                "package.kp.graph3d.render.webgl.surface-mesh"
            ) ?? []
        }
      },
      manifest
    }),
    [
      {
        path: "dependencies.capabilityPackageIds",
        message:
          "Export artifact artifact.linear-solve.iframe is missing capability package package.kp.graph3d.render.webgl.surface-mesh from dependency phase interactive."
      }
    ]
  );
});

test("static-step export dependency closure reports missing capability packages", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const artifact = resolveKpTutorialCardStepExportArtifact(manifest);

  assert.deepEqual(
    validateKpTutorialExportDependencyClosure({
      artifact: {
        ...artifact,
        dependencies: {
          ...artifact.dependencies,
          capabilityPackageIds:
            artifact.dependencies.capabilityPackageIds?.filter(
              (packageId) =>
                packageId !== "package.kp.export.encode.gif"
            ) ?? []
        }
      },
      manifest
    }),
    [
      {
        path: "dependencies.capabilityPackageIds",
        message:
          "Export artifact artifact.linear-solve.steps is missing capability package package.kp.export.encode.gif from dependency phase optional."
      }
    ]
  );
});

test("media frame export dependency closure reports missing capability packages", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const contract = createKpTutorialParentTimelineFrameExportContract({
    manifest,
    parentTimeline: createLinearSolveTutorialCardFrameSampler().parentTimeline,
    exportKind: "gif",
    frameCount: 5
  });

  assert.deepEqual(
    validateKpTutorialExportDependencyClosure({
      artifact: {
        ...contract.artifact,
        dependencies: {
          ...contract.artifact.dependencies,
          capabilityPackageIds:
            contract.artifact.dependencies.capabilityPackageIds?.filter(
              (packageId) =>
                packageId !== "package.kp.export.encode.gif"
            ) ?? []
        }
      },
      manifest
    }),
    [
      {
        path: "dependencies.capabilityPackageIds",
        message:
          "Export artifact artifact.linear-solve.gif is missing capability package package.kp.export.encode.gif from dependency phase optional."
      }
    ]
  );
});
