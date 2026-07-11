import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpTutorialCardExportArtifact,
  type KpTutorialCardExportArtifact
} from "../src/tutorial/export-artifact.ts";
import { createKpParentTimelineFromRuntimeContext } from "../src/tutorial/parent-timeline.ts";
import { createKpTutorialCardRuntimeContext } from "../src/tutorial/card-runtime.ts";
import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import {
  createKpTutorialCardStaticStepArtifact,
  type KpTutorialStaticStepCheckpoint,
  validateKpTutorialCardStaticStepArtifact
} from "../src/tutorial/static-step-artifact.ts";
import { selectKpTutorialStaticStepCheckpoints } from "../src/tutorial/static-step-checkpoints.ts";

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

test("static-step checkpoint selector uses parent timeline transformation boundaries", () => {
  const timeline = createKpParentTimelineFromRuntimeContext(
    createKpTutorialCardRuntimeContext(createLinearSolveTutorialCardManifest())
  );

  assert.deepEqual(selectKpTutorialStaticStepCheckpoints(timeline), [
    {
      id: "step.timeline.linear-solve.shared.start",
      label: "Start",
      progress: 0,
      beat: 0,
      timelineId: "timeline.linear-solve.shared",
      summary: "Initial tutorial card state."
    },
    {
      id: "step.transform.linear-solve.subtract-both-sides-3",
      label: "Subtract 3 from both sides while preserving equation value.",
      progress: 1 / 3,
      beat: 50 / 3,
      timelineId: "timeline.linear-solve.shared",
      summary: "Subtract 3 from both sides while preserving equation value."
    },
    {
      id: "step.transform.linear-solve.cancel-left-additive-inverse",
      label: "Cancel +3 and -3 on the left side.",
      progress: 2 / 3,
      beat: 100 / 3,
      timelineId: "timeline.linear-solve.shared",
      summary: "Cancel +3 and -3 on the left side."
    },
    {
      id: "step.transform.linear-solve.simplify-right-difference",
      label: "Simplify 7 - 3 into 4.",
      progress: 1,
      beat: 50,
      timelineId: "timeline.linear-solve.shared",
      summary: "Simplify 7 - 3 into 4."
    }
  ]);
});
