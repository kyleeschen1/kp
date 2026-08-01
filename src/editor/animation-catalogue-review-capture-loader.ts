export type KpAnimationCatalogueDevelopmentReviewClient =
  typeof import("../dev-review/animation-catalogue-review-bootstrap.ts");

// Review observes the catalogue in development and is erased from exports.
export const loadKpAnimationCatalogueDevelopmentReview:
  | (() => Promise<KpAnimationCatalogueDevelopmentReviewClient>)
  | undefined = import.meta.env.DEV
    ? () => import("../dev-review/animation-catalogue-review-bootstrap.ts")
    : undefined;
