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
      const childWindow = frame.contentWindow;
      const stage = childDocument?.querySelector<HTMLElement>(
        "[data-kp-reader-equation-stage]"
      );
      const viewportShell = frame.closest<HTMLElement>(
        "[data-animation-library-viewport-shell]"
      );
      const shellRect = viewportShell?.getBoundingClientRect() ??
        frame.getBoundingClientRect();
      const stageRect = stage?.getBoundingClientRect();
      const surfaceProfile =
        viewportShell?.dataset["animationLibraryViewportShell"];
      const progressPermille = readProgressPermille(childDocument);
      const reviewFrame = readReaderReviewFrame(childDocument);
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
          animationProgressPermille: reviewFrame?.[0],
          phaseProgressPermille: reviewFrame?.[1],
          activeNodeId: stage?.dataset["kpReaderFoldActiveNode"],
          activeTransformationIds: reviewFrame?.[3] ?? [],
          activePhase: reviewFrame?.[2],
          foldMode: stage?.dataset["kpReaderFoldMode"],
          foldDetail: stage?.dataset["kpReaderFoldPhaseDetail"],
          layoutPolicy: stage?.dataset["kpReaderFoldLayoutPolicy"],
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
          surface: {
            ...(surfaceProfile === undefined
              ? {}
              : { profile: surfaceProfile }),
            shellViewport: {
              width: positiveDimension(shellRect.width),
              height: positiveDimension(shellRect.height)
            },
            contentViewport: {
              width: positiveDimension(
                childWindow?.innerWidth ?? frame.clientWidth
              ),
              height: positiveDimension(
                childWindow?.innerHeight ?? frame.clientHeight
              ),
              devicePixelRatio: positiveDimension(
                childWindow?.devicePixelRatio ??
                ownerDocument.defaultView?.devicePixelRatio ??
                1
              )
            },
            ...(stageRect === undefined
              ? {}
              : {
                  stageViewport: {
                    left: stageRect.left,
                    top: stageRect.top,
                    width: positiveDimension(stageRect.width),
                    height: positiveDimension(stageRect.height)
                  }
                })
          },
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

type KpReaderReviewFrame = readonly [
  animationProgressPermille: number,
  phaseProgressPermille: number,
  activePhase: string,
  activeTransformationIds: readonly string[]
];

function readReaderReviewFrame(
  childDocument: Document | null
): KpReaderReviewFrame | undefined {
  const raw = childDocument?.body.dataset["kpReaderReviewFrame"];
  if (raw === undefined) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !Array.isArray(value) ||
      value.length !== 4 ||
      !Number.isFinite(value[0]) ||
      !Number.isFinite(value[1]) ||
      typeof value[2] !== "string" ||
      !Array.isArray(value[3]) ||
      !value[3].every((candidate) => typeof candidate === "string")
    ) {
      return undefined;
    }
    return [
      boundedPermille(value[0]),
      boundedPermille(value[1]),
      value[2],
      value[3]
    ];
  } catch {
    return undefined;
  }
}

function boundedPermille(value: number): number {
  return Math.round(Math.max(0, Math.min(1_000, value)));
}

function positiveDimension(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
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
