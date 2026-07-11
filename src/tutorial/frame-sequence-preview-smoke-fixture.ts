import { createLinearSolveTutorialCardManifest } from "./card-manifest.ts";
import { createLinearSolveTutorialCardFrameSampler } from "./card-frame-sampler.ts";
import { createKpTutorialEquationFrameAdapter } from "./equation-frame-adapter.ts";
import { sampleKpTutorialEquationFramesForExport } from "./equation-frame-export-sampler.ts";
import { createKpTutorialParentTimelineFrameExportContract } from "./frame-export-contract.ts";
import {
  createKpTutorialFrameSequenceArtifact,
  type KpTutorialFrameSequenceArtifact
} from "./frame-sequence-artifact.ts";
import { renderKpTutorialFrameSequencePreviewHtml } from "./frame-sequence-preview.ts";
import { createKpTutorialGraphFrameAdapter } from "./graph-frame-adapter.ts";
import { sampleKpTutorialGraphFramesForExport } from "./graph-frame-export-sampler.ts";
import { createAdditionProgrammingExecutionTraceTutorialCardSample } from "./programming-execution-trace-card-sample.ts";
import { sampleKpTutorialProgrammingFramesForExport } from "./programming-frame-export-sampler.ts";

export interface LinearSolveFrameSequencePreviewSmokeFixture {
  readonly id: "fixture.linear-solve.frame-sequence-preview-smoke";
  readonly sequence: KpTutorialFrameSequenceArtifact;
  readonly html: string;
  readonly diagnostics: KpTutorialFrameSequenceArtifact["diagnostics"];
}

export function createLinearSolveFrameSequencePreviewSmokeFixture(): LinearSolveFrameSequencePreviewSmokeFixture {
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

  return {
    id: "fixture.linear-solve.frame-sequence-preview-smoke",
    sequence,
    html: renderKpTutorialFrameSequencePreviewHtml({
      sequence,
      title: "Linear Solve Frame Sequence Preview"
    }),
    diagnostics: sequence.diagnostics
  };
}
