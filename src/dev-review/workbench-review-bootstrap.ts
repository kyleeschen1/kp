import { resolveKpDevReviewPlacement } from "./review-placement.ts";
import { mountKpDevReview } from "./review-bootstrap.ts";
import {
  createKpAnimationWorkbenchCaptureProvider
} from "./workbench-capture-provider.ts";

export function mountKpAnimationWorkbenchDevReview(
  ownerWindow: Window = window
): () => void {
  return mountKpDevReview({
    ownerWindow,
    provider: createKpAnimationWorkbenchCaptureProvider(
      ownerWindow.document
    ),
    placement: (viewportWidth) =>
      resolveKpDevReviewPlacement({
        surface: "animation-workbench",
        viewportWidth
      })
  });
}
