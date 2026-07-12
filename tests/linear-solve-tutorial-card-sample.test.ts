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
  assert.deepEqual(frame.equationFrame.semanticFrame?.activeTransformationIds, [
    "transform.linear-solve.cancel-left-additive-inverse"
  ]);
  assert.deepEqual(frame.equationFrame.semanticFrame?.drillDownIds, [
    "drilldown.linear-solve.cancel-additive-inverse"
  ]);
  assert.deepEqual(frame.equationFrame.semanticFrame?.flashcardIds, [
    "card.linear-solve.explain-cancel",
    "card.linear-solve.focus-x-persistence"
  ]);
  assert.equal(frame.graphFrame.graphFrame.progress, 0.5);
  assert.equal(frame.graphFrame.graphFrame.timelineId, "timeline.linear-solve.shared");
  assert.deepEqual(frame.diagnostics, []);
});

test("linear solve tutorial card sample rewinds to the same frames as forward sampling", () => {
  const sample = createLinearSolveTutorialCardSample();
  const progressSteps = [0, 0.25, 0.5, 0.75, 1];
  const forwardFrames = progressSteps.map((progress) => sample.sample(progress));
  const rewindFrames = [...progressSteps]
    .reverse()
    .map((progress) => sample.sample(progress));

  forwardFrames.forEach((forwardFrame, index) => {
    assert.deepEqual(
      forwardFrame,
      rewindFrames[rewindFrames.length - 1 - index]
    );
  });
  assert.deepEqual(
    forwardFrames.map((frame) => frame.cardFrame.parentTimelineFrame.beat),
    [0, 12.5, 25, 37.5, 50]
  );
  assert.deepEqual(
    forwardFrames.map((frame) => frame.equationFrame.transitionIndex),
    [0, 0, 1, 2, 2]
  );
  assert.deepEqual(
    forwardFrames.map((frame) => frame.equationFrame.transitionProgress),
    [0, 0.75, 0.5, 0.25, 1]
  );
  assert.deepEqual(
    forwardFrames.map((frame) => frame.graphFrame.graphProgress),
    [0, 0.25, 0.5, 0.75, 1]
  );
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
