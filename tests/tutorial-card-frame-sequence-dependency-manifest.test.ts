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
    assetIds: [],
    previewRenderer: "renderKpTutorialFrameSequencePreviewHtml",
    diagnostics: []
  });
});
