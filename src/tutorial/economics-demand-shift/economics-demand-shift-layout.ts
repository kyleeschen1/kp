export type KpEconomicsDemandShiftPresentationLayout =
  | "split"
  | "inline-sticky";

export type KpInlineStickyLessonFit =
  | "comfortable"
  | "compact"
  | "reading";

export interface KpInlineStickyLessonLayoutProjection {
  readonly fit: KpInlineStickyLessonFit;
  readonly stageHeightPx: number;
  readonly availableHeightPx: number;
}

export type KpInlineStickyCuePhase =
  | "below"
  | "approach"
  | "handoff"
  | "occluded";

export type KpInlineStickyCueStacking = "front" | "behind";

export interface KpInlineStickyCueProjection {
  readonly phase: KpInlineStickyCuePhase;
  readonly opacity: number;
  readonly handoffProgress: number;
  readonly elevationProgress: number;
  readonly depthPx: number;
  readonly scale: number;
  readonly stacking: KpInlineStickyCueStacking;
  readonly stageMidpointPx: number;
  readonly stageOcclusionPointPx: number;
  readonly distanceFromStageBottomPx: number;
}

const inlineStickyLayoutQueryValue = "inline-sticky";

export function readKpEconomicsDemandShiftPresentationLayout(
  search: string
): KpEconomicsDemandShiftPresentationLayout {
  const value = new URLSearchParams(search).get("layout");
  return value === inlineStickyLayoutQueryValue ? "inline-sticky" : "split";
}

export function projectKpInlineStickyLessonLayout(input: {
  readonly viewportWidthPx: number;
  readonly viewportHeightPx: number;
  readonly cueHeightPx: number;
}): KpInlineStickyLessonLayoutProjection {
  const width = finitePositive(input.viewportWidthPx, 320);
  const height = finitePositive(input.viewportHeightPx, 640);
  const cueHeight = finiteNonNegative(input.cueHeightPx);
  const topInset = clamp(height * 0.04, 16, 40);
  const bottomInset = clamp(height * 0.03, 16, 32);
  const availableHeight = Math.max(0, height - topInset - bottomInset);
  const minimumStageHeight = width <= 480 ? 208 : 240;
  const preferredStageHeight = clamp(
    height * (width <= 480 ? 0.42 : 0.46),
    minimumStageHeight,
    width <= 480 ? 360 : 432
  );
  const stageBudget = availableHeight - cueHeight;

  // Typography remains authoritative. The stage contracts before a complete
  // cue loses its ordinary below-stage reading position.
  if (stageBudget < minimumStageHeight) {
    return Object.freeze({
      fit: "reading",
      stageHeightPx: minimumStageHeight,
      availableHeightPx: Math.round(availableHeight)
    });
  }
  return Object.freeze({
    fit: stageBudget >= preferredStageHeight ? "comfortable" : "compact",
    stageHeightPx: Math.round(Math.min(preferredStageHeight, stageBudget)),
    availableHeightPx: Math.round(availableHeight)
  });
}

export function projectKpInlineStickyCue(input: {
  readonly cueAnchorCenterPx: number;
  readonly cueHeightPx?: number | undefined;
  readonly stageTopPx: number;
  readonly stageBottomPx: number;
  readonly viewportBottomPx?: number | undefined;
  readonly maximumElevationPx?: number | undefined;
  readonly maximumScaleIncrease?: number | undefined;
  readonly maximumDepthPx?: number | undefined;
  readonly maximumScaleReduction?: number | undefined;
}): KpInlineStickyCueProjection {
  const stageTop = finiteNonNegative(input.stageTopPx);
  const stageBottom = finiteNonNegative(input.stageBottomPx);
  const stageHeight = Math.max(0, stageBottom - stageTop);
  const stageMidpoint = stageTop + stageHeight / 2;
  const stageOcclusionPoint = stageBottom - stageHeight * 0.75;
  const maximumElevation = Math.max(
    0,
    finiteNonNegative(input.maximumElevationPx ?? 24)
  );
  const maximumScaleIncrease = clamp(
    input.maximumScaleIncrease ?? 0.012,
    0,
    0.1
  );
  const maximumDepth = Math.max(
    0,
    finiteNonNegative(input.maximumDepthPx ?? 24)
  );
  const maximumScaleReduction = clamp(
    input.maximumScaleReduction ?? 0.012,
    0,
    0.1
  );
  const cueCenter = Number.isFinite(input.cueAnchorCenterPx)
    ? input.cueAnchorCenterPx
    : stageBottom;
  const cueHeight = finiteNonNegative(input.cueHeightPx ?? 0);
  const viewportBottom = Math.max(
    stageBottom,
    finiteNonNegative(input.viewportBottomPx ?? stageBottom + stageHeight)
  );
  const liftStartCenter = viewportBottom + cueHeight / 2;
  const distanceFromStageBottom = cueCenter - stageBottom;
  const approachProgress = liftStartCenter <= stageBottom
    ? 0
    : 1 - smoothstep(stageBottom, liftStartCenter, cueCenter);

  if (cueCenter > stageBottom || stageHeight === 0) {
    return cueProjection(
      approachProgress > 0 ? "approach" : "below",
      0,
      approachProgress
    );
  }
  if (cueCenter <= stageOcclusionPoint) {
    return cueProjection("occluded", 1, 0);
  }
  const stageTraversal = clamp(
    (stageBottom - cueCenter) / stageHeight,
    0,
    0.75
  );
  return cueProjection("handoff", stageTraversal / 0.75, 0);

  function cueProjection(
    phase: KpInlineStickyCuePhase,
    handoffProgress: number,
    approachElevation: number
  ): KpInlineStickyCueProjection {
    const progress = clamp(handoffProgress, 0, 1);
    const stageTraversal = progress * 0.75;
    const descent = smoothstep(0, 0.5, stageTraversal);
    const behindProgress = smoothstep(0.5, 0.75, stageTraversal);
    const elevation = phase === "handoff"
      ? 1 - descent
      : phase === "occluded"
        ? 0
        : clamp(approachElevation, 0, 1);
    // The non-interpolable stacking switch happens only at the neutral plane;
    // transforms and opacity carry the visible approach and departure.
    const stacking: KpInlineStickyCueStacking = phase === "occluded" ||
      (phase === "handoff" && stageTraversal >= 0.5)
      ? "behind"
      : "front";
    return Object.freeze({
      phase,
      opacity: phase === "occluded" ? 0 : 1 - behindProgress,
      handoffProgress: progress,
      elevationProgress: elevation,
      depthPx: maximumElevation * elevation - maximumDepth * behindProgress,
      scale: 1 + maximumScaleIncrease * elevation -
        maximumScaleReduction * behindProgress,
      stacking,
      stageMidpointPx: stageMidpoint,
      stageOcclusionPointPx: stageOcclusionPoint,
      distanceFromStageBottomPx: distanceFromStageBottom
    });
  }
}

function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge1 <= edge0) return value >= edge1 ? 1 : 0;
  const position = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return position * position * (3 - 2 * position);
}
