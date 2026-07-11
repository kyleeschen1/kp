import {
  normalizeAnimationProgress,
  type KpSampledAnimationFrame
} from "../animation/kernel.ts";

export type KpProgrammingExecutionTraceStepKind =
  | "call"
  | "evaluate"
  | "return"
  | "output";

export interface KpProgrammingExecutionTraceStackFrame {
  readonly frameId: string;
  readonly functionName: string;
  readonly sourceFileId: string;
  readonly selectorId?: string | undefined;
}

export interface KpProgrammingExecutionTraceLocalBinding {
  readonly name: string;
  readonly value: string;
  readonly type?: string | undefined;
}

export interface KpProgrammingExecutionTraceStep {
  readonly stepId: string;
  readonly kind: KpProgrammingExecutionTraceStepKind;
  readonly progress: number;
  readonly selectorIds: readonly string[];
  readonly stack: readonly KpProgrammingExecutionTraceStackFrame[];
  readonly locals: readonly KpProgrammingExecutionTraceLocalBinding[];
  readonly output?: readonly string[] | undefined;
  readonly summary?: string | undefined;
}

export interface KpProgrammingExecutionTrace {
  readonly traceId: string;
  readonly sourceFileId: string;
  readonly sharedClockId: string;
  readonly steps: readonly KpProgrammingExecutionTraceStep[];
}

export interface CreateKpProgrammingExecutionTraceInput {
  readonly traceId: string;
  readonly sourceFileId: string;
  readonly sharedClockId: string;
  readonly steps: readonly KpProgrammingExecutionTraceStep[];
}

export interface CreateKpProgrammingExecutionTraceFrameInput {
  readonly trace: KpProgrammingExecutionTrace;
  readonly stepIndex: number;
  readonly progress: number;
}

export interface KpProgrammingExecutionTraceFrame
  extends KpSampledAnimationFrame {
  readonly traceId: string;
  readonly sourceFileId: string;
  readonly sharedClockId: string;
  readonly progress: number;
  readonly stepIndex: number;
  readonly stepId: string;
  readonly kind: KpProgrammingExecutionTraceStepKind;
  readonly summary?: string | undefined;
  readonly activeSelectorIds: readonly string[];
  readonly stack: readonly KpProgrammingExecutionTraceStackFrame[];
  readonly locals: readonly KpProgrammingExecutionTraceLocalBinding[];
  readonly output: readonly string[];
}

export function createKpProgrammingExecutionTrace(
  input: CreateKpProgrammingExecutionTraceInput
): KpProgrammingExecutionTrace {
  assertNonEmpty(input.traceId, "Programming execution trace id");
  assertNonEmpty(
    input.sourceFileId,
    `Programming execution trace ${input.traceId} sourceFileId`
  );
  assertNonEmpty(
    input.sharedClockId,
    `Programming execution trace ${input.traceId} sharedClockId`
  );

  if (input.steps.length === 0) {
    throw new Error(
      `Programming execution trace ${input.traceId} must contain at least one step.`
    );
  }

  const stepIds = new Set<string>();
  let previousProgress = -Infinity;

  const steps = input.steps.map((step, index) => {
    assertNonEmpty(
      step.stepId,
      `Programming execution trace ${input.traceId} step ${index} id`
    );

    if (stepIds.has(step.stepId)) {
      throw new Error(
        `Programming execution trace ${input.traceId} has duplicate step ${step.stepId}.`
      );
    }

    stepIds.add(step.stepId);

    const progress = normalizeAnimationProgress(step.progress);

    if (progress < previousProgress) {
      throw new Error(
        `Programming execution trace ${input.traceId} step ${step.stepId} progress must not move backward.`
      );
    }

    previousProgress = progress;

    return cloneTraceStep(step, progress);
  });

  return {
    traceId: input.traceId,
    sourceFileId: input.sourceFileId,
    sharedClockId: input.sharedClockId,
    steps
  };
}

export function createKpProgrammingExecutionTraceFrame(
  input: CreateKpProgrammingExecutionTraceFrameInput
): KpProgrammingExecutionTraceFrame {
  assertNonNegativeInteger(input.stepIndex, "Programming trace step index");

  const step = input.trace.steps[input.stepIndex];

  if (step === undefined) {
    throw new Error(
      `Programming execution trace ${input.trace.traceId} does not contain step index ${input.stepIndex}.`
    );
  }

  return {
    traceId: input.trace.traceId,
    sourceFileId: input.trace.sourceFileId,
    sharedClockId: input.trace.sharedClockId,
    progress: normalizeAnimationProgress(input.progress),
    stepIndex: input.stepIndex,
    stepId: step.stepId,
    kind: step.kind,
    ...(step.summary === undefined ? {} : { summary: step.summary }),
    activeSelectorIds: [...step.selectorIds],
    stack: step.stack.map(cloneStackFrame),
    locals: step.locals.map(cloneLocalBinding),
    output: [...(step.output ?? [])]
  };
}

function cloneTraceStep(
  step: KpProgrammingExecutionTraceStep,
  progress: number
): KpProgrammingExecutionTraceStep {
  return {
    stepId: step.stepId,
    kind: step.kind,
    progress,
    selectorIds: step.selectorIds.map((selectorId) =>
      nonEmptyCopy(selectorId, `Step ${step.stepId} selectorId`)
    ),
    stack: step.stack.map(cloneStackFrame),
    locals: step.locals.map(cloneLocalBinding),
    ...(step.output === undefined ? {} : { output: [...step.output] }),
    ...(step.summary === undefined ? {} : { summary: step.summary })
  };
}

function cloneStackFrame(
  frame: KpProgrammingExecutionTraceStackFrame
): KpProgrammingExecutionTraceStackFrame {
  return {
    frameId: nonEmptyCopy(frame.frameId, "Stack frame id"),
    functionName: nonEmptyCopy(frame.functionName, "Stack frame functionName"),
    sourceFileId: nonEmptyCopy(frame.sourceFileId, "Stack frame sourceFileId"),
    ...(frame.selectorId === undefined
      ? {}
      : { selectorId: nonEmptyCopy(frame.selectorId, "Stack frame selectorId") })
  };
}

function cloneLocalBinding(
  local: KpProgrammingExecutionTraceLocalBinding
): KpProgrammingExecutionTraceLocalBinding {
  return {
    name: nonEmptyCopy(local.name, "Local binding name"),
    value: local.value,
    ...(local.type === undefined ? {} : { type: local.type })
  };
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

function nonEmptyCopy(value: string, label: string): string {
  assertNonEmpty(value, label);

  return value;
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
}
