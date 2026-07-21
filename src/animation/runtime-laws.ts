import type {
  KpAnimationAsset,
  KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";

export interface CheckKpAnimationRuntimeCompositionLawInput {
  readonly animation: KpAnimationAsset;
  readonly childAnimations: readonly KpAnimationAsset[];
  readonly progressSamples?: readonly number[] | undefined;
  readonly direction?: KpAnimationAssetTransformationTreeDirection | undefined;
}

export interface CheckKpAnimationRuntimeRewindClockLawInput {
  readonly animation: KpAnimationAsset;
  readonly childAnimations?: readonly KpAnimationAsset[] | undefined;
  readonly progressSamples?: readonly number[] | undefined;
}

export function checkKpAnimationRuntimeCompositionLaw(
  input: CheckKpAnimationRuntimeCompositionLawInput
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const progressSamples = input.progressSamples ?? [0, 0.5, 1];
  const declaredChildAnimationIds = childAnimationIdsForAnimation(
    input.animation
  );

  progressSamples.forEach((progress, sampleIndex) => {
    const frame = sampleKpAnimationRuntimeFrame({
      animation: input.animation,
      childAnimations: input.childAnimations,
      direction: input.direction,
      progress
    });

    declaredChildAnimationIds.forEach((childAnimationId) => {
      const childFrame = frame.childFrames.find(
        (candidate) => candidate.animationId === childAnimationId
      );

      if (childFrame === undefined) {
        failures.push({
          path: `samples[${sampleIndex}].childFrames[${childAnimationId}]`,
          message:
            `Animation ${input.animation.id} did not sample child animation ${childAnimationId} at progress ${frame.clock.progress}.`
        });
        return;
      }

      if (!clockValuesEqual(childFrame.frame.clock.progress, frame.clock.progress)) {
        failures.push({
          path:
            `samples[${sampleIndex}].childFrames[${childAnimationId}].clock.progress`,
          message:
            `Animation ${childAnimationId} child progress ${childFrame.frame.clock.progress} did not match parent progress ${frame.clock.progress}.`
        });
      }

      if (childFrame.frame.clock.direction !== frame.clock.direction) {
        failures.push({
          path:
            `samples[${sampleIndex}].childFrames[${childAnimationId}].clock.direction`,
          message:
            `Animation ${childAnimationId} child direction ${childFrame.frame.clock.direction} did not match parent direction ${frame.clock.direction}.`
        });
      }
    });
  });

  return {
    lawId: "animation-runtime.composition",
    passed: failures.length === 0,
    failures
  };
}

export function checkKpAnimationRuntimeRewindClockLaw(
  input: CheckKpAnimationRuntimeRewindClockLawInput
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const progressSamples = input.progressSamples ?? [0.1, 0.25, 0.5, 0.75, 0.9];

  progressSamples.forEach((rawProgress, sampleIndex) => {
    const progress = normalizeProgressSample(rawProgress);
    // Runtime progress is a seek position inside the chosen direction, so the
    // reverse of forward progress p is rewind progress 1 - p.
    const mirrorProgress = normalizeProgressSample(1 - progress);
    const forwardFrame = sampleKpAnimationRuntimeFrame({
      animation: input.animation,
      childAnimations: input.childAnimations,
      direction: "forward",
      progress
    });
    const rewindFrame = sampleKpAnimationRuntimeFrame({
      animation: input.animation,
      childAnimations: input.childAnimations,
      direction: "rewind",
      progress: mirrorProgress
    });

    checkFrameDirection({
      failures,
      frameDirection: forwardFrame.clock.direction,
      expectedDirection: "forward",
      path: `samples[${sampleIndex}].forward.clock.direction`,
      animationId: input.animation.id
    });
    checkFrameDirection({
      failures,
      frameDirection: rewindFrame.clock.direction,
      expectedDirection: "rewind",
      path: `samples[${sampleIndex}].rewind.clock.direction`,
      animationId: input.animation.id
    });
    checkFrameClockProgress({
      failures,
      progress: forwardFrame.clock.progress,
      expectedProgress: progress,
      path: `samples[${sampleIndex}].forward.clock.progress`,
      animationId: input.animation.id
    });
    checkFrameClockProgress({
      failures,
      progress: rewindFrame.clock.progress,
      expectedProgress: mirrorProgress,
      path: `samples[${sampleIndex}].rewind.clock.progress`,
      animationId: input.animation.id
    });
    checkMirroredOptionalClock({
      failures,
      left: forwardFrame.clock.beat,
      right: rewindFrame.clock.beat,
      total: forwardFrame.clock.beatCount,
      path: `samples[${sampleIndex}].clock.beat`,
      label: "beat",
      animationId: input.animation.id
    });
    checkMirroredOptionalClock({
      failures,
      left: forwardFrame.clock.elapsedMs,
      right: rewindFrame.clock.elapsedMs,
      total: forwardFrame.clock.durationMs,
      path: `samples[${sampleIndex}].clock.elapsedMs`,
      label: "elapsed time",
      animationId: input.animation.id
    });
    checkMirroredRuntimeLists({
      failures,
      left: forwardFrame.phase.nodeIds,
      right: rewindFrame.phase.nodeIds,
      path: `samples[${sampleIndex}].phase.nodeIds`,
      label: "phase node ids",
      animationId: input.animation.id
    });
    checkMirroredRuntimeLists({
      failures,
      left: forwardFrame.activeTransformationIds,
      right: rewindFrame.activeTransformationIds,
      path: `samples[${sampleIndex}].activeTransformationIds`,
      label: "active transformations",
      animationId: input.animation.id
    });
    checkMirroredRuntimeLists({
      failures,
      left: forwardFrame.selectorFrames.map((selector) => selector.id),
      right: rewindFrame.selectorFrames.map((selector) => selector.id),
      path: `samples[${sampleIndex}].selectorFrames`,
      label: "selector frames",
      animationId: input.animation.id
    });
    checkMirroredRuntimeLists({
      failures,
      left: forwardFrame.activeRenderTargets.map((target) => target.id),
      right: rewindFrame.activeRenderTargets.map((target) => target.id),
      path: `samples[${sampleIndex}].activeRenderTargets`,
      label: "active render targets",
      animationId: input.animation.id
    });
  });

  return {
    lawId: "animation-runtime.rewind-clock",
    passed: failures.length === 0,
    failures
  };
}

function childAnimationIdsForAnimation(
  animation: KpAnimationAsset
): readonly string[] {
  return uniqueStrings(
    animation.renderTargets.flatMap((target) =>
      splitMetadataIds(target.metadata?.["childAnimationId"])
    )
  );
}

function splitMetadataIds(
  value: string | number | boolean | undefined
): readonly string[] {
  return typeof value === "string"
    ? value.split(/\s+/).filter((part) => part.length > 0)
    : [];
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values));
}

function normalizeProgressSample(progress: number): number {
  if (!Number.isFinite(progress)) return 0;

  return Math.min(Math.max(progress, 0), 1);
}

function clockValuesEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.000001;
}

function stringListsEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function checkFrameDirection(input: {
  readonly failures: KpLawFailure[];
  readonly frameDirection: KpAnimationAssetTransformationTreeDirection;
  readonly expectedDirection: KpAnimationAssetTransformationTreeDirection;
  readonly path: string;
  readonly animationId: string;
}): void {
  if (input.frameDirection === input.expectedDirection) return;

  input.failures.push({
    path: input.path,
    message:
      `Animation ${input.animationId} sampled ${input.frameDirection} direction where ${input.expectedDirection} was expected.`
  });
}

function checkFrameClockProgress(input: {
  readonly failures: KpLawFailure[];
  readonly progress: number;
  readonly expectedProgress: number;
  readonly path: string;
  readonly animationId: string;
}): void {
  if (clockValuesEqual(input.progress, input.expectedProgress)) return;

  input.failures.push({
    path: input.path,
    message:
      `Animation ${input.animationId} runtime progress ${input.progress} did not match expected mirrored progress ${input.expectedProgress}.`
  });
}

function checkMirroredOptionalClock(input: {
  readonly failures: KpLawFailure[];
  readonly left: number | undefined;
  readonly right: number | undefined;
  readonly total: number | undefined;
  readonly path: string;
  readonly label: string;
  readonly animationId: string;
}): void {
  if (
    input.left === undefined ||
    input.right === undefined ||
    input.total === undefined
  ) {
    return;
  }

  if (clockValuesEqual(input.left + input.right, input.total)) return;

  input.failures.push({
    path: input.path,
    message:
      `Animation ${input.animationId} forward and rewind ${input.label} values must sum to ${input.total}.`
  });
}

function checkMirroredRuntimeLists(input: {
  readonly failures: KpLawFailure[];
  readonly left: readonly string[];
  readonly right: readonly string[];
  readonly path: string;
  readonly label: string;
  readonly animationId: string;
}): void {
  if (stringListsEqual(input.left, input.right)) return;

  input.failures.push({
    path: input.path,
    message:
      `Animation ${input.animationId} forward and mirrored rewind ${input.label} must match.`
  });
}
