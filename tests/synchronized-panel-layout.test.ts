import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createLinearSolveSynchronizedPanelLayoutSample,
  sampleSynchronizedPanelLayoutFrame
} from "../src/layout/synchronized-panel.ts";

test("linear solve synchronized panel layout composes equation, graph, and controls", () => {
  const sample = createLinearSolveSynchronizedPanelLayoutSample();

  assert.equal(sample.id, "layout.sample.linear-solve-synchronized-panel");
  assert.equal(sample.sharedClockId, "solve-x-shared-clock");
  assert.equal(sample.rootLayoutId, "layout.linear-solve.root");
  assert.deepEqual(
    sample.layoutObjects.map((object) => [
      object.id,
      object.kind,
      object.childIds
    ]),
    [
      [
        "layout.linear-solve.root",
        "synchronized-panel",
        [
          "layout.linear-solve.split",
          "layout.linear-solve.controls"
        ]
      ],
      [
        "layout.linear-solve.split",
        "split",
        [
          "panel.linear-solve.equation",
          "panel.linear-solve.graph"
        ]
      ],
      ["layout.linear-solve.controls", "row", []]
    ]
  );
  assert.deepEqual(
    sample.panels.map((panel) => [
      panel.id,
      panel.role,
      panel.target.kind,
      panel.target.id
    ]),
    [
      [
        "panel.linear-solve.equation",
        "equation",
        "equation-animation",
        "linear-equation-solve-x"
      ],
      [
        "panel.linear-solve.graph",
        "graph",
        "graph-surface-mode",
        "saddle-orbit-graph"
      ]
    ]
  );
  assert.deepEqual(sample.controls.map((control) => control.kind), [
    "scrubber",
    "step-back",
    "play-pause",
    "step-forward"
  ]);
  assert.ok(
    sample.layoutObjects.every((object) =>
      object.preserves.includes("child selector identity")
    )
  );
});

test("synchronized panel layout frames sample every child from the same clock", () => {
  const sample = createLinearSolveSynchronizedPanelLayoutSample();
  const frame = sampleSynchronizedPanelLayoutFrame(sample, 0.5);
  const rewindFrame = sampleSynchronizedPanelLayoutFrame(sample, 0.5);
  const startFrame = sampleSynchronizedPanelLayoutFrame(sample, Number.NaN);
  const endFrame = sampleSynchronizedPanelLayoutFrame(sample, 2);

  assert.deepEqual(frame, rewindFrame);
  assert.equal(frame.sampleId, sample.id);
  assert.equal(frame.sharedClockId, sample.sharedClockId);
  assert.equal(frame.progress, 0.5);
  assert.deepEqual(
    frame.panels.map((panel) => [panel.panelId, panel.progress]),
    [
      ["panel.linear-solve.equation", 0.5],
      ["panel.linear-solve.graph", 0.5]
    ]
  );
  assert.deepEqual(
    frame.controls.map((control) => [control.controlId, control.boundProgress]),
    [
      ["control.linear-solve.scrubber", 0.5],
      ["control.linear-solve.step-back", 0.5],
      ["control.linear-solve.play-pause", 0.5],
      ["control.linear-solve.step-forward", 0.5]
    ]
  );
  assert.equal(startFrame.progress, 0);
  assert.equal(endFrame.progress, 1);
});
