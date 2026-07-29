export type KpEditorAnimationLibraryDevelopmentReviewClient =
  typeof import(
    "../dev-review/editor-animation-library-review-bootstrap.ts"
  );

// Review is a development observer, not an Animation Library dependency.
// Keeping this branch statically visible lets production erase its entire
// provider, composer, client, and endpoint graph.
export const loadKpEditorAnimationLibraryDevelopmentReview:
  | (() => Promise<KpEditorAnimationLibraryDevelopmentReviewClient>)
  | undefined = import.meta.env.DEV
    ? () => import(
        "../dev-review/editor-animation-library-review-bootstrap.ts"
      )
    : undefined;
