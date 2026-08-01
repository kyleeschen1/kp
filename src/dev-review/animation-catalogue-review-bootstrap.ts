import {
  createKpAnimationCatalogueCaptureProvider
} from "./animation-catalogue-capture-provider.ts";
import { mountKpDevReview } from "./review-bootstrap.ts";
import { resolveKpDevReviewPlacement } from "./review-placement.ts";

export function mountKpAnimationCatalogueDevReview(
  ownerWindow: Window = window
): () => void {
  return mountKpDevReview({
    ownerWindow,
    provider: createKpAnimationCatalogueCaptureProvider(
      ownerWindow.document
    ),
    placement: (viewportWidth) =>
      resolveKpDevReviewPlacement({
        surface: "animation-catalogue",
        viewportWidth
      })
  });
}
