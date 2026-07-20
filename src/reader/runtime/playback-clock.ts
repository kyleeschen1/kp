import type { KpAnimationAsset } from "../../animation/asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "../../animation/runtime-sampler.ts";

export type KpReaderClockSource =
  | "initial"
  | "scroll"
  | "controls"
  | "autoplay"
  | "url";

export interface KpReaderClockSample {
  readonly source: KpReaderClockSource;
  readonly progress: number;
  readonly progressPermille: number;
  readonly direction: "forward" | "rewind";
  readonly sequence: number;
  readonly settled: boolean;
  readonly checkpointId?: string | undefined;
}

export type KpReaderClockListener = (sample: KpReaderClockSample) => void;

export interface KpReaderPlaybackClock {
  readonly id: string;
  readonly source: KpReaderClockSource;
  getSnapshot(): KpReaderClockSample;
  subscribe(listener: KpReaderClockListener): () => void;
  dispose(): void;
}

export function createKpReaderClockSample(input: {
  readonly source: KpReaderClockSource;
  readonly progress: number;
  readonly previousProgress?: number | undefined;
  readonly sequence?: number | undefined;
  readonly settled?: boolean | undefined;
  readonly checkpointId?: string | undefined;
}): KpReaderClockSample {
  const progress = requireProgress(input.progress);
  const previous = input.previousProgress === undefined
    ? progress
    : requireProgress(input.previousProgress);
  const sequence = input.sequence ?? 0;
  if (!Number.isInteger(sequence) || sequence < 0) {
    throw new Error("reader clock sequence must be a non-negative integer.");
  }
  const checkpointId = input.checkpointId?.trim();
  if (checkpointId !== undefined && checkpointId === "") {
    throw new Error("reader clock checkpoint id must not be empty.");
  }
  return {
    source: input.source,
    progress,
    progressPermille: Math.round(progress * 1_000),
    direction: progress < previous ? "rewind" : "forward",
    sequence,
    settled: input.settled ?? false,
    ...(checkpointId === undefined ? {} : { checkpointId })
  };
}

export function sampleKpReaderAnimationFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly clock: KpReaderClockSample;
  readonly childAnimations?: readonly KpAnimationAsset[] | undefined;
}): KpAnimationRuntimeFrame {
  return sampleKpAnimationRuntimeFrame({
    animation: input.animation,
    childAnimations: input.childAnimations,
    direction: input.clock.direction,
    progress: input.clock.progress
  });
}

function requireProgress(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("reader clock progress must be finite and between 0 and 1.");
  }
  return value;
}
