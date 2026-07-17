import { loadKpAnimationAsset } from "../animation/catalog-loader.ts";
import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  createKpEditorAnimationLibrary
} from "./animation-library.ts";
import {
  createKpEditorAnimationPlaybackSession,
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
  createKpEditorAnimationGestaltInspection,
  parseKpEditorGestaltStyleRef
} from "./animation-gestalt-inspector.ts";
import type { KpGestaltStyleRef } from "../animation/gestalt-style.ts";
import {
  createKpElevatedFocusComparison,
  type KpFocusExperimentMode
} from "../animation/elevated-focus-experiment.ts";
import type { KpChoreographyEnvelopePhaseId } from "../animation/choreography-plan.ts";
import {
  createKpEditorAnimationDiagnostics,
  renderKpEditorAnimationDiagnostics
} from "./animation-diagnostics.ts";
import {
  createLinearSolveRuntimeVisualFrameSample
} from "../rendering/linear-solve-runtime-visual-sample.ts";

export const KP_EDITOR_ANIMATION_FRAME_EVENT = "kp-editor-animation-frame";
export const KP_EDITOR_ANIMATION_REGENERATION_EVENT =
  "kp-editor-animation-regeneration-request";

const sessions = new WeakMap<HTMLElement, KpEditorAnimationPlaybackSession>();
const authoringStates = new WeakMap<HTMLElement, KpEditorAnimationAuthoringState>();
const gestaltStyles = new WeakMap<HTMLElement, KpGestaltStyleRef>();
const focusExperimentModes = new WeakMap<HTMLElement, KpFocusExperimentMode>();
const frameRequests = new WeakMap<HTMLElement, number>();

export function hydrateKpEditorAnimationPlayers(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-kp-editor-animation-player]")
    .forEach((player) => {
      void hydrateKpEditorAnimationPlayer(player).catch((error: unknown) => {
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
      cancelPlayerFrame(player);
      player.removeEventListener("click", handlePlayerClick);
      player.removeEventListener("input", handlePlayerInput);
      player.removeEventListener("keydown", handlePlayerKeydown);
      sessions.delete(player);
      authoringStates.delete(player);
      gestaltStyles.delete(player);
      focusExperimentModes.delete(player);
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

async function hydrateKpEditorAnimationPlayer(player: HTMLElement): Promise<void> {
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
  const { animation, catalog, packId } = await loadKpAnimationAsset(animationId);
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
  gestaltStyles.set(
    player,
    parseKpEditorGestaltStyleRef(
      player.dataset["kpEditorAnimationGestaltSelectedStyle"]
    )
  );
  focusExperimentModes.set(player, "flat");
  syncAuthoringData(player, authoring);
  syncAccessibilityData(player, "full-motion");
  player.dataset["kpEditorAnimationPackId"] = packId;
  player.dataset["kpEditorAnimationHydrated"] = "true";
  delete player.dataset["kpEditorAnimationLoading"];
  player.addEventListener("click", handlePlayerClick);
  player.addEventListener("input", handlePlayerInput);
  player.addEventListener("keydown", handlePlayerKeydown);
  syncLoadedDiagnostics(player, animation, catalog);
  syncPlayerDom(player, session);
}

function syncLoadedDiagnostics(
  player: HTMLElement,
  animation: KpAnimationAsset,
  catalog: readonly KpAnimationAsset[]
): void {
  const solveXVisualSample = animation.id === "animation.linear-solve.solve-x"
    ? createLinearSolveRuntimeVisualFrameSample({ progress: 0.5 })
    : undefined;
  const diagnostics = createKpEditorAnimationDiagnostics({
    animation,
    catalog,
    ...(solveXVisualSample === undefined ? {} : {
      runtimeFrame: solveXVisualSample.runtimeFrame,
      visualFrame: solveXVisualSample.visualFrame
    })
  });
  const current = player.closest("[data-kp-editor-animation-library]")
    ?.querySelector<HTMLElement>("[data-kp-editor-animation-diagnostics]");
  if (current !== null && current !== undefined) {
    current.outerHTML = renderKpEditorAnimationDiagnostics(diagnostics);
  }
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

  if (!(player instanceof HTMLElement) || !(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;

  if (
    input instanceof HTMLSelectElement &&
    input.dataset["kpEditorAnimationGestaltStyleControl"] !== undefined
  ) {
    selectGestaltStyle(player, input.value);
    return;
  }

  if (
    input instanceof HTMLSelectElement &&
    input.dataset["kpEditorAnimationFocusExperimentControl"] !== undefined
  ) {
    selectFocusExperiment(player, input.value);
    return;
  }

  if (input instanceof HTMLSelectElement && input.dataset["kpEditorAnimationAccessibilityControl"] !== undefined) {
    syncAccessibilityData(player, input.value);
    const session = sessions.get(player);
    if (session !== undefined) {
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: session.player.progress
      });
    }
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

function selectFocusExperiment(player: HTMLElement, value: string): void {
  const mode: KpFocusExperimentMode =
    value === "elevated" || value === "no-depth" ? value : "flat";
  focusExperimentModes.set(player, mode);
  player.dataset["kpEditorAnimationFocusExperiment"] = mode;
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

function selectGestaltStyle(player: HTMLElement, value: string): void {
  const selectedStyle = parseKpEditorGestaltStyleRef(value);
  gestaltStyles.set(player, selectedStyle);
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

  const playButton = player.querySelector<HTMLButtonElement>(
    '[data-action="play-editor-animation"]'
  );
  const pauseButton = player.querySelector<HTMLButtonElement>(
    '[data-action="pause-editor-animation"]'
  );
  if (playButton !== null) playButton.disabled =
    state.playbackStatus === "playing" ||
    player.dataset["kpEditorAnimationAccessibilityMode"] === "static";
  if (pauseButton !== null) pauseButton.disabled = state.playbackStatus !== "playing";
  syncGestaltInspection(player, session);

  player.dispatchEvent(new CustomEvent(KP_EDITOR_ANIMATION_FRAME_EVENT, {
    bubbles: true,
    detail: state
  }));
}

function syncGestaltInspection(
  player: HTMLElement,
  session: KpEditorAnimationPlaybackSession
): void {
  const selectedStyle = gestaltStyles.get(player) ??
    parseKpEditorGestaltStyleRef(undefined);
  const inspection = createKpEditorAnimationGestaltInspection({
    animation: session.animation,
    state: session.player,
    selectedStyle
  });
  player.dataset["kpEditorAnimationGestaltPinnedStyle"] =
    inspection.pinnedStyleKey;
  player.dataset["kpEditorAnimationGestaltSelectedStyle"] =
    inspection.selectedStyleKey;
  player.dataset["kpEditorAnimationGestaltStatus"] = inspection.status;
  player.dataset["kpEditorAnimationGestaltFingerprint"] =
    inspection.resolvedStyle.fingerprint;
  player.dataset["kpEditorAnimationGestaltEnvelopePhase"] =
    inspection.envelopePhaseLabel;
  player.dataset["kpEditorAnimationDesignIssueCodes"] =
    inspection.designDiagnosis?.issues.map((issue) => issue.code).join(" ") ??
    "";
  if (inspection.choreographyPlanId === undefined) {
    delete player.dataset["kpEditorAnimationChoreographyPlanId"];
  } else {
    player.dataset["kpEditorAnimationChoreographyPlanId"] =
      inspection.choreographyPlanId;
  }
  const styleControl = player.querySelector<HTMLSelectElement>(
    "[data-kp-editor-animation-gestalt-style-control]"
  );
  if (styleControl !== null) styleControl.value = inspection.selectedStyleKey;
  player.style.setProperty(
    "--kp-editor-gestalt-micro-motion",
    String(inspection.channels.microMotion?.amplitude ?? 0)
  );
  player.style.setProperty(
    "--kp-editor-gestalt-focus-strength",
    String(inspection.channels.focus?.strength ?? 0)
  );
  player.style.setProperty(
    "--kp-editor-gestalt-context-dimming",
    String(inspection.channels.context?.dimming ?? 0)
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-status]",
    inspection.status
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-pinned-style]",
    inspection.pinnedStyleKey
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-selected-style]",
    inspection.selectedStyleKey
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-resolved-chain]",
    inspection.resolvedChainLabel
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-envelope-phase]",
    inspection.envelopePhaseLabel
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-focus-group]",
    inspection.focusGroupLabel
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-salience]",
    inspection.salienceLabel
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-traversal]",
    inspection.traversalLabel
  );
  replaceText(
    player,
    "[data-kp-editor-gestalt-capabilities]",
    inspection.capabilityLabel
  );
  replaceText(
    player,
    "[data-kp-editor-design-strategy]",
    inspection.designStrategyLabel
  );
  replaceText(
    player,
    "[data-kp-editor-design-issues]",
    inspection.designIssueLabel
  );
  const warnings = player.querySelector<HTMLElement>(
    "[data-kp-editor-gestalt-warnings]"
  );
  warnings?.replaceChildren(
    ...inspection.warnings.map((warning) => {
      const item = document.createElement("li");
      item.textContent = warning;
      return item;
    })
  );
  syncFocusExperiment(player, inspection);
}

function syncFocusExperiment(
  player: HTMLElement,
  inspection: ReturnType<typeof createKpEditorAnimationGestaltInspection>
): void {
  const mode = focusExperimentModes.get(player) ?? "flat";
  const [phaseText, progressText] = inspection.envelopePhaseLabel.split(" · ");
  const phaseId = isEnvelopePhase(phaseText) ? phaseText : "orient";
  const phaseProgress = Math.min(
    1,
    Math.max(0, Number.parseFloat(progressText ?? "0") / 100)
  );
  const comparison = createKpElevatedFocusComparison({
    id: `focus-experiment.${inspection.choreographyPlanId ?? "unmigrated"}`,
    groupId: inspection.focusGroupLabel,
    semanticEntityIds: [inspection.focusGroupLabel],
    strength: inspection.channels.focus?.strength ?? 0.55,
    contextDimming: inspection.channels.context?.dimming ?? 0.08,
    phaseId,
    phaseProgress
  });
  player.dataset["kpEditorAnimationFocusExperiment"] = mode;
  player.dataset["kpEditorAnimationFocusXyInvariant"] =
    String(comparison.invariance.passed);
  const control = player.querySelector<HTMLSelectElement>(
    "[data-kp-editor-animation-focus-experiment-control]"
  );
  if (control !== null) control.value = mode;
  replaceText(player, "[data-kp-editor-focus-experiment]", mode);
  replaceText(
    player,
    "[data-kp-editor-focus-invariance]",
    comparison.invariance.passed ? "pass · same x/y path" : "fail"
  );
}

function isEnvelopePhase(
  value: string | undefined
): value is KpChoreographyEnvelopePhaseId {
  return value === "orient" || value === "reflow" || value === "act" ||
    value === "settle" || value === "release";
}

function replaceText(
  root: ParentNode,
  selector: string,
  value: string
): void {
  root.querySelector<HTMLElement>(selector)
    ?.replaceChildren(document.createTextNode(value));
}

function playerStatusLabel(session: KpEditorAnimationPlaybackSession): string {
  const { playbackStatus, direction } = session.player;
  const status = playbackStatus === "complete"
    ? "Complete"
    : `${playbackStatus.slice(0, 1).toUpperCase()}${playbackStatus.slice(1)}`;
  return `${status} · ${direction === "rewind" ? "rewind" : "forward"}`;
}
