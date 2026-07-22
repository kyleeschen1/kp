export type KpReaderDevelopmentReviewMount = (ownerWindow: Window) => void;

// Keep the DEV branch at module scope so Vite can erase the dynamic import and
// its dependency graph instead of merely making it unreachable at runtime.
export const mountKpReaderDevelopmentReview: KpReaderDevelopmentReviewMount | undefined =
  import.meta.env.DEV
    ? (ownerWindow) => {
        void import("../../dev-review/reader-review-bootstrap.ts")
          .then(({ mountKpReaderDevReview }) => mountKpReaderDevReview(ownerWindow));
      }
    : undefined;
