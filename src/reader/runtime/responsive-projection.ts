export const KP_READER_WIDE_MIN_WIDTH = 881;

export type KpReaderResponsiveProjection =
  | "wide-scrollytelling"
  | "focus-stepper"
  | "compact-transcript"
  | "fallback";

export function resolveKpReaderViewportAnchorFraction(input: {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly stickyVisualBottomPx?: number | undefined;
  readonly maximumNarrativeHeightPx?: number | undefined;
  readonly clearancePx?: number | undefined;
}): number {
  assertPositiveFinite(input.viewportWidth, "width");
  assertPositiveFinite(input.viewportHeight, "height");
  if (input.viewportWidth >= KP_READER_WIDE_MIN_WIDTH) return 0.48;

  const hasVisual = input.stickyVisualBottomPx !== undefined;
  const hasNarrative = input.maximumNarrativeHeightPx !== undefined;
  if (hasVisual !== hasNarrative) {
    throw new TypeError(
      "Sticky visual bottom and maximum narrative height must both be provided"
    );
  }
  if (!hasVisual || !hasNarrative) return 0.66;

  assertNonNegativeFinite(
    input.stickyVisualBottomPx!,
    "Sticky visual bottom"
  );
  assertNonNegativeFinite(
    input.maximumNarrativeHeightPx!,
    "Maximum narrative height"
  );
  const clearancePx = input.clearancePx ?? 12;
  assertNonNegativeFinite(clearancePx, "Reader narrative clearance");
  const measuredAnchor = (
    input.stickyVisualBottomPx! +
    input.maximumNarrativeHeightPx! / 2 +
    clearancePx
  ) / input.viewportHeight;
  // The lower bound preserves the established reading position. The upper
  // bound keeps the focus point inside the viewport on unusually short hosts.
  return Math.min(0.95, Math.max(0.66, measuredAnchor));
}

export function resolveKpReaderResponsiveProjection(input: {
  readonly viewportWidth: number;
  readonly attentionAvailable: boolean;
  readonly compactTranscriptAvailable?: boolean;
}): KpReaderResponsiveProjection {
  assertPositiveFinite(input.viewportWidth, "width");
  if (!input.attentionAvailable) {
    return input.viewportWidth >= KP_READER_WIDE_MIN_WIDTH ||
      input.compactTranscriptAvailable !== true
      ? "fallback"
      : "compact-transcript";
  }
  // This is the same boundary as the reader's CSS layout; keeping the policy
  // explicit prevents presentation code from inventing a second breakpoint.
  return input.viewportWidth >= KP_READER_WIDE_MIN_WIDTH
    ? "wide-scrollytelling"
    : "focus-stepper";
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      `Reader projection viewport ${label} must be positive and finite`
    );
  }
}

function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be non-negative and finite`);
  }
}
