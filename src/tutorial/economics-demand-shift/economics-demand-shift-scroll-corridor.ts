import {
  projectKpTutorialCorridorTravel,
  projectKpTutorialMotionCorridor,
  projectKpTutorialRebasedCorridor,
  resolveKpTutorialCorridorTravelForProgress,
  type KpTutorialMotionCorridorProjection
} from "../kp-tutorial-motion.ts";
import type {
  KpEconomicsMotionCorridor
} from "./economics-demand-shift-motion-blocks.ts";

export interface KpEconomicsMotionCorridorProjection
  extends KpTutorialMotionCorridorProjection {}

export function projectKpEconomicsMotionCorridor(input: {
  readonly corridor: KpEconomicsMotionCorridor;
  readonly anchorTop: number;
  readonly viewportHeight: number;
}): KpEconomicsMotionCorridorProjection {
  return projectKpTutorialMotionCorridor(input);
}

export function projectKpEconomicsCorridorTravel(
  corridor: KpEconomicsMotionCorridor,
  travel: number
): number {
  return projectKpTutorialCorridorTravel(corridor, travel);
}

export function projectKpEconomicsRebasedCorridor(input: {
  readonly corridor: KpEconomicsMotionCorridor;
  readonly rawTravelAtTakeover: number;
  readonly manualProgress: number;
  readonly rawTravel: number;
}): KpEconomicsMotionCorridorProjection {
  return projectKpTutorialRebasedCorridor(input);
}

export function resolveKpEconomicsCorridorTravelForProgress(input: {
  readonly corridor: KpEconomicsMotionCorridor;
  readonly progress: number;
  readonly preferredTravel: number;
}): number {
  return resolveKpTutorialCorridorTravelForProgress(input);
}
