import type { KpTutorialMotionCorridor } from "../kp-tutorial-motion.ts";

export type KpEconomicsDemandShiftPresentationLayout =
  | "split"
  | "inline-sticky"
  | "animation-station"
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

export interface KpAnimationStationGeometryProjection {
  readonly usableTopPx: number;
  readonly usableBottomPx: number;
  readonly usableHeightPx: number;
  readonly railTopY: number;
  readonly railBottomY: number;
  readonly railHeightPx: number;
  readonly graphTopY: number;
  readonly graphBottomY: number;
  readonly graphHeightPx: number;
  readonly cueRevealStartY: number;
  readonly cueRevealEndY: number;
  readonly cuePinStartY: number;
  readonly cuePinEndY: number;
  readonly cueExitEndY: number;
  readonly motionDistancePx: number;
  readonly motionScrubEndY: number;
  readonly motionSettleDistancePx: number;
  readonly motionEndY: number;
  readonly beatDistancePx: number;
  readonly railExitEndY: number;
  readonly graphExitStartY: number;
  readonly graphExitEndY: number;
}

export interface KpAnimationStationCuePresenceProjection {
  readonly phase:
    | "waiting"
    | "materializing"
    | "bright"
    | "pinned"
    | "dissolving"
    | "gone";
  readonly presence: number;
  readonly scale: number;
  readonly pinOffsetPx: number;
}

export interface KpAnimationStationEntranceProjection {
  readonly phase: "approaching" | "latched";
  readonly distanceToLatchPx: number;
  readonly stageProgress: number;
  readonly railPresence: number;
}

export interface KpAnimationStationExitProjection {
  readonly railProgress: number;
  readonly graphProgress: number;
  readonly gridPresence: number;
  readonly guidePresence: number;
  readonly axisPresence: number;
  readonly supplyPresence: number;
  readonly demandPresence: number;
  readonly pointPresence: number;
  readonly labelPresence: number;
}

export interface KpAnimationStationReadingCycleProjection {
  readonly phase:
    | "stationed"
    | "releasing-to-reading"
    | "reading"
    | "reviving"
    | "revived"
    | "terminal-release";
  readonly revivalProgress: number;
  readonly exit: KpAnimationStationExitProjection;
}

export interface KpEconomicsAnimationStationRhythm {
  readonly railTopRatio: number;
  readonly railBottomRatio: number;
  readonly graphTopRatio: number;
  readonly graphBottomRatio: number;
  readonly cueRevealStartRatio: number;
  readonly cueRevealEndRatio: number;
  readonly cuePinStartRatio: number;
  readonly cuePinDistanceRatio: number;
  readonly cueExitGraphRatio: number;
  readonly motionDistanceRatio: number;
  readonly motionSettleDistanceRatio: number;
  readonly beatDistanceRatio: number;
  readonly railExitEndRatio: number;
  readonly graphExitStartRatio: number;
  readonly graphExitEndRatio: number;
}

export const kpEconomicsAnimationStationDefaultRhythm:
Readonly<KpEconomicsAnimationStationRhythm> = Object.freeze({
  railTopRatio: 0.15,
  railBottomRatio: 0.85,
  graphTopRatio: 0.17,
  graphBottomRatio: 0.5,
  cueRevealStartRatio: 0.85,
  cueRevealEndRatio: 0.7,
  cuePinStartRatio: 0.55,
  cuePinDistanceRatio: 0.15,
  cueExitGraphRatio: 0.6,
  motionDistanceRatio: 0.5,
  motionSettleDistanceRatio: 0.1,
  beatDistanceRatio: 0.74,
  railExitEndRatio: 0.78,
  graphExitStartRatio: 0.75,
  graphExitEndRatio: 0.6
});

const inlineStickyLayoutQueryValue = "inline-sticky";
const animationStationLayoutQueryValue = "animation-station";
const twoColumnScrollLayoutQueryValue = "two-column-scroll";
const motionBridgeScrubQueryValue = "motion-bridge";
const motionBridgeDwellQueryKey = "dwell";
const twoColumnTextSideQueryKey = "text";
const twoColumnParagraphGapQueryKey = "gap";

export const kpEconomicsTwoColumnScrollCanonicalSearch =
  "?layout=two-column-scroll";
export const kpEconomicsAnimationStationExemplarSearch =
  "?layout=animation-station";
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
  const value = new URLSearchParams(search).get("layout");
  return value === inlineStickyLayoutQueryValue
    ? "inline-sticky"
    : value === animationStationLayoutQueryValue
      ? "animation-station"
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

export function projectKpAnimationStationMotionCorridor(input: {
  readonly corridor: KpTutorialMotionCorridor;
  readonly motionStartPx: number;
  readonly viewportHeightPx: number;
  readonly runwayPx: number;
  readonly settleRunwayPx?: number | undefined;
}): KpTutorialMotionCorridor {
  const viewportHeight = finitePositive(input.viewportHeightPx, 640);
  const motionStart = clamp(
    finiteNonNegative(input.motionStartPx),
    1,
    viewportHeight
  );
  const runway = clamp(
    finitePositive(input.runwayPx, viewportHeight * 0.3),
    1,
    viewportHeight
  );
  const settleRunway = clamp(
    finitePositive(input.settleRunwayPx ?? runway * 0.2, runway * 0.2),
    0,
    runway
  );
  const firstProgress = input.corridor.keyframes[0]?.progress ?? 0;
  const finalProgress = input.corridor.keyframes.at(-1)?.progress ??
    firstProgress;
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
    ({ travel }) => travel > authoredMotionStart
  );
  const handoffEnd = 0.02;
  const settleStart = clamp(1 - settleRunway / runway, handoffEnd, 1);

  // The cue relinquishes attention first; the remaining local interval is the
  // existing semantic motion sampled over one stage-height of native scroll.
  const projected = activeKeyframes.map(({ travel, progress }) => ({
    travel: handoffEnd +
      ((travel - authoredMotionStart) / authoredMotionSpan) *
        (settleStart - handoffEnd),
    progress
  }));
  return Object.freeze({
    ...input.corridor,
    startViewportRatio: motionStart / viewportHeight,
    endViewportRatio: (motionStart - runway) / viewportHeight,
    keyframes: Object.freeze([
      Object.freeze({ travel: 0, progress: firstProgress }),
      Object.freeze({ travel: handoffEnd, progress: firstProgress }),
      ...projected.map((keyframe) => Object.freeze(keyframe)),
      Object.freeze({ travel: 1, progress: finalProgress })
    ])
  });
}

export function projectKpAnimationStationGeometry(input: {
  readonly viewportHeightPx: number;
  readonly usableTopPx?: number | undefined;
  readonly usableBottomPx?: number | undefined;
  // Runtime CSS tokens may refine any ratio without narrowing callers to the
  // literal values used by the canonical default rhythm.
  readonly rhythm?: Partial<KpEconomicsAnimationStationRhythm> | undefined;
}): KpAnimationStationGeometryProjection {
  const viewportHeight = finitePositive(input.viewportHeightPx, 640);
  const usableTop = clamp(finiteNonNegative(input.usableTopPx ?? 0), 0,
    viewportHeight - 1);
  const usableBottom = clamp(
    input.usableBottomPx === undefined ||
        !Number.isFinite(input.usableBottomPx)
      ? viewportHeight
      : input.usableBottomPx,
    usableTop + 1,
    viewportHeight
  );
  const usableHeight = usableBottom - usableTop;
  const rhythm = {
    ...kpEconomicsAnimationStationDefaultRhythm,
    ...input.rhythm
  };
  const y = (ratio: number): number => usableTop + usableHeight * clamp(
    Number.isFinite(ratio) ? ratio : 0,
    0,
    1
  );
  const railTopY = y(rhythm.railTopRatio);
  const railBottomY = y(rhythm.railBottomRatio);
  const graphTopY = y(rhythm.graphTopRatio);
  const graphBottomY = y(rhythm.graphBottomRatio);
  const cuePinStartY = y(rhythm.cuePinStartRatio);
  const cuePinEndY = Math.max(
    usableTop,
    cuePinStartY - usableHeight * clamp(rhythm.cuePinDistanceRatio, 0, 1)
  );
  const cueExitEndY = graphTopY +
    (graphBottomY - graphTopY) * clamp(rhythm.cueExitGraphRatio, 0, 1);
  const motionDistancePx = usableHeight * clamp(
    rhythm.motionDistanceRatio,
    0,
    1
  );
  const motionSettleDistancePx = Math.min(
    motionDistancePx,
    usableHeight * clamp(rhythm.motionSettleDistanceRatio, 0, 1)
  );

  return Object.freeze({
    usableTopPx: usableTop,
    usableBottomPx: usableBottom,
    usableHeightPx: usableHeight,
    railTopY,
    railBottomY,
    railHeightPx: Math.max(1, railBottomY - railTopY),
    graphTopY,
    graphBottomY,
    graphHeightPx: Math.max(1, graphBottomY - graphTopY),
    cueRevealStartY: y(rhythm.cueRevealStartRatio),
    cueRevealEndY: y(rhythm.cueRevealEndRatio),
    cuePinStartY,
    cuePinEndY,
    cueExitEndY,
    motionDistancePx,
    motionScrubEndY:
      cueExitEndY - (motionDistancePx - motionSettleDistancePx),
    motionSettleDistancePx,
    motionEndY: cueExitEndY - motionDistancePx,
    beatDistancePx: usableHeight * clamp(rhythm.beatDistanceRatio, 0.1, 1),
    railExitEndY: y(rhythm.railExitEndRatio),
    graphExitStartY: y(rhythm.graphExitStartRatio),
    graphExitEndY: y(rhythm.graphExitEndRatio)
  });
}

export function projectKpAnimationStationEntrance(input: {
  readonly stageTopPx: number;
  readonly geometry: KpAnimationStationGeometryProjection;
  readonly approachDistancePx?: number | undefined;
  readonly latchTolerancePx?: number | undefined;
}): KpAnimationStationEntranceProjection {
  const stageTop = Number.isFinite(input.stageTopPx)
    ? input.stageTopPx
    : input.geometry.usableBottomPx;
  const distanceToLatch = Math.max(0, stageTop - input.geometry.railTopY);
  const approachDistance = finitePositive(
    input.approachDistancePx ?? input.geometry.usableHeightPx * 0.15,
    Math.max(1, input.geometry.usableHeightPx * 0.15)
  );
  const tolerance = finiteNonNegative(input.latchTolerancePx ?? 1);
  const latched = distanceToLatch <= tolerance;
  return Object.freeze({
    phase: latched ? "latched" : "approaching",
    distanceToLatchPx: distanceToLatch,
    stageProgress: smoothstep(clamp(
      1 - distanceToLatch / approachDistance,
      0,
      1
    )),
    // Rails announce the station, not an approaching embedded figure. Their
    // later entrance choreography may refine this binary ownership boundary.
    railPresence: latched ? 1 : 0
  });
}

export function projectKpAnimationStationCuePresence(input: {
  readonly cueTopPx: number;
  readonly cueBottomPx: number;
  readonly geometry: KpAnimationStationGeometryProjection;
}): KpAnimationStationCuePresenceProjection {
  const cueTop = Number.isFinite(input.cueTopPx)
    ? input.cueTopPx
    : input.geometry.usableBottomPx;
  const cueBottom = Number.isFinite(input.cueBottomPx)
    ? input.cueBottomPx
    : cueTop;
  const geometry = input.geometry;
  const boundaryEpsilon = 1e-6;
  let phase: KpAnimationStationCuePresenceProjection["phase"];
  let presence: number;
  let pinOffsetPx = 0;
  if (cueBottom >= geometry.cueRevealStartY) {
    phase = "waiting";
    presence = 0;
  } else if (cueBottom > geometry.cueRevealEndY) {
    phase = "materializing";
    presence = smoothstep(clamp(
      (geometry.cueRevealStartY - cueBottom) /
        Math.max(1, geometry.cueRevealStartY - geometry.cueRevealEndY),
      0,
      1
    ));
  } else if (cueTop >= geometry.cuePinStartY - boundaryEpsilon) {
    phase = "bright";
    presence = 1;
  } else if (cueTop >= geometry.cuePinEndY - boundaryEpsilon) {
    phase = "pinned";
    presence = 1;
    pinOffsetPx = geometry.cuePinStartY - cueTop;
  } else if (cueTop > geometry.cueExitEndY) {
    phase = "dissolving";
    pinOffsetPx = geometry.cuePinStartY - cueTop;
    presence = smoothstep(clamp(
      (cueTop - geometry.cueExitEndY) /
        Math.max(1, geometry.cuePinEndY - geometry.cueExitEndY),
      0,
      1
    ));
  } else {
    phase = "gone";
    presence = 0;
    pinOffsetPx = geometry.cuePinStartY - geometry.cueExitEndY;
  }
  return Object.freeze({
    phase,
    presence,
    scale: 0.95 + presence * 0.05,
    pinOffsetPx
  });
}

/** Keeps a motion instruction and its rail fixed until semantic motion ends. */
export function projectKpAnimationStationMotionCuePresence(input: {
  readonly cueTopPx: number;
  readonly cueBottomPx: number;
  readonly successorPresence: number;
  readonly geometry: KpAnimationStationGeometryProjection;
}): KpAnimationStationCuePresenceProjection {
  const base = projectKpAnimationStationCuePresence(input);
  const cueTop = Number.isFinite(input.cueTopPx)
    ? input.cueTopPx
    : input.geometry.usableBottomPx;
  if (cueTop >= input.geometry.cuePinStartY) return base;

  const presence = cueTop >= input.geometry.motionScrubEndY
    ? 1
    : 1 - clamp(input.successorPresence, 0, 1);
  return Object.freeze({
    phase: presence <= Number.EPSILON
      ? "gone"
      : presence >= 1 - Number.EPSILON
        ? "pinned"
        : "dissolving",
    presence,
    scale: 0.95 + presence * 0.05,
    pinOffsetPx: input.geometry.cuePinStartY - cueTop
  });
}

/** Reading prose enters normally; unlike a station cue, it is never pinned. */
export function projectKpAnimationStationReadingPresence(input: {
  readonly paragraphAnchorPx: number;
  readonly geometry: KpAnimationStationGeometryProjection;
}): number {
  const anchor = Number.isFinite(input.paragraphAnchorPx)
    ? input.paragraphAnchorPx
    : input.geometry.usableBottomPx;
  if (anchor >= input.geometry.cueRevealStartY) return 0;
  if (anchor <= input.geometry.cueRevealEndY) return 1;
  return smoothstep(clamp(
    (input.geometry.cueRevealStartY - anchor) /
      Math.max(1, input.geometry.cueRevealStartY -
        input.geometry.cueRevealEndY),
    0,
    1
  ));
}

export function projectKpAnimationStationExit(input: {
  readonly releaseCueTopPx: number;
  readonly geometry: KpAnimationStationGeometryProjection;
}): KpAnimationStationExitProjection {
  const cueTop = Number.isFinite(input.releaseCueTopPx)
    ? input.releaseCueTopPx
    : input.geometry.usableBottomPx;
  const geometry = input.geometry;
  const descendingProgress = (startY: number, endY: number): number =>
    smoothstep(clamp(
      (startY - cueTop) / Math.max(1, startY - endY),
      0,
      1
    ));
  const railProgress = descendingProgress(
    geometry.railBottomY,
    geometry.railExitEndY
  );
  const graphProgress = descendingProgress(
    geometry.graphExitStartY,
    geometry.graphExitEndY
  );
  const presence = (start: number, end: number): number => 1 - smoothstep(
    clamp((graphProgress - start) / Math.max(Number.EPSILON, end - start), 0, 1)
  );

  return Object.freeze({
    railProgress,
    graphProgress,
    gridPresence: presence(0, 0.55),
    guidePresence: presence(0.08, 0.63),
    axisPresence: presence(0.16, 0.71),
    supplyPresence: presence(0.24, 0.79),
    demandPresence: presence(0.32, 0.87),
    pointPresence: presence(0.4, 0.95),
    labelPresence: presence(0.48, 1)
  });
}

/**
 * Releases one retained scene for ordinary reading, then reverses that exact
 * release as the next motion cue arrives. A later reading passage can perform
 * the terminal release without constructing a second graph instance.
 */
export function projectKpAnimationStationReadingCycle(input: {
  readonly readingCueTopPx: number;
  readonly revivalCueTopPx: number;
  readonly terminalCueTopPx: number;
  readonly geometry: KpAnimationStationGeometryProjection;
}): KpAnimationStationReadingCycleProjection {
  const readingExit = projectKpAnimationStationExit({
    releaseCueTopPx: input.readingCueTopPx,
    geometry: input.geometry
  });
  const terminalExit = projectKpAnimationStationExit({
    releaseCueTopPx: input.terminalCueTopPx,
    geometry: input.geometry
  });
  const revivalProgress = projectKpAnimationStationReadingPresence({
    paragraphAnchorPx: input.revivalCueTopPx,
    geometry: input.geometry
  });
  const revivedExit = interpolateAnimationStationExit(
    readingExit,
    emptyAnimationStationExit(),
    revivalProgress
  );
  const terminalStarted = terminalExit.railProgress > Number.EPSILON ||
    terminalExit.graphProgress > Number.EPSILON;
  const exit = terminalStarted ? terminalExit : revivedExit;
  const phase: KpAnimationStationReadingCycleProjection["phase"] =
    terminalStarted
      ? "terminal-release"
      : revivalProgress >= 1 - Number.EPSILON
        ? "revived"
        : revivalProgress > Number.EPSILON
          ? "reviving"
          : readingExit.graphProgress >= 1 - Number.EPSILON
            ? "reading"
            : readingExit.railProgress > Number.EPSILON ||
                readingExit.graphProgress > Number.EPSILON
              ? "releasing-to-reading"
              : "stationed";
  return Object.freeze({ phase, revivalProgress, exit });
}

function emptyAnimationStationExit(): KpAnimationStationExitProjection {
  return Object.freeze({
    railProgress: 0,
    graphProgress: 0,
    gridPresence: 1,
    guidePresence: 1,
    axisPresence: 1,
    supplyPresence: 1,
    demandPresence: 1,
    pointPresence: 1,
    labelPresence: 1
  });
}

function interpolateAnimationStationExit(
  from: KpAnimationStationExitProjection,
  to: KpAnimationStationExitProjection,
  progress: number
): KpAnimationStationExitProjection {
  const t = clamp(progress, 0, 1);
  const interpolate = (start: number, end: number): number =>
    start + (end - start) * t;
  return Object.freeze({
    railProgress: interpolate(from.railProgress, to.railProgress),
    graphProgress: interpolate(from.graphProgress, to.graphProgress),
    gridPresence: interpolate(from.gridPresence, to.gridPresence),
    guidePresence: interpolate(from.guidePresence, to.guidePresence),
    axisPresence: interpolate(from.axisPresence, to.axisPresence),
    supplyPresence: interpolate(from.supplyPresence, to.supplyPresence),
    demandPresence: interpolate(from.demandPresence, to.demandPresence),
    pointPresence: interpolate(from.pointPresence, to.pointPresence),
    labelPresence: interpolate(from.labelPresence, to.labelPresence)
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
