import type {
  KpTutorialGraphFrame,
  KpTutorialGraphFrameAdapter
} from "./graph-frame-adapter.ts";
import type {
  KpTutorialParentTimelineFrameExportContract,
  KpTutorialParentTimelineFrameExportDiagnostic,
  KpTutorialParentTimelineFrameSamplePoint
} from "./frame-export-contract.ts";

export interface SampleKpTutorialGraphFramesForExportInput {
  readonly contract: KpTutorialParentTimelineFrameExportContract;
  readonly graphAdapter: KpTutorialGraphFrameAdapter;
}

export interface KpTutorialGraphFrameExportSequence {
  readonly contractId: string;
  readonly artifactId: string;
  readonly manifestId: string;
  readonly profileId: string;
  readonly panelId: string;
  readonly graphId: string;
  readonly timelineId: string;
  readonly frameCount: number;
  readonly frames: readonly KpTutorialGraphFrameExportSample[];
  readonly rewindFrames: readonly KpTutorialGraphFrameExportSample[];
  readonly diagnostics: readonly KpTutorialParentTimelineFrameExportDiagnostic[];
}

export interface KpTutorialGraphFrameExportSample {
  readonly samplePointId: string;
  readonly index: number;
  readonly progress: number;
  readonly beat: number;
  readonly elapsedMs: number;
  readonly graphFrame: KpTutorialGraphFrame;
}

export function sampleKpTutorialGraphFramesForExport(
  input: SampleKpTutorialGraphFramesForExportInput
): KpTutorialGraphFrameExportSequence {
  const frames = input.contract.samplePoints.map((samplePoint) =>
    sampleGraphFrameAtPoint(input.graphAdapter, samplePoint)
  );

  return {
    contractId: input.contract.id,
    artifactId: input.contract.artifact.id,
    manifestId: input.contract.manifestId,
    profileId: input.contract.profileId,
    panelId: input.graphAdapter.panelId,
    graphId: input.graphAdapter.graphId,
    timelineId: input.contract.timelineId,
    frameCount: input.contract.frameCount,
    frames,
    // Reuse the same sampled records so rewind is exactly the forward sequence
    // in reverse, not a second sampling pass with possible drift.
    rewindFrames: [...frames].reverse(),
    diagnostics: input.contract.diagnostics
  };
}

function sampleGraphFrameAtPoint(
  graphAdapter: KpTutorialGraphFrameAdapter,
  samplePoint: KpTutorialParentTimelineFrameSamplePoint
): KpTutorialGraphFrameExportSample {
  return {
    samplePointId: samplePoint.id,
    index: samplePoint.index,
    progress: samplePoint.progress,
    beat: samplePoint.beat,
    elapsedMs: samplePoint.elapsedMs,
    graphFrame: graphAdapter.sample(samplePoint.progress)
  };
}
