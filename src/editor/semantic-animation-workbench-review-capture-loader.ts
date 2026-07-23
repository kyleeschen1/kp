export type KpAnimationWorkbenchDevelopmentReviewClient =
  typeof import("../dev-review/workbench-review-bootstrap.ts");

// Keep the DEV branch statically visible so production erases the review
// composer, client, capture provider, and endpoint strings as one graph.
export const loadKpAnimationWorkbenchDevelopmentReview:
  | (() => Promise<KpAnimationWorkbenchDevelopmentReviewClient>)
  | undefined = import.meta.env.DEV
    ? () => import("../dev-review/workbench-review-bootstrap.ts")
    : undefined;
