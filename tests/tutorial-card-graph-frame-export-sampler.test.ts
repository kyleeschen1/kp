import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { createLinearSolveTutorialCardFrameSampler } from "../src/tutorial/card-frame-sampler.ts";
import { createKpTutorialParentTimelineFrameExportContract } from "../src/tutorial/frame-export-contract.ts";
import { createKpTutorialGraphFrameAdapter } from "../src/tutorial/graph-frame-adapter.ts";
import { sampleKpTutorialGraphFramesForExport } from "../src/tutorial/graph-frame-export-sampler.ts";

test("graph frame export sampler maps parent-timeline sample points through graph adapter", () => {
  const cardSampler = createLinearSolveTutorialCardFrameSampler();
  const contract = createKpTutorialParentTimelineFrameExportContract({
    manifest: createLinearSolveTutorialCardManifest(),
    parentTimeline: cardSampler.parentTimeline,
    exportKind: "gif",
    frameCount: 5
  });
  const sequence = sampleKpTutorialGraphFramesForExport({
    contract,
    graphAdapter: createKpTutorialGraphFrameAdapter(cardSampler)
  });

  assert.equal(sequence.contractId, contract.id);
  assert.equal(sequence.artifactId, "artifact.linear-solve.gif");
  assert.equal(sequence.panelId, "panel.linear-solve.graph");
  assert.equal(sequence.graphId, "saddle-orbit-graph");
  assert.equal(sequence.timelineId, "timeline.linear-solve.shared");
  assert.equal(sequence.frameCount, 5);
  assert.deepEqual(sequence.diagnostics, []);
  assert.deepEqual(
    sequence.frames.map((frame) => [
      frame.samplePointId,
      frame.index,
      frame.progress,
      frame.beat,
      frame.graphFrame.graphProgress,
      frame.graphFrame.graphFrame.timelineId
    ]),
    [
      ["frame.timeline-linear-solve-shared.0000", 0, 0, 0, 0, "timeline.linear-solve.shared"],
      ["frame.timeline-linear-solve-shared.0001", 1, 0.25, 12.5, 0.25, "timeline.linear-solve.shared"],
      ["frame.timeline-linear-solve-shared.0002", 2, 0.5, 25, 0.5, "timeline.linear-solve.shared"],
      ["frame.timeline-linear-solve-shared.0003", 3, 0.75, 37.5, 0.75, "timeline.linear-solve.shared"],
      ["frame.timeline-linear-solve-shared.0004", 4, 1, 50, 1, "timeline.linear-solve.shared"]
    ]
  );
  assert.equal(
    sequence.frames[2]?.graphFrame.graphFrame.channels[0]?.vertices.length,
    441
  );
  assert.deepEqual(
    sequence.rewindFrames.map((frame) => frame.index),
    [4, 3, 2, 1, 0]
  );
  assert.strictEqual(sequence.rewindFrames[2], sequence.frames[2]);
});
