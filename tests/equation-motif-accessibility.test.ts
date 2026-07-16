import assert from "node:assert/strict";
import test from "node:test";
import { kpSubstitutionPhaseIds } from "../src/animation/substitution-choreography.ts";
import {
  createKpEquationMotifAccessibilityPlan,
  sampleKpEquationMotifAccessibility
} from "../src/rendering/equation-motif-accessibility.ts";
import {
  compileKpEquationSemanticTimeline,
  createEquationVisualMotifTimeline
} from "../src/rendering/equation-visual-motif-timeline.ts";
import { linearEquationDemoBeatTimeline } from "../src/rendering/semantic-beat-compiler.ts";
import { createVisualMotifPlan } from "../src/rendering/visual-motif.ts";

const timeline = compileKpEquationSemanticTimeline(
  createEquationVisualMotifTimeline({
    sourceLatex: "3 \\Rightarrow x + 2",
    targetLatex: "3 \\Rightarrow 3 + 2",
    correspondenceMap: { id: "correspondence.accessible-substitution", records: [] },
    tokens: [],
    tracks: [],
    visualMotifs: [createVisualMotifPlan({
      id: "motif.accessible-substitution",
      kind: "substitute",
      correspondenceRecordId: "relation.accessible-substitution",
      sourceTokenIds: ["value", "x"],
      targetTokenIds: ["value", "replacement"],
      motionPrimitiveIds: ["transmit", "exit", "enter"],
      phaseIds: kpSubstitutionPhaseIds,
      summary: "Carry the value to the replaced occupant."
    })]
  }, linearEquationDemoBeatTimeline)
);

test("motif accessibility variants preserve phase order and salience semantics", () => {
  const plan = createKpEquationMotifAccessibilityPlan({
    timeline,
    salienceIntentIds: ["salience.transmit-value"]
  });
  assert.deepEqual(plan.variants.map((variant) => variant.mode), [
    "full-motion",
    "reduced-motion",
    "static",
    "narrated"
  ]);
  for (const variant of plan.variants) {
    assert.deepEqual(variant.phaseIds, kpSubstitutionPhaseIds);
    assert.deepEqual(variant.salienceIntentIds, ["salience.transmit-value"]);
    assert.deepEqual(variant.directions, ["forward", "rewind"]);
    assert.equal(variant.seekable, true);
  }
  assert.equal(plan.variants.find((variant) => variant.mode === "static")?.automaticPlayback, false);
});

test("reduced and static forms snap to shared semantic checkpoints", () => {
  const plan = createKpEquationMotifAccessibilityPlan({ timeline });
  const full = sampleKpEquationMotifAccessibility({
    plan,
    mode: "full-motion",
    progress: 0.47
  });
  const reduced = sampleKpEquationMotifAccessibility({
    plan,
    mode: "reduced-motion",
    progress: 0.47
  });
  const staticFrame = sampleKpEquationMotifAccessibility({
    plan,
    mode: "static",
    progress: 0.47
  });
  assert.equal(full.semanticProgress, 0.47);
  assert.notEqual(reduced.semanticProgress, full.semanticProgress);
  assert.equal(staticFrame.semanticProgress, reduced.semanticProgress);
  assert.ok(timeline.checkpoints.some((checkpoint) =>
    checkpoint.progress === reduced.semanticProgress
  ));
});

test("narrated form uses the same semantic frame and readable phase summary", () => {
  const plan = createKpEquationMotifAccessibilityPlan({ timeline });
  const full = sampleKpEquationMotifAccessibility({
    plan,
    mode: "full-motion",
    progress: 0.6
  });
  const narrated = sampleKpEquationMotifAccessibility({
    plan,
    mode: "narrated",
    progress: 0.6
  });
  assert.equal(narrated.semanticProgress, full.semanticProgress);
  assert.deepEqual(narrated.semanticTimeline.activePhaseIds, full.semanticTimeline.activePhaseIds);
  assert.ok(narrated.narration.length > 20);
});

test("keyboard contract covers transport, stepping, seeking, and rewind", () => {
  const plan = createKpEquationMotifAccessibilityPlan({ timeline });
  assert.deepEqual(plan.keyboard, [
    { key: "Space", action: "toggle-playback" },
    { key: "ArrowLeft", action: "previous-step" },
    { key: "ArrowRight", action: "next-step" },
    { key: "Home", action: "start" },
    { key: "End", action: "end" },
    { key: "r", action: "rewind" }
  ]);
});
