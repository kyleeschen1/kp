import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { createLinearSolveTutorialCardFrameSampler } from "../src/tutorial/card-frame-sampler.ts";
import { createKpTutorialEquationFrameAdapter } from "../src/tutorial/equation-frame-adapter.ts";
import { sampleKpTutorialEquationFramesForExport } from "../src/tutorial/equation-frame-export-sampler.ts";
import { createKpTutorialParentTimelineFrameExportContract } from "../src/tutorial/frame-export-contract.ts";
import { createKpTutorialFrameSequenceArtifact } from "../src/tutorial/frame-sequence-artifact.ts";
import { createKpTutorialGraphFrameAdapter } from "../src/tutorial/graph-frame-adapter.ts";
import { sampleKpTutorialGraphFramesForExport } from "../src/tutorial/graph-frame-export-sampler.ts";
import { createAdditionProgrammingExecutionTraceTutorialCardSample } from "../src/tutorial/programming-execution-trace-card-sample.ts";
import { sampleKpTutorialProgrammingFramesForExport } from "../src/tutorial/programming-frame-export-sampler.ts";

test("frame sequence artifact bundles equation graph and programming frames by parent-timeline index", () => {
  const cardSampler = createLinearSolveTutorialCardFrameSampler();
  const contract = createKpTutorialParentTimelineFrameExportContract({
    manifest: createLinearSolveTutorialCardManifest(),
    parentTimeline: cardSampler.parentTimeline,
    exportKind: "gif",
    frameCount: 5
  });
  const sequence = createKpTutorialFrameSequenceArtifact({
    contract,
    equationSequence: sampleKpTutorialEquationFramesForExport({
      contract,
      equationAdapter: createKpTutorialEquationFrameAdapter(cardSampler)
    }),
    graphSequence: sampleKpTutorialGraphFramesForExport({
      contract,
      graphAdapter: createKpTutorialGraphFrameAdapter(cardSampler)
    }),
    programmingSequence: sampleKpTutorialProgrammingFramesForExport({
      contract,
      programmingSample: createAdditionProgrammingExecutionTraceTutorialCardSample()
    })
  });

  assert.equal(sequence.id, "frame-sequence.frame-export.tutorial.linear-solve.card.gif");
  assert.equal(sequence.contractId, contract.id);
  assert.equal(sequence.timelineId, "timeline.linear-solve.shared");
  assert.equal(sequence.frameCount, 5);
  assert.deepEqual(sequence.domains, ["equation", "graph", "programming"]);
  assert.deepEqual(sequence.diagnostics, []);
  assert.deepEqual(sequence.artifact, {
    ...contract.artifact,
    id: "artifact.linear-solve.gif.frames",
    artifactKind: "frame-sequence",
    payloadKind: "json-document",
    status: "renderable",
    metadata: {
      ...contract.artifact.metadata,
      animationIds: ["animation.linear-solve.solve-x"],
      domains: ["equation", "graph", "programming"],
      frameSequenceVersion: 1,
      sourceArtifactId: "artifact.linear-solve.gif"
    }
  });
  assert.deepEqual(
    sequence.frames.map((frame) => [
      frame.id,
      frame.index,
      frame.progress,
      frame.equation?.equationFrame.transitionIndex,
      frame.graph?.graphFrame.graphProgress,
      frame.programming?.programmingFrame.traceFrame.stepId
    ]),
    [
      ["frame-sequence.timeline-linear-solve-shared.0000", 0, 0, 0, 0, "step.programming.add.call"],
      ["frame-sequence.timeline-linear-solve-shared.0001", 1, 0.25, 0, 0.25, "step.programming.add.call"],
      ["frame-sequence.timeline-linear-solve-shared.0002", 2, 0.5, 1, 0.5, "step.programming.add.evaluate-return"],
      ["frame-sequence.timeline-linear-solve-shared.0003", 3, 0.75, 2, 0.75, "step.programming.add.return"],
      ["frame-sequence.timeline-linear-solve-shared.0004", 4, 1, 2, 1, "step.programming.add.output"]
    ]
  );
  assert.deepEqual(sequence.rewindFrameIds, [
    "frame-sequence.timeline-linear-solve-shared.0004",
    "frame-sequence.timeline-linear-solve-shared.0003",
    "frame-sequence.timeline-linear-solve-shared.0002",
    "frame-sequence.timeline-linear-solve-shared.0001",
    "frame-sequence.timeline-linear-solve-shared.0000"
  ]);
});
