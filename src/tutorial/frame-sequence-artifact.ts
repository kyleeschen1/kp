import {
  createKpTutorialCardExportArtifact,
  type KpTutorialCardExportArtifact
} from "./export-artifact.ts";
import type {
  KpTutorialEquationFrameExportSample,
  KpTutorialEquationFrameExportSequence
} from "./equation-frame-export-sampler.ts";
import type {
  KpTutorialGraphFrameExportSample,
  KpTutorialGraphFrameExportSequence
} from "./graph-frame-export-sampler.ts";
import type {
  KpTutorialParentTimelineFrameExportContract,
  KpTutorialParentTimelineFrameExportDiagnostic,
  KpTutorialParentTimelineFrameSamplePoint
} from "./frame-export-contract.ts";
import type {
  KpTutorialProgrammingFrameExportDiagnostic,
  KpTutorialProgrammingFrameExportSample,
  KpTutorialProgrammingFrameExportSequence
} from "./programming-frame-export-sampler.ts";

export type KpTutorialFrameSequenceDomain =
  | "equation"
  | "graph"
  | "programming";

export interface CreateKpTutorialFrameSequenceArtifactInput {
  readonly contract: KpTutorialParentTimelineFrameExportContract;
  readonly equationSequence: KpTutorialEquationFrameExportSequence;
  readonly graphSequence: KpTutorialGraphFrameExportSequence;
  readonly programmingSequence: KpTutorialProgrammingFrameExportSequence;
}

export interface KpTutorialFrameSequenceArtifact {
  readonly id: string;
  readonly contractId: string;
  readonly artifact: KpTutorialCardExportArtifact;
  readonly timelineId: string;
  readonly frameCount: number;
  readonly domains: readonly KpTutorialFrameSequenceDomain[];
  readonly frames: readonly KpTutorialFrameSequenceFrame[];
  readonly rewindFrameIds: readonly string[];
  readonly diagnostics: readonly KpTutorialFrameSequenceDiagnostic[];
}

export interface KpTutorialFrameSequenceFrame {
  readonly id: string;
  readonly index: number;
  readonly samplePointId: string;
  readonly progress: number;
  readonly beat: number;
  readonly elapsedMs: number;
  readonly equation?: KpTutorialEquationFrameExportSample | undefined;
  readonly graph?: KpTutorialGraphFrameExportSample | undefined;
  readonly programming?: KpTutorialProgrammingFrameExportSample | undefined;
}

export type KpTutorialFrameSequenceDiagnostic =
  | KpTutorialParentTimelineFrameExportDiagnostic
  | KpTutorialProgrammingFrameExportDiagnostic
  | {
      readonly path: string;
      readonly message: string;
    };

const frameSequenceDomains: readonly KpTutorialFrameSequenceDomain[] = [
  "equation",
  "graph",
  "programming"
];

export function createKpTutorialFrameSequenceArtifact(
  input: CreateKpTutorialFrameSequenceArtifactInput
): KpTutorialFrameSequenceArtifact {
  const frames = input.contract.samplePoints.map((samplePoint) =>
    createFrameSequenceFrame(input, samplePoint)
  );
  const artifact = createFrameSequenceExportArtifact(input.contract);

  return {
    id: `frame-sequence.${input.contract.id}`,
    contractId: input.contract.id,
    artifact,
    timelineId: input.contract.timelineId,
    frameCount: input.contract.frameCount,
    domains: frameSequenceDomains,
    frames,
    // These ids give later media encoders and rewind checks a stable reverse
    // traversal without re-sampling any domain frame.
    rewindFrameIds: frames.map((frame) => frame.id).reverse(),
    diagnostics: collectFrameSequenceDiagnostics(input)
  };
}

function createFrameSequenceExportArtifact(
  contract: KpTutorialParentTimelineFrameExportContract
): KpTutorialCardExportArtifact {
  return createKpTutorialCardExportArtifact({
    ...contract.artifact,
    id: `${contract.artifact.id}.frames`,
    artifactKind: "frame-sequence",
    payloadKind: "json-document",
    status: "renderable",
    metadata: {
      ...(contract.artifact.metadata ?? {}),
      domains: frameSequenceDomains,
      frameSequenceVersion: 1,
      sourceArtifactId: contract.artifact.id
    }
  });
}

function createFrameSequenceFrame(
  input: CreateKpTutorialFrameSequenceArtifactInput,
  samplePoint: KpTutorialParentTimelineFrameSamplePoint
): KpTutorialFrameSequenceFrame {
  const equation = input.equationSequence.frames[samplePoint.index];
  const graph = input.graphSequence.frames[samplePoint.index];
  const programming = input.programmingSequence.frames[samplePoint.index];

  return {
    id: `${frameSequenceIdPrefix(input.contract.timelineId)}.${samplePoint.index
      .toString()
      .padStart(4, "0")}`,
    index: samplePoint.index,
    samplePointId: samplePoint.id,
    progress: samplePoint.progress,
    beat: samplePoint.beat,
    elapsedMs: samplePoint.elapsedMs,
    ...(equation === undefined ? {} : { equation }),
    ...(graph === undefined ? {} : { graph }),
    ...(programming === undefined ? {} : { programming })
  };
}

function collectFrameSequenceDiagnostics(
  input: CreateKpTutorialFrameSequenceArtifactInput
): readonly KpTutorialFrameSequenceDiagnostic[] {
  return [
    ...input.contract.diagnostics,
    ...input.equationSequence.diagnostics,
    ...input.graphSequence.diagnostics,
    ...input.programmingSequence.diagnostics,
    ...validateSequenceAlignment(
      "equationSequence",
      input.contract,
      input.equationSequence
    ),
    ...validateSequenceAlignment(
      "graphSequence",
      input.contract,
      input.graphSequence
    ),
    ...validateSequenceAlignment(
      "programmingSequence",
      input.contract,
      input.programmingSequence
    )
  ];
}

interface FrameSequenceLike {
  readonly contractId: string;
  readonly timelineId: string;
  readonly frameCount: number;
}

function validateSequenceAlignment(
  path: string,
  contract: KpTutorialParentTimelineFrameExportContract,
  sequence: FrameSequenceLike
): readonly KpTutorialFrameSequenceDiagnostic[] {
  const diagnostics: KpTutorialFrameSequenceDiagnostic[] = [];

  if (sequence.contractId !== contract.id) {
    diagnostics.push({
      path: `${path}.contractId`,
      message: `Frame sequence ${path} uses ${sequence.contractId} but expected ${contract.id}.`
    });
  }

  if (sequence.timelineId !== contract.timelineId) {
    diagnostics.push({
      path: `${path}.timelineId`,
      message: `Frame sequence ${path} uses ${sequence.timelineId} but expected ${contract.timelineId}.`
    });
  }

  if (sequence.frameCount !== contract.frameCount) {
    diagnostics.push({
      path: `${path}.frameCount`,
      message: `Frame sequence ${path} has ${sequence.frameCount} frames but expected ${contract.frameCount}.`
    });
  }

  return diagnostics;
}

function frameSequenceIdPrefix(timelineId: string): string {
  return `frame-sequence.${timelineId.replaceAll(".", "-")}`;
}
