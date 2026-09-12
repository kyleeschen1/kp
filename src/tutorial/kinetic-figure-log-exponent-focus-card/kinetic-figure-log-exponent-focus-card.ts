/// <reference types="vite/client" />

import {
dispatchKpEditorAnimationPlaybackAction,
disposeKpEditorAnimationPlayers,
hydrateKpEditorAnimationPlayers,
KP_EDITOR_ANIMATION_FRAME_EVENT
} from "../../editor/animation-player-controller.ts";
import {
hydrateKpEditorAnimationSurfaces,
kpEditorAnimationSurfaceAdapterRegistry
} from "../../editor/animation-surface-adapter-registry.ts";
import {
KP_EDITOR_ANIMATION_SURFACE_READINESS_EVENT,
readKpEditorAnimationSurfaceReadiness
} from "../../editor/animation-surface-readiness.ts";
import { registerKpEditorLogExponentSurfaceCapability } from "../../editor/log-exponent-surface-capability.ts";
import { kpCanonicalLogExponentNativeEndpoints } from "../../rendering/log-exponent-native-endpoints.ts";
import { readKpFocusDeckScrubberKeyTarget } from "../focus-deck-scaffold.ts";
import {
kpLogExponentFocusCardBeatHash,
readKpLogExponentFocusCardBeatIndexFromHash,
sampleKpLogExponentFocusCardPlayback,
sampleKpLogExponentFocusCardPosition,
type KpLogExponentFocusCardBeatV1
} from "./kinetic-figure-log-exponent-focus-card-model.ts";
import { boundedIndex,type KpLogExponentFocusCardAuthority } from "./kinetic-figure-log-exponent-focus-card-static.ts";

const progressTolerance = 0.004;


export interface KpLogExponentFocusCardSession {
  dispose(): void;
}

interface PendingMotion {
  readonly targetIndex: number;
  readonly sourceProgress: number;
  readonly targetProgress: number;
  readonly direction: "forward" | "rewind";
}

type MotionDecisionReason =
  | "motion-owning-adjacent-edge"
  | "reduced-motion"
  | "direct-seek"
  | "non-adjacent"
  | "attention-only-edge"
  | "already-at-target"
  | "surface-failed";

type PassageTransportOwner =
  "idle" | "animation" | "scrubber" | "native" | "correction";
type CursorMotion = "immediate" | "transition";

const passageScrollEndFallbackMs = 180;
const passageNativeIntentGraceMs = 180;




export function mountKpLogExponentFocusCard(input: {
  readonly root: ParentNode;
  readonly authority: KpLogExponentFocusCardAuthority;
}): KpLogExponentFocusCardSession {
  const { score } = input.authority;
  const deck = requiredElement<HTMLElement>(input.root,
    "[data-kp-log-exponent-focus-card]");
  const player = requiredElement<HTMLElement>(deck,
    "[data-kp-editor-animation-player]");
  const surface = requiredElement<HTMLElement>(player,
    '[data-kp-editor-animation-surface-slot="equation"]');
  const viewport = requiredElement<HTMLElement>(deck,
    "[data-kp-focus-deck-viewport]");
  const scrubber = requiredElement<HTMLInputElement>(deck,
    "[data-kp-focus-deck-scrubber]");
  const scrubberField = requiredElement<HTMLElement>(deck,
    ".kp-focus-deck__scrubber");
  const previous = requiredElement<HTMLButtonElement>(deck,
    "[data-kp-focus-deck-previous]");
  const next = requiredElement<HTMLButtonElement>(deck,
    "[data-kp-focus-deck-next]");
  const replay = requiredElement<HTMLButtonElement>(deck,
    "[data-kp-log-exponent-focus-card-replay]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = readKpLogExponentFocusCardBeatIndexFromHash(
    score,
    window.location.hash
  );
  let pendingMotion: PendingMotion | undefined;
  let pendingMotionWaitingForSurface = false;
  let deckPosition = activeIndex;
  let passageTransportOwner: PassageTransportOwner = "correction";
  let passageProjectionFrame: number | undefined;
  let passageScrollEndTimer: number | undefined;
  let snapRestoreFrame: number | undefined;
  let nativePassageIntent = false;
  let nativePassageIntentTimer: number | undefined;
  let disposed = false;
  let initialProjectionFrame: number | undefined;
  let playbackTempo = 1;

  const cursorTrack = document.createElement("span");
  cursorTrack.dataset["kpLogExponentCursorTrack"] = "true";
  cursorTrack.setAttribute("aria-hidden", "true");
  const cursor = document.createElement("span");
  cursor.dataset["kpLogExponentCursor"] = "true";
  cursorTrack.append(cursor);
  scrubberField.append(cursorTrack);
  deck.dataset["kpLogExponentCursorEnhanced"] = "true";

  surface.innerHTML = kpCanonicalLogExponentNativeEndpoints[0]!.nativeHtmlAndMathml;
  player.tabIndex = -1;
  player.removeAttribute("aria-keyshortcuts");
  const unregisterCapability = registerKpEditorLogExponentSurfaceCapability(
    kpEditorAnimationSurfaceAdapterRegistry
  );
  hydrateKpEditorAnimationSurfaces(deck);
  hydrateKpEditorAnimationPlayers(deck, {
    animationOverrides: [input.authority.animation],
    descriptorOverrides: [input.authority.descriptor]
  });

  const semanticProgress = (): number => {
    const requested = Number(player.dataset["kpEditorAnimationProgress"] ?? 0);
    return player.dataset["kpEditorAnimationDirection"] === "rewind"
      ? 1 - requested
      : requested;
  };

  const seekSemanticProgress = (progress: number): void => {
    if (player.dataset["kpEditorAnimationDirection"] === "rewind") {
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "forward",
        nowMs: performance.now()
      });
      dispatchKpEditorAnimationPlaybackAction(player, { type: "pause" });
    }
    dispatchKpEditorAnimationPlaybackAction(player, {
      type: "seek",
      progress
    });
    deck.dataset["kpLogExponentTimelineProgress"] = progress.toFixed(6);
  };

  const setPlaybackTempo = (
    multiplier: number,
    forceDispatch = false
  ): void => {
    if (
      !forceDispatch &&
      Math.abs(playbackTempo - multiplier) <= 0.000001
    ) return;
    playbackTempo = multiplier;
    deck.dataset["kpLogExponentPlaybackTempo"] = multiplier.toFixed(2);
    dispatchKpEditorAnimationPlaybackAction(player, {
      type: "set-tempo",
      multiplier
    });
  };

  const tempoForPlayback = (
    playback: ReturnType<typeof sampleKpLogExponentFocusCardPlayback>
  ): number => playback.tempoMultiplier;

  const cancelPassageProjection = (): void => {
    if (passageProjectionFrame === undefined) return;
    window.cancelAnimationFrame(passageProjectionFrame);
    passageProjectionFrame = undefined;
  };

  const cancelPassageScrollEnd = (): void => {
    if (passageScrollEndTimer === undefined) return;
    window.clearTimeout(passageScrollEndTimer);
    passageScrollEndTimer = undefined;
  };

  const cancelSnapRestore = (): void => {
    if (snapRestoreFrame === undefined) return;
    window.cancelAnimationFrame(snapRestoreFrame);
    snapRestoreFrame = undefined;
  };

  const cancelNativePassageIntentClear = (): void => {
    if (nativePassageIntentTimer === undefined) return;
    window.clearTimeout(nativePassageIntentTimer);
    nativePassageIntentTimer = undefined;
  };

  const clearNativePassageIntent = (): void => {
    cancelNativePassageIntentClear();
    nativePassageIntent = false;
  };

  const armNativePassageIntent = (): void => {
    cancelNativePassageIntentClear();
    nativePassageIntent = true;
  };

  const releaseNativePassageIntentSoon = (): void => {
    cancelNativePassageIntentClear();
    nativePassageIntentTimer = window.setTimeout(() => {
      nativePassageIntentTimer = undefined;
      if (passageTransportOwner !== "native") nativePassageIntent = false;
    }, passageNativeIntentGraceMs);
  };

  const disablePassageSnap = (): void => {
    cancelSnapRestore();
    viewport.dataset["kpFocusDeckSnapDisabled"] = "true";
    // WebKit must commit snap-off before a fractional semantic position is
    // written, or the prose can spring to a different beat than the playhead.
    void viewport.offsetWidth;
  };

  const restorePassageSnapSoon = (): void => {
    cancelSnapRestore();
    snapRestoreFrame = window.requestAnimationFrame(() => {
      snapRestoreFrame = undefined;
      delete viewport.dataset["kpFocusDeckSnapDisabled"];
      passageTransportOwner = "idle";
    });
  };

  const projectDeckPosition = (
    position: number,
    writePassage = true,
    cursorMotion: CursorMotion = "immediate"
  ): void => {
    const sample = sampleKpLogExponentFocusCardPosition(score, position);
    const progress = sample.position / Math.max(1, score.beats.length - 1) * 100;
    deckPosition = sample.position;
    scrubber.value = sample.position.toFixed(4);
    scrubber.style.setProperty("--kp-focus-deck-scrubber-progress",
      `${progress.toFixed(3)}%`);
    deck.dataset["kpLogExponentCursorMotion"] = cursorMotion;
    cursor.style.setProperty("--kp-log-exponent-cursor-progress",
      `${progress.toFixed(3)}%`);
    deck.dataset["kpLogExponentDeckPosition"] = sample.position.toFixed(4);
    if (writePassage) {
      viewport.scrollLeft = sample.position * Math.max(1, viewport.clientWidth);
    }
  };

  const projectChrome = (index: number): void => {
    const bounded = boundedIndex(index, score.beats.length);
    const beat = score.beats[bounded]!;
    activeIndex = bounded;
    deck.dataset["kpFocusDeckActiveBeat"] = beat.slug;
    deck.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]")
      .forEach((passage, passageIndex) => {
        const active = passageIndex === bounded;
        passage.dataset["kpFocusDeckBeatActive"] = String(active);
        if (active) passage.setAttribute("aria-current", "page");
        else passage.removeAttribute("aria-current");
      });
    previous.disabled = bounded === 0;
    next.disabled = bounded === score.beats.length - 1;
    replay.hidden = !beat.ownsMotionFromPrevious;
    scrubber.setAttribute("aria-valuetext", statusText(beat, score.beats.length));
    requiredElement<HTMLOutputElement>(deck,
      "[data-kp-focus-deck-position]").value =
        statusText(beat, score.beats.length);
  };

  const finishMotion = (pending: PendingMotion): void => {
    pendingMotion = undefined;
    pendingMotionWaitingForSurface = false;
    setPlaybackTempo(1);
    if (player.dataset["kpEditorAnimationDirection"] === "rewind") {
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: 1 - pending.targetProgress
      });
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "forward",
        nowMs: performance.now()
      });
      dispatchKpEditorAnimationPlaybackAction(player, { type: "pause" });
    }
    seekSemanticProgress(pending.targetProgress);
    passageTransportOwner = "correction";
    projectDeckPosition(pending.targetIndex);
    restorePassageSnapSoon();
    deck.dataset["kpLogExponentTransition"] = "settled";
    deck.dataset["kpLogExponentPlaybackPhase"] = "settled";
  };

  const moveToBeat = (inputMove: {
    readonly fromIndex: number;
    readonly targetIndex: number;
    readonly animate: boolean;
  }): boolean => {
    const target = score.beats[inputMove.targetIndex]!;
    const currentProgress = semanticProgress();
    const targetProgress = target.timelineProgress;
    const adjacent = Math.abs(inputMove.targetIndex - inputMove.fromIndex) === 1;
    const edgeOwnsMotion = inputMove.targetIndex > inputMove.fromIndex
      ? target.ownsMotionFromPrevious
      : score.beats[inputMove.fromIndex]!.ownsMotionFromPrevious;
    const skipReason: MotionDecisionReason | undefined =
      reducedMotion.matches
        ? "reduced-motion"
        : !inputMove.animate
          ? "direct-seek"
          : !adjacent
            ? "non-adjacent"
            : !edgeOwnsMotion
              ? "attention-only-edge"
              : Math.abs(currentProgress - targetProgress) <= progressTolerance
                ? "already-at-target"
                : undefined;
    if (skipReason !== undefined) {
      pendingMotion = undefined;
      pendingMotionWaitingForSurface = false;
      setPlaybackTempo(1);
      seekSemanticProgress(targetProgress);
      deck.dataset["kpLogExponentTransition"] = "settled";
      deck.dataset["kpLogExponentPlaybackPhase"] = "settled";
      recordMotionDecision(deck, "static", skipReason);
      return false;
    }
    const direction = targetProgress > currentProgress ? "forward" : "rewind";
    if (readKpEditorAnimationSurfaceReadiness(player) === "failed") {
      pendingMotion = undefined;
      pendingMotionWaitingForSurface = false;
      setPlaybackTempo(1);
      seekSemanticProgress(targetProgress);
      deck.dataset["kpLogExponentTransition"] = "fallback";
      deck.dataset["kpLogExponentPlaybackPhase"] = "settled";
      recordMotionDecision(deck, "static", "surface-failed");
      return false;
    }
    cancelPassageProjection();
    cancelPassageScrollEnd();
    passageTransportOwner = "animation";
    disablePassageSnap();
    // Navigation selects the destination once; only the equation playhead
    // traverses the governed edge. Rewriting passage scroll on every paint
    // frame made Safari's visible current step oscillate during playback.
    projectDeckPosition(inputMove.targetIndex, true, "transition");
    const motion = Object.freeze({
      targetIndex: inputMove.targetIndex,
      sourceProgress: currentProgress,
      targetProgress,
      direction
    });
    pendingMotion = motion;
    const playback = sampleKpLogExponentFocusCardPlayback({
      sourceProgress: currentProgress,
      targetProgress,
      currentProgress
    });
    deck.dataset["kpLogExponentPlaybackPhase"] = playback.phaseId;
    const desiredTempo = tempoForPlayback(playback);
    if (readKpEditorAnimationSurfaceReadiness(player) === "ready") {
      setPlaybackTempo(desiredTempo);
    } else {
      // set-tempo resamples the shared player. Keep the desired value local
      // while paint is preparing so a presentation update cannot accidentally
      // mint renderer readiness before the operation starts.
      playbackTempo = desiredTempo;
      deck.dataset["kpLogExponentPlaybackTempo"] = desiredTempo.toFixed(2);
    }
    const started = dispatchKpEditorAnimationPlaybackAction(player, {
      type: direction,
      nowMs: performance.now()
    });
    pendingMotionWaitingForSurface = !started;
    deck.dataset["kpLogExponentTransition"] = started ? "active" : "waiting";
    recordMotionDecision(
      deck,
      "animate",
      "motion-owning-adjacent-edge"
    );
    return true;
  };

  const handleSurfaceReadiness = (): void => {
    const readiness = readKpEditorAnimationSurfaceReadiness(player);
    deck.dataset["kpLogExponentAnimationStatus"] = readiness;
    const error = player.dataset["kpEditorAnimationSurfaceError"];
    if (error === undefined) {
      delete deck.dataset["kpLogExponentAnimationError"];
    } else {
      deck.dataset["kpLogExponentAnimationError"] = error;
    }

    const pending = pendingMotion;
    if (readiness === "failed") {
      if (pending === undefined) return;
      pendingMotion = undefined;
      pendingMotionWaitingForSurface = false;
      setPlaybackTempo(1);
      seekSemanticProgress(pending.targetProgress);
      passageTransportOwner = "correction";
      projectDeckPosition(pending.targetIndex);
      restorePassageSnapSoon();
      deck.dataset["kpLogExponentTransition"] = "fallback";
      deck.dataset["kpLogExponentPlaybackPhase"] = "settled";
      recordMotionDecision(deck, "static", "surface-failed");
      return;
    }
    if (readiness === "preparing") {
      if (pending !== undefined) {
        // The renderer can discover an operation-specific paint dependency
        // after playback begins. Remember that the existing semantic edge,
        // rather than a second navigation action, owns the eventual resume.
        pendingMotionWaitingForSurface = true;
        deck.dataset["kpLogExponentTransition"] = "waiting";
      }
      return;
    }
    if (
      pending === undefined ||
      !pendingMotionWaitingForSurface
    ) return;

    const playback = sampleKpLogExponentFocusCardPlayback({
      sourceProgress: pending.sourceProgress,
      targetProgress: pending.targetProgress,
      currentProgress: semanticProgress()
    });
    setPlaybackTempo(tempoForPlayback(playback), true);
    const started = dispatchKpEditorAnimationPlaybackAction(player, {
      type: pending.direction,
      nowMs: performance.now()
    });
    pendingMotionWaitingForSurface = !started;
    deck.dataset["kpLogExponentTransition"] = started ? "active" : "waiting";
  };

  const select = (
    requestedIndex: number,
    options: {
      readonly animate?: boolean;
      readonly history?: "none" | "push" | "replace";
    } = {}
  ): void => {
    clearNativePassageIntent();
    const targetIndex = boundedIndex(requestedIndex, score.beats.length);
    const historyMode = options.history ?? "push";
    const interrupted = pendingMotion;
    if (interrupted !== undefined && options.animate !== false) {
      // Navigation remains responsive without creating a hidden destination:
      // settle the operation the learner can currently see, then let this
      // activation own exactly the requested adjacent edge.
      dispatchKpEditorAnimationPlaybackAction(player, { type: "pause" });
      finishMotion(interrupted);
    }
    const fromIndex = activeIndex;
    projectChrome(targetIndex);
    const motionStarted = moveToBeat({
      fromIndex,
      targetIndex,
      animate: options.animate !== false
    });
    if (!motionStarted) {
      passageTransportOwner = "correction";
      disablePassageSnap();
      projectDeckPosition(targetIndex, true,
        options.animate === false ? "immediate" : "transition");
      restorePassageSnapSoon();
    }
    if (historyMode === "none") return;
    const hash = kpLogExponentFocusCardBeatHash(score.beats[targetIndex]!);
    if (window.location.hash === hash) return;
    if (historyMode === "replace") history.replaceState(null, "", hash);
    else history.pushState(null, "", hash);
  };

  const replayCurrent = (): void => {
    if (pendingMotion !== undefined) return;
    const beat = score.beats[activeIndex]!;
    if (!beat.ownsMotionFromPrevious || activeIndex === 0) return;
    const source = score.beats[activeIndex - 1]!.timelineProgress;
    passageTransportOwner = "correction";
    disablePassageSnap();
    seekSemanticProgress(source);
    moveToBeat({
      fromIndex: activeIndex - 1,
      targetIndex: activeIndex,
      animate: true
    });
  };

  const handleFrame = (): void => {
    const current = semanticProgress();
    deck.dataset["kpLogExponentTimelineProgress"] = current.toFixed(6);
    const pending = pendingMotion;
    if (pending === undefined) return;
    const playback = sampleKpLogExponentFocusCardPlayback({
      sourceProgress: pending.sourceProgress,
      targetProgress: pending.targetProgress,
      currentProgress: current
    });
    const reached = pending.direction === "forward"
      ? current + progressTolerance >= pending.targetProgress
      : current - progressTolerance <= pending.targetProgress;
    if (reached) {
      finishMotion(pending);
      return;
    }
    deck.dataset["kpLogExponentPlaybackPhase"] = playback.phaseId;
    setPlaybackTempo(tempoForPlayback(playback));
  };

  const handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("[data-kp-focus-deck-previous]") !== null) {
      select(activeIndex - 1);
    } else if (target?.closest("[data-kp-focus-deck-next]") !== null) {
      select(activeIndex + 1);
    } else if (target?.closest(
      "[data-kp-log-exponent-focus-card-replay]"
    ) !== null) {
      replayCurrent();
    }
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.target instanceof HTMLElement && event.target.closest(
      "input, button, a, textarea, select, [contenteditable]"
    ) !== null) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      select(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      select(activeIndex + 1);
    }
  };

  const handleScrubberKeydown = (event: KeyboardEvent): void => {
    const target = readKpFocusDeckScrubberKeyTarget(event, Number(scrubber.value), score.beats.length);
    if (target === undefined) return;
    event.preventDefault();
    select(target);
  };

  const handleScrubberInput = (): void => {
    const sample = sampleKpLogExponentFocusCardPosition(
      score,
      Number(scrubber.value)
    );
    cancelPassageProjection();
    cancelPassageScrollEnd();
    pendingMotion = undefined;
    pendingMotionWaitingForSurface = false;
    setPlaybackTempo(1);
    clearNativePassageIntent();
    passageTransportOwner = "scrubber";
    disablePassageSnap();
    seekSemanticProgress(sample.timelineProgress);
    projectDeckPosition(sample.position);
    deck.dataset["kpLogExponentTransition"] = "scrub";
    deck.dataset["kpLogExponentPlaybackPhase"] = "scrub";
  };

  const handleScrubberChange = (): void => {
    select(Number(scrubber.value), { animate: false });
  };

  const projectNativePassage = (): void => {
    passageProjectionFrame = undefined;
    if (passageTransportOwner !== "native") return;
    const sample = sampleKpLogExponentFocusCardPosition(
      score,
      viewport.scrollLeft / Math.max(1, viewport.clientWidth)
    );
    pendingMotion = undefined;
    pendingMotionWaitingForSurface = false;
    setPlaybackTempo(1);
    seekSemanticProgress(sample.timelineProgress);
    projectDeckPosition(sample.position, false);
    deck.dataset["kpLogExponentTransition"] = "scrub";
    deck.dataset["kpLogExponentPlaybackPhase"] = "scrub";
  };

  const scheduleNativePassageProjection = (): void => {
    if (passageProjectionFrame !== undefined) return;
    passageProjectionFrame = window.requestAnimationFrame(projectNativePassage);
  };

  const settleNativePassage = (): void => {
    cancelPassageScrollEnd();
    if (passageTransportOwner !== "native") return;
    cancelPassageProjection();
    projectNativePassage();
    clearNativePassageIntent();
    select(Math.round(deckPosition), { animate: false });
  };

  const scheduleNativePassageSettlement = (): void => {
    cancelPassageScrollEnd();
    passageScrollEndTimer = window.setTimeout(
      settleNativePassage,
      passageScrollEndFallbackMs
    );
  };

  const handlePassageScroll = (): void => {
    if (passageTransportOwner !== "idle" &&
        passageTransportOwner !== "native") return;
    if (passageTransportOwner === "idle" && !nativePassageIntent) {
      // Safari can emit late snap or momentum corrections long after a
      // programmatic write. Only explicit physical intent may reopen the
      // semantic playhead; otherwise restore the deterministic projection.
      passageTransportOwner = "correction";
      disablePassageSnap();
      projectDeckPosition(deckPosition);
      restorePassageSnapSoon();
      return;
    }
    passageTransportOwner = "native";
    scheduleNativePassageProjection();
    scheduleNativePassageSettlement();
  };

  const handlePassageScrollEnd = (): void => settleNativePassage();

  const handlePassagePointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(
      "a, button, input, select, textarea, [contenteditable]"
    ) !== null) return;
    armNativePassageIntent();
  };

  const handlePassagePointerEnd = (): void => {
    releaseNativePassageIntentSoon();
  };

  const handlePassageWheel = (event: WheelEvent): void => {
    const horizontalIntent = Math.abs(event.deltaX) >=
      Math.max(1, Math.abs(event.deltaY) * 0.65);
    if (!horizontalIntent && !event.shiftKey) return;
    armNativePassageIntent();
    releaseNativePassageIntentSoon();
  };

  const restoreFromLocation = (): void => {
    if (!window.location.hash.startsWith("#beat.log-exponent.")) return;
    select(readKpLogExponentFocusCardBeatIndexFromHash(
      score,
      window.location.hash
    ), { animate: false, history: "none" });
  };

  const handleResize = (): void => {
    passageTransportOwner = "correction";
    disablePassageSnap();
    projectDeckPosition(deckPosition);
    restorePassageSnapSoon();
  };

  player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
  player.addEventListener(
    KP_EDITOR_ANIMATION_SURFACE_READINESS_EVENT,
    handleSurfaceReadiness
  );
  deck.addEventListener("click", handleClick);
  deck.addEventListener("keydown", handleKeydown);
  scrubber.addEventListener("input", handleScrubberInput);
  scrubber.addEventListener("change", handleScrubberChange);
  scrubber.addEventListener("keydown", handleScrubberKeydown);
  viewport.addEventListener("scroll", handlePassageScroll, { passive: true });
  viewport.addEventListener("scrollend", handlePassageScrollEnd);
  viewport.addEventListener("pointerdown", handlePassagePointerDown,
    { passive: true });
  viewport.addEventListener("pointerup", handlePassagePointerEnd,
    { passive: true });
  viewport.addEventListener("pointercancel", handlePassagePointerEnd,
    { passive: true });
  viewport.addEventListener("wheel", handlePassageWheel, { passive: true });
  window.addEventListener("resize", handleResize);
  window.addEventListener("popstate", restoreFromLocation);
  window.addEventListener("hashchange", restoreFromLocation);
  projectChrome(activeIndex);
  projectDeckPosition(activeIndex);
  restorePassageSnapSoon();

  const projectInitialWhenHydrated = (): void => {
    initialProjectionFrame = undefined;
    if (disposed) return;
    if (player.dataset["kpEditorAnimationHydrated"] !== "true") {
      initialProjectionFrame = window.requestAnimationFrame(
        projectInitialWhenHydrated
      );
      return;
    }
    seekSemanticProgress(score.beats[activeIndex]!.timelineProgress);
  };
  initialProjectionFrame = window.requestAnimationFrame(projectInitialWhenHydrated);

  return Object.freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      if (initialProjectionFrame !== undefined) {
        window.cancelAnimationFrame(initialProjectionFrame);
      }
      cancelPassageProjection();
      cancelPassageScrollEnd();
      cancelSnapRestore();
      clearNativePassageIntent();
      player.removeEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
      player.removeEventListener(
        KP_EDITOR_ANIMATION_SURFACE_READINESS_EVENT,
        handleSurfaceReadiness
      );
      deck.removeEventListener("click", handleClick);
      deck.removeEventListener("keydown", handleKeydown);
      scrubber.removeEventListener("input", handleScrubberInput);
      scrubber.removeEventListener("change", handleScrubberChange);
      scrubber.removeEventListener("keydown", handleScrubberKeydown);
      viewport.removeEventListener("scroll", handlePassageScroll);
      viewport.removeEventListener("scrollend", handlePassageScrollEnd);
      viewport.removeEventListener("pointerdown", handlePassagePointerDown);
      viewport.removeEventListener("pointerup", handlePassagePointerEnd);
      viewport.removeEventListener("pointercancel", handlePassagePointerEnd);
      viewport.removeEventListener("wheel", handlePassageWheel);
      delete deck.dataset["kpLogExponentCursorEnhanced"];
      delete deck.dataset["kpLogExponentCursorMotion"];
      cursorTrack.remove();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("popstate", restoreFromLocation);
      window.removeEventListener("hashchange", restoreFromLocation);
      disposeKpEditorAnimationPlayers(deck);
      unregisterCapability();
    }
  });
}

function statusText(
  beat: KpLogExponentFocusCardBeatV1,
  count: number
): string {
  return `Step ${beat.ordinal} of ${count}: ${beat.title}`;
}


function recordMotionDecision(
  deck: HTMLElement,
  decision: "animate" | "static",
  reason: MotionDecisionReason
): void {
  deck.dataset["kpLogExponentMotionDecision"] = decision;
  deck.dataset["kpLogExponentMotionReason"] = reason;
}

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Missing log-exponent Focus Deck element ${selector}.`);
  }
  return element;
}
export { createKpLogExponentFocusCardAuthority,readKpLogExponentFocusCardInitialIndex,renderKpLogExponentFocusCard,type KpLogExponentFocusCardAuthority } from "./kinetic-figure-log-exponent-focus-card-static.ts";
