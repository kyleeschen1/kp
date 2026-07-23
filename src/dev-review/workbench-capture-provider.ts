import type {
  KpDevReviewCaptureContext,
  KpDevReviewCaptureProvider
} from "./capture-provider.ts";
import { captureKpDevReviewSemanticTarget } from "./semantic-target.ts";

export function createKpAnimationWorkbenchCaptureProvider(
  ownerDocument: Document
): KpDevReviewCaptureProvider {
  return {
    id: "editor.animation-workbench",
    priority: 100,
    matches: () =>
      ownerDocument.querySelector(
        "[data-kp-animation-workbench-selection]"
      ) !== null,
    capture(context: KpDevReviewCaptureContext) {
      const selection = requiredElement(
        ownerDocument,
        "[data-kp-animation-workbench-selection]"
      );
      const player = selection.querySelector<HTMLElement>(
        "[data-kp-editor-animation-player]"
      );
      const library = selection.querySelector<HTMLElement>(
        "[data-kp-editor-animation-library]"
      );
      const animationId =
        selection.dataset["kpAnimationWorkbenchSelection"];
      if (animationId === undefined) {
        throw new Error("Workbench capture requires a canonical animation id");
      }
      const progress = boundedProgress(
        player?.dataset["kpEditorAnimationProgress"]
      );
      const activePhase =
        library?.dataset["kpEditorAnimationLiveVisualPhaseId"] ??
        library
          ?.querySelector<HTMLElement>(
            "[data-kp-editor-animation-diagnostics]"
          )
          ?.dataset["kpEditorAnimationRuntimePhaseId"];
      const target =
        context.pointer === undefined
          ? undefined
          : captureKpDevReviewSemanticTarget(
              context.eventTarget,
              context.pointer
            );
      const descriptorId =
        library?.dataset["kpEditorAnimationDescriptorId"];
      const projectionId =
        library?.dataset["kpAnimationWorkbenchRepresentation"] ??
        descriptorId;
      const motionPreference =
        player?.dataset["kpEditorAnimationAccessibilityPreference"];
      const motionMode =
        player?.dataset["kpEditorAnimationAccessibilityMode"];
      return {
        semantic: {
          documentId: "editor.semantic-animation-workbench",
          documentVersion: "1",
          assetId: animationId,
          progressPermille: Math.round(progress * 1_000),
          activeTransformationIds: [],
          focusRefs: [],
          playbackDirection:
            player?.dataset["kpEditorAnimationDirection"] === "rewind"
              ? "rewind"
              : "forward",
          ...(projectionId === undefined ? {} : { projectionId }),
          ...(activePhase === undefined ? {} : { activePhase }),
          ...(motionPreference === undefined
            ? {}
            : { motionPreference }),
          ...(motionMode === undefined ? {} : { motionMode }),
          ...(target === undefined ? {} : { target })
        },
        render: {
          rendererId:
            player
              ?.querySelector<HTMLElement>(
                "[data-kp-editor-animation-stage]"
              )
              ?.dataset["kpEditorAnimationSurface"] ??
            "editor-animation-player",
          motionAuthority: "editor-animation-playback-session",
          fontReady: ownerDocument.fonts.status === "loaded",
          ownerIds: [animationId, descriptorId]
            .filter((value): value is string => value !== undefined)
        },
        temporalTrace: [
          {
            offsetMs: 0,
            progressPermille: Math.round(progress * 1_000),
            ...(activePhase === undefined ? {} : { phase: activePhase })
          }
        ]
      };
    }
  };
}

function requiredElement(
  ownerDocument: Document,
  selector: string
): HTMLElement {
  const element = ownerDocument.querySelector<HTMLElement>(selector);
  if (element === null) {
    throw new Error(`Workbench capture requires ${selector}`);
  }
  return element;
}

function boundedProgress(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed)
    ? Math.min(1, Math.max(0, parsed))
    : 0;
}
