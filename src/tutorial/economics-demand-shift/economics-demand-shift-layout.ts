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

export interface KpTwoColumnScrollCardProjection
  extends KpInlineStickyParagraphProjection {
  readonly opacity: number;
  readonly ownsAttention: boolean;
}

export interface KpTwoColumnScrollSequenceProjection {
  readonly cards: readonly KpTwoColumnScrollCardProjection[];
  readonly attentionIndex: number;
  readonly incomingIndex: number | undefined;
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
  readonly previousCardTopPx?: number | undefined;
  readonly viewportHeightPx: number;
}): KpInlineStickyParagraphProjection {
  const viewportHeight = finitePositive(input.viewportHeightPx, 640);
  const measuredCardTop = Number.isFinite(input.cardTopPx)
    ? input.cardTopPx
    : viewportHeight;
  const cardTop = Math.abs(measuredCardTop) <= 0.5 ? 0 : measuredCardTop;
  const measuredPreviousCardTop = input.previousCardTopPx;
  const previousCardTop = measuredPreviousCardTop !== undefined &&
      Math.abs(measuredPreviousCardTop) <= 0.5
    ? 0
    : measuredPreviousCardTop;
  const cardDistance = previousCardTop === undefined ||
      !Number.isFinite(previousCardTop)
    ? viewportHeight
    : Math.max(1, cardTop - previousCardTop);
  const startY = Math.min(viewportHeight, cardDistance);
  const travel = clamp((startY - cardTop) / startY, 0, 1);
  return Object.freeze({
    phase: cardTop >= startY
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

export function projectKpTwoColumnScrollSequence(input: {
  readonly cardTopPx: readonly number[];
  readonly viewportHeightPx: number;
  readonly inactiveOpacity?: number | undefined;
}): KpTwoColumnScrollSequenceProjection {
  const inactiveOpacity = clamp(input.inactiveOpacity ?? 0.24, 0, 1);
  const baseCards = input.cardTopPx.map((cardTopPx, index) =>
    projectKpTwoColumnScrollCard({
      cardTopPx,
      ...(index === 0
        ? {}
        : { previousCardTopPx: input.cardTopPx[index - 1] }),
      viewportHeightPx: input.viewportHeightPx
    })
  );
  if (baseCards.length === 0) {
    return Object.freeze({
      cards: Object.freeze([]),
      attentionIndex: -1,
      incomingIndex: undefined
    });
  }

  const opacity = baseCards.map(() => inactiveOpacity);
  const incomingIndex = baseCards.findIndex(({ phase }) => phase === "crossing");
  let attentionIndex = 0;
  if (incomingIndex >= 0) {
    const incomingProgress = baseCards[incomingIndex]!.travel;
    opacity[incomingIndex] = inactiveOpacity +
      (1 - inactiveOpacity) * incomingProgress;
    if (incomingIndex > 0) {
      opacity[incomingIndex - 1] = 1 -
        (1 - inactiveOpacity) * incomingProgress;
      attentionIndex = incomingProgress >= 0.5
        ? incomingIndex
        : incomingIndex - 1;
    }
  } else {
    let lastPassedIndex = -1;
    baseCards.forEach(({ phase }, index) => {
      if (phase === "passed") lastPassedIndex = index;
    });
    attentionIndex = lastPassedIndex >= 0 ? lastPassedIndex : 0;
    opacity[attentionIndex] = lastPassedIndex >= 0 ? 1 : inactiveOpacity;
  }

  return Object.freeze({
    cards: Object.freeze(baseCards.map((card, index) => Object.freeze({
      ...card,
      opacity: opacity[index]!,
      ownsAttention: index === attentionIndex
    }))),
    attentionIndex,
    incomingIndex: incomingIndex >= 0 ? incomingIndex : undefined
  });
}

export function projectKpTwoColumnScrollMotionCorridor(input: {
  readonly corridor: KpTutorialMotionCorridor;
  readonly cardDistancePx: number;
  readonly viewportHeightPx: number;
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
    startViewportRatio: Math.min(
      1,
      finitePositive(input.cardDistancePx, input.viewportHeightPx) /
        finitePositive(input.viewportHeightPx, 640)
    ),
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
