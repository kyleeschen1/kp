import { resolveKpDevReviewPlacement } from "./review-placement.ts";
import { mountKpDevReview } from "./review-bootstrap.ts";
import {
  createKpAnimationLibraryCaptureProvider
} from "./animation-library-capture-provider.ts";

export function mountKpAnimationLibraryDevReview(
  ownerWindow: Window = window
): () => void {
  return mountKpDevReview({
    ownerWindow,
    provider: createKpAnimationLibraryCaptureProvider(
      ownerWindow.document
    ),
    placement: (viewportWidth) =>
      resolveKpDevReviewPlacement({
        surface: "animation-library",
        viewportWidth
      })
  });
}
