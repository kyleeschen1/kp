import {
  KpTutorialScrollCoordinator,
  projectKpTutorialScrollFrame,
  type KpTutorialCoordinatedScrollProjection,
  type KpTutorialScrollBlockGeometry,
  type KpTutorialScrollBlockProjection,
  type KpTutorialScrollBlockRegistration,
  type KpTutorialScrollFrameProjection
} from "../kp-tutorial-motion.ts";
import type {
  KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";

export interface KpEconomicsScrollBlockGeometry
  extends KpTutorialScrollBlockGeometry<KpEconomicsMotionBlockId> {}

export interface KpEconomicsScrollBlockProjection
  extends KpTutorialScrollBlockProjection<KpEconomicsMotionBlockId> {}

export interface KpEconomicsScrollFrameProjection
  extends KpTutorialScrollFrameProjection<KpEconomicsMotionBlockId> {}

export interface KpEconomicsScrollBlockRegistration
  extends KpTutorialScrollBlockRegistration<KpEconomicsMotionBlockId> {}

export interface KpEconomicsCoordinatedScrollProjection
  extends KpTutorialCoordinatedScrollProjection<KpEconomicsMotionBlockId> {}

export function projectKpEconomicsScrollFrame(input: {
  readonly blocks: readonly KpEconomicsScrollBlockGeometry[];
  readonly viewportHeight: number;
}): KpEconomicsScrollFrameProjection {
  return projectKpTutorialScrollFrame(input);
}

export class KpEconomicsTutorialScrollCoordinator
  extends KpTutorialScrollCoordinator<KpEconomicsMotionBlockId> {
  constructor(
    view: Window,
    registrations: () => readonly KpEconomicsScrollBlockRegistration[],
    onProjection: (projection: KpEconomicsCoordinatedScrollProjection) => void
  ) {
    super(view, registrations, onProjection);
  }
}
