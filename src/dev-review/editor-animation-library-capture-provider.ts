import type {
  KpDevReviewCaptureContext,
  KpDevReviewCaptureProvider
} from "./capture-provider.ts";
import {
  kpExactFractionQuantityLayoutPolicy
} from "../semantic/exact-fraction-quantity-layout-policy.ts";
import { captureKpDevReviewSemanticTarget } from "./semantic-target.ts";

export function createKpEditorAnimationLibraryCaptureProvider(
  ownerDocument: Document,
  options: {
    readonly providerId?: string | undefined;
    readonly rootSelector?: string | undefined;
    readonly documentId?: string | undefined;
  } = {}
): KpDevReviewCaptureProvider {
  const providerId = options.providerId ?? "editor.animation-library";
  const rootSelector = options.rootSelector ??
    "[data-kp-editor-animation-library]";
  const documentId = options.documentId ?? "editor.animation-library";
  return {
    id: providerId,
    priority: 100,
    matches: () =>
      ownerDocument.querySelector(
        `${rootSelector} [data-kp-editor-animation-player]`
      ) !== null,
    capture(context: KpDevReviewCaptureContext) {
      const library = requiredElement(
        ownerDocument,
        rootSelector
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
      const placeValue =
        player.dataset["kpPlaceValueProgressPermille"] !== undefined;
      const progressPermille = exactQuantity || placeValue
        ? boundedPermille(
            exactQuantity
              ? player.dataset["kpExactProgressPermille"]
              : player.dataset["kpPlaceValueProgressPermille"]
          )
        : boundedProgressPermille(
            player.dataset["kpEditorAnimationProgress"]
          );
      const animationProgressPermille = exactQuantity || placeValue
        ? boundedPermille(
            exactQuantity
              ? player.dataset["kpExactInputProgressPermille"]
              : player.dataset["kpPlaceValueInputProgressPermille"]
          )
        : progressPermille;
      const activeTransformation =
        player.dataset["kpExactPhase"] ??
        player.dataset["kpPlaceValueBeatId"];
      const activePhase =
        player.dataset["kpExactVisiblePhase"] ??
        player.dataset["kpPlaceValueActivePhase"] ??
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
      // Review diagnostics need the actual responsive regime for every
      // animation, not a generic host label that hides phone-only failures.
      const surfaceProfile =
        contentWidth < kpExactFractionQuantityLayoutPolicy.wideMinWidthPx
          ? "phone"
          : "wide";
      const target =
        context.pointer === undefined
          ? undefined
          : captureKpDevReviewSemanticTarget(
              context.eventTarget,
              context.pointer
            );
      const focusRefs = readIdList(player.dataset["kpExactFocusRefs"]);
      const placeValueFocusRefs = readIdList(
        player.dataset["kpPlaceValueFocusRefs"]
      );
      const pinnedNodeIds = readIdList(
        player.dataset["kpExactPinnedNodeIds"]
      );
      const rendererSessionId =
        player.dataset["kpExactRendererSessionId"] ??
        player.dataset["kpPlaceValueRendererSessionId"];
      const adapterId = player
        .querySelector<HTMLElement>(
          "[data-kp-editor-animation-adapter-id]"
        )
        ?.dataset["kpEditorAnimationAdapterId"];
      return {
        semantic: {
          documentId,
          documentVersion: "1",
          assetId: animationId,
          progressPermille,
          animationProgressPermille,
          activeTransformationIds:
            activeTransformation !== undefined &&
              isProtocolId(activeTransformation)
              ? [activeTransformation]
              : activePhase !== undefined && isProtocolId(activePhase)
                ? [activePhase]
                : [],
          focusRefs: exactQuantity ? focusRefs : placeValueFocusRefs,
          playbackDirection:
            player.dataset["kpEditorAnimationDirection"] === "rewind"
              ? "rewind"
              : "forward",
          projectionId:
            player.dataset["kpExactActiveRepresentation"] ??
            player.dataset["kpPlaceValueActiveRepresentation"] ??
            descriptorId,
          ...(
            (
              player.dataset["kpExactCheckpoint"] ??
              player.dataset["kpPlaceValueCheckpoint"]
            ) === undefined
            ? {}
            : {
                checkpointId:
                  player.dataset["kpExactCheckpoint"] ??
                  player.dataset["kpPlaceValueCheckpoint"]
              }),
          ...(
            (
              player.dataset["kpExactPhaseProgressPermille"] ??
              player.dataset["kpPlaceValuePhaseProgressPermille"]
            ) === undefined
            ? {}
            : {
                phaseProgressPermille: boundedPermille(
                  player.dataset["kpExactPhaseProgressPermille"] ??
                  player.dataset["kpPlaceValuePhaseProgressPermille"]
                )
              }),
          ...(activePhase === undefined ? {} : { activePhase }),
          ...(
            (
              player.dataset["kpExactFoldMode"] ??
              player.dataset["kpPlaceValueFoldMode"]
            ) === undefined
            ? {}
            : {
                foldMode:
                  player.dataset["kpExactFoldMode"] ??
                  player.dataset["kpPlaceValueFoldMode"]
              }),
          ...(pinnedNodeIds.length === 0
            ? {}
            : { foldDetail: `pinned:${pinnedNodeIds.join(",")}` }),
          ...(exactQuantity || placeValue
            ? {
                layoutPolicy: placeValue
                  ? player.dataset["kpPlaceValueLayoutPolicy"]
                  : surfaceProfile === "phone"
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
