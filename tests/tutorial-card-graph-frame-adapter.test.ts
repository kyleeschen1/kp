import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardFrameSampler } from "../src/tutorial/card-frame-sampler.ts";
import { createKpTutorialGraphFrameAdapter } from "../src/tutorial/graph-frame-adapter.ts";
import { createKpTutorialGraphParentTimelineDiagnostic } from "../src/tutorial/graph-parent-timeline-diagnostic.ts";

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
  assert.equal(frame.graphTrackActive, true);
  assert.equal(frame.graphTrackStartProgress, 0);
  assert.equal(frame.graphTrackEndProgress, 1);
  assert.equal(frame.graphTrackLocalProgress, 0.5);
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

test("tutorial graph parent timeline diagnostic checks shared timeline conformance", () => {
  const cardSampler = createLinearSolveTutorialCardFrameSampler();
  const adapter = createKpTutorialGraphFrameAdapter(cardSampler);
  const diagnostic = createKpTutorialGraphParentTimelineDiagnostic({
    adapter,
    timelineId: cardSampler.parentTimeline.id,
    sampleProgresses: [0, 0.5, 1]
  });

  assert.deepEqual(diagnostic, {
    id: "diagnostic.panel.linear-solve.graph.parent-timeline",
    panelId: "panel.linear-solve.graph",
    graphId: "saddle-orbit-graph",
    timelineId: "timeline.linear-solve.shared",
    samples: [
      {
        requestedProgress: 0,
        parentTimelineId: "timeline.linear-solve.shared",
        cardProgress: 0,
        graphProgress: 0,
        graphTrackActive: true,
        graphTrackStartProgress: 0,
        graphTrackEndProgress: 1,
        graphTrackLocalProgress: 0,
        frameProgress: 0,
        graphFrameTimelineId: "timeline.linear-solve.shared",
        graphTrackId: "timeline.linear-solve.shared.semantic-object.saddle-orbit-graph",
        graphFrameTimelineMatchesParent: true,
        graphProgressMatchesCard: true,
        frameProgressMatchesGraph: true
      },
      {
        requestedProgress: 0.5,
        parentTimelineId: "timeline.linear-solve.shared",
        cardProgress: 0.5,
        graphProgress: 0.5,
        graphTrackActive: true,
        graphTrackStartProgress: 0,
        graphTrackEndProgress: 1,
        graphTrackLocalProgress: 0.5,
        frameProgress: 0.5,
        graphFrameTimelineId: "timeline.linear-solve.shared",
        graphTrackId: "timeline.linear-solve.shared.semantic-object.saddle-orbit-graph",
        graphFrameTimelineMatchesParent: true,
        graphProgressMatchesCard: true,
        frameProgressMatchesGraph: true
      },
      {
        requestedProgress: 1,
        parentTimelineId: "timeline.linear-solve.shared",
        cardProgress: 1,
        graphProgress: 1,
        graphTrackActive: true,
        graphTrackStartProgress: 0,
        graphTrackEndProgress: 1,
        graphTrackLocalProgress: 1,
        frameProgress: 1,
        graphFrameTimelineId: "timeline.linear-solve.shared",
        graphTrackId: "timeline.linear-solve.shared.semantic-object.saddle-orbit-graph",
        graphFrameTimelineMatchesParent: true,
        graphProgressMatchesCard: true,
        frameProgressMatchesGraph: true
      }
    ],
    diagnostics: []
  });
});

test("tutorial graph parent timeline diagnostic reports timeline mismatches", () => {
  const adapter = createKpTutorialGraphFrameAdapter(
    createLinearSolveTutorialCardFrameSampler()
  );
  const diagnostic = createKpTutorialGraphParentTimelineDiagnostic({
    adapter,
    timelineId: "timeline.other",
    sampleProgresses: [0.5]
  });

  assert.deepEqual(diagnostic.diagnostics, [
    {
      path: "samples[0].graphFrame.timelineId",
      message:
        "Graph frame timeline timeline.linear-solve.shared does not match parent timeline timeline.other."
    }
  ]);
  assert.equal(
    diagnostic.samples[0]?.graphFrameTimelineMatchesParent,
    false
  );
});
