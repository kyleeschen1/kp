import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpTutorialCardExportArtifact,
  type KpTutorialCardExportArtifact
} from "../src/tutorial/export-artifact.ts";
import {
  createKpTutorialCardStaticStepArtifact,
  type KpTutorialStaticStepCheckpoint,
  validateKpTutorialCardStaticStepArtifact
} from "../src/tutorial/static-step-artifact.ts";

const staticArtifact: KpTutorialCardExportArtifact =
  createKpTutorialCardExportArtifact({
    id: "artifact.linear-solve.steps",
    manifestId: "tutorial.linear-solve.card",
    profileId: "export.linear-solve.steps",
    exportKind: "step-sequence",
    target: "static",
    artifactKind: "static-step-sequence",
    payloadKind: "json-document",
    status: "metadata",
    timelineIds: ["timeline.linear-solve.shared"],
    dependencies: {
      phases: ["critical", "optional"],
      capabilityKeys: [
        "kp.semantic:document.read:*:*",
        "kp.export:render.step-sequence:*:*"
      ],
      assetIds: []
    },
    fallback: {
      strategy: "static-snapshot",
      preservesLayout: true
    }
  });

test("static-step artifact contract preserves checkpoint records", () => {
  const checkpoints: KpTutorialStaticStepCheckpoint[] = [
    {
      id: "step.linear-solve.initial",
      label: "Initial equation",
      progress: 0,
      beat: 0,
      timelineId: "timeline.linear-solve.shared",
      summary: "Show x + 3 = 7."
    }
  ];

  const sequence = createKpTutorialCardStaticStepArtifact({
    artifact: staticArtifact,
    checkpoints
  });

  checkpoints[0] = {
    id: "mutated",
    label: "Mutated",
    progress: 1,
    beat: 50,
    timelineId: "timeline.linear-solve.shared"
  };

  assert.deepEqual(sequence, {
    artifact: staticArtifact,
    checkpoints: [
      {
        id: "step.linear-solve.initial",
        label: "Initial equation",
        progress: 0,
        beat: 0,
        timelineId: "timeline.linear-solve.shared",
        summary: "Show x + 3 = 7."
      }
    ]
  });
});

test("static-step artifact validation reports wrong artifact shape", () => {
  const diagnostics = validateKpTutorialCardStaticStepArtifact({
    artifact: {
      ...staticArtifact,
      artifactKind: "iframe-document",
      payloadKind: "html-document"
    },
    checkpoints: []
  });

  assert.deepEqual(diagnostics, [
    {
      path: "artifact.artifactKind",
      message: "Static-step artifact must use static-step-sequence artifactKind."
    },
    {
      path: "artifact.payloadKind",
      message: "Static-step artifact must use json-document payloadKind."
    },
    {
      path: "checkpoints",
      message: "Static-step artifact must include at least one checkpoint."
    }
  ]);
});
