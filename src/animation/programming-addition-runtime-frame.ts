import type {
  KpAnimationAsset,
  KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import {
  kpProgrammingAdditionExemplarContract
} from "./programming-addition-exemplar-contract.ts";
import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";
import type { SourceFileObject } from "../semantic/source-file.ts";
import {
  createAdditionProgrammingExecutionTraceFixture
} from "../domain-ir/programming-addition-trace-fixture.ts";
import type {
  KpProgrammingExecutionTraceLocalBinding,
  KpProgrammingExecutionTraceStackFrame
} from "../domain-ir/programming-execution-trace.ts";

export type KpProgrammingAdditionFrameMode =
  | "animated"
  | "reduced-motion"
  | "static";

export type KpProgrammingAdditionPlaybackStatus =
  | "idle"
  | "playing"
  | "paused"
  | "complete";

export interface KpProgrammingAdditionSourceFocusFrame {
  readonly selectorId: string;
  readonly start: readonly [line: number, column: number];
  readonly end: readonly [line: number, column: number];
  readonly exactText: string;
  readonly textHash: string;
}

export interface KpProgrammingAdditionRuntimeFrame {
  readonly schemaVersion: "kp.programming-addition-runtime-frame.v1";
  readonly kind: "programming-addition-runtime-frame";
  readonly animationId: "animation.programming.add.execution-trace";
  readonly runtimeFrameId: string;
  readonly renderTargetId: string;
  readonly traceId: "trace.programming.add";
  readonly sourceFile: {
    readonly id: "source-file.programming.add";
    readonly label: string;
    readonly language: string;
    readonly path?: string | undefined;
    readonly revisionId?: string | undefined;
    readonly lines: readonly string[];
  };
  readonly timelineProgress: number;
  readonly semanticProgress: number;
  readonly stepProgress: number;
  readonly emphasisProgress: number;
  readonly stepIndex: number;
  readonly stepId: string;
  readonly stepKind: "call" | "evaluate" | "return" | "output";
  readonly summary: string;
  readonly activeSourceRanges:
    readonly KpProgrammingAdditionSourceFocusFrame[];
  readonly stack: readonly KpProgrammingExecutionTraceStackFrame[];
  readonly locals: readonly KpProgrammingExecutionTraceLocalBinding[];
  readonly output: readonly string[];
  readonly transformationId: string;
  readonly control: {
    readonly direction: KpAnimationAssetTransformationTreeDirection;
    readonly playbackStatus: KpProgrammingAdditionPlaybackStatus;
    readonly mode: KpProgrammingAdditionFrameMode;
  };
  readonly accessibleDescription: string;
}

const fixture = createAdditionProgrammingExecutionTraceFixture();

export function sampleKpProgrammingAdditionRuntimeFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly playbackStatus?: KpProgrammingAdditionPlaybackStatus | undefined;
  readonly mode?: KpProgrammingAdditionFrameMode | undefined;
}): KpProgrammingAdditionRuntimeFrame {
  assertAnimationIdentity(input.animation);
  const target = input.animation.renderTargets.find((candidate) =>
    candidate.kind === "programming" &&
    candidate.metadata?.["sourceFixtureId"] ===
      kpProgrammingAdditionExemplarContract.sourceFixtureId
  );
  if (target === undefined) {
    throw new Error(
      `Animation ${input.animation.id} lacks the contracted programming target.`
    );
  }
  const sourceFile = sourceFileValue(input.animation);
  const mode = input.mode ?? "animated";
  const semanticProgress = input.runtimeFrame.clock.direction === "rewind"
    ? 1 - input.runtimeFrame.clock.progress
    : input.runtimeFrame.clock.progress;
  const traceFrame = fixture.sample(semanticProgress);
  const stepContract = kpProgrammingAdditionExemplarContract.trace.steps[
    traceFrame.stepIndex
  ];
  if (stepContract === undefined || stepContract.stepId !== traceFrame.stepId) {
    throw new Error(
      `Trace step ${traceFrame.stepId} is outside the contracted addition story.`
    );
  }
  const stepProgress = localStepProgress(
    semanticProgress,
    traceFrame.stepIndex
  );
  const activeSourceRanges = traceFrame.activeSelectorIds.map((selectorId) =>
    sourceFocusFrame(selectorId)
  );
  const stack = traceFrame.stack.map((frame) => Object.freeze({ ...frame }));
  const locals = traceFrame.locals.map((local) => Object.freeze({ ...local }));
  const output = Object.freeze([...traceFrame.output]);
  const summary = traceFrame.summary ?? traceFrame.stepId;

  return Object.freeze({
    schemaVersion: "kp.programming-addition-runtime-frame.v1" as const,
    kind: "programming-addition-runtime-frame" as const,
    animationId: kpProgrammingAdditionExemplarContract.animationId,
    runtimeFrameId: input.runtimeFrame.id,
    renderTargetId: target.id,
    traceId: kpProgrammingAdditionExemplarContract.trace.traceId,
    sourceFile: Object.freeze({
      id: kpProgrammingAdditionExemplarContract.source.sourceFileId,
      label: sourceFile.label,
      language: sourceFile.language,
      ...(sourceFile.path === undefined ? {} : { path: sourceFile.path }),
      ...(sourceFile.revisionId === undefined
        ? {}
        : { revisionId: sourceFile.revisionId }),
      lines: Object.freeze(sourceFile.sourceText.split(/\r\n|\n|\r/u))
    }),
    timelineProgress: input.runtimeFrame.clock.progress,
    semanticProgress,
    stepProgress,
    // Reduced/static modes preserve state while removing compulsory travel.
    emphasisProgress: mode === "animated" ? stepProgress : 1,
    stepIndex: traceFrame.stepIndex,
    stepId: traceFrame.stepId,
    stepKind: traceFrame.kind,
    summary,
    activeSourceRanges: Object.freeze(activeSourceRanges),
    stack: Object.freeze(stack),
    locals: Object.freeze(locals),
    output,
    transformationId: traceFrame.stepId.replace(/^step\./u, "transform."),
    control: Object.freeze({
      direction: input.runtimeFrame.clock.direction,
      playbackStatus: input.playbackStatus ?? "idle",
      mode
    }),
    accessibleDescription: describeFrame({
      summary,
      activeSourceRanges,
      stack,
      locals,
      output
    })
  });
}

export function createKpProgrammingAdditionStaticFrame(
  animation: KpAnimationAsset
): KpProgrammingAdditionRuntimeFrame {
  return sampleKpProgrammingAdditionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction: "forward",
      progress: 1
    }),
    playbackStatus: "complete",
    mode: "static"
  });
}

export function checkKpProgrammingAdditionRuntimeLaw(input: {
  readonly animation: KpAnimationAsset;
  readonly sampleProgresses?: readonly number[] | undefined;
}): KpLawCheckResult {
  const sampleProgresses = input.sampleProgresses ?? Array.from(
    { length: 129 },
    (_, index) => index / 128
  );
  const failures: KpLawFailure[] = [];

  sampleProgresses.forEach((progress, index) => {
    const forward = sampleAt(input.animation, "forward", progress);
    const repeat = sampleAt(input.animation, "forward", progress);
    const rewind = sampleAt(input.animation, "rewind", 1 - progress);
    const reduced = sampleAt(
      input.animation,
      "forward",
      progress,
      "reduced-motion"
    );
    if (JSON.stringify(forward) !== JSON.stringify(repeat)) {
      failures.push({
        path: `samples[${index}].determinism`,
        message: "Repeated direct sampling produced different frames."
      });
    }
    if (
      JSON.stringify(semanticSnapshot(forward)) !==
        JSON.stringify(semanticSnapshot(rewind))
    ) {
      failures.push({
        path: `samples[${index}].rewind`,
        message: "Mirrored rewind did not preserve absolute trace state."
      });
    }
    if (
      JSON.stringify(semanticSnapshot(forward)) !==
        JSON.stringify(semanticSnapshot(reduced))
    ) {
      failures.push({
        path: `samples[${index}].reducedMotion`,
        message: "Reduced motion changed semantic trace state."
      });
    }
    if (forward.activeSourceRanges.some((range) =>
      !kpProgrammingAdditionExemplarContract.source.sourceRanges.some(
        ({ selectorId, textHash }) =>
          selectorId === range.selectorId && textHash === range.textHash
      )
    )) {
      failures.push({
        path: `samples[${index}].sourceFocus`,
        message: "Frame referenced source focus outside contracted provenance."
      });
    }
  });

  const staticFrame = createKpProgrammingAdditionStaticFrame(input.animation);
  const settled = sampleAt(input.animation, "forward", 1);
  if (
    JSON.stringify(semanticSnapshot(staticFrame)) !==
      JSON.stringify(semanticSnapshot(settled)) ||
    JSON.stringify(staticFrame.output) !== JSON.stringify(["4"])
  ) {
    failures.push({
      path: "staticFrame",
      message: "Static output did not preserve the exact settled trace state."
    });
  }

  return {
    lawId: "programming-runtime.addition-trace",
    passed: failures.length === 0,
    failures
  };
}

function sampleAt(
  animation: KpAnimationAsset,
  direction: KpAnimationAssetTransformationTreeDirection,
  progress: number,
  mode: KpProgrammingAdditionFrameMode = "animated"
): KpProgrammingAdditionRuntimeFrame {
  return sampleKpProgrammingAdditionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction,
      progress
    }),
    mode
  });
}

function semanticSnapshot(frame: KpProgrammingAdditionRuntimeFrame): unknown {
  return {
    semanticProgress: frame.semanticProgress,
    stepProgress: frame.stepProgress,
    stepIndex: frame.stepIndex,
    stepId: frame.stepId,
    stepKind: frame.stepKind,
    activeSourceRanges: frame.activeSourceRanges,
    stack: frame.stack,
    locals: frame.locals,
    output: frame.output,
    transformationId: frame.transformationId,
    accessibleDescription: frame.accessibleDescription
  };
}

function sourceFocusFrame(
  selectorId: string
): KpProgrammingAdditionSourceFocusFrame {
  const sourceRange = kpProgrammingAdditionExemplarContract.source.sourceRanges
    .find((candidate) => candidate.selectorId === selectorId);
  if (sourceRange === undefined) {
    throw new Error(`Programming trace references unknown selector ${selectorId}.`);
  }
  return Object.freeze({
    selectorId: sourceRange.selectorId,
    start: sourceRange.start,
    end: sourceRange.end,
    exactText: sourceRange.exactText,
    textHash: sourceRange.textHash
  });
}

function localStepProgress(progress: number, stepIndex: number): number {
  const steps = kpProgrammingAdditionExemplarContract.trace.steps;
  const start = steps[stepIndex]?.progress ?? 0;
  const end = steps[stepIndex + 1]?.progress ?? 1;
  if (end <= start) return 1;
  const normalized = Math.min(
    1,
    Math.max(0, (progress - start) / (end - start))
  );
  // Stable decimal output keeps direct seeks and UI labels free of binary drift.
  return Math.round(normalized * 1_000_000_000_000) / 1_000_000_000_000;
}

function sourceFileValue(animation: KpAnimationAsset): SourceFileObject {
  const value = animation.bundle.objects.find((object) =>
    object.id === kpProgrammingAdditionExemplarContract.source.sourceFileId
  )?.value;
  if (
    typeof value !== "object" || value === null ||
    !("type" in value) || value.type !== "source-file" ||
    !("sourceText" in value) || typeof value.sourceText !== "string" ||
    !("label" in value) || typeof value.label !== "string" ||
    !("language" in value) || typeof value.language !== "string"
  ) {
    throw new Error(
      `Animation ${animation.id} lacks the contracted SourceFile value.`
    );
  }
  return value as SourceFileObject;
}

function assertAnimationIdentity(animation: KpAnimationAsset): void {
  if (animation.id !== kpProgrammingAdditionExemplarContract.animationId) {
    throw new Error(
      `Programming addition runtime cannot sample animation ${animation.id}.`
    );
  }
}

function describeFrame(input: {
  readonly summary: string;
  readonly activeSourceRanges:
    readonly KpProgrammingAdditionSourceFocusFrame[];
  readonly stack: readonly KpProgrammingExecutionTraceStackFrame[];
  readonly locals: readonly KpProgrammingExecutionTraceLocalBinding[];
  readonly output: readonly string[];
}): string {
  const focus = input.activeSourceRanges.length === 0
    ? "No source range is active."
    : `Source focus: ${input.activeSourceRanges.map(({ exactText }) =>
        exactText
      ).join("; ")}.`;
  const stack = input.stack.length === 0
    ? "The call stack is empty."
    : `Call stack: ${input.stack.map(({ functionName }) => functionName)
        .join(", ")}.`;
  const locals = input.locals.length === 0
    ? "No local bindings remain."
    : `Locals: ${input.locals.map(({ name, value }) => `${name} = ${value}`)
        .join(", ")}.`;
  const output = input.output.length === 0
    ? "No output yet."
    : `Output: ${input.output.join(", ")}.`;
  return `${input.summary} ${focus} ${stack} ${locals} ${output}`;
}
