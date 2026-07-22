export type KpIndexedProgressStrategy =
  | { readonly kind: "parallel" }
  | { readonly kind: "sequence" }
  | { readonly kind: "stagger"; readonly overlap: number };

export interface KpIndexedProgressWindow<TId extends string> {
  readonly id: TId;
  readonly start: number;
  readonly end: number;
}

export interface KpIndexedProgressSchedule<TId extends string> {
  readonly id: string;
  readonly strategy: KpIndexedProgressStrategy;
  readonly ids: readonly TId[];
  readonly windows: readonly KpIndexedProgressWindow<TId>[];
  sample(progress: number): Readonly<Record<TId, number>>;
}

export const kpParallel = (): KpIndexedProgressStrategy => ({ kind: "parallel" });
export const kpSequence = (): KpIndexedProgressStrategy => ({ kind: "sequence" });
export const kpStagger = (overlap: number): KpIndexedProgressStrategy => ({ kind: "stagger", overlap });

export function createKpIndexedProgressSchedule<const TIds extends readonly [string, ...string[]]>(input: {
  readonly id: string;
  readonly ids: TIds;
  readonly strategy: KpIndexedProgressStrategy;
}): KpIndexedProgressSchedule<TIds[number]> {
  if (input.id.trim().length === 0) throw new Error("Indexed progress schedule id must not be empty.");
  if (new Set(input.ids).size !== input.ids.length) throw new Error("Indexed progress schedule ids must be unique.");
  if (input.strategy.kind === "stagger" && (!Number.isFinite(input.strategy.overlap) || input.strategy.overlap < 0 || input.strategy.overlap >= 1)) {
    throw new Error("Indexed progress stagger overlap must be at least zero and less than one.");
  }
  const windows = scheduleWindows(input.ids, input.strategy);
  return {
    id: input.id,
    strategy: input.strategy,
    ids: [...input.ids],
    windows,
    sample(progressValue) {
      const progress = clamp01(progressValue);
      return Object.fromEntries(windows.map((window) => [
        window.id,
        smoothstep(clamp01((progress - window.start) / (window.end - window.start)))
      ])) as Record<TIds[number], number>;
    }
  };
}

function scheduleWindows<TId extends string>(
  ids: readonly TId[],
  strategy: KpIndexedProgressStrategy
): readonly KpIndexedProgressWindow<TId>[] {
  if (strategy.kind === "parallel") return ids.map((id) => ({ id, start: 0, end: 1 }));
  const overlap = strategy.kind === "sequence" ? 0 : strategy.overlap;
  const stride = 1 - overlap;
  const duration = 1 / (1 + (ids.length - 1) * stride);
  return ids.map((id, index) => ({
    id,
    start: index * duration * stride,
    end: index * duration * stride + duration
  }));
}

function smoothstep(value: number): number {
  const local = clamp01(value);
  return local * local * (3 - 2 * local);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Indexed progress must be finite.");
  return Math.max(0, Math.min(1, value));
}
