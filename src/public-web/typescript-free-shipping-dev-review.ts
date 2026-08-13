import { mountKpDevReview } from "../dev-review/review-bootstrap.ts";
import { resolveKpDevReviewPlacement } from
  "../dev-review/review-placement.ts";
import type { KpDevReviewCaptureProvider } from
  "../dev-review/capture-provider.ts";

export function mountKpTypeScriptFreeShippingDevReview(
  ownerWindow: Window = window
): () => void {
  return mountKpDevReview({
    ownerWindow,
    provider: createPublicTypeScriptCaptureProvider(ownerWindow.document),
    placement: (viewportWidth) => resolveKpDevReviewPlacement({
      surface: "semantic-reader",
      viewportWidth
    })
  });
}

function createPublicTypeScriptCaptureProvider(
  ownerDocument: Document
): KpDevReviewCaptureProvider {
  return Object.freeze({
    id: "public.typescript-free-shipping",
    priority: 100,
    matches: () => ownerDocument.querySelector(
      "[data-kp-public-typescript-lesson]"
    ) !== null,
    capture(context) {
      const lesson = required<HTMLElement>(ownerDocument,
        "[data-kp-public-typescript-lesson]");
      const host = required<HTMLElement>(ownerDocument,
        "[data-kp-public-typescript-stage]");
      const stage = required<HTMLElement>(ownerDocument,
        "[data-kp-typescript-refactor-stage]");
      const view = ownerDocument.defaultView;
      if (view === null) throw new Error("Public review needs a window.");
      const progress = Math.max(0, Math.min(1,
        Number(host.dataset["kpPublicTypescriptProgress"] ?? 0)));
      const rect = stage.getBoundingClientRect();
      const checkpoint = host.dataset["kpPublicTypescriptCheckpoint"];
      return {
        semantic: {
          documentId: "lesson.programming.typescript-free-shipping",
          documentVersion: "1",
          assetId: "animation.programming.typescript-free-shipping-refactor",
          ...(checkpoint === undefined ? {} : { checkpointId: checkpoint }),
          progressPermille: Math.round(progress * 1000),
          projectionId: "kp.public-web.typescript-lesson",
          activeTransformationIds: [],
          focusSource: "public-player",
          focusRefs: checkpoint === undefined ? [] : [checkpoint],
          motionPreference: view.matchMedia("(prefers-reduced-motion: reduce)")
            .matches ? "reduce" : "no-preference",
          motionMode: "scrub-player",
          playbackDirection: "forward"
        },
        render: {
          rendererId: "kp.typescript-refactor.native-dom",
          motionAuthority: "shared-animation-clock",
          fontReady: ownerDocument.fonts.status === "loaded",
          surface: {
            profile: "kp.public-web.typescript-lesson",
            shellViewport: {
              width: lesson.getBoundingClientRect().width,
              height: lesson.getBoundingClientRect().height
            },
            contentViewport: {
              width: view.innerWidth,
              height: view.innerHeight,
              devicePixelRatio: view.devicePixelRatio
            },
            stageViewport: {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height
            }
          },
          ownerIds: [
            "lesson.programming.typescript-free-shipping",
            "animation.programming.typescript-free-shipping-refactor"
          ]
        },
        temporalTrace: [{
          offsetMs: 0,
          progressPermille: Math.round(progress * 1000),
          ...(checkpoint === undefined ? {} : { transitionId: checkpoint })
        }]
      };
    }
  });
}

function required<Element extends globalThis.Element>(
  root: ParentNode,
  selector: string
): Element {
  const element = root.querySelector<Element>(selector);
  if (element === null) throw new Error(`Missing public review element ${selector}.`);
  return element;
}
