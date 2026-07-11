import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { createLinearSolveTutorialCardFrameSampler } from "../src/tutorial/card-frame-sampler.ts";
import { createKpTutorialEquationFrameAdapter } from "../src/tutorial/equation-frame-adapter.ts";
import { sampleKpTutorialEquationFramesForExport } from "../src/tutorial/equation-frame-export-sampler.ts";
import { createKpTutorialParentTimelineFrameExportContract } from "../src/tutorial/frame-export-contract.ts";

test("equation frame export sampler maps parent-timeline sample points through equation adapter", () => {
  const cardSampler = createLinearSolveTutorialCardFrameSampler();
  const contract = createKpTutorialParentTimelineFrameExportContract({
    manifest: createLinearSolveTutorialCardManifest(),
    parentTimeline: cardSampler.parentTimeline,
    exportKind: "gif",
    frameCount: 5
  });
  const sequence = sampleKpTutorialEquationFramesForExport({
    contract,
    equationAdapter: createKpTutorialEquationFrameAdapter(cardSampler)
  });

  assert.equal(sequence.contractId, contract.id);
  assert.equal(sequence.artifactId, "artifact.linear-solve.gif");
  assert.equal(sequence.panelId, "panel.linear-solve.equation");
  assert.equal(sequence.timelineId, "timeline.linear-solve.shared");
  assert.equal(sequence.frameCount, 5);
  assert.deepEqual(sequence.diagnostics, []);
  assert.deepEqual(
    sequence.frames.map((frame) => [
      frame.samplePointId,
      frame.index,
      frame.progress,
      frame.beat,
      frame.equationFrame.transitionIndex,
      frame.equationFrame.transitionProgress
    ]),
    [
      ["frame.timeline-linear-solve-shared.0000", 0, 0, 0, 0, 0],
      ["frame.timeline-linear-solve-shared.0001", 1, 0.25, 12.5, 0, 0.75],
      ["frame.timeline-linear-solve-shared.0002", 2, 0.5, 25, 1, 0.5],
      ["frame.timeline-linear-solve-shared.0003", 3, 0.75, 37.5, 2, 0.25],
      ["frame.timeline-linear-solve-shared.0004", 4, 1, 50, 2, 1]
    ]
  );
  assert.ok(
    sequence.frames[2]?.equationFrame.equationFrame.tokens.some(
      (token) => token.tokenId === "lhs.x"
    )
  );
  assert.deepEqual(
    sequence.rewindFrames.map((frame) => frame.index),
    [4, 3, 2, 1, 0]
  );
  assert.strictEqual(sequence.rewindFrames[2], sequence.frames[2]);
});
