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
  | "handoff"
  | "occluded";

export interface KpInlineStickyCueProjection {
  readonly phase: KpInlineStickyCuePhase;
  readonly opacity: number;
  readonly handoffProgress: number;
  readonly emphasis: number;
  readonly depthPx: number;
  readonly scale: number;
  readonly stageMidpointPx: number;
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
  readonly stageTopPx: number;
  readonly stageBottomPx: number;
  readonly maximumDepthPx?: number | undefined;
  readonly maximumScaleReduction?: number | undefined;
  readonly emphasisRangePx?: number | undefined;
}): KpInlineStickyCueProjection {
  const stageTop = finiteNonNegative(input.stageTopPx);
  const stageBottom = finiteNonNegative(input.stageBottomPx);
  const stageMidpoint = stageTop + Math.max(0, stageBottom - stageTop) / 2;
  const maximumDepth = Math.max(
    0,
    finiteNonNegative(input.maximumDepthPx ?? 24)
  );
  const maximumScaleReduction = clamp(
    input.maximumScaleReduction ?? 0.012,
    0,
    0.1
  );
  const emphasisRange = Math.max(
    1,
    finiteNonNegative(input.emphasisRangePx ?? 32)
  );
  const cueCenter = Number.isFinite(input.cueAnchorCenterPx)
    ? input.cueAnchorCenterPx
    : stageBottom;
  const distanceFromStageBottom = cueCenter - stageBottom;

  if (cueCenter >= stageBottom || stageMidpoint >= stageBottom) {
    return cueProjection("below", 0);
  }
  if (cueCenter <= stageMidpoint) {
    return cueProjection("occluded", 1);
  }
  const handoff = 1 - smoothstep(stageMidpoint, stageBottom, cueCenter);
  return cueProjection("handoff", handoff);

  function cueProjection(
    phase: KpInlineStickyCuePhase,
    handoffProgress: number
  ): KpInlineStickyCueProjection {
    const progress = clamp(handoffProgress, 0, 1);
    // Depth settles quickly after the punctuation point; opacity continues to
    // clear the cue through the rest of the lower-half handoff.
    const depthProgress = smoothstep(0, 0.35, progress);
    const emphasis = distanceFromStageBottom >= 0
      ? 1 - smoothstep(0, emphasisRange, distanceFromStageBottom)
      : 1 - smoothstep(
          0,
          emphasisRange * 0.4,
          -distanceFromStageBottom
        );
    return Object.freeze({
      phase,
      opacity: (1 - progress) ** 2,
      handoffProgress: progress,
      emphasis: phase === "occluded" ? 0 : clamp(emphasis, 0, 1),
      depthPx: depthProgress === 0 ? 0 : -maximumDepth * depthProgress,
      scale: 1 - maximumScaleReduction * depthProgress,
      stageMidpointPx: stageMidpoint,
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
