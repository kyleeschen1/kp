import { createKpAnimationAssets } from "../animation/catalog.ts";
import {
  createKpEditorAnimationLibrary
} from "./animation-library.ts";
import {
  createKpEditorAnimationPlaybackSession,
  reduceKpEditorAnimationPlaybackSession,
  type KpEditorAnimationPlaybackAction,
  type KpEditorAnimationPlaybackSession
} from "./animation-playback-session.ts";

export const KP_EDITOR_ANIMATION_FRAME_EVENT = "kp-editor-animation-frame";

const sessions = new WeakMap<HTMLElement, KpEditorAnimationPlaybackSession>();
const frameRequests = new WeakMap<HTMLElement, number>();

export function hydrateKpEditorAnimationPlayers(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-kp-editor-animation-player]")
    .forEach(hydrateKpEditorAnimationPlayer);
}

export function getKpEditorAnimationPlaybackSession(
  player: HTMLElement
): KpEditorAnimationPlaybackSession | undefined {
  return sessions.get(player);
}

export function dispatchKpEditorAnimationPlaybackAction(
  player: HTMLElement,
  action: KpEditorAnimationPlaybackAction
): void {
  const session = sessions.get(player);
  if (session === undefined) return;

  if (action.type !== "play" && action.type !== "tick" && action.type !== "rewind") {
    cancelPlayerFrame(player);
  }

  const nextSession = reduceKpEditorAnimationPlaybackSession(session, action);
  sessions.set(player, nextSession);
  syncPlayerDom(player, nextSession);

  if (nextSession.player.playbackStatus === "playing") {
    schedulePlayerFrame(player);
  } else {
    cancelPlayerFrame(player);
  }
}

function hydrateKpEditorAnimationPlayer(player: HTMLElement): void {
  if (player.dataset["kpEditorAnimationHydrated"] === "true") return;

  const descriptorId = player.dataset["kpEditorAnimationDescriptorId"];
  const animationId = player.dataset["kpEditorAnimationId"];
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.id === descriptorId
  );
  const catalog = createKpAnimationAssets();
  const animation = catalog.find((candidate) => candidate.id === animationId);

  if (descriptor === undefined || animation === undefined) {
    throw new Error(
      `Cannot hydrate editor animation player for ${descriptorId ?? "unknown descriptor"} / ${animationId ?? "unknown animation"}.`
    );
  }

  const progress = Number(player.dataset["kpEditorAnimationProgress"] ?? 0);
  const session = createKpEditorAnimationPlaybackSession({
    descriptor,
    animation,
    catalog,
    progress
  });

  sessions.set(player, session);
  player.dataset["kpEditorAnimationHydrated"] = "true";
  player.addEventListener("click", handlePlayerClick);
  player.addEventListener("input", handlePlayerInput);
  syncPlayerDom(player, session);
}

function handlePlayerClick(event: MouseEvent): void {
  const player = event.currentTarget;
  const button = event.target instanceof Element
    ? event.target.closest<HTMLButtonElement>("button[data-action]")
    : null;

  if (!(player instanceof HTMLElement) || button === null) return;

  const nowMs = performance.now();
  switch (button.dataset["action"]) {
    case "play-editor-animation":
      dispatchKpEditorAnimationPlaybackAction(player, { type: "play", nowMs });
      return;
    case "pause-editor-animation":
      dispatchKpEditorAnimationPlaybackAction(player, { type: "pause", nowMs });
      return;
    case "step-editor-animation":
      dispatchKpEditorAnimationPlaybackAction(player, { type: "step" });
      return;
    case "rewind-editor-animation":
      dispatchKpEditorAnimationPlaybackAction(player, { type: "rewind", nowMs });
      return;
    case "reset-editor-animation":
      dispatchKpEditorAnimationPlaybackAction(player, { type: "reset" });
      return;
  }
}

function handlePlayerInput(event: Event): void {
  const player = event.currentTarget;
  const input = event.target;

  if (
    !(player instanceof HTMLElement) ||
    !(input instanceof HTMLInputElement) ||
    input.dataset["action"] !== "seek-editor-animation"
  ) {
    return;
  }

  dispatchKpEditorAnimationPlaybackAction(player, {
    type: "seek",
    progress: Number(input.value)
  });
}

function schedulePlayerFrame(player: HTMLElement): void {
  if (frameRequests.has(player)) return;

  const requestId = requestAnimationFrame((nowMs) => {
    frameRequests.delete(player);
    if (!player.isConnected) return;

    dispatchKpEditorAnimationPlaybackAction(player, { type: "tick", nowMs });
  });
  frameRequests.set(player, requestId);
}

function cancelPlayerFrame(player: HTMLElement): void {
  const requestId = frameRequests.get(player);
  if (requestId === undefined) return;

  cancelAnimationFrame(requestId);
  frameRequests.delete(player);
}

function syncPlayerDom(
  player: HTMLElement,
  session: KpEditorAnimationPlaybackSession
): void {
  const state = session.player;
  player.dataset["kpEditorAnimationStatus"] = state.playbackStatus;
  player.dataset["kpEditorAnimationDirection"] = state.direction;
  player.dataset["kpEditorAnimationProgress"] = String(state.progress);

  const scrubber = player.querySelector<HTMLInputElement>(
    '[data-action="seek-editor-animation"]'
  );
  if (scrubber !== null) scrubber.value = String(state.progress);

  player.querySelector<HTMLOutputElement>(
    "[data-kp-editor-animation-progress-label]"
  )?.replaceChildren(document.createTextNode(`${Math.round(state.progress * 100)}%`));
  player.querySelector<HTMLElement>(
    "[data-kp-editor-animation-status-label]"
  )?.replaceChildren(document.createTextNode(playerStatusLabel(session)));

  const playButton = player.querySelector<HTMLButtonElement>(
    '[data-action="play-editor-animation"]'
  );
  const pauseButton = player.querySelector<HTMLButtonElement>(
    '[data-action="pause-editor-animation"]'
  );
  if (playButton !== null) playButton.disabled = state.playbackStatus === "playing";
  if (pauseButton !== null) pauseButton.disabled = state.playbackStatus !== "playing";

  player.dispatchEvent(new CustomEvent(KP_EDITOR_ANIMATION_FRAME_EVENT, {
    bubbles: true,
    detail: state
  }));
}

function playerStatusLabel(session: KpEditorAnimationPlaybackSession): string {
  const { playbackStatus, direction } = session.player;
  const status = playbackStatus === "complete"
    ? "Complete"
    : `${playbackStatus.slice(0, 1).toUpperCase()}${playbackStatus.slice(1)}`;
  return `${status} · ${direction === "rewind" ? "rewind" : "forward"}`;
}
