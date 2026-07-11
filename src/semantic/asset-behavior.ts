export interface KpSampleContext {
  readonly timeMs: number;
  readonly progress: number;
}

export interface KpBehavior<TFrame> {
  readonly id: string;
  readonly durationMs: number;
  sample(context: KpSampleContext): TFrame;
}

export interface CreateKpBehaviorInput<TFrame> {
  readonly id: string;
  readonly durationMs: number;
  readonly sample: (context: KpSampleContext) => TFrame;
}

export interface ReparameterizeKpBehaviorInput {
  readonly id: string;
  readonly durationMs: number;
}

export function createKpBehavior<TFrame>(
  input: CreateKpBehaviorInput<TFrame>
): KpBehavior<TFrame> {
  assertNonEmpty(input.id, "Behavior id");
  assertPositiveDuration(input.durationMs, `Behavior ${input.id}`);

  return {
    id: input.id,
    durationMs: input.durationMs,
    sample: input.sample
  };
}

export function sampleKpBehavior<TFrame>(
  behavior: KpBehavior<TFrame>,
  timeMs: number
): TFrame {
  const clampedTimeMs = clamp(timeMs, 0, behavior.durationMs);

  return behavior.sample({
    timeMs: clampedTimeMs,
    progress: clampedTimeMs / behavior.durationMs
  });
}

export function sampleKpBehaviorAtProgress<TFrame>(
  behavior: KpBehavior<TFrame>,
  progress: number
): TFrame {
  return sampleKpBehavior(behavior, clamp(progress, 0, 1) * behavior.durationMs);
}

export function reparameterizeKpBehavior<TFrame>(
  behavior: KpBehavior<TFrame>,
  input: ReparameterizeKpBehaviorInput
): KpBehavior<TFrame> {
  assertNonEmpty(input.id, "Behavior id");
  assertPositiveDuration(input.durationMs, `Behavior ${input.id}`);

  return createKpBehavior({
    id: input.id,
    durationMs: input.durationMs,
    sample: ({ progress }) =>
      sampleKpBehavior(behavior, progress * behavior.durationMs)
  });
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function assertPositiveDuration(durationMs: number, label: string): void {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error(`${label} durationMs must be positive.`);
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
