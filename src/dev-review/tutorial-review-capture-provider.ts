import type {
  KpDevReviewCaptureContext,
  KpDevReviewCaptureProvider
} from "./capture-provider.ts";
import { captureKpDevReviewSemanticTarget } from "./semantic-target.ts";
import { readKpTutorialReviewEvidence } from
  "./tutorial-review-evidence.ts";

const tutorialRootSelector = "[data-kp-tutorial-review-root]";

/** Captures the lesson shell's portable semantic projection, not a
 * domain-specific player implementation. */
export function createKpTutorialCaptureProvider(
  ownerDocument: Document
): KpDevReviewCaptureProvider {
  return {
    id: "tutorial.lesson-shell",
    priority: 100,
    matches: () => ownerDocument.querySelector(tutorialRootSelector) !== null,
    capture(context: KpDevReviewCaptureContext) {
      const root = requiredRoot(ownerDocument);
      const view = ownerDocument.defaultView;
      if (view === null) throw new Error("Tutorial review requires a browser view");
      const progress = boundedProgress(
        root.dataset["kpTutorialReviewProgress"]
      );
      const motionBlockId = optional(
        root.dataset["kpTutorialReviewMotionBlock"]
      );
      const passageId = optional(root.dataset["kpTutorialReviewPassage"]);
      const checkpointId = optional(
        root.dataset["kpTutorialReviewCheckpoint"]
      );
      const documentId = requiredDataset(root, "kpTutorialReviewDocumentId");
      const documentVersion = requiredDataset(
        root,
        "kpTutorialReviewDocumentVersion"
      );
      const assetId = requiredDataset(root, "kpTutorialReviewAssetId");
      const extension = readKpTutorialReviewEvidence(root);
      const target = context.pointer === undefined
        ? undefined
        : captureKpDevReviewSemanticTarget(
            context.eventTarget,
            context.pointer
          );
      const shellBounds = root.getBoundingClientRect();
      const stageBounds = root.querySelector<HTMLElement>(
        ".kp-tutorial-shell__stage"
      )?.getBoundingClientRect();
      const progressPermille = Math.round(progress * 1_000);
      // A review taken between reading regions still needs a durable semantic
      // anchor, so fall back from the live passage to the restored lesson state.
      const focusRef = passageId ?? checkpointId ?? motionBlockId;

      return {
        semantic: {
          documentId,
          documentVersion,
          assetId,
          ...(checkpointId === undefined ? {} : { checkpointId }),
          progressPermille,
          projectionId: "kp.tutorial.lesson-shell",
          activeTransformationIds: motionBlockId === undefined
            ? []
            : [motionBlockId],
          focusSource: "reading-cursor",
          focusRefs: focusRef === undefined ? [] : [focusRef],
          motionPreference: view.matchMedia("(prefers-reduced-motion: reduce)")
            .matches ? "reduce" : "no-preference",
          motionMode: "scroll-scrub",
          playbackDirection:
            root.dataset["kpTutorialReviewPlaybackDirection"] === "rewind"
              ? "rewind"
              : "forward",
          ...extension,
          ...(target === undefined ? {} : { target })
        },
        render: {
          rendererId: optional(root.dataset["kpTutorialReviewRenderer"]) ??
            "kp-tutorial-lesson-shell",
          motionAuthority:
            optional(root.dataset["kpTutorialReviewMotionAuthority"]) ??
            "untouched",
          fontReady: ownerDocument.fonts.status === "loaded",
          surface: {
            profile: "kp.tutorial.lesson-shell",
            shellViewport: {
              width: shellBounds.width,
              height: shellBounds.height
            },
            contentViewport: {
              width: view.innerWidth,
              height: view.innerHeight,
              devicePixelRatio: view.devicePixelRatio
            },
            ...(stageBounds === undefined ? {} : {
              stageViewport: {
                left: stageBounds.left,
                top: stageBounds.top,
                width: stageBounds.width,
                height: stageBounds.height
              }
            })
          },
          ownerIds: [documentId, assetId, motionBlockId]
            .filter((value): value is string => value !== undefined)
        },
        temporalTrace: [{
          offsetMs: 0,
          progressPermille,
          ...(motionBlockId === undefined ? {} : { transitionId: motionBlockId })
        }]
      };
    }
  };
}

function requiredRoot(ownerDocument: Document): HTMLElement {
  const root = ownerDocument.querySelector<HTMLElement>(tutorialRootSelector);
  if (root === null) throw new Error("Tutorial review requires a lesson root");
  return root;
}

function requiredDataset(element: HTMLElement, key: string): string {
  const value = optional(element.dataset[key]);
  if (value === undefined) {
    throw new Error(`Tutorial review requires data-${key}`);
  }
  return value;
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized === undefined || normalized === "" ? undefined : normalized;
}

function boundedProgress(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed)
    ? Math.max(0, Math.min(1, parsed))
    : 0;
}
