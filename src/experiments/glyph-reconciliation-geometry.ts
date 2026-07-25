import type {
  KpStageRelativeRect
} from "../rendering/native-katex-fragment-observer.ts";

export function directScheduleProgress(
  waypoints: readonly { readonly x: number; readonly y: number }[],
  x: number,
  y: number
): number {
  const source = waypoints[0];
  const target = waypoints.at(-1);
  if (source === undefined || target === undefined) return 1;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return 1;
  return clamp(((x - source.x) * dx + (y - source.y) * dy) / lengthSquared);
}

export function projectScheduledRect(input: {
  readonly motion: {
    readonly status: "direct" | "clearance-route" | "settle";
    readonly waypoints: readonly { readonly x: number; readonly y: number }[];
  };
  readonly sample: { readonly x: number; readonly y: number };
  readonly source: KpStageRelativeRect;
  readonly target: KpStageRelativeRect;
  readonly progress: number;
  readonly sourceViewport: { readonly width: number; readonly height: number };
  readonly targetViewport: { readonly width: number; readonly height: number };
}): KpStageRelativeRect {
  if (input.motion.status === "settle") {
    return input.progress < 1 ? input.source : input.target;
  }
  const sourcePoint = input.motion.waypoints[0]!;
  const targetPoint = input.motion.waypoints.at(-1)!;
  const scaleX = input.targetViewport.width / input.sourceViewport.width;
  const scaleY = input.targetViewport.height / input.sourceViewport.height;
  const sourceCenter = center(input.source);
  const targetCenter = center(input.target);
  const correctionX = lerp(
    sourceCenter.x - sourcePoint.x * scaleX,
    targetCenter.x - targetPoint.x * scaleX,
    input.progress
  );
  const correctionY = lerp(
    sourceCenter.y - sourcePoint.y * scaleY,
    targetCenter.y - targetPoint.y * scaleY,
    input.progress
  );
  const width = lerp(input.source.width, input.target.width, input.progress);
  const height = lerp(input.source.height, input.target.height, input.progress);
  return {
    left: input.sample.x * scaleX + correctionX - width / 2,
    top: input.sample.y * scaleY + correctionY - height / 2,
    width,
    height
  };
}

function center(rect: KpStageRelativeRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}
