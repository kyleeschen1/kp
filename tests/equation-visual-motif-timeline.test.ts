import { strict as assert } from "node:assert";
import test from "node:test";

import { createEquationOperationTransition } from "../src/math/equation-transform.ts";
import { createEquationMotionPlan } from "../src/rendering/equation-motion-plan.ts";
import {
  compileKpEquationSemanticTimeline,
  createEquationVisualMotifTimeline,
  findKpEquationSemanticTimelineCheckpoint,
  sampleKpEquationSemanticTimeline,
  sampleEquationVisualMotifTimeline,
  type EquationVisualMotifTimeline,
  type EquationVisualMotifTimelineFrame
} from "../src/rendering/equation-visual-motif-timeline.ts";
import {
  compileSemanticBeatTimeline,
  linearEquationDemoBeatTimeline
} from "../src/rendering/semantic-beat-compiler.ts";

const cancelationTimeline = (): EquationVisualMotifTimeline => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 - 3 = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });

  return createEquationVisualMotifTimeline(
    createEquationMotionPlan(transition),
    linearEquationDemoBeatTimeline
  );
};

const findFrameMotif = (
  frame: EquationVisualMotifTimelineFrame,
  kind: string
) => {
  const motif = frame.motifs.find((candidate) => candidate.kind === kind);
  assert.ok(motif, `missing motif frame for ${kind}`);
  return motif;
};

const assertNearlyEqual = (
  actual: number,
  expected: number,
  epsilon = 1e-12
): void => {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`
  );
};

test("createEquationVisualMotifTimeline indexes motif phases to semantic beats", () => {
  const timeline = cancelationTimeline();
  const motif = timeline.motifs.find(
    (candidate) => candidate.kind === "cancelation"
  );
  assert.ok(motif);

  assert.deepEqual(
    motif.phases.map((phase) => [
      phase.phaseId,
      phase.start,
      phase.end,
      phase.easing
    ]),
    [
      ["cancel-meet", 0, 0.4, "ease-in-out"],
      ["cancel-collapse", 0.4, 0.5, "ease-out"],
      ["post-cancel-layout-shift", 0.6, 1, "ease-in-out"]
    ]
  );
});

test("sampleEquationVisualMotifTimeline reports reversible phase progress", () => {
  const timeline = cancelationTimeline();
  const frame = sampleEquationVisualMotifTimeline(timeline, 0.45);
  const rewindFrame = sampleEquationVisualMotifTimeline(timeline, 0.55, {
    direction: "rewind"
  });
  const motif = findFrameMotif(frame, "cancelation");
  const phaseById = new Map(
    motif.phases.map((phase) => [phase.phaseId, phase])
  );

  assert.deepEqual(frame, rewindFrame);
  assert.equal(frame.progress, 0.45);
  assert.equal(phaseById.get("cancel-meet")?.progress, 1);
  assert.equal(phaseById.get("cancel-meet")?.active, false);
  assert.equal(phaseById.get("cancel-collapse")?.progress, 0.5);
  assert.equal(phaseById.get("cancel-collapse")?.active, true);
  assertNearlyEqual(phaseById.get("cancel-collapse")?.easedProgress ?? 0, 0.75);
  assert.equal(phaseById.get("post-cancel-layout-shift")?.progress, 0);
});

test("semantic timeline compiles stable named checkpoints from motif boundaries", () => {
  const timeline = compileKpEquationSemanticTimeline(cancelationTimeline());

  assert.deepEqual(
    timeline.checkpoints.map((checkpoint) => [
      checkpoint.id,
      checkpoint.progress,
      checkpoint.label
    ]),
    [
      [
        "linear-equation-demo.semantic-checkpoint.0",
        0,
        "Beat 0: start cancel-meet"
      ],
      [
        "linear-equation-demo.semantic-checkpoint.20",
        0.4,
        "Beat 20: finish cancel-meet; start cancel-collapse"
      ],
      [
        "linear-equation-demo.semantic-checkpoint.25",
        0.5,
        "Beat 25: finish cancel-collapse"
      ],
      [
        "linear-equation-demo.semantic-checkpoint.30",
        0.6,
        "Beat 30: start post-cancel-layout-shift"
      ],
      [
        "linear-equation-demo.semantic-checkpoint.50",
        1,
        "Beat 50: finish post-cancel-layout-shift"
      ]
    ]
  );
  assert.equal(
    findKpEquationSemanticTimelineCheckpoint(
      timeline,
      "linear-equation-demo.semantic-checkpoint.25"
    ).beat,
    25
  );
});

test("semantic timeline samples named phases equivalently in reverse", () => {
  const timeline = compileKpEquationSemanticTimeline(cancelationTimeline());
  const forward = sampleKpEquationSemanticTimeline(timeline, 0.45);
  const rewind = sampleKpEquationSemanticTimeline(timeline, 0.55, {
    direction: "rewind"
  });

  assert.deepEqual(forward, rewind);
  assert.deepEqual(forward.activePhaseIds, ["cancel-collapse"]);
  assert.deepEqual(forward.completedPhaseIds, ["cancel-meet"]);
  assert.equal(
    forward.previousCheckpointId,
    "linear-equation-demo.semantic-checkpoint.20"
  );
  assert.equal(
    forward.nextCheckpointId,
    "linear-equation-demo.semantic-checkpoint.25"
  );
});

test("createEquationVisualMotifTimeline rejects motif phases without beats", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 - 3 = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });
  const brokenTimeline = compileSemanticBeatTimeline({
    id: "missing-cancel-collapse",
    beatCount: linearEquationDemoBeatTimeline.beatCount,
    beats: linearEquationDemoBeatTimeline.beats.filter(
      (beat) => beat.id !== "cancel-collapse"
    )
  });

  assert.throws(
    () =>
      createEquationVisualMotifTimeline(
        createEquationMotionPlan(transition),
        brokenTimeline
      ),
    /Unknown semantic beat cancel-collapse/
  );
});
