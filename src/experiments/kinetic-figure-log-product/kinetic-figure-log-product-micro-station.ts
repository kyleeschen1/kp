import {
  projectKpTutorialCorridorTravel,
  type KpTutorialMotionCorridor
} from "../../tutorial/kp-tutorial-motion.ts";
import type {
  KpLogProductKineticFigureStateId
} from "./kinetic-figure-log-product-model.ts";

export type KpLogProductMicroStationPhase =
  | "read"
  | "locate"
  | "rewrite"
  | "inspect"
  | "settle";

export interface KpLogProductMicroStationProjection {
  readonly travel: number;
  readonly animationProgress: number;
  readonly stateId: KpLogProductKineticFigureStateId;
  readonly phase: KpLogProductMicroStationPhase;
}

const wholeEndTravel = 0.16;
const productEndTravel = 0.34;
const rewriteEndTravel = 0.72;
const inspectEndTravel = 0.84;

/**
 * Physical travel is presentation policy for this exemplar. Plateaus make the
 * two source-reading beats and the native target available without inventing
 * time-based pauses or changing the canonical log-product motion plan.
 */
export const kpLogProductMicroStationCorridor: KpTutorialMotionCorridor =
  Object.freeze({
    startViewportRatio: 0.18,
    endViewportRatio: -0.72,
    keyframes: Object.freeze([
      Object.freeze({ travel: 0, progress: 0 }),
      Object.freeze({ travel: productEndTravel, progress: 0 }),
      Object.freeze({ travel: rewriteEndTravel, progress: 1 }),
      Object.freeze({ travel: 1, progress: 1 })
    ])
  });

export const kpLogProductMicroStationCanonicalTravel: Readonly<
  Record<KpLogProductKineticFigureStateId, number>
> = Object.freeze({
  whole: 0.08,
  product: 0.25,
  transform: 0.78,
  result: 0.92
});

export function projectKpLogProductMicroStation(
  inputTravel: number
): KpLogProductMicroStationProjection {
  const travel = Number.isFinite(inputTravel)
    ? Math.max(0, Math.min(1, inputTravel))
    : 0;
  const animationProgress = projectKpTutorialCorridorTravel(
    kpLogProductMicroStationCorridor,
    travel
  );
  const stateId = travel < wholeEndTravel
    ? "whole" as const
    : travel < productEndTravel
      ? "product" as const
      : travel < inspectEndTravel
        ? "transform" as const
        : "result" as const;
  const phase = stateId === "whole"
    ? "read" as const
    : stateId === "product"
      ? "locate" as const
      : stateId === "result"
        ? "settle" as const
        : animationProgress < 1
          ? "rewrite" as const
          : "inspect" as const;
  return Object.freeze({
    travel,
    animationProgress,
    stateId,
    phase
  });
}
