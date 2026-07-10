import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardFrameSampler } from "../src/tutorial/card-frame-sampler.ts";
import { createKpTutorialGraphFrameAdapter } from "../src/tutorial/graph-frame-adapter.ts";

test("tutorial graph frame adapter resolves graph surface frames from card progress", () => {
  const adapter = createKpTutorialGraphFrameAdapter(
    createLinearSolveTutorialCardFrameSampler()
  );
  const frame = adapter.sample(0.5);
  const rewindFrame = adapter.sample(0.5);

  assert.deepEqual(frame, rewindFrame);
  assert.equal(adapter.panelId, "panel.linear-solve.graph");
  assert.equal(adapter.graphId, "saddle-orbit-graph");
  assert.equal(adapter.surfaceMode, "mesh");
  assert.equal(frame.cardProgress, 0.5);
  assert.equal(frame.graphProgress, 0.5);
  assert.equal(frame.graphFrame.progress, 0.5);
  assert.equal(frame.graphFrame.timelineId, "timeline.linear-solve.shared");
  assert.equal(frame.graphFrame.sourceMode, "mesh");
  assert.equal(frame.graphFrame.targetMode, "mesh");
  assert.equal(frame.graphFrame.channels.length, 1);
  assert.equal(frame.graphFrame.channels[0]?.vertices.length, 441);
});

test("tutorial graph frame adapter clamps through parent timeline", () => {
  const adapter = createKpTutorialGraphFrameAdapter(
    createLinearSolveTutorialCardFrameSampler()
  );
  const startFrame = adapter.sample(Number.NaN);
  const endFrame = adapter.sample(2);

  assert.equal(startFrame.cardProgress, 0);
  assert.equal(startFrame.graphProgress, 0);
  assert.equal(startFrame.graphFrame.progress, 0);
  assert.equal(endFrame.cardProgress, 1);
  assert.equal(endFrame.graphProgress, 1);
  assert.equal(endFrame.graphFrame.progress, 1);
});
