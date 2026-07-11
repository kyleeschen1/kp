import {
  normalizeAnimationProgress,
  type KpAnimationSampler
} from "../animation/kernel.ts";
import type {
  SourceFileObject,
  SourceRangeSelector
} from "../semantic/source-file.ts";
import {
  createAdditionProgrammingTutorialCardSample
} from "./programming-card-sample.ts";
import {
  createKpProgrammingExecutionTrace,
  createKpProgrammingExecutionTraceFrame,
  type KpProgrammingExecutionTrace,
  type KpProgrammingExecutionTraceFrame,
  type KpProgrammingExecutionTraceLocalBinding,
  type KpProgrammingExecutionTraceStackFrame,
  type KpProgrammingExecutionTraceStep
} from "./programming-execution-trace.ts";

export interface AdditionProgrammingExecutionTraceFixture
  extends KpAnimationSampler<KpProgrammingExecutionTraceFrame> {
  readonly id: "fixture.programming.add.execution-trace";
  readonly sourceFile: SourceFileObject;
  readonly selectors: readonly SourceRangeSelector[];
  readonly trace: KpProgrammingExecutionTrace;
}

export function createAdditionProgrammingExecutionTraceFixture(): AdditionProgrammingExecutionTraceFixture {
  const sample = createAdditionProgrammingTutorialCardSample();
  const signatureSelectorId = "selector.programming.add.signature";
  const returnSelectorId = "selector.programming.add.return";
  const stackFrame: KpProgrammingExecutionTraceStackFrame = {
    frameId: "frame.programming.add",
    functionName: "add",
    sourceFileId: sample.sourceFile.id,
    selectorId: signatureSelectorId
  };
  const locals: readonly KpProgrammingExecutionTraceLocalBinding[] = [
    { name: "a", value: "2", type: "number" },
    { name: "b", value: "2", type: "number" }
  ];
  const trace = createKpProgrammingExecutionTrace({
    traceId: "trace.programming.add",
    sourceFileId: sample.sourceFile.id,
    sharedClockId: sample.panel.sharedClockId,
    steps: [
      {
        stepId: "step.programming.add.call",
        kind: "call",
        progress: 0,
        summary: "Call add with two numeric arguments.",
        selectorIds: [signatureSelectorId],
        stack: [stackFrame],
        locals
      },
      {
        stepId: "step.programming.add.evaluate-return",
        kind: "evaluate",
        progress: 1 / 3,
        summary: "Evaluate the return expression.",
        selectorIds: [returnSelectorId],
        stack: [stackFrame],
        locals
      },
      {
        stepId: "step.programming.add.return",
        kind: "return",
        progress: 2 / 3,
        summary: "Return the computed value.",
        selectorIds: [returnSelectorId],
        stack: [stackFrame],
        locals: [...locals, { name: "return", value: "4", type: "number" }]
      },
      {
        stepId: "step.programming.add.output",
        kind: "output",
        progress: 1,
        summary: "Expose the final result.",
        selectorIds: [],
        stack: [],
        locals: [],
        output: ["4"]
      }
    ] satisfies readonly KpProgrammingExecutionTraceStep[]
  });

  return {
    id: "fixture.programming.add.execution-trace",
    sourceFile: sample.sourceFile,
    selectors: sample.selectors,
    trace,
    sample(progress) {
      const normalizedProgress = normalizeAnimationProgress(progress);

      return createKpProgrammingExecutionTraceFrame({
        trace,
        stepIndex: selectProgrammingExecutionTraceStepIndex(
          trace,
          normalizedProgress
        ),
        progress: normalizedProgress
      });
    }
  };
}

function selectProgrammingExecutionTraceStepIndex(
  trace: KpProgrammingExecutionTrace,
  progress: number
): number {
  let selectedIndex = 0;

  trace.steps.forEach((step, index) => {
    if (step.progress <= progress + Number.EPSILON) {
      selectedIndex = index;
    }
  });

  return selectedIndex;
}
