import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveSynchronizedPanelLayoutSample } from "../src/layout/synchronized-panel.ts";
import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { createKpTutorialCardRuntimeContext } from "../src/tutorial/card-runtime.ts";
import {
  createKpTutorialCardLayoutTimelineBinding,
  sampleKpTutorialCardLayoutTimelineBindingFrame
} from "../src/tutorial/layout-timeline-binding.ts";
import {
  createKpParentTimelineFromRuntimeContext,
  sampleKpParentTimeline
} from "../src/tutorial/parent-timeline.ts";

test("tutorial card layout binding maps panels to parent timeline tracks", () => {
  const context = createKpTutorialCardRuntimeContext(
    createLinearSolveTutorialCardManifest()
  );
  const parentTimeline = createKpParentTimelineFromRuntimeContext(context);
  const binding = createKpTutorialCardLayoutTimelineBinding({
    context,
    parentTimeline,
    layout: createLinearSolveSynchronizedPanelLayoutSample()
  });
  const equationPanel = binding.panelsById.get("panel.linear-solve.equation");
  const graphPanel = binding.panelsById.get("panel.linear-solve.graph");

  assert.equal(binding.id, "tutorial.linear-solve.card.layout-timeline-binding");
  assert.equal(binding.manifestId, "tutorial.linear-solve.card");
  assert.equal(binding.layoutId, "layout.sample.linear-solve-synchronized-panel");
  assert.equal(binding.timelineId, "timeline.linear-solve.shared");
  assert.equal(binding.sharedClockId, "solve-x-shared-clock");
  assert.equal(binding.diagnostics.length, 0);
  assert.equal(equationPanel?.role, "equation");
  assert.deepEqual(
    equationPanel?.trackIds.filter((trackId) =>
      trackId.includes(".transformation.")
    ),
    [
      "timeline.linear-solve.shared.transformation.transform.linear-solve.subtract-both-sides-3",
      "timeline.linear-solve.shared.transformation.transform.linear-solve.cancel-left-additive-inverse",
      "timeline.linear-solve.shared.transformation.transform.linear-solve.simplify-right-difference"
    ]
  );
  assert.ok(
    equationPanel?.trackIds.includes(
      "timeline.linear-solve.shared.semantic-object.equation.linear-solve.initial"
    )
  );
  assert.deepEqual(graphPanel?.trackIds, [
    "timeline.linear-solve.shared.semantic-object.saddle-orbit-graph"
  ]);
  assert.deepEqual(
    binding.controls.map((control) => [
      control.controlId,
      control.kind,
      control.boundTimelineId
    ]),
    [
      ["control.linear-solve.scrubber", "scrubber", "timeline.linear-solve.shared"],
      ["control.linear-solve.step-back", "step-back", "timeline.linear-solve.shared"],
      ["control.linear-solve.play-pause", "play-pause", "timeline.linear-solve.shared"],
      ["control.linear-solve.step-forward", "step-forward", "timeline.linear-solve.shared"]
    ]
  );
});

test("tutorial card layout binding samples panel and control progress from parent frame", () => {
  const context = createKpTutorialCardRuntimeContext(
    createLinearSolveTutorialCardManifest()
  );
  const parentTimeline = createKpParentTimelineFromRuntimeContext(context);
  const binding = createKpTutorialCardLayoutTimelineBinding({
    context,
    parentTimeline,
    layout: createLinearSolveSynchronizedPanelLayoutSample()
  });
  const parentFrame = sampleKpParentTimeline(parentTimeline, 0.5);
  const bindingFrame = sampleKpTutorialCardLayoutTimelineBindingFrame(
    binding,
    parentFrame
  );
  const rewindFrame = sampleKpTutorialCardLayoutTimelineBindingFrame(
    binding,
    sampleKpParentTimeline(parentTimeline, 0.5)
  );
  const equationPanel = bindingFrame.panels.find(
    (panel) => panel.panelId === "panel.linear-solve.equation"
  );
  const graphPanel = bindingFrame.panels.find(
    (panel) => panel.panelId === "panel.linear-solve.graph"
  );

  assert.deepEqual(bindingFrame, rewindFrame);
  assert.equal(bindingFrame.progress, 0.5);
  assert.equal(bindingFrame.beat, 25);
  assert.equal(equationPanel?.activeTrackIds.length, 5);
  assert.ok(
    equationPanel?.activeTrackIds.includes(
      "timeline.linear-solve.shared.transformation.transform.linear-solve.cancel-left-additive-inverse"
    )
  );
  assert.deepEqual(graphPanel?.activeTrackIds, [
    "timeline.linear-solve.shared.semantic-object.saddle-orbit-graph"
  ]);
  assert.deepEqual(
    bindingFrame.controls.map((control) => [
      control.controlId,
      control.boundProgress,
      control.boundBeat
    ]),
    [
      ["control.linear-solve.scrubber", 0.5, 25],
      ["control.linear-solve.step-back", 0.5, 25],
      ["control.linear-solve.play-pause", 0.5, 25],
      ["control.linear-solve.step-forward", 0.5, 25]
    ]
  );
});
