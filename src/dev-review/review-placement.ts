export type KpDevReviewSurface =
  | "default"
  | "semantic-reader"
  | "animation-workbench"
  | "animation-catalogue"
  | "animation-library";

export type KpDevReviewPlacement =
  | "bottom-right"
  | "left-prose-rail"
  | "catalogue-rail"
  | "catalogue-inspector-drawer"
  | "captured-moment-sheet";

export interface KpDevReviewPlacementInput {
  readonly surface: KpDevReviewSurface;
  readonly viewportWidth: number;
}

export const KP_DEV_REVIEW_READER_WIDE_MIN_WIDTH = 881;

export function resolveKpDevReviewPlacement(
  input: KpDevReviewPlacementInput
): KpDevReviewPlacement {
  if (!Number.isFinite(input.viewportWidth) || input.viewportWidth <= 0) {
    throw new RangeError("Review placement viewport width must be positive and finite");
  }
  if (input.surface === "default") return "bottom-right";
  if (input.surface === "animation-library") {
    return input.viewportWidth >= KP_DEV_REVIEW_READER_WIDE_MIN_WIDTH
      ? "bottom-right"
      : "captured-moment-sheet";
  }
  if (input.surface === "animation-catalogue") {
    return input.viewportWidth >= KP_DEV_REVIEW_READER_WIDE_MIN_WIDTH
      ? "catalogue-inspector-drawer"
      : "captured-moment-sheet";
  }
  return input.viewportWidth >= KP_DEV_REVIEW_READER_WIDE_MIN_WIDTH
    ? "left-prose-rail"
    : "captured-moment-sheet";
}
