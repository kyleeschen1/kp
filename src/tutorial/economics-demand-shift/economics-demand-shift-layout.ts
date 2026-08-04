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
  | "hold"
  | "fade"
  | "occluded";

export interface KpInlineStickyCueProjection {
  readonly phase: KpInlineStickyCuePhase;
  readonly opacity: number;
  readonly fadeProgress: number;
  readonly distanceFromHandoffThresholdPx: number;
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
  readonly cueAnchorTopPx: number;
  readonly stageTopPx: number;
  readonly stageBottomPx: number;
  readonly viewportHeightPx: number;
}): KpInlineStickyCueProjection {
  const stageTop = finiteNonNegative(input.stageTopPx);
  const stageBottom = finiteNonNegative(input.stageBottomPx);
  const stageHeight = Math.max(0, stageBottom - stageTop);
  const viewportHeight = finitePositive(input.viewportHeightPx, 640);
  const holdDistance = viewportHeight * 0.05;
  const fadeDistance = viewportHeight * 0.1;
  const fadeStart = stageBottom - holdDistance;
  const fadeEnd = fadeStart - fadeDistance;
  const cueTop = Number.isFinite(input.cueAnchorTopPx)
    ? input.cueAnchorTopPx
    : stageBottom;
  const viewportBottom = Math.max(stageBottom, viewportHeight);
  const distanceFromHandoffThreshold = cueTop - stageBottom;
  const approachProgress = viewportBottom <= stageBottom
    ? 0
    : 1 - smoothstep(stageBottom, viewportBottom, cueTop);

  if (cueTop > stageBottom || stageHeight === 0) {
    return cueProjection(
      approachProgress > 0 ? "approach" : "below",
      0
    );
  }
  if (cueTop <= fadeEnd) {
    return cueProjection("occluded", 1);
  }
  if (cueTop >= fadeStart) {
    return cueProjection("hold", 0);
  }
  return cueProjection(
    "fade",
    clamp((fadeStart - cueTop) / fadeDistance, 0, 1)
  );

  function cueProjection(
    phase: KpInlineStickyCuePhase,
    fadeProgress: number
  ): KpInlineStickyCueProjection {
    const progress = clamp(fadeProgress, 0, 1);
    const fade = smoothstep(0, 1, progress);
    return Object.freeze({
      phase,
      opacity: phase === "fade" ? 1 - fade : phase === "occluded" ? 0 : 1,
      fadeProgress: progress,
      distanceFromHandoffThresholdPx: distanceFromHandoffThreshold
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
