import type {
  KpDevReviewCaptureContext,
  KpDevReviewCaptureProvider
} from "./capture-provider.ts";
import { captureKpDevReviewSemanticTarget } from "./semantic-target.ts";

export function createKpAnimationLibraryCaptureProvider(
  ownerDocument: Document
): KpDevReviewCaptureProvider {
  return {
    id: "review.animation-library",
    priority: 100,
    matches: () =>
      ownerDocument.querySelector(
        "[data-kp-animation-library][data-animation-id]"
      ) !== null,
    capture(context: KpDevReviewCaptureContext) {
      const library = requiredElement(
        ownerDocument,
        "[data-kp-animation-library][data-animation-id]"
      );
      const frame = requiredElement<HTMLIFrameElement>(
        library,
        "[data-animation-library-frame]"
      );
      const animationId = requiredDataset(library, "animationId");
      const representationId = requiredDataset(
        library,
        "representationId"
      );
      const childDocument = frame.contentDocument;
      const progressPermille = readProgressPermille(childDocument);
      const target =
        context.pointer === undefined
          ? undefined
          : captureKpDevReviewSemanticTarget(
              context.eventTarget,
              context.pointer
            );
      return {
        semantic: {
          documentId: "review.animation-library",
          documentVersion: "1",
          assetId: animationId,
          projectionId: representationId,
          progressPermille,
          activeTransformationIds: [],
          focusRefs: [],
          playbackDirection: readPlaybackDirection(childDocument),
          ...(target === undefined ? {} : { target })
        },
        render: {
          rendererId:
            childDocument?.body.dataset["kpReaderLessonVariant"] ??
            childDocument
              ?.querySelector<HTMLElement>(
                "[data-kp-editor-animation-stage]"
              )
              ?.dataset["kpEditorAnimationSurface"] ??
            "animation-library-host",
          motionAuthority: "selected-animation-host",
          fontReady:
            childDocument?.fonts.status === "loaded" &&
            ownerDocument.fonts.status === "loaded",
          ownerIds: [animationId, representationId]
        },
        temporalTrace: [{
          offsetMs: 0,
          progressPermille
        }]
      };
    }
  };
}

function readProgressPermille(
  childDocument: Document | null
): number {
  if (childDocument === null) return 0;
  const readerProgress = Number(
    childDocument.body.dataset["kpReaderProgress"]
  );
  if (Number.isFinite(readerProgress)) {
    return boundedPermille(readerProgress);
  }
  const editorProgress = Number(
    childDocument
      .querySelector<HTMLElement>("[data-kp-editor-animation-player]")
      ?.dataset["kpEditorAnimationProgress"]
  );
  return Number.isFinite(editorProgress)
    ? boundedPermille(editorProgress * 1_000)
    : 0;
}

function readPlaybackDirection(
  childDocument: Document | null
): "forward" | "rewind" {
  return childDocument
    ?.querySelector<HTMLElement>("[data-kp-editor-animation-player]")
    ?.dataset["kpEditorAnimationDirection"] === "rewind"
    ? "rewind"
    : "forward";
}

function boundedPermille(value: number): number {
  return Math.round(Math.max(0, Math.min(1_000, value)));
}

function requiredElement<T extends HTMLElement = HTMLElement>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Animation Library capture requires ${selector}`);
  }
  return element;
}

function requiredDataset(
  element: HTMLElement,
  key: string
): string {
  const value = element.dataset[key]?.trim();
  if (value === undefined || value === "") {
    throw new Error(`Animation Library capture requires data-${key}`);
  }
  return value;
}
