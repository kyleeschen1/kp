/// <reference types="vite/client" />

import {
  kpPlaceValueAdditionAnimationId
} from "../animation/place-value-addition-adapter.ts";
import {
  kpPlaceValueAdditionOutlineAnchors
} from "../semantic/place-value-addition-fold-plan.ts";
import {
  createKpPlaceValueAdditionRuntimeController,
  type KpPlaceValueAdditionRuntimeController
} from "../rendering/place-value-addition-runtime-controller.ts";
import {
  dispatchKpEditorAnimationPlaybackAction,
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

interface PlaceValueSurfaceSession {
  readonly controller: KpPlaceValueAdditionRuntimeController;
  readonly visibilityListener: () => void;
  viewportWidth: number;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement, PlaceValueSurfaceSession>();

export const kpEditorPlaceValueAdditionSurfaceAdapter:
KpEditorAnimationSurfaceAdapter = {
  id: "editor-animation-surface.place-value-addition.synchronized",
  slotKind: "diagram",
  priority: 120,
  supports(state) {
    return state.animationId === kpPlaceValueAdditionAnimationId;
  },
  render({ player, slot, state }) {
    let session = sessions.get(player);
    if (session === undefined) {
      session = mountPlaceValueSurface(player, slot);
      sessions.set(player, session);
    }
    if (session.disposed) return;

    const viewportWidth = measuredViewportWidth(slot);
    if (viewportWidth !== session.viewportWidth) {
      session.viewportWidth = viewportWidth;
      session.controller.setViewportWidth(viewportWidth);
    }
    const visualProgress =
      state.direction === "forward" ? state.progress : 1 - state.progress;
    session.controller.requestProgress({
      progress: visualProgress,
      source: playbackSource(state.playbackStatus)
    });
  }
};

export function registerKpEditorPlaceValueAdditionSurfaceAdapter():
() => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorPlaceValueAdditionSurfaceAdapter
  );
}

function mountPlaceValueSurface(
  player: HTMLElement,
  slot: HTMLElement
): PlaceValueSurfaceSession {
  const viewportWidth = measuredViewportWidth(slot);
  slot.replaceChildren();
  const controller = createKpPlaceValueAdditionRuntimeController({
    document: player.ownerDocument,
    viewportWidth,
    onOutlineRequest: (anchorId) => {
      const anchor = kpPlaceValueAdditionOutlineAnchors.find(
        (candidate) => candidate.id === anchorId
      );
      if (anchor === undefined) {
        throw new Error(`Unknown place-value outline anchor ${anchorId}.`);
      }
      // Outline buttons seek the existing player. The controller receives the
      // resulting frame event and therefore never becomes a second clock.
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: anchor.progressPermille / 1_000
      });
    }
  });
  controller.mount(slot);
  const visibilityListener = (): void => {
    controller.setSuspended(player.ownerDocument.hidden);
  };
  player.ownerDocument.addEventListener(
    "visibilitychange",
    visibilityListener
  );
  if (player.ownerDocument.hidden) controller.setSuspended(true);
  const session: PlaceValueSurfaceSession = {
    controller,
    viewportWidth,
    visibilityListener,
    disposed: false
  };
  player.addEventListener(
    KP_EDITOR_ANIMATION_DISPOSE_EVENT,
    () => disposePlaceValueSurface(player, session),
    { once: true }
  );
  return session;
}

function disposePlaceValueSurface(
  player: HTMLElement,
  session: PlaceValueSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  player.ownerDocument.removeEventListener(
    "visibilitychange",
    session.visibilityListener
  );
  session.controller.dispose();
  sessions.delete(player);
}

function measuredViewportWidth(slot: HTMLElement): number {
  const width = slot.getBoundingClientRect().width || slot.clientWidth;
  const documentWidth =
    slot.ownerDocument.documentElement.clientWidth;
  return Math.max(1, Math.round(width || documentWidth || 390));
}

function playbackSource(
  status: "idle" | "playing" | "paused" | "complete"
): "initial" | "autoplay" | "controls" {
  if (status === "idle") return "initial";
  if (status === "playing") return "autoplay";
  return "controls";
}
