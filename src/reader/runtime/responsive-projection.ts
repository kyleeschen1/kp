export const KP_READER_WIDE_MIN_WIDTH = 881;

export type KpReaderResponsiveProjection =
  | "wide-scrollytelling"
  | "focus-stepper"
  | "fallback";

export function resolveKpReaderResponsiveProjection(input: {
  readonly viewportWidth: number;
  readonly attentionAvailable: boolean;
}): KpReaderResponsiveProjection {
  if (!Number.isFinite(input.viewportWidth) || input.viewportWidth <= 0) {
    throw new RangeError("Reader projection viewport width must be positive and finite");
  }
  if (!input.attentionAvailable) return "fallback";
  // This is the same boundary as the reader's CSS layout; keeping the policy
  // explicit prevents presentation code from inventing a second breakpoint.
  return input.viewportWidth >= KP_READER_WIDE_MIN_WIDTH
    ? "wide-scrollytelling"
    : "focus-stepper";
}
