import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpTutorialCardExportArtifact,
  type KpTutorialCardExportArtifact
} from "../src/tutorial/export-artifact.ts";
import { createKpParentTimelineFromRuntimeContext } from "../src/tutorial/parent-timeline.ts";
import { createKpTutorialCardRuntimeContext } from "../src/tutorial/card-runtime.ts";
import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { createLinearSolveTutorialCardSample } from "../src/tutorial/linear-solve-card-sample.ts";
import {
  createKpTutorialCardStaticStepArtifact,
  type KpTutorialStaticStepCheckpoint,
  validateKpTutorialCardStaticStepArtifact
} from "../src/tutorial/static-step-artifact.ts";
import { selectKpTutorialStaticStepCheckpoints } from "../src/tutorial/static-step-checkpoints.ts";
import { renderKpTutorialCardStaticStepSequence } from "../src/tutorial/static-step-sequence-renderer.ts";

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

test("static-step sequence renderer samples frames at selected checkpoints", () => {
  const sample = createLinearSolveTutorialCardSample();
  const checkpoints = selectKpTutorialStaticStepCheckpoints(
    sample.cardSampler.parentTimeline
  );

  const sequence = renderKpTutorialCardStaticStepSequence({
    artifact: staticArtifact,
    checkpoints,
    sampler: sample
  });

  assert.equal(sequence.artifact.status, "renderable");
  assert.deepEqual(
    sequence.checkpoints.map((checkpoint) => checkpoint.id),
    [
      "step.timeline.linear-solve.shared.start",
      "step.transform.linear-solve.subtract-both-sides-3",
      "step.transform.linear-solve.cancel-left-additive-inverse",
      "step.transform.linear-solve.simplify-right-difference"
    ]
  );
  assert.deepEqual(
    sequence.steps.map((step) => [
      step.checkpointId,
      step.label,
      step.progress,
      step.beat,
      step.frame.progress
    ]),
    [
      ["step.timeline.linear-solve.shared.start", "Start", 0, 0, 0],
      [
        "step.transform.linear-solve.subtract-both-sides-3",
        "Subtract 3 from both sides while preserving equation value.",
        1 / 3,
        50 / 3,
        1 / 3
      ],
      [
        "step.transform.linear-solve.cancel-left-additive-inverse",
        "Cancel +3 and -3 on the left side.",
        2 / 3,
        100 / 3,
        2 / 3
      ],
      [
        "step.transform.linear-solve.simplify-right-difference",
        "Simplify 7 - 3 into 4.",
        1,
        50,
        1
      ]
    ]
  );
  for (const step of sequence.steps) {
    assertNear(step.frame.cardFrame.parentTimelineFrame.beat, step.beat);
  }
  assert.deepEqual(sequence.diagnostics, []);
});

function assertNear(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `Expected ${actual} to be within tolerance of ${expected}`
  );
}
