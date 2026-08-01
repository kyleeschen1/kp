import type { KpDevReviewCaptureProvider } from "./capture-provider.ts";
import {
  createKpEditorAnimationLibraryCaptureProvider
} from "./editor-animation-library-capture-provider.ts";

export function createKpAnimationCatalogueCaptureProvider(
  ownerDocument: Document
): KpDevReviewCaptureProvider {
  // The catalogue changes the host projection, not the player-state evidence.
  return createKpEditorAnimationLibraryCaptureProvider(ownerDocument, {
    providerId: "animation.catalogue",
    rootSelector: "[data-kp-animation-catalogue]",
    documentId: "animation.catalogue"
  });
}
