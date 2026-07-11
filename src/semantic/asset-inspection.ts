import {
  sampleKpBehavior,
  type KpBehavior
} from "./asset-behavior.ts";

export interface InspectKpBehaviorAtInput<TFrame> {
  readonly behavior: KpBehavior<TFrame>;
  readonly timeMs: number;
  readonly phaseId?: ((frame: TFrame) => string | undefined) | undefined;
  readonly activeTransformationIds?:
    | ((frame: TFrame) => readonly string[])
    | undefined;
  readonly activeSelectorIds?: ((frame: TFrame) => readonly string[]) | undefined;
}

export interface KpBehaviorInspection<TFrame> {
  readonly behaviorId: string;
  readonly timeMs: number;
  readonly progress: number;
  readonly phaseId?: string | undefined;
  readonly activeTransformationIds: readonly string[];
  readonly activeSelectorIds: readonly string[];
  readonly frame: TFrame;
}

export function inspectKpBehaviorAt<TFrame>(
  input: InspectKpBehaviorAtInput<TFrame>
): KpBehaviorInspection<TFrame> {
  const timeMs = clamp(input.timeMs, 0, input.behavior.durationMs);
  const frame = sampleKpBehavior(input.behavior, timeMs);
  const phaseId = input.phaseId?.(frame);

  return {
    behaviorId: input.behavior.id,
    timeMs,
    progress: timeMs / input.behavior.durationMs,
    ...(phaseId === undefined ? {} : { phaseId }),
    activeTransformationIds: [...(input.activeTransformationIds?.(frame) ?? [])],
    activeSelectorIds: [...(input.activeSelectorIds?.(frame) ?? [])],
    frame
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}
