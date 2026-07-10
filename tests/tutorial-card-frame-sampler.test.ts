import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpTutorialCardFrameSampler,
  createLinearSolveTutorialCardFrameSampler
} from "../src/tutorial/card-frame-sampler.ts";
import { createLinearSolveSynchronizedPanelLayoutSample } from "../src/layout/synchronized-panel.ts";
import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";

test("tutorial card frame sampler composes runtime, parent timeline, layout, and binding frames", () => {
  const sampler = createKpTutorialCardFrameSampler({
    manifest: createLinearSolveTutorialCardManifest(),
    layout: createLinearSolveSynchronizedPanelLayoutSample()
  });
  const frame = sampler.sample(0.5);
  const rewindFrame = sampler.sample(0.5);

  assert.deepEqual(frame, rewindFrame);
  assert.equal(sampler.manifestId, "tutorial.linear-solve.card");
  assert.equal(frame.manifestId, "tutorial.linear-solve.card");
  assert.equal(frame.progress, 0.5);
  assert.equal(frame.parentTimelineFrame.beat, 25);
  assert.equal(frame.layoutFrame.progress, 0.5);
  assert.deepEqual(
    frame.layoutFrame.panels.map((panel) => [
      panel.panelId,
      panel.role,
      panel.progress
    ]),
    [
      ["panel.linear-solve.equation", "equation", 0.5],
      ["panel.linear-solve.graph", "graph", 0.5]
    ]
  );
  assert.ok(
    frame.bindingFrame.panels
      .find((panel) => panel.panelId === "panel.linear-solve.equation")
      ?.activeTrackIds.includes(
        "timeline.linear-solve.shared.transformation.transform.linear-solve.cancel-left-additive-inverse"
      )
  );
  assert.deepEqual(frame.diagnostics, []);
});

test("linear solve tutorial card frame sampler clamps progress through one shared clock", () => {
  const sampler = createLinearSolveTutorialCardFrameSampler();
  const startFrame = sampler.sample(Number.NaN);
  const endFrame = sampler.sample(2);

  assert.equal(startFrame.progress, 0);
  assert.equal(startFrame.parentTimelineFrame.beat, 0);
  assert.equal(startFrame.layoutFrame.controls[0]?.boundProgress, 0);
  assert.equal(endFrame.progress, 1);
  assert.equal(endFrame.parentTimelineFrame.beat, 50);
  assert.equal(endFrame.layoutFrame.controls[0]?.boundProgress, 1);
});
