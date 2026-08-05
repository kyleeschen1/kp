export type KpTutorialOrdinaryBeatPhase =
  | "waiting"
  | "approaching"
  | "settled";

export interface KpTutorialOrdinaryBeatProjection {
  readonly phase: KpTutorialOrdinaryBeatPhase;
  readonly progress: number;
  readonly distanceToAnchorPx: number;
}

export type KpTutorialMotionBridgePhase =
  | "before"
  | "scrubbing"
  | "after";

export interface KpTutorialMotionBridgeProjection {
  readonly phase: KpTutorialMotionBridgePhase;
  readonly progress: number;
  readonly startScrollY: number;
  readonly endScrollY: number;
  readonly distancePx: number;
}

export function projectKpTutorialOrdinaryBeat(input: {
  readonly paragraphTopPx: number;
  readonly readingAnchorPx: number;
  readonly approachDistancePx: number;
}): KpTutorialOrdinaryBeatProjection {
  const paragraphTop = finite(input.paragraphTopPx, "paragraph top");
  const readingAnchor = finite(input.readingAnchorPx, "reading anchor");
  const approachDistance = positive(
    input.approachDistancePx,
    "ordinary beat approach distance"
  );
  const distanceToAnchor = paragraphTop - readingAnchor;
  const progress = clamp(
    (approachDistance - distanceToAnchor) / approachDistance
  );
  return Object.freeze({
    phase: progress === 0
      ? "waiting"
      : progress === 1
        ? "settled"
        : "approaching",
    progress,
    distanceToAnchorPx: distanceToAnchor
  });
}

export function projectKpTutorialMotionBridge(input: {
  readonly scrollY: number;
  readonly beforeDocumentTopPx: number;
  readonly afterDocumentTopPx: number;
  readonly readingAnchorPx: number;
}): KpTutorialMotionBridgeProjection {
  const scrollY = finite(input.scrollY, "motion bridge scroll position");
  const beforeTop = finite(
    input.beforeDocumentTopPx,
    "motion bridge before anchor"
  );
  const afterTop = finite(
    input.afterDocumentTopPx,
    "motion bridge after anchor"
  );
  const readingAnchor = finite(
    input.readingAnchorPx,
    "motion bridge reading anchor"
  );
  const distance = afterTop - beforeTop;
  if (distance <= 0) {
    throw new Error(
      "Tutorial motion bridge after anchor must follow its before anchor."
    );
  }
  const startScrollY = beforeTop - readingAnchor;
  const endScrollY = afterTop - readingAnchor;
  const progress = clamp((scrollY - startScrollY) / distance);
  return Object.freeze({
    phase: progress === 0
      ? "before"
      : progress === 1
        ? "after"
        : "scrubbing",
    progress,
    startScrollY,
    endScrollY,
    distancePx: distance
  });
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Tutorial ${label} must be finite.`);
  }
  return value;
}

function positive(value: number, label: string): number {
  const result = finite(value, label);
  if (result <= 0) throw new Error(`Tutorial ${label} must be positive.`);
  return result;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
