export type KpTutorialOrdinaryBeatPhase =
  | "waiting"
  | "approaching"
  | "settled";

export interface KpTutorialOrdinaryBeatProjection {
  readonly phase: KpTutorialOrdinaryBeatPhase;
  readonly progress: number;
  readonly distanceToAnchorPx: number;
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
