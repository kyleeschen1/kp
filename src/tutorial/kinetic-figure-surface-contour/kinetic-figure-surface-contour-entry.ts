import "katex/dist/katex.min.css";
import "../../styles.css";
import "../focus-deck-scaffold.css";
import "./kinetic-figure-surface-contour.css";

import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { applyKpSemanticVisualDomTheme } from "../../rendering/semantic-visual-dom-theme.ts";
import { readKpFocusDeckScrubberKeyTarget } from "../focus-deck-scaffold.ts";
import { beatHash,boundedIndex,createKpSurfaceContourFocusCardAuthority,findBeatIndexFromHash,readKpSurfaceContourFocusCardInitialIndex,renderKpSurfaceContourFocusCard,type KpSurfaceContourFocusCardAuthority } from "./kinetic-figure-surface-contour-entry-static.ts";
import {
interpolateKpSurfaceContourProjection,
projectKpSurfaceContourBeat,
withKpSurfaceContourLevel,
type KpSurfaceContourSceneProjectionV1
} from "./kinetic-figure-surface-contour-model.ts";
import {
mountKpSurfaceContourStage
} from "./kinetic-figure-surface-contour-stage.ts";

const TRANSITION_DURATION_MS = 1_050;
const PASSAGE_SCROLL_END_FALLBACK_MS = 180;

type PassageTransportOwner =
  "idle" | "animation" | "scrubber" | "native" | "correction";

interface ActiveEdge {
  readonly lowerIndex: number;
  readonly upperIndex: number;
  readonly targetIndex: number;
  readonly history: "none" | "push" | "replace";
}

export interface KpSurfaceContourKineticFigureSession {
  dispose(): void;
}



export function mountKpSurfaceContourKineticFigure(input: {
  readonly root: HTMLElement;
}): KpSurfaceContourKineticFigureSession {
  applyKpSemanticVisualDomTheme({ root: input.root, theme: "light" });
  const authority = createKpSurfaceContourFocusCardAuthority();
  const initialIndex = readKpSurfaceContourFocusCardInitialIndex(
    authority,
    window.location.hash
  );
  input.root.innerHTML = renderPage({ authority, initialIndex });
  return mountKpSurfaceContourFocusCard({
    root: input.root,
    authority
  });
}


export function mountKpSurfaceContourFocusCard(input: {
  readonly root: ParentNode;
  readonly authority: KpSurfaceContourFocusCardAuthority;
}): KpSurfaceContourKineticFigureSession {
  const { score, stageAuthority } = input.authority;

  const deck = requiredElement<HTMLElement>(input.root,
    "[data-kp-surface-contour-deck]");
  const passageViewport = requiredElement<HTMLElement>(deck,
    "[data-kp-focus-deck-viewport]");
  const stateSlider = requiredElement<HTMLInputElement>(deck,
    "[data-kp-surface-contour-state]");
  const levelSlider = requiredElement<HTMLInputElement>(deck,
    "[data-kp-surface-contour-level]");
  const previous = requiredElement<HTMLButtonElement>(deck,
    "[data-kp-focus-deck-previous]");
  const next = requiredElement<HTMLButtonElement>(deck,
    "[data-kp-focus-deck-next]");
  const replay = requiredElement<HTMLButtonElement>(deck,
    "[data-kp-surface-contour-replay]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clock = createKpReaderTimelinePlaybackClock({
    id: "clock.calculus.surface-contour-focus-card.v1",
    durationMs: TRANSITION_DURATION_MS,
    initialProgress: 1,
    ownerWindow: window
  });
  let settledIndex = readKpSurfaceContourFocusCardInitialIndex(
    input.authority,
    window.location.hash
  );
  let activeEdge: ActiveEdge | undefined;
  let manualLevel: number | undefined;
  let passageTransportOwner: PassageTransportOwner = "correction";
  let passageProjectionFrame: number | undefined;
  let passageScrollEndTimer: number | undefined;
  let snapRestoreFrame: number | undefined;
  let disposed = false;
  const stageSession = mountKpSurfaceContourStage({
    root: deck,
    authority: stageAuthority,
    initialProjection: projectKpSurfaceContourBeat(score, settledIndex)
  });

  const endpoint = (index: number): KpSurfaceContourSceneProjectionV1 => {
    const projection = projectKpSurfaceContourBeat(score, index);
    return manualLevel !== undefined && projection.levelControl >= 0.75
      ? withKpSurfaceContourLevel(projection, manualLevel)
      : projection;
  };

  const projectVisual = (
    projection: KpSurfaceContourSceneProjectionV1
  ): void => {
    stageSession.project(projection);
  };

  const projectionAtPosition = (
    position: number
  ): KpSurfaceContourSceneProjectionV1 => {
    const bounded = boundedPosition(position, score.beats.length);
    const lowerIndex = Math.floor(bounded);
    const upperIndex = Math.min(score.beats.length - 1, Math.ceil(bounded));
    if (lowerIndex === upperIndex) return endpoint(lowerIndex);
    return interpolateKpSurfaceContourProjection({
      from: endpoint(lowerIndex),
      to: endpoint(upperIndex),
      progress: bounded - lowerIndex
    });
  };

  const projectPosition = (
    position: number,
    instantPassage = false,
    writePassage = true
  ): void => {
    const bounded = boundedPosition(position, score.beats.length);
    const lowerIndex = Math.floor(bounded);
    const upperIndex = Math.min(score.beats.length - 1, Math.ceil(bounded));
    projectVisual(projectionAtPosition(bounded));
    projectRail(bounded);
    projectPassage(bounded, instantPassage, writePassage);
    deck.dataset["kpSurfaceContourPosition"] = bounded.toFixed(4);
    deck.dataset["kpSurfaceContourTransition"] =
      lowerIndex === upperIndex ? "settled" : "active";
  };

  const projectRail = (position: number): void => {
    stateSlider.value = position.toFixed(4);
    stateSlider.style.setProperty("--kp-sc-state-progress",
      `${(position / Math.max(1, score.beats.length - 1) * 100).toFixed(3)}%`);
    const index = boundedIndex(position, score.beats.length);
    const beat = score.beats[index]!;
    stateSlider.setAttribute("aria-valuetext",
      `Step ${beat.ordinal} of ${score.beats.length}: ${beat.title}`);
  };

  const projectPassage = (
    position: number,
    _instant: boolean,
    writePassage: boolean
  ): void => {
    const bounded = boundedIndex(position, score.beats.length);
    const beat = score.beats[bounded]!;
    if (writePassage) {
      passageViewport.scrollLeft = boundedPosition(
        position,
        score.beats.length
      ) * Math.max(1, passageViewport.clientWidth);
    }
    deck.dataset["kpSurfaceContourActiveBeat"] = beat.slug;
    deck.dataset["kpFocusDeckActiveBeat"] = beat.slug;
    deck.querySelectorAll<HTMLElement>("[data-kp-surface-contour-beat]")
      .forEach((passage, passageIndex) => {
        const active = passageIndex === bounded;
        passage.dataset["kpSurfaceContourBeatActive"] = String(active);
        passage.dataset["kpFocusDeckBeatActive"] = String(active);
        if (active) passage.setAttribute("aria-current", "page");
        else passage.removeAttribute("aria-current");
      });
    previous.disabled = bounded === 0;
    next.disabled = bounded === score.beats.length - 1;
    replay.disabled = bounded === 0;
    requiredElement<HTMLOutputElement>(deck,
      "[data-kp-focus-deck-position]").value =
        `Step ${beat.ordinal} of ${score.beats.length}: ${beat.title}`;
  };

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

  const disablePassageSnap = (): void => {
    cancelSnapRestore();
    passageViewport.dataset["kpFocusDeckSnapDisabled"] = "true";
    // WebKit must commit snap-off before a fractional semantic position is
    // written, or prose and 3D state can settle on different beats.
    void passageViewport.offsetWidth;
  };

  const restorePassageSnapSoon = (): void => {
    cancelSnapRestore();
    snapRestoreFrame = window.requestAnimationFrame(() => {
      snapRestoreFrame = undefined;
      delete passageViewport.dataset["kpFocusDeckSnapDisabled"];
      passageTransportOwner = "idle";
    });
  };

  const updateLocation = (
    index: number,
    mode: ActiveEdge["history"]
  ): void => {
    if (mode === "none") return;
    const hash = beatHash(score.beats[index]!);
    if (window.location.hash === hash) return;
    if (mode === "push") history.pushState(null, "", hash);
    else history.replaceState(null, "", hash);
  };

  const settleAt = (
    index: number,
    historyMode: ActiveEdge["history"],
    instantPassage = true
  ): void => {
    const bounded = boundedIndex(index, score.beats.length);
    clock.pause();
    activeEdge = undefined;
    settledIndex = bounded;
    passageTransportOwner = "correction";
    disablePassageSnap();
    projectPosition(bounded, instantPassage);
    restorePassageSnapSoon();
    updateLocation(bounded, historyMode);
  };

  const navigateTo = (
    requestedIndex: number,
    historyMode: ActiveEdge["history"] = "push"
  ): void => {
    const targetIndex = boundedIndex(requestedIndex, score.beats.length);
    if (targetIndex === settledIndex && activeEdge === undefined) return;
    if (reducedMotion.matches || Math.abs(targetIndex - settledIndex) !== 1) {
      settleAt(targetIndex, historyMode);
      return;
    }
    const lowerIndex = Math.min(settledIndex, targetIndex);
    const upperIndex = Math.max(settledIndex, targetIndex);
    const forward = targetIndex > settledIndex;
    passageTransportOwner = "animation";
    disablePassageSnap();
    // seek() publishes a settled setup sample synchronously. Arm the edge
    // only afterward so initialization cannot be mistaken for completion.
    clock.seek(forward ? 0 : 1);
    activeEdge = Object.freeze({
      lowerIndex,
      upperIndex,
      targetIndex,
      history: historyMode
    });
    deck.dataset["kpSurfaceContourNavigation"] = forward ? "forward" : "rewind";
    deck.dataset["kpSurfaceContourTransition"] = "active";
    clock.play({ direction: forward ? "forward" : "rewind", stopAt: forward ? 1 : 0 });
  };

  const replayCurrentEdge = (): void => {
    if (settledIndex === 0) return;
    const target = settledIndex;
    settleAt(target - 1, "none");
    navigateTo(target, "none");
  };

  const handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("[data-kp-focus-deck-previous]") !== null) {
      navigateTo(settledIndex - 1);
    } else if (target?.closest("[data-kp-focus-deck-next]") !== null) {
      navigateTo(settledIndex + 1);
    } else if (target?.closest("[data-kp-surface-contour-replay]") !== null) {
      replayCurrentEdge();
    }
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof HTMLElement && event.target.closest(
      "input, button, a, textarea, select, [contenteditable]"
    ) !== null) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateTo(settledIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateTo(settledIndex + 1);
    }
  };

  const handleStateKeydown = (event: KeyboardEvent): void => {
    const target = readKpFocusDeckScrubberKeyTarget(event, Number(stateSlider.value), score.beats.length);
    if (target === undefined) return;
    event.preventDefault();
    navigateTo(target);
  };

  const handleStateInput = (): void => {
    clock.pause();
    activeEdge = undefined;
    passageTransportOwner = "scrubber";
    disablePassageSnap();
    projectPosition(Number(stateSlider.value));
    deck.dataset["kpSurfaceContourNavigation"] = "scrub";
  };

  const handleStateChange = (): void => {
    settleAt(Number(stateSlider.value), "push");
  };

  const projectNativePassage = (): void => {
    passageProjectionFrame = undefined;
    if (passageTransportOwner !== "native") return;
    const position = passageViewport.scrollLeft /
      Math.max(1, passageViewport.clientWidth);
    projectVisual(projectionAtPosition(position));
  };

  const scheduleNativePassageProjection = (): void => {
    if (passageProjectionFrame !== undefined) return;
    passageProjectionFrame = window.requestAnimationFrame(projectNativePassage);
  };

  const settleNativePassage = (): void => {
    cancelPassageScrollEnd();
    if (passageTransportOwner !== "native") return;
    cancelPassageProjection();
    const position = passageViewport.scrollLeft /
      Math.max(1, passageViewport.clientWidth);
    settleAt(position, "push");
  };

  const scheduleNativePassageSettlement = (): void => {
    cancelPassageScrollEnd();
    passageScrollEndTimer = window.setTimeout(
      settleNativePassage,
      PASSAGE_SCROLL_END_FALLBACK_MS
    );
  };

  const handlePassageScroll = (): void => {
    if (passageTransportOwner !== "idle" &&
        passageTransportOwner !== "native") return;
    passageTransportOwner = "native";
    const position = boundedPosition(
      passageViewport.scrollLeft / Math.max(1, passageViewport.clientWidth),
      score.beats.length
    );
    clock.pause();
    activeEdge = undefined;
    projectRail(position);
    projectPassage(position, false, false);
    deck.dataset["kpSurfaceContourPosition"] = position.toFixed(4);
    deck.dataset["kpSurfaceContourTransition"] =
      Number.isInteger(position) ? "settled" : "active";
    deck.dataset["kpSurfaceContourNavigation"] = "scrub";
    scheduleNativePassageProjection();
    scheduleNativePassageSettlement();
  };

  const handlePassageScrollEnd = (): void => settleNativePassage();

  const handleLevelInput = (): void => {
    if (levelSlider.disabled) return;
    clock.pause();
    activeEdge = undefined;
    manualLevel = Number(levelSlider.value);
    projectVisual(withKpSurfaceContourLevel(endpoint(settledIndex), manualLevel));
    deck.dataset["kpSurfaceContourInteraction"] = "inspect-level";
  };

  const handleHash = (): void => {
    const index = findBeatIndexFromHash(score, window.location.hash);
    if (index !== undefined) settleAt(index, "none");
  };

  const handleResize = (): void => {
    passageTransportOwner = "correction";
    disablePassageSnap();
    projectPosition(settledIndex);
    restorePassageSnapSoon();
  };

  const revealMatchedPassage = (node: Node | null): void => {
    const element = node instanceof Element ? node : node?.parentElement;
    const passage = element?.closest<HTMLElement>(
      "[data-kp-surface-contour-beat]"
    );
    if (passage === undefined || passage === null) return;
    const index = Number(passage.dataset["kpSurfaceContourBeatIndex"]);
    if (Number.isInteger(index) && index !== settledIndex) {
      settleAt(index, "replace");
    }
  };

  const handleSelectionChange = (): void => {
    if (activeEdge !== undefined) return;
    revealMatchedPassage(window.getSelection()?.anchorNode ?? null);
  };

  const unsubscribe = clock.subscribe((sample) => {
    const edge = activeEdge;
    if (edge === undefined) return;
    projectPosition(edge.lowerIndex + sample.progress);
    if (sample.settled) settleAt(edge.targetIndex, edge.history, false);
  });

  settleAt(settledIndex, "none");
  deck.addEventListener("click", handleClick);
  deck.addEventListener("keydown", handleKeydown);
  stateSlider.addEventListener("keydown", handleStateKeydown);
  stateSlider.addEventListener("input", handleStateInput);
  stateSlider.addEventListener("change", handleStateChange);
  levelSlider.addEventListener("input", handleLevelInput);
  passageViewport.addEventListener("scroll", handlePassageScroll,
    { passive: true });
  passageViewport.addEventListener("scrollend", handlePassageScrollEnd);
  document.addEventListener("selectionchange", handleSelectionChange);
  window.addEventListener("resize", handleResize);
  window.addEventListener("popstate", handleHash);
  window.addEventListener("hashchange", handleHash);

  return Object.freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      deck.removeEventListener("click", handleClick);
      deck.removeEventListener("keydown", handleKeydown);
      stateSlider.removeEventListener("keydown", handleStateKeydown);
      stateSlider.removeEventListener("input", handleStateInput);
      stateSlider.removeEventListener("change", handleStateChange);
      levelSlider.removeEventListener("input", handleLevelInput);
      passageViewport.removeEventListener("scroll", handlePassageScroll);
      passageViewport.removeEventListener("scrollend", handlePassageScrollEnd);
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("popstate", handleHash);
      window.removeEventListener("hashchange", handleHash);
      cancelPassageProjection();
      cancelPassageScrollEnd();
      cancelSnapRestore();
      unsubscribe();
      clock.dispose();
      stageSession.dispose();
    }
  });
}


function renderPage(input: {
  readonly authority: KpSurfaceContourFocusCardAuthority;
  readonly initialIndex: number;
}): string {
  return `<main class="kp-surface-contour-page">
    <article class="kp-surface-contour-article" aria-labelledby="kp-surface-contour-title">
      <h1 id="kp-surface-contour-title" class="kp-focus-deck__visually-hidden">Surface and contour Kinetic Figure</h1>
      ${renderKpSurfaceContourFocusCard(input)}
    </article>
  </main>`;
}





function boundedPosition(value: number, count: number): number {
  return Math.max(0, Math.min(count - 1, value));
}

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing surface-contour element ${selector}.`);
  return element;
}
export { createKpSurfaceContourFocusCardAuthority,readKpSurfaceContourFocusCardInitialIndex,renderKpSurfaceContourFocusCard,type KpSurfaceContourFocusCardAuthority } from "./kinetic-figure-surface-contour-entry-static.ts";
