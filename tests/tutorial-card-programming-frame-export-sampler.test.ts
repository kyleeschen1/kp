import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { createLinearSolveTutorialCardFrameSampler } from "../src/tutorial/card-frame-sampler.ts";
import { createKpTutorialParentTimelineFrameExportContract } from "../src/tutorial/frame-export-contract.ts";
import { createAdditionProgrammingExecutionTraceTutorialCardSample } from "../src/tutorial/programming-execution-trace-card-sample.ts";
import { sampleKpTutorialProgrammingFramesForExport } from "../src/tutorial/programming-frame-export-sampler.ts";

test("programming frame export sampler maps parent-timeline sample points through execution trace sample", () => {
  const contract = createKpTutorialParentTimelineFrameExportContract({
    manifest: createLinearSolveTutorialCardManifest(),
    parentTimeline: createLinearSolveTutorialCardFrameSampler().parentTimeline,
    exportKind: "gif",
    frameCount: 5
  });
  const sequence = sampleKpTutorialProgrammingFramesForExport({
    contract,
    programmingSample: createAdditionProgrammingExecutionTraceTutorialCardSample()
  });

  assert.equal(sequence.contractId, contract.id);
  assert.equal(sequence.artifactId, "artifact.linear-solve.gif");
  assert.equal(
    sequence.programmingSampleId,
    "tutorial.programming.add.execution-trace.card.live-sample"
  );
  assert.equal(
    sequence.programmingManifestId,
    "tutorial.programming.add.execution-trace.card"
  );
  assert.equal(sequence.timelineId, "timeline.linear-solve.shared");
  assert.equal(sequence.sharedClockId, "clock.programming.add-demo");
  assert.equal(sequence.frameCount, 5);
  assert.deepEqual(sequence.diagnostics, []);
  assert.deepEqual(
    sequence.frames.map((frame) => [
      frame.samplePointId,
      frame.index,
      frame.progress,
      frame.beat,
      frame.programmingFrame.sourceFrame.progress,
      frame.programmingFrame.traceFrame.stepId
    ]),
    [
      ["frame.timeline-linear-solve-shared.0000", 0, 0, 0, 0, "step.programming.add.call"],
      ["frame.timeline-linear-solve-shared.0001", 1, 0.25, 12.5, 0.25, "step.programming.add.call"],
      ["frame.timeline-linear-solve-shared.0002", 2, 0.5, 25, 0.5, "step.programming.add.evaluate-return"],
      ["frame.timeline-linear-solve-shared.0003", 3, 0.75, 37.5, 0.75, "step.programming.add.return"],
      ["frame.timeline-linear-solve-shared.0004", 4, 1, 50, 1, "step.programming.add.output"]
    ]
  );
  assert.deepEqual(
    sequence.frames[3]?.programmingFrame.traceFrame.activeSelectorIds,
    ["selector.programming.add.return"]
  );
  assert.deepEqual(
    sequence.rewindFrames.map((frame) => frame.index),
    [4, 3, 2, 1, 0]
  );
  assert.strictEqual(sequence.rewindFrames[2], sequence.frames[2]);
});
