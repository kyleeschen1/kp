import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardSample } from "../src/tutorial/linear-solve-card-sample.ts";

test("linear solve tutorial card sample synchronizes card, equation, and graph frames", () => {
  const sample = createLinearSolveTutorialCardSample();
  const frame = sample.sample(0.5);
  const rewindFrame = sample.sample(0.5);

  assert.deepEqual(frame, rewindFrame);
  assert.equal(sample.id, "tutorial.linear-solve.card.live-sample");
  assert.equal(sample.manifestId, "tutorial.linear-solve.card");
  assert.equal(frame.progress, 0.5);
  assert.equal(frame.cardFrame.parentTimelineFrame.beat, 25);
  assert.equal(frame.equationFrame.transitionIndex, 1);
  assert.equal(frame.equationFrame.transitionProgress, 0.5);
  assert.equal(frame.graphFrame.graphFrame.progress, 0.5);
  assert.equal(frame.graphFrame.graphFrame.timelineId, "timeline.linear-solve.shared");
  assert.deepEqual(frame.diagnostics, []);
});

test("linear solve tutorial card sample clamps every child frame through the parent clock", () => {
  const sample = createLinearSolveTutorialCardSample();
  const startFrame = sample.sample(Number.NaN);
  const endFrame = sample.sample(2);

  assert.equal(startFrame.progress, 0);
  assert.equal(startFrame.cardFrame.progress, 0);
  assert.equal(startFrame.equationFrame.transitionProgress, 0);
  assert.equal(startFrame.graphFrame.graphProgress, 0);
  assert.equal(endFrame.progress, 1);
  assert.equal(endFrame.cardFrame.progress, 1);
  assert.equal(endFrame.equationFrame.transitionProgress, 1);
  assert.equal(endFrame.graphFrame.graphProgress, 1);
});
