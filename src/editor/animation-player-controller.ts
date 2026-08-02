import { loadKpAnimationAsset } from "../animation/catalog-loader.ts";
import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  createKpEditorAnimationLibrary
} from "./animation-library.ts";
import {
  createKpEditorAnimationPlaybackSession,
  replaceKpEditorAnimationPlaybackSessionAsset,
  reduceKpEditorAnimationPlaybackSession,
  type KpEditorAnimationPlaybackAction,
  type KpEditorAnimationPlaybackSession
} from "./animation-playback-session.ts";
import {
  createKpEditorAnimationAuthoringState,
  createKpEditorAnimationRegenerationRequest,
  updateKpEditorAnimationAuthoringControl,
  type KpEditorAnimationAuthoringControlId,
  type KpEditorAnimationAuthoringState
} from "./animation-authoring-controls.ts";
import {
  createKpRenderQualityState,
  freezeKpRenderQualityState,
  kpRenderQualityPreferencePending,
  normalizeKpRenderQualityPreference,
  releaseKpRenderQualityState,
  selectKpRenderQualityPreference,
  type KpRenderQualityCapabilities,
  type KpRenderQualityState
} from "../animation/render-quality.ts";

export const KP_EDITOR_ANIMATION_FRAME_EVENT = "kp-editor-animation-frame";
export const KP_EDITOR_ANIMATION_DISPOSE_EVENT =
  "kp-editor-animation-dispose";
export const KP_EDITOR_ANIMATION_REGENERATION_EVENT =
  "kp-editor-animation-regeneration-request";
export const KP_EDITOR_ANIMATION_LOAD_EVENT =
  "kp-editor-animation-load";
export const KP_EDITOR_RENDER_QUALITY_STORAGE_KEY =
  "kp.editor.animation.render-quality.v1";

export type KpEditorAnimationPresentationTuningKind =
  | "gestalt-style"
  | "focus-experiment";

const sessions = new WeakMap<HTMLElement, KpEditorAnimationPlaybackSession>();
const authoringStates = new WeakMap<HTMLElement, KpEditorAnimationAuthoringState>();
const renderQualityStates = new WeakMap<HTMLElement, KpRenderQualityState>();
const frameRequests = new WeakMap<HTMLElement, number>();
type AnimationPlayerGestaltCapabilityClient = typeof import(
  "./animation-player-gestalt-capability.ts"
);
let animationPlayerGestaltCapability:
  | AnimationPlayerGestaltCapabilityClient
  | undefined;
let animationPlayerGestaltCapabilityPromise:
  | Promise<AnimationPlayerGestaltCapabilityClient>
  | undefined;

export function hydrateKpEditorAnimationPlayers(
  root: ParentNode,
  options: {
    readonly animationOverrides?: readonly KpAnimationAsset[] | undefined;
  } = {}
): void {
  root.querySelectorAll<HTMLElement>("[data-kp-editor-animation-player]")
    .forEach((player) => {
      const animationId = player.dataset["kpEditorAnimationId"];
      const override = options.animationOverrides?.find(
        ({ id }) => id === animationId
      );
      void hydrateKpEditorAnimationPlayer(player, override).catch((error: unknown) => {
        markPlayerLoadFailure(player, error);
      });
    });
}

export function pauseKpEditorAnimationPlayers(
  root: ParentNode,
  nowMs: number = performance.now()
): void {
  root.querySelectorAll<HTMLElement>("[data-kp-editor-animation-player]")
    .forEach((player) => {
      const session = sessions.get(player);
      if (session?.player.playbackStatus !== "playing") return;
      dispatchKpEditorAnimationPlaybackAction(player, { type: "pause", nowMs });
    });
}

export function disposeKpEditorAnimationPlayers(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-kp-editor-animation-player]")
    .forEach((player) => {
      // Surface adapters can own observers or render sessions that WeakMap
      // collection alone cannot release; signal them before detaching the DOM.
      player.dispatchEvent(new Event(KP_EDITOR_ANIMATION_DISPOSE_EVENT));
      cancelPlayerFrame(player);
      player.removeEventListener("click", handlePlayerClick);
      player.removeEventListener("input", handlePlayerInput);
      player.removeEventListener("keydown", handlePlayerKeydown);
      sessions.delete(player);
      authoringStates.delete(player);
      renderQualityStates.delete(player);
      animationPlayerGestaltCapability
        ?.disposeKpEditorAnimationGestaltCapability(player);
      player.dataset["kpEditorAnimationDisposed"] = "true";
      delete player.dataset["kpEditorAnimationHydrated"];
    });
}

export function getKpEditorAnimationPlaybackSession(
  player: HTMLElement
): KpEditorAnimationPlaybackSession | undefined {
  return sessions.get(player);
}

export function getKpEditorAnimationAuthoringState(
  player: HTMLElement
): KpEditorAnimationAuthoringState | undefined {
  return authoringStates.get(player);
}

export function dispatchKpEditorAnimationPlaybackAction(
  player: HTMLElement,
  action: KpEditorAnimationPlaybackAction
): void {
  const session = sessions.get(player);
  if (session === undefined) return;

  syncRenderQualityForPlaybackAction(player, session, action);

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

export function replaceKpEditorAnimationPlaybackAsset(
  player: HTMLElement,
  animation: KpAnimationAsset
): void {
  const session = sessions.get(player);
  if (session === undefined) {
    throw new Error("Cannot replace an animation before its player is hydrated.");
  }
  const next = replaceKpEditorAnimationPlaybackSessionAsset({
    session,
    animation
  });
  sessions.set(player, next);
  cancelPlayerFrame(player);
  syncLoadedDiagnostics(player, next.animation, next.catalog);
  syncPlayerDom(player, next);
}

export function applyKpEditorAnimationPresentationTuning(
  player: HTMLElement,
  kind: KpEditorAnimationPresentationTuningKind,
  value: string
): void {
  void loadAnimationPlayerGestaltCapability().then((client) => {
    if (!player.isConnected) return;
    client.applyKpEditorAnimationGestaltTuning({ player, kind, value });
    resampleAfterPresentationTuning(player);
  });
}

async function hydrateKpEditorAnimationPlayer(
  player: HTMLElement,
  animationOverride?: KpAnimationAsset | undefined
): Promise<void> {
  if (player.dataset["kpEditorAnimationHydrated"] === "true" ||
    player.dataset["kpEditorAnimationLoading"] === "true") return;
  player.dataset["kpEditorAnimationLoading"] = "true";

  const descriptorId = player.dataset["kpEditorAnimationDescriptorId"];
  const animationId = player.dataset["kpEditorAnimationId"];
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.id === descriptorId
  );
  if (descriptor === undefined || animationId === undefined) {
    throw new Error(
      `Cannot hydrate editor animation player for ${descriptorId ?? "unknown descriptor"} / ${animationId ?? "unknown animation"}.`
    );
  }
  const [loaded, gestaltCapability] = await Promise.all([
    loadKpAnimationAsset(animationId),
    player.querySelector("[data-kp-editor-animation-gestalt-diagnostics]") ===
        null
      ? Promise.resolve(undefined)
      : loadAnimationPlayerGestaltCapability()
  ]);
  const animation = animationOverride ?? loaded.animation;
  if (animation.id !== animationId) {
    throw new Error(
      `Animation override ${animation.id} does not match player ${animationId}.`
    );
  }
  const catalog = loaded.catalog.some(({ id }) => id === animation.id)
    ? loaded.catalog.map((candidate) =>
        candidate.id === animation.id ? animation : candidate
      )
    : [...loaded.catalog, animation];
  const { packId } = loaded;
  if (!player.isConnected || player.dataset["kpEditorAnimationDisposed"] === "true") {
    return;
  }

  const progress = Number(player.dataset["kpEditorAnimationProgress"] ?? 0);
  const session = createKpEditorAnimationPlaybackSession({
    descriptor,
    animation,
    catalog,
    progress
  });

  sessions.set(player, session);
  const authoring = createKpEditorAnimationAuthoringState();
  authoringStates.set(player, authoring);
  // Review evidence needs the default even when the optional tuning inspector
  // never loads; the value is playback state, not diagnostic machinery.
  player.dataset["kpEditorAnimationFocusExperiment"] ??= "flat";
  gestaltCapability?.initializeKpEditorAnimationGestaltCapability(player);
  renderQualityStates.set(player, createKpRenderQualityState({
    preference: readPersistedRenderQualityPreference(),
    capabilities: currentRenderQualityCapabilities()
  }));
  syncAuthoringData(player, authoring);
  syncAccessibilityData(player, "system");
  syncExplanationProfileData(player, "explain");
  syncRenderQualityData(player);
  player.dataset["kpEditorAnimationPackId"] = packId;
  player.dataset["kpEditorAnimationHydrated"] = "true";
  delete player.dataset["kpEditorAnimationLoading"];
  player.addEventListener("click", handlePlayerClick);
  player.addEventListener("input", handlePlayerInput);
  player.addEventListener("keydown", handlePlayerKeydown);
  syncLoadedDiagnostics(player, animation, catalog);
  syncPlayerDom(player, session);
  player.dispatchEvent(new CustomEvent(KP_EDITOR_ANIMATION_LOAD_EVENT, {
    bubbles: true,
    detail: Object.freeze({ status: "ready" as const })
  }));
}

function syncLoadedDiagnostics(
  player: HTMLElement,
  animation: KpAnimationAsset,
  catalog: readonly KpAnimationAsset[]
): void {
  const current = player.closest("[data-kp-editor-animation-library]")
    ?.querySelector<HTMLElement>("[data-kp-editor-animation-diagnostics]");
  if (current === null || current === undefined) return;
  void import("./animation-diagnostics-capability.ts").then((client) => {
    if (!player.isConnected) return;
    client.syncKpEditorAnimationLoadedDiagnostics({
      player,
      animation,
      catalog
    });
  }).catch(() => {
    // Diagnostics are an optional development surface; a failed inspector
    // chunk must not turn otherwise-valid playback into an unhandled error.
  });
}

function markPlayerLoadFailure(player: HTMLElement, error: unknown): void {
  delete player.dataset["kpEditorAnimationLoading"];
  player.dataset["kpEditorAnimationLoadError"] = "true";
  const message = error instanceof Error ? error.message : "Animation pack failed to load.";
  const diagnostics = player.closest("[data-kp-editor-animation-library]")
    ?.querySelector<HTMLElement>("[data-kp-editor-animation-diagnostics]");
  if (diagnostics !== null && diagnostics !== undefined) {
    diagnostics.dataset["kpEditorAnimationDiagnosticsStatus"] = "error";
    diagnostics.querySelector<HTMLElement>("[data-kp-editor-animation-diagnostics-label]")
      ?.replaceChildren(document.createTextNode("Diagnostics: load error"));
    diagnostics.querySelector<HTMLElement>("[data-kp-editor-animation-diagnostics-counts]")
      ?.replaceChildren(document.createTextNode(message));
  }
  player.dispatchEvent(new CustomEvent(KP_EDITOR_ANIMATION_LOAD_EVENT, {
    bubbles: true,
    detail: Object.freeze({
      status: "failed" as const,
      message
    })
  }));
}

function handlePlayerClick(event: MouseEvent): void {
  const player = event.currentTarget;
  const button = event.target instanceof Element
    ? event.target.closest<HTMLButtonElement>("button[data-action]")
    : null;

  if (!(player instanceof HTMLElement) || button === null) return;

  const nowMs = performance.now();
  switch (button.dataset["action"]) {
    case "toggle-editor-animation": {
      const session = sessions.get(player);
      dispatchKpEditorAnimationPlaybackAction(
        player,
        session?.player.playbackStatus === "playing"
          ? { type: "pause", nowMs }
          : { type: "play", nowMs }
      );
      return;
    }
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

  if (!(player instanceof HTMLElement) || !(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;

  if (
    input instanceof HTMLSelectElement &&
    input.dataset["kpEditorAnimationGestaltStyleControl"] !== undefined
  ) {
    applyKpEditorAnimationPresentationTuning(
      player,
      "gestalt-style",
      input.value
    );
    return;
  }

  if (
    input instanceof HTMLSelectElement &&
    input.dataset["kpEditorAnimationFocusExperimentControl"] !== undefined
  ) {
    applyKpEditorAnimationPresentationTuning(
      player,
      "focus-experiment",
      input.value
    );
    return;
  }

  if (
    input instanceof HTMLSelectElement &&
    input.dataset["kpEditorAnimationExplanationProfileControl"] !== undefined
  ) {
    syncExplanationProfileData(player, input.value);
    const session = sessions.get(player);
    if (session !== undefined) {
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: session.player.progress
      });
    }
    return;
  }

  if (input instanceof HTMLSelectElement && input.dataset["kpEditorAnimationAccessibilityControl"] !== undefined) {
    syncAccessibilityData(player, input.value);
    animationPlayerGestaltCapability
      ?.invalidateKpEditorAnimationGestaltDiagnostics(player);
    const session = sessions.get(player);
    if (session !== undefined) {
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: session.player.progress
      });
    }
    return;
  }

  if (
    input instanceof HTMLSelectElement &&
    input.dataset["kpEditorAnimationQualityControl"] !== undefined
  ) {
    selectRenderQuality(player, input.value);
    return;
  }

  const authoringControlId = input.dataset["kpAnimationAuthoringControl"] as
    KpEditorAnimationAuthoringControlId | undefined;
  if (authoringControlId !== undefined) {
    updateAuthoringControl(player, authoringControlId, input);
    return;
  }

  if (!(input instanceof HTMLInputElement) || input.dataset["action"] !== "seek-editor-animation") return;

  dispatchKpEditorAnimationPlaybackAction(player, {
    type: "seek",
    progress: Number(input.value)
  });
}

function resampleAfterPresentationTuning(player: HTMLElement): void {
  const session = sessions.get(player);
  if (session === undefined) return;
  const paused = session.player.playbackStatus === "playing"
    ? reduceKpEditorAnimationPlaybackSession(session, {
        type: "pause",
        nowMs: performance.now()
      })
    : session;
  const resampled = reduceKpEditorAnimationPlaybackSession(paused, {
    type: "seek",
    progress: paused.player.progress
  });
  sessions.set(player, resampled);
  cancelPlayerFrame(player);
  syncPlayerDom(player, resampled);
}

function handlePlayerKeydown(event: KeyboardEvent): void {
  const player = event.currentTarget;
  if (!(player instanceof HTMLElement) || event.target !== player) return;
  const session = sessions.get(player);
  if (session === undefined) return;
  const nowMs = performance.now();
  switch (event.key) {
    case " ":
      event.preventDefault();
      dispatchKpEditorAnimationPlaybackAction(player,
        session.player.playbackStatus === "playing"
          ? { type: "pause", nowMs }
          : player.dataset["kpEditorAnimationAccessibilityMode"] === "static"
            ? { type: "step" }
            : { type: "play", nowMs });
      return;
    case "ArrowLeft":
      event.preventDefault();
      dispatchKpEditorAnimationPlaybackAction(player, { type: "step", delta: -keyboardStep(session) });
      return;
    case "ArrowRight":
      event.preventDefault();
      dispatchKpEditorAnimationPlaybackAction(player, { type: "step", delta: keyboardStep(session) });
      return;
    case "Home":
      event.preventDefault();
      dispatchKpEditorAnimationPlaybackAction(player, { type: "seek", progress: 0 });
      return;
    case "End":
      event.preventDefault();
      dispatchKpEditorAnimationPlaybackAction(player, { type: "seek", progress: 1 });
      return;
    case "r":
    case "R":
      event.preventDefault();
      dispatchKpEditorAnimationPlaybackAction(player, { type: "rewind", nowMs });
      return;
  }
}

function keyboardStep(session: KpEditorAnimationPlaybackSession): number {
  return 1 / Math.max(1, session.player.beatCount ?? 20);
}

function syncAccessibilityData(player: HTMLElement, preference: string): void {
  const normalizedPreference = ["system", "full-motion", "reduced-motion", "static", "narrated"]
    .includes(preference) ? preference : "system";
  const reducedBySystem = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const mode = normalizedPreference === "system"
    ? reducedBySystem ? "reduced-motion" : "full-motion"
    : normalizedPreference;
  player.dataset["kpEditorAnimationAccessibilityPreference"] = normalizedPreference;
  player.dataset["kpEditorAnimationAccessibilityMode"] = mode;
}

function syncExplanationProfileData(
  player: HTMLElement,
  requestedProfile: string
): void {
  const profile = requestedProfile === "fluent" ? "fluent" : "explain";
  player.dataset["kpEditorAnimationExplanationProfile"] = profile;
  const control = player.querySelector<HTMLSelectElement>(
    "[data-kp-editor-animation-explanation-profile-control]"
  );
  if (control !== null) control.value = profile;
}

function selectRenderQuality(player: HTMLElement, value: string): void {
  const preference = normalizeKpRenderQualityPreference(value);
  persistRenderQualityPreference(preference);
  const current = renderQualityStates.get(player) ?? createKpRenderQualityState();
  const next = selectKpRenderQualityPreference({
    state: current,
    preference,
    capabilities: currentRenderQualityCapabilities()
  });
  renderQualityStates.set(player, next);
  syncRenderQualityData(player);
  animationPlayerGestaltCapability
    ?.invalidateKpEditorAnimationGestaltDiagnostics(player);
  if (next.frozen) return;

  const session = sessions.get(player);
  if (session !== undefined) {
    dispatchKpEditorAnimationPlaybackAction(player, {
      type: "seek",
      progress: session.player.progress
    });
  }
}

function syncRenderQualityForPlaybackAction(
  player: HTMLElement,
  session: KpEditorAnimationPlaybackSession,
  action: KpEditorAnimationPlaybackAction
): void {
  const current = renderQualityStates.get(player) ?? createKpRenderQualityState({
    capabilities: currentRenderQualityCapabilities()
  });
  const capabilities = currentRenderQualityCapabilities();
  const next = action.type === "reset"
    ? releaseKpRenderQualityState({ state: current, capabilities })
    : action.type === "play" || action.type === "rewind"
      ? freezeKpRenderQualityState({
          state: session.player.playbackStatus === "complete"
            ? releaseKpRenderQualityState({ state: current, capabilities })
            : current,
          capabilities
        })
      : current;
  if (next === current) return;
  renderQualityStates.set(player, next);
  syncRenderQualityData(player);
}

function syncRenderQualityData(player: HTMLElement): void {
  const state = renderQualityStates.get(player);
  if (state === undefined) return;
  const pending = kpRenderQualityPreferencePending(state);
  player.dataset["kpEditorAnimationQualityPreference"] = state.preference;
  player.dataset["kpEditorAnimationQualityResolvedPreference"] =
    state.resolvedPreference;
  player.dataset["kpEditorAnimationQualityTier"] = state.profile.tier;
  player.dataset["kpEditorAnimationQualityFrozen"] = String(state.frozen);
  player.dataset["kpEditorAnimationQualityPending"] = String(pending);
  player.dataset["kpEditorAnimationQualityRevision"] = String(state.revision);
  player.dataset["kpEditorAnimationQualityParticleDensityScale"] =
    String(state.profile.particleDensityScale);
  player.dataset["kpEditorAnimationQualityMicroMotionScale"] =
    String(state.profile.microMotionScale);
  player.style.setProperty(
    "--kp-render-quality-shadow-scale",
    String(state.profile.shadowScale)
  );
  player.style.setProperty(
    "--kp-render-quality-depth-scale",
    String(state.profile.depthScale)
  );
  player.style.setProperty(
    "--kp-render-quality-texture-subdivision-scale",
    String(state.profile.textureSubdivisionScale)
  );
  player.style.setProperty(
    "--kp-render-quality-particle-density-scale",
    String(state.profile.particleDensityScale)
  );
  player.style.setProperty(
    "--kp-render-quality-micro-motion-scale",
    String(state.profile.microMotionScale)
  );
  const control = player.querySelector<HTMLSelectElement>(
    "[data-kp-editor-animation-quality-control]"
  );
  if (control !== null) control.value = state.preference;
  player.querySelector<HTMLOutputElement>(
    "[data-kp-editor-animation-quality-status]"
  )?.replaceChildren(document.createTextNode(
    pending
      ? `${state.profile.tier} · ${state.preference} next playback`
      : state.preference === state.profile.tier
        ? state.profile.tier
        : `${state.preference} → ${state.profile.tier}`
  ));
}

function currentRenderQualityCapabilities(): KpRenderQualityCapabilities {
  const extendedNavigator = navigator as Navigator & {
    readonly deviceMemory?: number | undefined;
    readonly connection?: { readonly saveData?: boolean | undefined } | undefined;
  };
  return {
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemoryGb: extendedNavigator.deviceMemory,
    saveData: extendedNavigator.connection?.saveData
  };
}

function readPersistedRenderQualityPreference() {
  try {
    return normalizeKpRenderQualityPreference(
      globalThis.localStorage?.getItem(KP_EDITOR_RENDER_QUALITY_STORAGE_KEY)
    );
  } catch {
    return "auto" as const;
  }
}

function persistRenderQualityPreference(preference: string): void {
  try {
    globalThis.localStorage?.setItem(
      KP_EDITOR_RENDER_QUALITY_STORAGE_KEY,
      preference
    );
  } catch {
    // Storage can be denied in embedded or privacy-restricted contexts; the
    // in-memory selection still applies to the current player.
  }
}

function updateAuthoringControl(
  player: HTMLElement,
  controlId: KpEditorAnimationAuthoringControlId,
  input: HTMLInputElement | HTMLSelectElement
): void {
  const current = authoringStates.get(player) ?? createKpEditorAnimationAuthoringState();
  const value = input instanceof HTMLInputElement && input.type === "checkbox"
    ? input.checked
    : input.value;
  const next = updateKpEditorAnimationAuthoringControl({
    state: current,
    controlId,
    value
  });
  authoringStates.set(player, next);
  syncAuthoringData(player, next);
  animationPlayerGestaltCapability
    ?.invalidateKpEditorAnimationGestaltDiagnostics(player);
  player.dataset["kpEditorAnimationMotionPlanInvalidated"] = "true";
  player.querySelector<HTMLOutputElement>("[data-kp-editor-animation-authoring-status]")
    ?.replaceChildren(document.createTextNode(
      `Plan revision ${next.revision} · semantic edits regenerate canonical operations`
    ));
  if (controlId === "tempo") {
    dispatchKpEditorAnimationPlaybackAction(player, {
      type: "set-tempo",
      multiplier: next.presentation.tempo
    });
  } else {
    const session = sessions.get(player);
    if (session !== undefined) syncPlayerDom(player, session);
  }
  player.dispatchEvent(new CustomEvent(KP_EDITOR_ANIMATION_REGENERATION_EVENT, {
    bubbles: true,
    detail: createKpEditorAnimationRegenerationRequest({
      animationId: nextAnimationId(player),
      state: next
    })
  }));
}

function syncAuthoringData(
  player: HTMLElement,
  state: KpEditorAnimationAuthoringState
): void {
  player.dataset["kpEditorAnimationAuthoringRevision"] = String(state.revision);
  player.dataset["kpEditorAnimationSpacing"] = state.presentation.spacing;
  player.dataset["kpEditorAnimationTempo"] = String(state.presentation.tempo);
  player.dataset["kpEditorAnimationPathPreference"] = state.presentation.pathPreference;
  player.dataset["kpEditorAnimationRoleMode"] = state.semantic.roleMode;
  player.dataset["kpEditorAnimationLineageMode"] = state.semantic.lineageMode;
  player.dataset["kpEditorAnimationProvenanceVisibility"] =
    String(state.semantic.provenanceVisibility);
  player.dataset["kpEditorAnimationSaliencePolicy"] = state.semantic.saliencePolicy;
  player.dataset["kpEditorAnimationCorrectnessDisclosure"] =
    state.semantic.correctnessDisclosure;
  player.dataset["kpEditorAnimationGapPolicy"] = state.semantic.gapPolicy;
}

function nextAnimationId(player: HTMLElement): string {
  return player.dataset["kpEditorAnimationId"] ?? "unknown-animation";
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

  const toggleButton = player.querySelector<HTMLButtonElement>(
    '[data-action="toggle-editor-animation"]'
  );
  if (toggleButton !== null) {
    const label = state.playbackStatus === "playing"
      ? "Pause"
      : state.playbackStatus === "complete"
        ? "Replay"
        : "Play";
    toggleButton.disabled =
      player.dataset["kpEditorAnimationAccessibilityMode"] === "static";
    toggleButton.textContent = label;
    toggleButton.setAttribute("aria-label", `${label} animation`);
  }
  animationPlayerGestaltCapability
    ?.syncKpEditorAnimationGestaltAtCadence(player, session);

  player.dispatchEvent(new CustomEvent(KP_EDITOR_ANIMATION_FRAME_EVENT, {
    bubbles: true,
    detail: state
  }));
}

function loadAnimationPlayerGestaltCapability():
  Promise<AnimationPlayerGestaltCapabilityClient> {
  return animationPlayerGestaltCapabilityPromise ??= import(
    "./animation-player-gestalt-capability.ts"
  ).then((client) => {
    animationPlayerGestaltCapability = client;
    return client;
  });
}

function playerStatusLabel(session: KpEditorAnimationPlaybackSession): string {
  const { playbackStatus, direction } = session.player;
  const status = playbackStatus === "complete"
    ? "Complete"
    : `${playbackStatus.slice(0, 1).toUpperCase()}${playbackStatus.slice(1)}`;
  return `${status} · ${direction === "rewind" ? "rewind" : "forward"}`;
}
