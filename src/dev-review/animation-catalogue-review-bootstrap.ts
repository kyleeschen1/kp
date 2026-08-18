import {
  createKpAnimationCatalogueCaptureProvider
} from "./animation-catalogue-capture-provider.ts";
import { mountKpDevReview } from "./review-bootstrap.ts";
import { resolveKpDevReviewPlacement } from "./review-placement.ts";
import {
  createKpAnimationDevelopmentExactHref
} from "../editor/animation-development-url-state.ts";

export function mountKpAnimationCatalogueDevReview(
  ownerWindow: Window = window
): () => void {
  return mountKpDevReview({
    ownerWindow,
    provider: createKpAnimationCatalogueCaptureProvider(
      ownerWindow.document
    ),
    screenshotSurface: "animation-catalogue",
    // Review evidence must restore the same projection even when the user
    // arrived through the legacy root URL without an explicit view parameter.
    resolveCaptureRoute: createKpAnimationDevelopmentExactHref,
    placement: (viewportWidth) =>
      resolveKpDevReviewPlacement({
        surface: "animation-catalogue",
        viewportWidth
      })
  });
}
