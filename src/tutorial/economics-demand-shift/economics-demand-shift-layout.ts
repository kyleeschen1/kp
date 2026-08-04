import type { KpTutorialMotionCorridor } from "../kp-tutorial-motion.ts";

export type KpEconomicsDemandShiftPresentationLayout =
  | "split"
  | "inline-sticky"
  | "two-column-scroll";

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
const twoColumnScrollLayoutQueryValue = "two-column-scroll";

export function readKpEconomicsDemandShiftPresentationLayout(
  search: string
): KpEconomicsDemandShiftPresentationLayout {
  const value = new URLSearchParams(search).get("layout");
  return value === inlineStickyLayoutQueryValue
    ? "inline-sticky"
    : value === twoColumnScrollLayoutQueryValue
      ? "two-column-scroll"
      : "split";
}

export function projectKpTwoColumnScrollCard(input: {
  readonly cardTopPx: number;
  readonly viewportHeightPx: number;
}): KpInlineStickyParagraphProjection {
  const viewportHeight = finitePositive(input.viewportHeightPx, 640);
  const cardTop = Number.isFinite(input.cardTopPx)
    ? input.cardTopPx
    : viewportHeight;
  const travel = clamp((viewportHeight - cardTop) / viewportHeight, 0, 1);
  return Object.freeze({
    phase: cardTop >= viewportHeight
      ? "below"
      : cardTop > 0
        ? "crossing"
        : "passed",
    travel,
    crossingProgress: travel,
    // The shared attention frame sorts this value by distance from its
    // ownership threshold. For this candidate that threshold is viewport top.
    distanceFromStageBottomPx: cardTop
  });
}

export function projectKpTwoColumnScrollMotionCorridor(input: {
  readonly corridor: KpTutorialMotionCorridor;
}): KpTutorialMotionCorridor {
  const keyframes = input.corridor.keyframes;
  const firstProgress = keyframes[0]?.progress ?? 0;
  const finalProgress = keyframes.at(-1)?.progress ?? firstProgress;
  const firstChangingIndex = keyframes.findIndex(
    ({ progress }) => Math.abs(progress - firstProgress) > Number.EPSILON
  );
  let lastChangingIndex = -1;
  for (let index = keyframes.length - 1; index >= 0; index -= 1) {
    if (
      Math.abs(keyframes[index]!.progress - finalProgress) > Number.EPSILON
    ) {
      lastChangingIndex = index;
      break;
    }
  }
  const authoredMotionStart = firstChangingIndex <= 0
    ? 0
    : keyframes[firstChangingIndex - 1]!.travel;
  const authoredMotionEnd = lastChangingIndex < 0 ||
      lastChangingIndex >= keyframes.length - 1
    ? 1
    : keyframes[lastChangingIndex + 1]!.travel;
  const authoredMotionSpan = Math.max(
    Number.EPSILON,
    authoredMotionEnd - authoredMotionStart
  );
  const activeKeyframes = keyframes.filter(({ travel }) =>
    travel >= authoredMotionStart && travel <= authoredMotionEnd
  );
  const projectedKeyframes = activeKeyframes.map(({ travel, progress }) => ({
    travel: (travel - authoredMotionStart) / authoredMotionSpan,
    progress
  }));
  // This comparison mode deliberately spends the card's entire bottom-to-top
  // journey on visible choreography. The shared split and inline corridors
  // retain their independently approved entry and exit holds.
  return Object.freeze({
    ...input.corridor,
    startViewportRatio: 1,
    endViewportRatio: 0,
    keyframes: Object.freeze(projectedKeyframes.map((keyframe) =>
      Object.freeze(keyframe)
    ))
  });
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
  const firstMovingIndex = input.corridor.keyframes.findIndex(
    ({ progress }) => Math.abs(progress - firstProgress) > Number.EPSILON
  );
  const authoredMotionStart = firstMovingIndex <= 0
    ? 0
    : input.corridor.keyframes[firstMovingIndex - 1]!.travel;
  const authoredMotionSpan = Math.max(
    Number.EPSILON,
    1 - authoredMotionStart
  );
  const activeKeyframes = input.corridor.keyframes.filter(
    ({ travel }) => travel >= authoredMotionStart
  );
  const keyframes = [
    { travel: 0, progress: firstProgress },
    ...activeKeyframes.map(({ travel, progress }) => ({
      travel: crossingStart +
        ((travel - authoredMotionStart) / authoredMotionSpan) *
          (1 - crossingStart),
      progress
    }))
  ];
  // Approach now owns the original pre-motion hold. Crossing can therefore
  // begin visibly at the threshold without mutating the shared authored
  // corridor used by the approved split presentation.
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
