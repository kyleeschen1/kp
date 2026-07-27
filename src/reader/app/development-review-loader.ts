export type KpReaderDevelopmentReviewMount = (ownerWindow: Window) => void;

// Keep the DEV branch at module scope so Vite can erase the dynamic import and
// its dependency graph instead of merely making it unreachable at runtime.
export const mountKpReaderDevelopmentReview: KpReaderDevelopmentReviewMount | undefined =
  import.meta.env.DEV
    ? (ownerWindow) => {
        // The Animation Library owns one persistent capture shell around its
        // selected host; a nested reader shell would duplicate the control.
        if (
          ownerWindow.frameElement?.hasAttribute(
            "data-animation-library-frame"
          ) === true
        ) {
          return;
        }
        void import("../../dev-review/reader-review-bootstrap.ts")
          .then(({ mountKpReaderDevReview }) => mountKpReaderDevReview(ownerWindow));
      }
    : undefined;
