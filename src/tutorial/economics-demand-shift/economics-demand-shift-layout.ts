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
  readonly dockedTextHeightPx: number;
  readonly controlsHeightPx?: number | undefined;
}): KpInlineStickyLessonLayoutProjection {
  const width = finitePositive(input.viewportWidthPx, 320);
  const height = finitePositive(input.viewportHeightPx, 640);
  const dockedTextHeight = finiteNonNegative(input.dockedTextHeightPx);
  const controlsHeight = finiteNonNegative(input.controlsHeightPx ?? 0);
  const topInset = clamp(height * 0.04, 16, 40);
  const bottomInset = clamp(height * 0.03, 16, 32);
  const platformGaps = width <= 480 ? 24 : 32;
  const availableHeight = Math.max(
    0,
    height - topInset - bottomInset - platformGaps
  );
  const minimumStageHeight = width <= 480 ? 208 : 240;
  const preferredStageHeight = clamp(
    height * (width <= 480 ? 0.42 : 0.48),
    minimumStageHeight,
    width <= 480 ? 360 : 432
  );
  const stageBudget = availableHeight - dockedTextHeight - controlsHeight;

  // Typography remains authoritative. When a readable paragraph and the
  // minimum useful diagram cannot coexist, the scene returns to document flow.
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

function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
