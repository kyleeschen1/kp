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

function clockValuesEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.000001;
}

