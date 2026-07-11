import type {
  ProgrammingExecutionTraceTutorialCardSample,
  ProgrammingExecutionTraceTutorialCardSampleFrame
} from "./programming-execution-trace-card-sample.ts";
import type {
  KpTutorialParentTimelineFrameExportContract,
  KpTutorialParentTimelineFrameExportDiagnostic,
  KpTutorialParentTimelineFrameSamplePoint
} from "./frame-export-contract.ts";

export interface SampleKpTutorialProgrammingFramesForExportInput {
  readonly contract: KpTutorialParentTimelineFrameExportContract;
  readonly programmingSample: ProgrammingExecutionTraceTutorialCardSample;
}

export interface KpTutorialProgrammingFrameExportSequence {
  readonly contractId: string;
  readonly artifactId: string;
  readonly manifestId: string;
  readonly profileId: string;
  readonly programmingSampleId: string;
  readonly programmingManifestId: string;
  readonly sharedClockId: string;
  readonly timelineId: string;
  readonly frameCount: number;
  readonly frames: readonly KpTutorialProgrammingFrameExportSample[];
  readonly rewindFrames: readonly KpTutorialProgrammingFrameExportSample[];
  readonly diagnostics: readonly KpTutorialProgrammingFrameExportDiagnostic[];
}

export interface KpTutorialProgrammingFrameExportSample {
  readonly samplePointId: string;
  readonly index: number;
  readonly progress: number;
  readonly beat: number;
  readonly elapsedMs: number;
  readonly programmingFrame: ProgrammingExecutionTraceTutorialCardSampleFrame;
}

export type KpTutorialProgrammingFrameExportDiagnostic =
  | KpTutorialParentTimelineFrameExportDiagnostic
  | {
      readonly path: string;
      readonly message: string;
    };

export function sampleKpTutorialProgrammingFramesForExport(
  input: SampleKpTutorialProgrammingFramesForExportInput
): KpTutorialProgrammingFrameExportSequence {
  const frames = input.contract.samplePoints.map((samplePoint) =>
    sampleProgrammingFrameAtPoint(input.programmingSample, samplePoint)
  );

  return {
    contractId: input.contract.id,
    artifactId: input.contract.artifact.id,
    manifestId: input.contract.manifestId,
    profileId: input.contract.profileId,
    programmingSampleId: input.programmingSample.id,
    programmingManifestId: input.programmingSample.manifestId,
    sharedClockId: input.programmingSample.sourceSample.panel.sharedClockId,
    timelineId: input.contract.timelineId,
    frameCount: input.contract.frameCount,
    frames,
    // Reuse the same sampled records so rewind is exactly the forward sequence
    // in reverse, not a second sampling pass with possible drift.
    rewindFrames: [...frames].reverse(),
    diagnostics: [
      ...input.contract.diagnostics,
      ...input.programmingSample.diagnostics.map(
        (diagnostic, index): KpTutorialProgrammingFrameExportDiagnostic => ({
          path: `programmingSample.diagnostics[${index}]`,
          message: diagnostic
        })
      )
    ]
  };
}

function sampleProgrammingFrameAtPoint(
  programmingSample: ProgrammingExecutionTraceTutorialCardSample,
  samplePoint: KpTutorialParentTimelineFrameSamplePoint
): KpTutorialProgrammingFrameExportSample {
  return {
    samplePointId: samplePoint.id,
    index: samplePoint.index,
    progress: samplePoint.progress,
    beat: samplePoint.beat,
    elapsedMs: samplePoint.elapsedMs,
    programmingFrame: programmingSample.sample(samplePoint.progress)
  };
}
