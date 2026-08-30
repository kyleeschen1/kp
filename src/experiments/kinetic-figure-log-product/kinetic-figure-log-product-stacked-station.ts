import {
  projectKpTutorialLocalViewportAnchor,
  type KpTutorialMotionCorridor
} from "../../tutorial/kp-tutorial-motion.ts";
import type {
  KpLogProductKineticFigureStateId
} from "./kinetic-figure-log-product-model.ts";
import {
  kpLogProductGlanceScrollytellingCorridor,
  kpLogProductGlanceScrollytellingUrlIds,
  projectKpLogProductGlanceScrollytellingEdge,
  projectKpLogProductGlanceScrollytellingNode,
  projectKpLogProductGlanceScrollytellingScroll,
  readKpLogProductGlanceScrollytellingUrlState,
  type KpLogProductGlanceScrollytellingProjection
} from "./kinetic-figure-log-product-glance-scrollytelling.ts";

export type KpLogProductStackedStationProjection =
  KpLogProductGlanceScrollytellingProjection;

/**
 * Stacked Station changes physical reading order, not the instructional arc.
 * Delegating semantic frames to the reviewed Glance projector prevents this
 * layout experiment from becoming a second salience or animation authority.
 */
export const kpLogProductStackedStationCorridor: KpTutorialMotionCorridor =
  kpLogProductGlanceScrollytellingCorridor;

export const kpLogProductStackedStationUrlIds =
  kpLogProductGlanceScrollytellingUrlIds;

/** Active prose lands just below the stage's deliberate half-screen plane. */
export const kpLogProductStackedStationReadingLineViewportRatio = 0.58;

/**
 * Dock the stage's measured bottom edge rather than assigning the stage a
 * viewport-sized height. This keeps intrinsic renderer proportions available
 * if a later caller pressures the candidate with code, graphs, or 3D.
 */
export const kpLogProductStackedStationDockAnchor = Object.freeze({
  stageLocalRatio: 1,
  viewportRatio: 0.5
});

export type KpLogProductStackedStationLifecyclePhase =
  | "approaching"
  | "docked"
  | "releasing";

export interface KpLogProductStackedStationDockProjection {
  readonly phase: KpLogProductStackedStationLifecyclePhase;
  readonly dockTopViewportY: number;
  readonly dockBottomViewportY: number;
}

export function projectKpLogProductStackedStationDock(input: {
  readonly stageViewportTop: number;
  readonly stageBlockSize: number;
  readonly viewportHeight: number;
}): KpLogProductStackedStationDockProjection {
  const anchor = projectKpTutorialLocalViewportAnchor({
    anchor: kpLogProductStackedStationDockAnchor,
    stageBlockSize: input.stageBlockSize,
    viewportHeight: input.viewportHeight
  });
  const dockTopViewportY = Math.max(16, anchor.stageTop);
  const delta = input.stageViewportTop - dockTopViewportY;
  return Object.freeze({
    phase: delta > 1
      ? "approaching"
      : delta < -1
        ? "releasing"
        : "docked",
    dockTopViewportY,
    dockBottomViewportY: dockTopViewportY + input.stageBlockSize
  });
}

export function readKpLogProductStackedStationUrlState(
  hash: string
): KpLogProductKineticFigureStateId | undefined {
  return readKpLogProductGlanceScrollytellingUrlState(hash);
}

export function projectKpLogProductStackedStationNode(
  stateId: KpLogProductKineticFigureStateId,
  travel = 0
): KpLogProductStackedStationProjection {
  return projectKpLogProductGlanceScrollytellingNode(stateId, travel);
}

export function projectKpLogProductStackedStationScroll(input: {
  readonly scrollY: number;
  readonly landingScrollY: Readonly<
    Record<KpLogProductKineticFigureStateId, number>
  >;
  readonly transitionStartScrollY: number;
  readonly transitionEndScrollY: number;
}): KpLogProductStackedStationProjection {
  const sourceLanding = input.landingScrollY.transform;
  const targetLanding = input.landingScrollY.result;
  if (
    input.transitionStartScrollY <= sourceLanding ||
    input.transitionEndScrollY <= input.transitionStartScrollY ||
    input.transitionEndScrollY >= targetLanding
  ) {
    throw new Error(
      "Stacked Station transition must remain inside the rule-to-result edge."
    );
  }
  const physicalEdgeProgress = (input.scrollY - sourceLanding) /
    (targetLanding - sourceLanding);
  if (
    physicalEdgeProgress > 0.002 &&
    physicalEdgeProgress < 0.998
  ) {
    return projectKpLogProductGlanceScrollytellingEdge({
      sourceStateId: "transform",
      targetStateId: "result",
      progress: projectTransitionProgress(input)
    });
  }
  return projectKpLogProductGlanceScrollytellingScroll(input);
}

function projectTransitionProgress(input: {
  readonly scrollY: number;
  readonly landingScrollY: Readonly<
    Record<KpLogProductKineticFigureStateId, number>
  >;
  readonly transitionStartScrollY: number;
  readonly transitionEndScrollY: number;
}): number {
  const sourceLanding = input.landingScrollY.transform;
  const targetLanding = input.landingScrollY.result;
  if (input.scrollY <= input.transitionStartScrollY) {
    return projectRange(
      input.scrollY,
      sourceLanding,
      input.transitionStartScrollY,
      0,
      0.2
    );
  }
  if (input.scrollY <= input.transitionEndScrollY) {
    // The visible operation marker owns the armed, rewrite, and settled
    // phases. It remaps physical document travel onto the existing Glance
    // semantic edge instead of becoming a second clock.
    return projectRange(
      input.scrollY,
      input.transitionStartScrollY,
      input.transitionEndScrollY,
      0.2,
      0.8
    );
  }
  return projectRange(
    input.scrollY,
    input.transitionEndScrollY,
    targetLanding,
    0.8,
    1
  );
}

function projectRange(
  value: number,
  sourceStart: number,
  sourceEnd: number,
  targetStart: number,
  targetEnd: number
): number {
  const progress = (value - sourceStart) / (sourceEnd - sourceStart);
  return targetStart + Math.max(0, Math.min(1, progress)) *
    (targetEnd - targetStart);
}
