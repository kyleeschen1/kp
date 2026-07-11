import type {
  KpTutorialEquationFrame,
  KpTutorialEquationFrameAdapter
} from "./equation-frame-adapter.ts";
import type {
  KpTutorialParentTimelineFrameExportContract,
  KpTutorialParentTimelineFrameExportDiagnostic,
  KpTutorialParentTimelineFrameSamplePoint
} from "./frame-export-contract.ts";

export interface SampleKpTutorialEquationFramesForExportInput {
  readonly contract: KpTutorialParentTimelineFrameExportContract;
  readonly equationAdapter: KpTutorialEquationFrameAdapter;
}

export interface KpTutorialEquationFrameExportSequence {
  readonly contractId: string;
  readonly artifactId: string;
  readonly manifestId: string;
  readonly profileId: string;
  readonly panelId: string;
  readonly timelineId: string;
  readonly frameCount: number;
  readonly frames: readonly KpTutorialEquationFrameExportSample[];
  readonly rewindFrames: readonly KpTutorialEquationFrameExportSample[];
  readonly diagnostics: readonly KpTutorialParentTimelineFrameExportDiagnostic[];
}

export interface KpTutorialEquationFrameExportSample {
  readonly samplePointId: string;
  readonly index: number;
  readonly progress: number;
  readonly beat: number;
  readonly elapsedMs: number;
  readonly equationFrame: KpTutorialEquationFrame;
}

export function sampleKpTutorialEquationFramesForExport(
  input: SampleKpTutorialEquationFramesForExportInput
): KpTutorialEquationFrameExportSequence {
  const frames = input.contract.samplePoints.map((samplePoint) =>
    sampleEquationFrameAtPoint(input.equationAdapter, samplePoint)
  );

  return {
    contractId: input.contract.id,
    artifactId: input.contract.artifact.id,
    manifestId: input.contract.manifestId,
    profileId: input.contract.profileId,
    panelId: input.equationAdapter.panelId,
    timelineId: input.contract.timelineId,
    frameCount: input.contract.frameCount,
    frames,
    // Reuse the same sampled records so rewind is exactly the forward sequence
    // in reverse, not a second sampling pass with possible drift.
    rewindFrames: [...frames].reverse(),
    diagnostics: input.contract.diagnostics
  };
}

function sampleEquationFrameAtPoint(
  equationAdapter: KpTutorialEquationFrameAdapter,
  samplePoint: KpTutorialParentTimelineFrameSamplePoint
): KpTutorialEquationFrameExportSample {
  return {
    samplePointId: samplePoint.id,
    index: samplePoint.index,
    progress: samplePoint.progress,
    beat: samplePoint.beat,
    elapsedMs: samplePoint.elapsedMs,
    equationFrame: equationAdapter.sample(samplePoint.progress)
  };
}
