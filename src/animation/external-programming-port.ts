import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpExternalAnimationPort,
  type KpExternalAnimationPort,
  type KpExternalAnimationPortImportResult
} from "./external-port.ts";
import {
  createProgramTraceAnimationAsset
} from "./programming-adapter.ts";
import type {
  KpPortDiagnostic
} from "../semantic/asset-port.ts";
import {
  createAdditionProgrammingExecutionTraceFixture
} from "../domain-ir/programming-addition-trace-fixture.ts";
import type {
  KpProgrammingExecutionTrace,
  KpProgrammingExecutionTraceStackFrame,
  KpProgrammingExecutionTraceStep
} from "../domain-ir/programming-execution-trace.ts";

export interface CreateProgrammingTraceExternalAnimationPortInput {
  readonly id: string;
  readonly title: string;
  readonly sourceSystem?: string | undefined;
  readonly version?: string | undefined;
  readonly expectedTrace: KpProgrammingExecutionTrace;
  readonly createAnimation: () => KpAnimationAsset;
}

export function createAdditionProgramTraceExternalAnimationPort():
  KpExternalAnimationPort<KpProgrammingExecutionTrace> {
  const fixture = createAdditionProgrammingExecutionTraceFixture();

  return createProgrammingTraceExternalAnimationPort({
    id: "port.animation.fixture.programming-trace.add",
    title: "Addition program trace animation port",
    expectedTrace: fixture.trace,
    createAnimation: createProgramTraceAnimationAsset
  });
}

export function createProgrammingTraceExternalAnimationPort(
  input: CreateProgrammingTraceExternalAnimationPortInput
): KpExternalAnimationPort<KpProgrammingExecutionTrace> {
  return createKpExternalAnimationPort({
    id: input.id,
    title: input.title,
    sourceSystem: input.sourceSystem ?? "fixture.programming.execution-trace",
    version: input.version ?? "0.1.0",
    preservation: "strict",
    importAnimation: (trace) => importProgrammingTraceAnimation(input, trace)
  });
}

function importProgrammingTraceAnimation(
  input: CreateProgrammingTraceExternalAnimationPortInput,
  trace: KpProgrammingExecutionTrace
): KpExternalAnimationPortImportResult {
  const diagnostics = validateProgrammingTraceShape(
    trace,
    input.expectedTrace
  );
  const sourceSystem = input.sourceSystem ?? "fixture.programming.execution-trace";

  return {
    animation: createImportedTraceAnimation({
      base: input.createAnimation(),
      sourcePortId: input.id,
      sourceSystem,
      sourceTraceId: trace.traceId
    }),
    preservation: diagnostics.length === 0 ? "strict" : "lax",
    diagnostics
  };
}

interface CreateImportedTraceAnimationInput {
  readonly base: KpAnimationAsset;
  readonly sourcePortId: string;
  readonly sourceSystem: string;
  readonly sourceTraceId: string;
}

function createImportedTraceAnimation(
  input: CreateImportedTraceAnimationInput
): KpAnimationAsset {
  return createKpAnimationAsset({
    id: input.base.id,
    title: input.base.title,
    bundle: input.base.bundle,
    transformations: input.base.transformations,
    transformationTree: input.base.transformationTree,
    timeline: input.base.timeline,
    layout: input.base.layout,
    renderTargets: input.base.renderTargets,
    checks: input.base.checks,
    exportTargets: input.base.exportTargets,
    dashboard: input.base.dashboard,
    metadata: {
      ...(input.base.metadata ?? {}),
      sourcePortId: input.sourcePortId,
      sourceSystem: input.sourceSystem,
      sourceTraceId: input.sourceTraceId
    }
  });
}

function validateProgrammingTraceShape(
  trace: KpProgrammingExecutionTrace,
  expected: KpProgrammingExecutionTrace
): readonly KpPortDiagnostic[] {
  const diagnostics: KpPortDiagnostic[] = [];

  if (trace.sourceFileId !== expected.sourceFileId) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-source-file-mismatch",
      lossKind: "partial",
      message:
        `Programming trace source file ${trace.sourceFileId} does not match expected ${expected.sourceFileId}.`,
      path: "sourceFileId"
    });
  }

  if (trace.sharedClockId !== expected.sharedClockId) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-clock-mismatch",
      lossKind: "partial",
      message:
        `Programming trace clock ${trace.sharedClockId} does not match expected ${expected.sharedClockId}.`,
      path: "sharedClockId"
    });
  }

  if (trace.steps.length !== expected.steps.length) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-step-count-mismatch",
      lossKind: "partial",
      message:
        `Expected ${expected.steps.length} programming trace steps but received ${trace.steps.length}.`,
      path: "steps"
    });
  }

  expected.steps.forEach((expectedStep, index) => {
    const step = trace.steps[index];

    if (step === undefined) {
      diagnostics.push({
        severity: "warning",
        code: "programming-trace-step-missing",
        lossKind: "partial",
        message:
          `Programming trace is missing expected step ${expectedStep.stepId}.`,
        path: `steps[${index}]`
      });
      return;
    }

    validateProgrammingTraceStep(step, expectedStep, index, diagnostics);
  });

  return diagnostics;
}

function validateProgrammingTraceStep(
  step: KpProgrammingExecutionTraceStep,
  expectedStep: KpProgrammingExecutionTraceStep,
  index: number,
  diagnostics: KpPortDiagnostic[]
): void {
  if (step.stepId !== expectedStep.stepId) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-step-id-mismatch",
      lossKind: "lossy",
      message:
        `Programming trace step ${step.stepId} does not match expected ${expectedStep.stepId}.`,
      path: `steps[${index}].stepId`
    });
  }

  if (step.kind !== expectedStep.kind) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-step-kind-mismatch",
      lossKind: "lossy",
      message:
        `Programming trace step ${step.stepId} kind ${step.kind} does not match expected ${expectedStep.kind}.`,
      path: `steps[${index}].kind`
    });
  }

  if (Math.abs(step.progress - expectedStep.progress) > 0.000001) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-progress-mismatch",
      lossKind: "approximate",
      message:
        `Programming trace step ${step.stepId} progress ${step.progress} does not match expected ${expectedStep.progress}.`,
      path: `steps[${index}].progress`
    });
  }

  if (!stringListsEqual(step.selectorIds, expectedStep.selectorIds)) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-selector-mismatch",
      lossKind: "partial",
      message:
        `Programming trace step ${step.stepId} selectors ${formatStringList(step.selectorIds)} do not match expected ${formatStringList(expectedStep.selectorIds)}.`,
      path: `steps[${index}].selectorIds`
    });
  }

  validateProgrammingTraceStack(step, expectedStep, index, diagnostics);
}

function validateProgrammingTraceStack(
  step: KpProgrammingExecutionTraceStep,
  expectedStep: KpProgrammingExecutionTraceStep,
  stepIndex: number,
  diagnostics: KpPortDiagnostic[]
): void {
  if (step.stack.length !== expectedStep.stack.length) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-stack-count-mismatch",
      lossKind: "partial",
      message:
        `Programming trace step ${step.stepId} stack depth ${step.stack.length} does not match expected ${expectedStep.stack.length}.`,
      path: `steps[${stepIndex}].stack`
    });
  }

  expectedStep.stack.forEach((expectedFrame, frameIndex) => {
    const frame = step.stack[frameIndex];

    if (frame === undefined) {
      return;
    }

    validateProgrammingTraceStackFrame(
      frame,
      expectedFrame,
      step.stepId,
      stepIndex,
      frameIndex,
      diagnostics
    );
  });
}

function validateProgrammingTraceStackFrame(
  frame: KpProgrammingExecutionTraceStackFrame,
  expectedFrame: KpProgrammingExecutionTraceStackFrame,
  stepId: string,
  stepIndex: number,
  frameIndex: number,
  diagnostics: KpPortDiagnostic[]
): void {
  if (frame.frameId !== expectedFrame.frameId) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-stack-frame-id-mismatch",
      lossKind: "lossy",
      message:
        `Programming trace step ${stepId} stack frame ${frame.frameId} does not match expected ${expectedFrame.frameId}.`,
      path: `steps[${stepIndex}].stack[${frameIndex}].frameId`
    });
  }

  if (frame.functionName !== expectedFrame.functionName) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-stack-function-mismatch",
      lossKind: "lossy",
      message:
        `Programming trace step ${stepId} stack frame ${frame.frameId} function ${frame.functionName} does not match expected ${expectedFrame.functionName}.`,
      path: `steps[${stepIndex}].stack[${frameIndex}].functionName`
    });
  }

  if (frame.sourceFileId !== expectedFrame.sourceFileId) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-stack-source-file-mismatch",
      lossKind: "partial",
      message:
        `Programming trace step ${stepId} stack frame ${frame.frameId} source file ${frame.sourceFileId} does not match expected ${expectedFrame.sourceFileId}.`,
      path: `steps[${stepIndex}].stack[${frameIndex}].sourceFileId`
    });
  }

  if (frame.selectorId !== expectedFrame.selectorId) {
    diagnostics.push({
      severity: "warning",
      code: "programming-trace-stack-selector-mismatch",
      lossKind: "lossy",
      message:
        `Programming trace step ${stepId} stack frame ${frame.frameId} selector ${formatOptionalString(frame.selectorId)} does not match expected ${formatOptionalString(expectedFrame.selectorId)}.`,
      path: `steps[${stepIndex}].stack[${frameIndex}].selectorId`
    });
  }
}

function stringListsEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function formatStringList(values: readonly string[]): string {
  return values.length === 0 ? "<none>" : values.join(", ");
}

function formatOptionalString(value: string | undefined): string {
  return value ?? "<none>";
}
