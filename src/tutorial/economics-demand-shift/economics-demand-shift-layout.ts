import type { KpTutorialMotionCorridor } from "../kp-tutorial-motion.ts";

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

export type KpInlineStickyParagraphPhase =
  | "below"
  | "approach"
  | "crossing"
  | "passed";

export interface KpInlineStickyParagraphProjection {
  readonly phase: KpInlineStickyParagraphPhase;
  readonly travel: number;
  readonly crossingProgress: number;
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
  readonly proseLineHeightPx: number;
}): KpInlineStickyLessonLayoutProjection {
  const height = finitePositive(input.viewportHeightPx, 640);
  // CSS owns the initial 50vh geometry so progressive publication does not
  // shift when enhancement mounts. This projection mirrors that fixed visual
  // contract for scroll and semantic motion calculations.
  return Object.freeze({
    fit: "comfortable",
    stageHeightPx: Math.round(height * 0.5),
    availableHeightPx: Math.round(height)
  });
}

export function projectKpInlineStickyParagraph(input: {
  readonly paragraphTopPx: number;
  readonly paragraphBottomPx: number;
  readonly stageBottomPx: number;
  readonly viewportHeightPx: number;
}): KpInlineStickyParagraphProjection {
  const stageBottom = finiteNonNegative(input.stageBottomPx);
  const viewportHeight = finitePositive(input.viewportHeightPx, 640);
  const paragraphTop = Number.isFinite(input.paragraphTopPx)
    ? input.paragraphTopPx
    : viewportHeight;
  const paragraphBottom = Number.isFinite(input.paragraphBottomPx)
    ? Math.max(paragraphTop, input.paragraphBottomPx)
    : paragraphTop;
  const paragraphHeight = Math.max(1, paragraphBottom - paragraphTop);
  const travelDistance = Math.max(
    1,
    viewportHeight - stageBottom + paragraphHeight
  );
  const travel = clamp(
    (viewportHeight - paragraphTop) / travelDistance,
    0,
    1
  );
  const crossingProgress = clamp(
    (stageBottom - paragraphTop) / paragraphHeight,
    0,
    1
  );
  return Object.freeze({
    phase: paragraphTop >= viewportHeight
      ? "below"
      : paragraphTop > stageBottom
        ? "approach"
        : paragraphBottom > stageBottom
          ? "crossing"
          : "passed",
    travel,
    crossingProgress,
    distanceFromStageBottomPx: paragraphTop - stageBottom
  });
}

export function projectKpInlineStickyParagraphMotionCorridor(input: {
  readonly corridor: KpTutorialMotionCorridor;
  readonly stageBottomPx: number;
  readonly viewportHeightPx: number;
  readonly paragraphHeightPx: number;
}): KpTutorialMotionCorridor {
  const viewportHeight = finitePositive(input.viewportHeightPx, 640);
  const stageBottom = clamp(
    finiteNonNegative(input.stageBottomPx),
    1,
    viewportHeight
  );
  const paragraphHeight = finitePositive(input.paragraphHeightPx, 1);
  const totalTravel = viewportHeight - stageBottom + paragraphHeight;
  const crossingStart = clamp(
    (viewportHeight - stageBottom) / totalTravel,
    Number.EPSILON,
    1 - Number.EPSILON
  );
  const firstProgress = input.corridor.keyframes[0]?.progress ?? 0;
  const keyframes = [
    { travel: 0, progress: firstProgress },
    ...input.corridor.keyframes.map(({ travel, progress }) => ({
      travel: crossingStart + travel * (1 - crossingStart),
      progress
    }))
  ];
  // The paragraph's approach is a semantic entry hold. Its authored motion
  // then occupies exactly the distance during which the paragraph passes
  // beneath the stage, ending when the paragraph's trailing edge arrives.
  return Object.freeze({
    ...input.corridor,
    startViewportRatio: 1,
    endViewportRatio: (stageBottom - paragraphHeight) / viewportHeight,
    keyframes: Object.freeze(keyframes.map((keyframe) =>
      Object.freeze(keyframe)
    ))
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
