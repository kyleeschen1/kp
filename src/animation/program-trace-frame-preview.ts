import {
  createProgramTraceAnimationAsset
} from "./programming-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import {
  createAdditionProgrammingExecutionTraceFixture
} from "../tutorial/programming-execution-trace-fixture.ts";
import type {
  KpProgrammingExecutionTraceFrame,
  KpProgrammingExecutionTraceLocalBinding,
  KpProgrammingExecutionTraceStackFrame,
  KpProgrammingExecutionTraceStepKind
} from "../tutorial/programming-execution-trace.ts";

export interface CreateProgramTraceFramePreviewSampleInput {
  readonly progress?: number | undefined;
}

export interface CreateProgramTraceFramePreviewDataInput {
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly traceFrame: KpProgrammingExecutionTraceFrame;
}

export interface ProgramTraceFramePreviewSample {
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly traceFrame: KpProgrammingExecutionTraceFrame;
  readonly preview: ProgramTraceFramePreviewData;
}

export interface ProgramTraceFramePreviewData {
  readonly id: string;
  readonly kind: "program-trace-frame-preview";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly traceId: string;
  readonly sourceFileId: string;
  readonly progress: number;
  readonly phaseId: string;
  readonly activeTransformationIds: readonly string[];
  readonly step: ProgramTraceFramePreviewStep;
  readonly activeSelectorIds: readonly string[];
  readonly stackFrames: readonly KpProgrammingExecutionTraceStackFrame[];
  readonly locals: readonly KpProgrammingExecutionTraceLocalBinding[];
  readonly output: readonly string[];
  readonly searchFields: readonly string[];
}

export interface ProgramTraceFramePreviewStep {
  readonly stepIndex: number;
  readonly stepId: string;
  readonly kind: KpProgrammingExecutionTraceStepKind;
  readonly summary?: string | undefined;
}

export function createProgramTraceFramePreviewSample(
  input: CreateProgramTraceFramePreviewSampleInput = {}
): ProgramTraceFramePreviewSample {
  const progress = input.progress ?? 1 / 3;
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.programming.add.preview",
    animation: createProgramTraceAnimationAsset(),
    progress
  });
  const traceFrame = createAdditionProgrammingExecutionTraceFixture().sample(
    progress
  );

  return {
    runtimeFrame,
    traceFrame,
    preview: createProgramTraceFramePreviewData({
      runtimeFrame,
      traceFrame
    })
  };
}

export function createProgramTraceFramePreviewData(
  input: CreateProgramTraceFramePreviewDataInput
): ProgramTraceFramePreviewData {
  const step = {
    stepIndex: input.traceFrame.stepIndex,
    stepId: input.traceFrame.stepId,
    kind: input.traceFrame.kind,
    ...(input.traceFrame.summary === undefined
      ? {}
      : { summary: input.traceFrame.summary })
  };

  return {
    id: `program-trace-preview.${input.runtimeFrame.id}`,
    kind: "program-trace-frame-preview",
    animationId: input.runtimeFrame.animationId,
    runtimeFrameId: input.runtimeFrame.id,
    traceId: input.traceFrame.traceId,
    sourceFileId: input.traceFrame.sourceFileId,
    progress: input.traceFrame.progress,
    phaseId: input.runtimeFrame.phase.phaseId,
    activeTransformationIds: [
      ...input.runtimeFrame.activeTransformationIds
    ],
    step,
    activeSelectorIds: [...input.traceFrame.activeSelectorIds],
    stackFrames: input.traceFrame.stack.map((frame) => ({ ...frame })),
    locals: input.traceFrame.locals.map((local) => ({ ...local })),
    output: [...input.traceFrame.output],
    searchFields: programTracePreviewSearchFields(input.runtimeFrame, input.traceFrame)
  };
}

function programTracePreviewSearchFields(
  runtimeFrame: KpAnimationRuntimeFrame,
  traceFrame: KpProgrammingExecutionTraceFrame
): readonly string[] {
  return [
    "program-trace-frame-preview",
    runtimeFrame.animationId,
    runtimeFrame.id,
    runtimeFrame.phase.phaseId,
    traceFrame.traceId,
    traceFrame.sourceFileId,
    traceFrame.stepId,
    traceFrame.kind,
    `program-trace-step:${traceFrame.stepId}`,
    `program-trace-kind:${traceFrame.kind}`,
    ...runtimeFrame.activeTransformationIds.map(
      (id) => `program-transform:${id}`
    ),
    ...traceFrame.activeSelectorIds.map(
      (id) => `program-active-selector:${id}`
    ),
    ...traceFrame.stack.flatMap((frame) => [
      frame.frameId,
      frame.functionName,
      `program-stack:${frame.functionName}`,
      frame.selectorId ?? ""
    ]),
    ...traceFrame.locals.flatMap((local) => [
      local.name,
      local.value,
      local.type ?? "",
      `program-local:${local.name}=${local.value}`
    ]),
    ...traceFrame.output.map((value) => `program-output:${value}`)
  ].filter((value) => value.length > 0);
}
