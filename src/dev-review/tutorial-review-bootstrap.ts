import { mountKpDevReview } from "./review-bootstrap.ts";
import { resolveKpDevReviewPlacement } from "./review-placement.ts";
import { createKpTutorialCaptureProvider } from "./tutorial-review-capture-provider.ts";

export function mountKpTutorialDevReview(
  ownerWindow: Window = window
): () => void {
  return mountKpDevReview({
    ownerWindow,
    provider: createKpTutorialCaptureProvider(ownerWindow.document),
    placement: (viewportWidth) => resolveKpDevReviewPlacement({
      surface: "semantic-reader",
      viewportWidth
    })
  });
}
