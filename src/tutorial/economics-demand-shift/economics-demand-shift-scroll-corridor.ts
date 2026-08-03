import type {
  KpEconomicsMotionCorridor
} from "./economics-demand-shift-motion-blocks.ts";

export interface KpEconomicsMotionCorridorProjection {
  readonly travel: number;
  readonly progress: number;
}

export function projectKpEconomicsMotionCorridor(input: {
  readonly corridor: KpEconomicsMotionCorridor;
  readonly anchorTop: number;
  readonly viewportHeight: number;
}): KpEconomicsMotionCorridorProjection {
  const { corridor } = input;
  const viewportHeight = Number.isFinite(input.viewportHeight) &&
      input.viewportHeight > 0
    ? input.viewportHeight
    : 1;
  const start = corridor.startViewportRatio * viewportHeight;
  const end = corridor.endViewportRatio * viewportHeight;
  const span = start - end;
  const travel = span > 0 && Number.isFinite(input.anchorTop)
    ? clamp((start - input.anchorTop) / span)
    : 0;

  return Object.freeze({
    travel,
    progress: projectCorridorProgress(corridor, travel)
  });
}

export function projectKpEconomicsCorridorTravel(
  corridor: KpEconomicsMotionCorridor,
  travel: number
): number {
  return projectCorridorProgress(corridor, clamp(travel));
}

function projectCorridorProgress(
  corridor: KpEconomicsMotionCorridor,
  travel: number
): number {
  const keyframes = corridor.keyframes;
  if (keyframes.length < 2) {
    throw new Error("An economics motion corridor requires at least two keyframes.");
  }
  if (travel <= keyframes[0]!.travel) return keyframes[0]!.progress;
  for (let index = 1; index < keyframes.length; index += 1) {
    const previous = keyframes[index - 1]!;
    const next = keyframes[index]!;
    if (travel > next.travel) continue;
    const span = next.travel - previous.travel;
    if (span <= 0) {
      throw new Error("Economics motion-corridor travel must increase strictly.");
    }
    const segmentProgress = (travel - previous.travel) / span;
    return previous.progress +
      (next.progress - previous.progress) * segmentProgress;
  }
  return keyframes.at(-1)!.progress;
}

function clamp(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
