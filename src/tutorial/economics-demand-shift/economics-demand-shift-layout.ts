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
  readonly paddingHeightPx: number;
  readonly approachHeightPx: number;
  readonly readingShelfHeightPx: number;
  readonly availableHeightPx: number;
}

export type KpInlineStickyCuePhase =
  | "waiting"
  | "approaching"
  | "reading"
  | "receding"
  | "occluded";

export interface KpInlineStickyCueProjection {
  readonly phase: KpInlineStickyCuePhase;
  readonly opacity: number;
  readonly focusLinePx: number;
  readonly distanceFromFocusLinePx: number;
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
  const paddingHeight = clamp(height * 0.12, 72, 128);
  const approachHeight = clamp(height * 0.18, 96, 160);
  const readingShelfHeight = clamp(height * 0.03, 20, 30);
  const availableHeight = Math.max(0, height - topInset - bottomInset);
  const minimumStageHeight = width <= 480 ? 208 : 240;
  const preferredStageHeight = clamp(
    height * (width <= 480 ? 0.42 : 0.46),
    minimumStageHeight,
    width <= 480 ? 360 : 432
  );
  const stageBudget = availableHeight - paddingHeight - cueHeight;

  // Typography remains authoritative. The stage and its attention corridor
  // contract before a readable cue is ever narrowed, clipped, or scrolled.
  if (stageBudget < minimumStageHeight) {
    return Object.freeze({
      fit: "reading",
      stageHeightPx: minimumStageHeight,
      paddingHeightPx: Math.round(paddingHeight),
      approachHeightPx: Math.round(approachHeight),
      readingShelfHeightPx: Math.round(readingShelfHeight),
      availableHeightPx: Math.round(availableHeight)
    });
  }
  return Object.freeze({
    fit: stageBudget >= preferredStageHeight ? "comfortable" : "compact",
    stageHeightPx: Math.round(Math.min(preferredStageHeight, stageBudget)),
    paddingHeightPx: Math.round(paddingHeight),
    approachHeightPx: Math.round(approachHeight),
    readingShelfHeightPx: Math.round(readingShelfHeight),
    availableHeightPx: Math.round(availableHeight)
  });
}

export function projectKpInlineStickyCue(input: {
  readonly cueAnchorTopPx: number;
  readonly stageBottomPx: number;
  readonly paddingHeightPx: number;
  readonly approachHeightPx: number;
  readonly readingShelfHeightPx: number;
  readonly waitingOpacity?: number | undefined;
}): KpInlineStickyCueProjection {
  const stageBottom = finiteNonNegative(input.stageBottomPx);
  const paddingHeight = finiteNonNegative(input.paddingHeightPx);
  const approachHeight = Math.max(1, finiteNonNegative(input.approachHeightPx));
  const shelfHeight = Math.max(
    1,
    finiteNonNegative(input.readingShelfHeightPx)
  );
  const waitingOpacity = clamp(input.waitingOpacity ?? 0.18, 0, 1);
  const focusLine = stageBottom + paddingHeight;
  const shelfTop = focusLine - shelfHeight / 2;
  const shelfBottom = focusLine + shelfHeight / 2;
  const approachEnd = shelfBottom + approachHeight;
  const cueTop = Number.isFinite(input.cueAnchorTopPx)
    ? input.cueAnchorTopPx
    : approachEnd;
  const distanceFromFocusLine = cueTop - focusLine;

  if (cueTop <= stageBottom) {
    return cueProjection("occluded", 0);
  }
  if (cueTop < shelfTop) {
    return cueProjection(
      "receding",
      smoothstep(stageBottom, shelfTop, cueTop)
    );
  }
  if (cueTop <= shelfBottom) {
    return cueProjection("reading", 1);
  }
  if (cueTop < approachEnd) {
    const approach = 1 - smoothstep(shelfBottom, approachEnd, cueTop);
    return cueProjection(
      "approaching",
      waitingOpacity + (1 - waitingOpacity) * approach
    );
  }
  return cueProjection("waiting", waitingOpacity);

  function cueProjection(
    phase: KpInlineStickyCuePhase,
    opacity: number
  ): KpInlineStickyCueProjection {
    return Object.freeze({
      phase,
      opacity: clamp(opacity, 0, 1),
      focusLinePx: focusLine,
      distanceFromFocusLinePx: distanceFromFocusLine
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
