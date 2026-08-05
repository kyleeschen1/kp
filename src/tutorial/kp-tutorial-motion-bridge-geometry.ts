import type {
  KpTutorialMotionBridgeDistancePreset
} from "./kp-tutorial-motion-bridge-authoring.ts";
import {
  projectKpTutorialUsableViewport,
  projectKpTutorialViewportAnchors,
  type KpTutorialUsableViewportProjection
} from "./kp-tutorial-usable-viewport.ts";

export interface KpTutorialProseMotionTimingRatios {
  readonly ordinaryBeatApproachRatio: number;
  readonly bridgeDistanceRatios: Readonly<
    Record<KpTutorialMotionBridgeDistancePreset, number>
  >;
}

export interface KpTutorialProseMotionGeometry {
  readonly viewport: KpTutorialUsableViewportProjection;
  readonly readingAnchorPx: number;
  readonly ordinaryBeatApproachDistancePx: number;
  readonly bridgeDistancePx: Readonly<
    Record<KpTutorialMotionBridgeDistancePreset, number>
  >;
}

/**
 * Motion timing is derived from the same chrome-safe viewport used by the
 * tutorial latch. This keeps headers from creating a second scroll coordinate
 * system or a second set of route-specific offsets.
 */
export function projectKpTutorialProseMotionGeometry(input: {
  readonly viewportHeightPx: number;
  readonly persistentTopInsetPx?: number | undefined;
  readonly persistentBottomInsetPx?: number | undefined;
  readonly readingAnchorRatio?: number | undefined;
  readonly timing: KpTutorialProseMotionTimingRatios;
}): KpTutorialProseMotionGeometry {
  const viewport = projectKpTutorialUsableViewport(input);
  const anchors = projectKpTutorialViewportAnchors({
    viewport,
    textRatio: input.readingAnchorRatio
  });
  const ordinaryBeatApproachRatio = positiveRatio(
    input.timing.ordinaryBeatApproachRatio,
    "ordinary beat approach"
  );
  const bridgeDistanceRatios = Object.freeze({
    short: positiveRatio(
      input.timing.bridgeDistanceRatios.short,
      "short bridge distance"
    ),
    standard: positiveRatio(
      input.timing.bridgeDistanceRatios.standard,
      "standard bridge distance"
    ),
    extended: positiveRatio(
      input.timing.bridgeDistanceRatios.extended,
      "extended bridge distance"
    )
  });

  return Object.freeze({
    viewport,
    readingAnchorPx: anchors.textY,
    ordinaryBeatApproachDistancePx:
      viewport.heightPx * ordinaryBeatApproachRatio,
    bridgeDistancePx: Object.freeze({
      short: viewport.heightPx * bridgeDistanceRatios.short,
      standard: viewport.heightPx * bridgeDistanceRatios.standard,
      extended: viewport.heightPx * bridgeDistanceRatios.extended
    })
  });
}

export interface KpTutorialProseMotionGeometryCache {
  readonly read: () => KpTutorialProseMotionGeometry;
  readonly invalidate: () => void;
}

/** Layout/resize invalidation may measure; ordinary scroll only reads. */
export function createKpTutorialProseMotionGeometryCache(
  measure: () => KpTutorialProseMotionGeometry
): KpTutorialProseMotionGeometryCache {
  let cached: KpTutorialProseMotionGeometry | undefined;
  return Object.freeze({
    read(): KpTutorialProseMotionGeometry {
      cached ??= measure();
      return cached;
    },
    invalidate(): void {
      cached = undefined;
    }
  });
}

function positiveRatio(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0 || value > 1) {
    throw new Error(
      `Tutorial ${label} ratio must be finite and within (0, 1].`
    );
  }
  return value;
}
