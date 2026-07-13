import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { createLinearSolveFrameSequencePreviewSmokeFixture } from "../src/tutorial/frame-sequence-preview-smoke-fixture.ts";
import { createKpTutorialFrameSequenceDependencyManifest } from "../src/tutorial/frame-sequence-dependency-manifest.ts";

test("frame sequence dependency manifest exposes export dependencies and closure diagnostics", () => {
  const sequence = createLinearSolveFrameSequencePreviewSmokeFixture().sequence;
  const manifest = createKpTutorialFrameSequenceDependencyManifest({
    sequence,
    tutorialManifest: createLinearSolveTutorialCardManifest()
  });

  assert.deepEqual(manifest, {
    artifactId: "artifact.linear-solve.gif.frames",
    sourceArtifactId: "artifact.linear-solve.gif",
    manifestId: "tutorial.linear-solve.card",
    profileId: "export.linear-solve.gif",
    payloadKind: "json-document",
    timelineIds: ["timeline.linear-solve.shared"],
    animationIds: ["animation.linear-solve.solve-x"],
    frameCount: 5,
    domains: ["equation", "graph", "programming"],
    dependencyPhases: ["critical", "interactive", "optional"],
    capabilityKeys: [
      "kp.semantic:document.read:*:*",
      "kp.layout:sample.synchronized-panel:*:*",
      "kp.equation:render.katex:equation:*",
      "kp.graph:render.webgl:graph-3d:surface.mesh",
      "kp.export:encode.gif:*:*",
      "kp.export:render.step-sequence:*:*"
    ],
    capabilityPackageIds: [
      "package.kp.equation.render.katex",
      "package.kp.equation.transform.semantic",
      "package.kp.equation.animate.motion-plan",
      "package.kp.graph3d.render.webgl.surface-mesh",
      "package.kp.graph3d.animate.surface-mode",
      "package.kp.export.encode.gif"
    ],
    capabilityPackageKeys: [
      "kp.equation:render.katex:equation:*",
      "kp.equation:transform.semantic:equation:*",
      "kp.equation:animate.motion-plan:equation:*",
      "kp.graph:render.webgl:graph-3d:surface.mesh",
      "kp.graph:animate.surface-mode:graph-3d:surface.mode",
      "kp.export:encode.gif:*:*"
    ],
    assetIds: [],
    previewRenderer: "renderKpTutorialFrameSequencePreviewHtml",
    diagnostics: []
  });
});
