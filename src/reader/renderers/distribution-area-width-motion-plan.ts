import type {
  KpDistributionAreaMeasuredAnchor,
  KpDistributionAreaWidthLayoutSnapshot
} from "./distribution-area-layout.ts";
import type { KpIndexedProgressSchedule } from "../../animation/indexed-progress-schedule.ts";
import {
  createKpDistributionAreaTermSchedule,
  type KpDistributionAreaTermLaneId
} from "./distribution-area-term-schedule.ts";

export type KpDistributionAreaWidthTokenId = "x" | "plus" | "two";

export interface KpDistributionAreaWidthTokenPose {
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
  readonly scale: number;
}

export interface KpDistributionAreaWidthMotionPlan {
  readonly id: string;
  readonly layoutRevision: number;
  readonly scheduleId: string;
  sample(progress: number): Readonly<Record<KpDistributionAreaWidthTokenId, KpDistributionAreaWidthTokenPose>>;
}

export function createKpDistributionAreaWidthMotionPlan(
  layout: KpDistributionAreaWidthLayoutSnapshot,
  termSchedule: KpIndexedProgressSchedule<KpDistributionAreaTermLaneId> = createKpDistributionAreaTermSchedule()
): KpDistributionAreaWidthMotionPlan {
  return {
    id: `motion-plan.distribution-area-width.r${layout.revision}`,
    layoutRevision: layout.revision,
    scheduleId: termSchedule.id,
    sample(progressValue) {
      // The caller supplies the shared, already-eased correspondence clock so
      // algebra, labels, and the partition cannot drift through double easing.
      const progress = clamp01(progressValue);
      const lanes = termSchedule.sample(progress);
      return {
        x: travel(layout.anchor("source.x"), layout.anchor("target.x"), lanes.left, -6),
        plus: {
          ...at(layout.anchor("source.plus")),
          opacity: 1 - interval(progress, 0.18, 0.52),
          scale: lerp(1, 1.08, interval(progress, 0.18, 0.52))
        },
        two: travel(layout.anchor("source.two"), layout.anchor("target.two"), lanes.right, -6)
      };
    }
  };
}

function travel(
  from: KpDistributionAreaMeasuredAnchor,
  to: KpDistributionAreaMeasuredAnchor,
  progress: number,
  arc: number
): KpDistributionAreaWidthTokenPose {
  return {
    x: lerp(from.center.x, to.center.x, progress),
    y: lerp(from.center.y, to.center.y, progress) + arc * Math.sin(Math.PI * progress),
    opacity: 1,
    scale: 1
  };
}

function at(anchor: KpDistributionAreaMeasuredAnchor): Pick<KpDistributionAreaWidthTokenPose, "x" | "y"> {
  return { x: anchor.center.x, y: anchor.center.y };
}

function interval(value: number, start: number, end: number): number {
  return smoothstep(clamp01((value - start) / (end - start)));
}

function smoothstep(value: number): number {
  const local = clamp01(value);
  return local * local * (3 - 2 * local);
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
