import type { KpDevReviewTemporalSampleV1 } from "../../protocols/dev-review-v1.ts";

export interface KpDevReviewLiveTemporalSample
  extends Omit<KpDevReviewTemporalSampleV1, "offsetMs"> {
  readonly atMs: number;
}

export interface KpDevReviewTemporalTraceOptions {
  readonly capacity?: number;
  readonly windowMs?: number;
}

export class KpDevReviewTemporalTrace {
  readonly #capacity: number;
  readonly #windowMs: number;
  #samples: KpDevReviewLiveTemporalSample[] = [];

  constructor(options: KpDevReviewTemporalTraceOptions = {}) {
    this.#capacity = positiveInteger(options.capacity ?? 180, "capacity");
    this.#windowMs = positiveFinite(options.windowMs ?? 3_000, "windowMs");
  }

  push(sample: KpDevReviewLiveTemporalSample): void {
    if (!Number.isFinite(sample.atMs)) throw new TypeError("atMs must be finite");
    const previous = this.#samples.at(-1);
    if (previous !== undefined && sample.atMs < previous.atMs) {
      throw new RangeError("temporal samples must follow the renderer clock");
    }
    this.#samples.push({ ...sample });
    this.#trim(sample.atMs);
  }

  snapshot(capturedAtMs: number): readonly KpDevReviewTemporalSampleV1[] {
    if (!Number.isFinite(capturedAtMs)) throw new TypeError("capturedAtMs must be finite");
    const lowerBound = capturedAtMs - this.#windowMs;
    return this.#samples
      .filter((sample) => sample.atMs >= lowerBound && sample.atMs <= capturedAtMs)
      .map(({ atMs, ...sample }) => Object.freeze({
        ...sample,
        offsetMs: Math.min(0, atMs - capturedAtMs)
      }));
  }

  clear(): void {
    this.#samples = [];
  }

  #trim(latestAtMs: number): void {
    const lowerBound = latestAtMs - this.#windowMs;
    while (
      this.#samples.length > this.#capacity
      || (this.#samples[0]?.atMs ?? latestAtMs) < lowerBound
    ) {
      this.#samples.shift();
    }
  }
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 1) throw new RangeError(`${name} must be a positive integer`);
  return value;
}

function positiveFinite(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive`);
  return value;
}
