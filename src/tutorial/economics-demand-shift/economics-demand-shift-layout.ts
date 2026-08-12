import type { KpTutorialMotionCorridor } from "../kp-tutorial-motion.ts";
import {
  isKpEconomicsPresenterView,
  readKpEconomicsDemandShiftView
} from "./economics-demand-shift-view.ts";

export type KpEconomicsDemandShiftPresentationLayout =
  | "split"
  | "inline-sticky"
  | "two-column-scroll";

export type KpEconomicsScrollScrubStrategy =
  | "continuous-passage"
  | "motion-bridge";

export type KpEconomicsMotionBridgeDwellProfile =
  | "none"
  | "preserve"
  | "medium"
  | "recommended";

export type KpEconomicsTwoColumnTextSide = "left" | "right";

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

export interface KpTwoColumnScrollParagraphProjection
  extends KpInlineStickyParagraphProjection {
  readonly salience: number;
  readonly ownsAttention: boolean;
}

export interface KpTwoColumnScrollSequenceProjection {
  readonly paragraphs: readonly KpTwoColumnScrollParagraphProjection[];
  readonly attentionIndex: number;
}

const inlineStickyLayoutQueryValue = "inline-sticky";
const twoColumnScrollLayoutQueryValue = "two-column-scroll";
const motionBridgeScrubQueryValue = "motion-bridge";
const motionBridgeDwellQueryKey = "dwell";
const twoColumnTextSideQueryKey = "text";
const twoColumnParagraphGapQueryKey = "gap";

export const kpEconomicsTwoColumnScrollCanonicalSearch =
  "?layout=two-column-scroll";
export const kpEconomicsMotionBridgeExemplarSearch =
  "?layout=two-column-scroll&scrub=motion-bridge";
export const kpEconomicsMotionBridgeDwellExemplarSearch =
  "?layout=two-column-scroll&scrub=motion-bridge&dwell=recommended";

export const kpEconomicsTwoColumnParagraphGapMinimumVh = 0;
export const kpEconomicsTwoColumnParagraphGapMaximumVh = 100;
export const kpEconomicsTwoColumnParagraphGapStepVh = 1;
export const kpEconomicsTwoColumnParagraphGapDefaultVh = 30;

export function readKpEconomicsDemandShiftPresentationLayout(
  search: string
): KpEconomicsDemandShiftPresentationLayout {
  const canonicalView = readKpEconomicsDemandShiftView(search);
  if (isKpEconomicsPresenterView(canonicalView)) return canonicalView;
  const value = new URLSearchParams(search).get("layout");
  return value === inlineStickyLayoutQueryValue
    ? "inline-sticky"
    : value === twoColumnScrollLayoutQueryValue
      ? "two-column-scroll"
      : "split";
}

export function readKpEconomicsScrollScrubStrategy(
  search: string
): KpEconomicsScrollScrubStrategy {
  const parameters = new URLSearchParams(search);
  // The experiment is deliberately coupled to the accepted two-column host;
  // a stray scrub query must not alter split or inline publication behavior.
  return parameters.get("layout") === twoColumnScrollLayoutQueryValue &&
      parameters.get("scrub") === motionBridgeScrubQueryValue
    ? "motion-bridge"
    : "continuous-passage";
}

export function readKpEconomicsMotionBridgeDwellProfile(
  search: string
): KpEconomicsMotionBridgeDwellProfile {
  if (readKpEconomicsScrollScrubStrategy(search) !== "motion-bridge") {
    return "none";
  }
  const value = new URLSearchParams(search).get(motionBridgeDwellQueryKey);
  return value === "preserve" || value === "medium" || value === "recommended"
    ? value
    : "none";
}

export function readKpEconomicsTwoColumnTextSide(
  search: string
): KpEconomicsTwoColumnTextSide {
  return new URLSearchParams(search).get(twoColumnTextSideQueryKey) === "right"
    ? "right"
    : "left";
}

export function writeKpEconomicsTwoColumnTextSide(input: {
  readonly search: string;
  readonly side: KpEconomicsTwoColumnTextSide;
}): string {
  const parameters = new URLSearchParams(input.search);
  if (input.side === "left") {
    parameters.delete(twoColumnTextSideQueryKey);
  } else {
    parameters.set(twoColumnTextSideQueryKey, input.side);
  }
  const serialized = parameters.toString();
  return serialized === "" ? "" : `?${serialized}`;
}

export function normalizeKpEconomicsTwoColumnParagraphGapVh(
  value: number
): number {
  if (!Number.isFinite(value)) return kpEconomicsTwoColumnParagraphGapDefaultVh;
  return clamp(
    Math.round(value / kpEconomicsTwoColumnParagraphGapStepVh) *
      kpEconomicsTwoColumnParagraphGapStepVh,
    kpEconomicsTwoColumnParagraphGapMinimumVh,
    kpEconomicsTwoColumnParagraphGapMaximumVh
  );
}

export function readKpEconomicsTwoColumnParagraphGapVh(
  search: string
): number {
  const value = new URLSearchParams(search).get(twoColumnParagraphGapQueryKey);
  if (value === null || value.trim() === "") {
    return kpEconomicsTwoColumnParagraphGapDefaultVh;
  }
  return normalizeKpEconomicsTwoColumnParagraphGapVh(Number(value));
}

export function writeKpEconomicsTwoColumnParagraphGapVh(input: {
  readonly search: string;
  readonly gapVh: number;
}): string {
  const gapVh = normalizeKpEconomicsTwoColumnParagraphGapVh(input.gapVh);
  const parameters = new URLSearchParams(input.search);
  if (gapVh === kpEconomicsTwoColumnParagraphGapDefaultVh) {
    parameters.delete(twoColumnParagraphGapQueryKey);
  } else {
    parameters.set(twoColumnParagraphGapQueryKey, String(gapVh));
  }
  const serialized = parameters.toString();
  return serialized === "" ? "" : `?${serialized}`;
}

export function projectKpTwoColumnScrollParagraph(input: {
  readonly paragraphTopPx: number;
  readonly paragraphBottomPx?: number | undefined;
  readonly previousParagraphTopPx?: number | undefined;
  readonly focusTopPx: number;
  readonly viewportHeightPx: number;
  readonly opening?: boolean | undefined;
  readonly approachStartRatio?: number | undefined;
  readonly focusBottomRatio?: number | undefined;
  readonly minimumEffectiveHeightRatio?: number | undefined;
  readonly motionStartRatio?: number | undefined;
}): Omit<KpTwoColumnScrollParagraphProjection, "ownsAttention"> {
  const viewportHeight = finitePositive(input.viewportHeightPx, 640);
  const measuredParagraphTop = Number.isFinite(input.paragraphTopPx)
    ? input.paragraphTopPx
    : viewportHeight;
  const focusTop = clamp(
    finiteNonNegative(input.focusTopPx),
    0,
    viewportHeight - 1
  );
  const paragraphTop = Math.abs(measuredParagraphTop - focusTop) <= 0.5
    ? focusTop
    : measuredParagraphTop;
  const measuredParagraphBottom = input.paragraphBottomPx;
  const paragraphBottom = measuredParagraphBottom === undefined ||
      !Number.isFinite(measuredParagraphBottom)
    ? paragraphTop
    : Math.max(paragraphTop, measuredParagraphBottom);
  const measuredPreviousParagraphTop = input.previousParagraphTopPx;
  const previousParagraphTop = measuredPreviousParagraphTop !== undefined &&
      Math.abs(measuredPreviousParagraphTop - focusTop) <= 0.5
    ? focusTop
    : measuredPreviousParagraphTop;
  const paragraphDistance = previousParagraphTop === undefined ||
      !Number.isFinite(previousParagraphTop)
    ? viewportHeight
    : Math.max(1, paragraphTop - previousParagraphTop);
  const approachStartY = viewportHeight * clamp(
    input.approachStartRatio ?? 0.78,
    0,
    1
  );
  const focusBottomY = viewportHeight * clamp(
    input.focusBottomRatio ?? 0.5,
    focusTop / viewportHeight,
    1
  );
  const minimumEffectiveHeight = viewportHeight * clamp(
    input.minimumEffectiveHeightRatio ?? 0.23,
    0,
    1
  );
  const paragraphHeight = Math.max(1, paragraphBottom - paragraphTop);
  const effectiveHeight = Math.max(paragraphHeight, minimumEffectiveHeight);
  const paragraphCenter = paragraphTop + paragraphHeight / 2;
  const effectiveTop = paragraphCenter - effectiveHeight / 2;
  const effectiveBottom = paragraphCenter + effectiveHeight / 2;
  const authoredMotionStartY = Math.max(
    focusTop + 1,
    viewportHeight * clamp(input.motionStartRatio ?? 0.62, 0, 1)
  );
  // Short passages may approach before their predecessor settles. Starting at
  // the later event preserves cumulative truth; longer gaps become a readable
  // hold instead of stretching motion artificially.
  const motionStartY = input.opening
    ? focusTop
    : Math.max(
        focusTop + 1,
        Math.min(authoredMotionStartY, focusTop + paragraphDistance)
      );
  const travel = input.opening
    ? paragraphTop <= focusTop ? 1 : 0
    : clamp(
        (motionStartY - paragraphTop) /
          Math.max(1, motionStartY - focusTop),
        0,
        1
      );
  // Opening prose owns an already-settled graph, but correspondence cues still
  // need a continuous approach clock before that first paragraph latches.
  const crossingProgress = input.opening
    ? clamp(
        (approachStartY - paragraphTop) /
          Math.max(1, approachStartY - focusTop),
        0,
        1
      )
    : travel;
  const exitEndY = Math.max(0, focusTop);
  // A projected minimum height gives short thoughts a real reading plateau
  // without inserting artificial space into the document flow.
  const salience = effectiveTop > focusTop
    ? smoothstep(clamp(
        (approachStartY - effectiveTop) /
          Math.max(1, approachStartY - focusTop),
        0,
        1
      ))
    : effectiveBottom >= focusBottomY
      ? 1
      : smoothstep(clamp(
          (effectiveBottom - exitEndY) /
            Math.max(1, focusBottomY - exitEndY),
          0,
          1
        ));
  return Object.freeze({
    phase: paragraphTop >= approachStartY
      ? "below"
      : paragraphTop > motionStartY
        ? "approach"
        : paragraphTop > focusTop
        ? "crossing"
        : "passed",
    travel,
    crossingProgress,
    // The legacy field name is shared with the inline projector. Here it
    // measures distance from the invisible prose completion line.
    distanceFromStageBottomPx: paragraphTop - focusTop,
    salience
  });
}

export function projectKpTwoColumnScrollSequence(input: {
  readonly paragraphTopPx: readonly number[];
  readonly paragraphBottomPx?: readonly number[] | undefined;
  readonly indexOffset?: number | undefined;
  readonly totalParagraphCount?: number | undefined;
  readonly previousParagraphTopPx?: number | undefined;
  readonly focusTopPx: number;
  readonly viewportHeightPx: number;
  readonly approachStartRatio?: number | undefined;
  readonly focusBottomRatio?: number | undefined;
  readonly minimumEffectiveHeightRatio?: number | undefined;
  readonly motionStartRatio?: number | undefined;
}): KpTwoColumnScrollSequenceProjection {
  const baseParagraphs = input.paragraphTopPx.map((paragraphTopPx, index) =>
    projectKpTwoColumnScrollParagraph({
      paragraphTopPx,
      ...(input.paragraphBottomPx?.[index] === undefined
        ? {}
        : { paragraphBottomPx: input.paragraphBottomPx[index] }),
      ...((input.indexOffset ?? 0) + index === 0
        ? {}
        : {
            previousParagraphTopPx: index === 0
              ? input.previousParagraphTopPx
              : input.paragraphTopPx[index - 1]
          }),
      focusTopPx: input.focusTopPx,
      viewportHeightPx: input.viewportHeightPx,
      opening: (input.indexOffset ?? 0) + index === 0,
      approachStartRatio: input.approachStartRatio,
      focusBottomRatio: input.focusBottomRatio,
      minimumEffectiveHeightRatio: input.minimumEffectiveHeightRatio,
      motionStartRatio: input.motionStartRatio
    })
  );
  if (baseParagraphs.length === 0) {
    return Object.freeze({
      paragraphs: Object.freeze([]),
      attentionIndex: -1
    });
  }

  const railSalience = projectPairwiseRailSalience({
    paragraphs: baseParagraphs,
    paragraphTopPx: input.paragraphTopPx,
    paragraphBottomPx: input.paragraphBottomPx,
    focusTopPx: input.focusTopPx,
    focusBottomPx:
      input.viewportHeightPx * clamp(input.focusBottomRatio ?? 0.5, 0, 1),
    indexOffset: input.indexOffset ?? 0,
    totalParagraphCount:
      input.totalParagraphCount ?? (input.indexOffset ?? 0) + baseParagraphs.length
  });

  const attentionIndex = railSalience.reduce((bestIndex, salience, index) =>
    salience > railSalience[bestIndex]!
      ? index
      : bestIndex
  , 0);

  return Object.freeze({
    paragraphs: Object.freeze(baseParagraphs.map((paragraph, index) => Object.freeze({
      ...paragraph,
      salience: railSalience[index]!,
      ownsAttention: index === attentionIndex
    }))),
    attentionIndex
  });
}

function projectPairwiseRailSalience(input: {
  readonly paragraphs: readonly Omit<
    KpTwoColumnScrollParagraphProjection,
    "ownsAttention"
  >[];
  readonly paragraphTopPx: readonly number[];
  readonly paragraphBottomPx?: readonly number[] | undefined;
  readonly focusTopPx: number;
  readonly focusBottomPx: number;
  readonly indexOffset: number;
  readonly totalParagraphCount: number;
}): readonly number[] {
  const result = input.paragraphs.map(() => 0);
  let settledIndex = -1;
  input.paragraphTopPx.forEach((top, index) => {
    if (top <= input.focusTopPx) settledIndex = index;
  });
  if (settledIndex < 0) {
    result[0] = input.paragraphs[0]!.salience;
    return Object.freeze(result);
  }

  const absoluteIndex = input.indexOffset + settledIndex;
  const isTerminal = absoluteIndex === input.totalParagraphCount - 1;
  const nextIndex = settledIndex + 1;
  if (isTerminal || nextIndex >= input.paragraphs.length) {
    result[settledIndex] = isTerminal
      ? 1
      : input.paragraphs[settledIndex]!.salience;
    return Object.freeze(result);
  }

  const currentTop = input.paragraphTopPx[settledIndex]!;
  const currentBottom = input.paragraphBottomPx?.[settledIndex] ?? currentTop;
  if (currentBottom >= input.focusBottomPx) {
    result[settledIndex] = 1;
    return Object.freeze(result);
  }

  const nextTop = input.paragraphTopPx[nextIndex]!;
  const gap = Math.max(0, nextTop - currentBottom);
  const handoffSpan = Math.max(
    1,
    gap + input.focusBottomPx - input.focusTopPx
  );
  const progress = smoothstep(clamp(
    (input.focusBottomPx - currentBottom) / handoffSpan,
    0,
    1
  ));
  result[settledIndex] = 1 - progress;
  result[nextIndex] = progress;
  return Object.freeze(result);
}

export function projectKpTwoColumnScrollMotionCorridor(input: {
  readonly corridor: KpTutorialMotionCorridor;
  readonly paragraphDistancePx: number;
  readonly focusTopPx: number;
  readonly viewportHeightPx: number;
  readonly motionStartRatio?: number | undefined;
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
  const viewportHeight = finitePositive(input.viewportHeightPx, 640);
  const focusTop = clamp(
    finiteNonNegative(input.focusTopPx),
    0,
    viewportHeight - 1
  );
  const motionStart = clamp(
    focusTop + finitePositive(input.paragraphDistancePx, viewportHeight),
    focusTop + 1,
    viewportHeight
  );
  // The incoming transition paragraph names the motion, but the document gap
  // before it owns the playhead. Motion begins when the preceding paragraph
  // reaches its final reading anchor and ends when this paragraph reaches it.
  return Object.freeze({
    ...input.corridor,
    startViewportRatio: motionStart / viewportHeight,
    endViewportRatio: focusTop / viewportHeight,
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

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}
