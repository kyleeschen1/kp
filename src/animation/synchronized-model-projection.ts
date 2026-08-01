import type { ExactRationalDto } from "../../protocols/public-api.ts";
import type { KpAnimationRuntimeClock } from "./runtime-sampler.ts";

export interface KpSynchronizedModelProjectionProgressV1 {
  readonly schemaVersion: "kp.synchronized-model-projection-progress.v1";
  readonly progress: number;
  readonly presentationProgress: number;
}

export function sampleKpSynchronizedModelProjectionProgress(
  clock: KpAnimationRuntimeClock
): KpSynchronizedModelProjectionProgressV1 {
  const progress = clamp01(clock.progress);
  // Quantizing the complemented clock is the shared seek/rewind invariant;
  // domain choreography still owns every stage threshold and visual choice.
  const presentationProgress = quantize01(
    clock.direction === "forward" ? progress : 1 - progress
  );
  return Object.freeze({
    schemaVersion: "kp.synchronized-model-projection-progress.v1",
    progress,
    presentationProgress
  });
}

export function exactKpSynchronizedModelProgress(
  value: number
): ExactRationalDto {
  const denominator = 1_000_000;
  const numerator = Math.round(clamp01(value) * denominator);
  return Object.freeze({
    numerator: String(numerator),
    denominator: String(denominator)
  });
}

export function easeKpSynchronizedModelProgress(value: number): number {
  const bounded = clamp01(value);
  return bounded * bounded * (3 - 2 * bounded);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function quantize01(value: number): number {
  return Math.round(clamp01(value) * 1_000_000) / 1_000_000;
}
