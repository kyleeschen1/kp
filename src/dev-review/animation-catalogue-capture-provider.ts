import type { KpDevReviewCaptureProvider } from "./capture-provider.ts";
import {
  createKpEditorAnimationLibraryCaptureProvider
} from "./editor-animation-library-capture-provider.ts";

export function createKpAnimationCatalogueCaptureProvider(
  ownerDocument: Document
): KpDevReviewCaptureProvider {
  // The catalogue changes the host projection, not the player-state evidence.
  const playerProvider = createKpEditorAnimationLibraryCaptureProvider(ownerDocument, {
    providerId: "animation.catalogue",
    rootSelector: "[data-kp-animation-catalogue]",
    documentId: "animation.catalogue"
  });
  return {
    ...playerProvider,
    async capture(context) {
      const evidence = await playerProvider.capture(context);
      const player = ownerDocument.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue] [data-kp-editor-animation-player]"
      );
      if (player === null) {
        throw new Error("Animation catalogue tuning capture requires a player");
      }
      return {
        ...evidence,
        semantic: {
          ...evidence.semantic,
          tuning: {
            "gestalt-style": requiredDataset(
              player,
              "kpEditorAnimationGestaltSelectedStyle"
            ),
            "focus-experiment": requiredDataset(
              player,
              "kpEditorAnimationFocusExperiment"
            )
          }
        }
      };
    }
  };
}

function requiredDataset(element: HTMLElement, key: string): string {
  const value = element.dataset[key]?.trim();
  if (value === undefined || value.length === 0) {
    throw new Error(`Animation catalogue tuning capture requires data-${key}`);
  }
  return value;
}
