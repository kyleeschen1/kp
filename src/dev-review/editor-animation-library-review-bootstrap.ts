import {
  createKpEditorAnimationLibraryCaptureProvider
} from "./editor-animation-library-capture-provider.ts";
import { mountKpDevReview } from "./review-bootstrap.ts";
import { resolveKpDevReviewPlacement } from "./review-placement.ts";

export function mountKpEditorAnimationLibraryDevReview(
  ownerWindow: Window = window
): () => void {
  return mountKpDevReview({
    ownerWindow,
    provider: createKpEditorAnimationLibraryCaptureProvider(
      ownerWindow.document
    ),
    placement: (viewportWidth) =>
      resolveKpDevReviewPlacement({
        surface: "animation-library",
        viewportWidth
      })
  });
}
