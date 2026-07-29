import type {
  KpDevReviewCaptureContext,
  KpDevReviewCaptureProvider
} from "./capture-provider.ts";
import {
  kpExactFractionQuantityLayoutPolicy
} from "../semantic/exact-fraction-quantity-layout-policy.ts";
import { captureKpDevReviewSemanticTarget } from "./semantic-target.ts";

export function createKpEditorAnimationLibraryCaptureProvider(
  ownerDocument: Document
): KpDevReviewCaptureProvider {
  return {
    id: "editor.animation-library",
    priority: 100,
    matches: () =>
      ownerDocument.querySelector(
        "[data-kp-editor-animation-library] [data-kp-editor-animation-player]"
      ) !== null,
    capture(context: KpDevReviewCaptureContext) {
      const library = requiredElement(
        ownerDocument,
        "[data-kp-editor-animation-library]"
      );
      const player = requiredElement(
        library,
        "[data-kp-editor-animation-player]"
      );
      const stage = requiredElement(
        player,
        "[data-kp-editor-animation-stage]"
      );
      const ownerWindow = ownerDocument.defaultView;
      const animationId = requiredDataset(player, "kpEditorAnimationId");
      const descriptorId = requiredDataset(
        player,
        "kpEditorAnimationDescriptorId"
      );
      const exactQuantity = player.dataset["kpExactProgressPermille"] !==
        undefined;
      const progressPermille = exactQuantity
        ? boundedPermille(player.dataset["kpExactProgressPermille"])
        : boundedProgressPermille(
            player.dataset["kpEditorAnimationProgress"]
          );
      const activePhase =
        player.dataset["kpExactPhase"] ??
        library.dataset["kpEditorAnimationLiveVisualPhaseId"] ??
        library
          .querySelector<HTMLElement>(
            "[data-kp-editor-animation-diagnostics]"
          )
          ?.dataset["kpEditorAnimationRuntimePhaseId"];
      const shellRect = library.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const contentWidth = positiveDimension(
        ownerWindow?.innerWidth ?? ownerDocument.documentElement.clientWidth
      );
      const contentHeight = positiveDimension(
        ownerWindow?.innerHeight ?? ownerDocument.documentElement.clientHeight
      );
      const surfaceProfile = exactQuantity
        ? contentWidth < kpExactFractionQuantityLayoutPolicy.wideMinWidthPx
          ? "phone"
          : "wide"
        : "editor-animation-library";
      const target =
        context.pointer === undefined
          ? undefined
          : captureKpDevReviewSemanticTarget(
              context.eventTarget,
              context.pointer
            );
      const focusRefs = readIdList(player.dataset["kpExactFocusRefs"]);
      const pinnedNodeIds = readIdList(
        player.dataset["kpExactPinnedNodeIds"]
      );
      const rendererSessionId =
        player.dataset["kpExactRendererSessionId"];
      const adapterId = player
        .querySelector<HTMLElement>(
          "[data-kp-editor-animation-adapter-id]"
        )
        ?.dataset["kpEditorAnimationAdapterId"];
      return {
        semantic: {
          documentId: "editor.animation-library",
          documentVersion: "1",
          assetId: animationId,
          progressPermille,
          animationProgressPermille: progressPermille,
          activeTransformationIds:
            activePhase !== undefined && isProtocolId(activePhase)
              ? [activePhase]
              : [],
          focusRefs,
          playbackDirection:
            player.dataset["kpEditorAnimationDirection"] === "rewind"
              ? "rewind"
              : "forward",
          projectionId:
            player.dataset["kpExactActiveRepresentation"] ?? descriptorId,
          ...(player.dataset["kpExactCheckpoint"] === undefined
            ? {}
            : {
                checkpointId: player.dataset["kpExactCheckpoint"]
              }),
          ...(player.dataset["kpExactPhaseProgressPermille"] === undefined
            ? {}
            : {
                phaseProgressPermille: boundedPermille(
                  player.dataset["kpExactPhaseProgressPermille"]
                )
              }),
          ...(activePhase === undefined ? {} : { activePhase }),
          ...(player.dataset["kpExactFoldMode"] === undefined
            ? {}
            : { foldMode: player.dataset["kpExactFoldMode"] }),
          ...(pinnedNodeIds.length === 0
            ? {}
            : { foldDetail: `pinned:${pinnedNodeIds.join(",")}` }),
          ...(exactQuantity
            ? {
                layoutPolicy: surfaceProfile === "phone"
                  ? kpExactFractionQuantityLayoutPolicy.phonePolicy
                  : kpExactFractionQuantityLayoutPolicy.widePolicy
              }
            : {}),
          ...(player.dataset["kpEditorAnimationAccessibilityPreference"] ===
            undefined
            ? {}
            : {
                motionPreference:
                  player.dataset[
                    "kpEditorAnimationAccessibilityPreference"
                  ]
              }),
          ...(player.dataset["kpEditorAnimationAccessibilityMode"] ===
            undefined
            ? {}
            : {
                motionMode:
                  player.dataset["kpEditorAnimationAccessibilityMode"]
              }),
          ...(target === undefined ? {} : { target })
        },
        render: {
          rendererId:
            stage.dataset["kpEditorAnimationSurface"] ??
            "editor-animation-player",
          motionAuthority: "editor-animation-playback-session",
          fontReady: ownerDocument.fonts.status === "loaded",
          surface: {
            profile: surfaceProfile,
            shellViewport: {
              width: positiveDimension(shellRect.width),
              height: positiveDimension(shellRect.height)
            },
            contentViewport: {
              width: contentWidth,
              height: contentHeight,
              devicePixelRatio: positiveDimension(
                ownerWindow?.devicePixelRatio ?? 1
              )
            },
            stageViewport: {
              left: stageRect.left,
              top: stageRect.top,
              width: positiveDimension(stageRect.width),
              height: positiveDimension(stageRect.height)
            }
          },
          ownerIds: uniqueProtocolIds([
            animationId,
            descriptorId,
            rendererSessionId,
            adapterId
          ])
        },
        temporalTrace: [{
          offsetMs: 0,
          progressPermille,
          ...(activePhase === undefined ? {} : { phase: activePhase })
        }]
      };
    }
  };
}

function readIdList(value: string | undefined): readonly string[] {
  if (value === undefined || value === "") return [];
  return uniqueProtocolIds(value.split(","));
}

function uniqueProtocolIds(
  values: readonly (string | undefined)[]
): readonly string[] {
  return [...new Set(
    values.filter(
      (value): value is string =>
        value !== undefined && isProtocolId(value)
    )
  )];
}

function isProtocolId(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u.test(value);
}

function boundedProgressPermille(value: string | undefined): number {
  const progress = Number(value ?? 0);
  return Number.isFinite(progress)
    ? Math.round(Math.max(0, Math.min(1, progress)) * 1_000)
    : 0;
}

function boundedPermille(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed)
    ? Math.round(Math.max(0, Math.min(1_000, parsed)))
    : 0;
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
    throw new Error(`Editor Animation Library capture requires ${selector}`);
  }
  return element;
}

function requiredDataset(
  element: HTMLElement,
  key: string
): string {
  const value = element.dataset[key]?.trim();
  if (value === undefined || value === "") {
    throw new Error(
      `Editor Animation Library capture requires data-${key}`
    );
  }
  return value;
}
