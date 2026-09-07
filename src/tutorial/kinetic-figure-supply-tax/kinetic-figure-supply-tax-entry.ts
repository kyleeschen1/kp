import "katex/dist/katex.min.css";
import "../../styles.css";
import "../focus-deck-scaffold.css";
import "../kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card.css";
import "../../rendering/typescript-refactor.css";
import "../kinetic-figure-typescript-focus-card/kinetic-figure-typescript-focus-card.css";
import "../kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score.css";
import "./kinetic-figure-supply-tax.css";

import type { KpEconomicsSupplyTaxAnimationAsset } from "../../animation/economics-supply-tax-asset.ts";
import type { KpPerUnitTaxWelfareFrameV1 } from "../../../domains/economics/per-unit-tax-welfare-frame.ts";
import { applyKpSemanticVisualDomTheme } from
  "../../rendering/semantic-visual-dom-theme.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { createKpReaderTimelinePlaybackClock } from
  "../../reader/runtime/timeline-playback-clock.ts";
import { renderKpFocusDeckScaffold, readKpFocusDeckScrubberKeyTarget } from
  "../focus-deck-scaffold.ts";
import {
  createKpLogExponentFocusCardAuthority,
  mountKpLogExponentFocusCard,
  readKpLogExponentFocusCardInitialIndex,
  renderKpLogExponentFocusCard
} from
  "../kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card.ts";
import {
  createKpSurfaceContourFocusCardAuthority,
  mountKpSurfaceContourFocusCard,
  readKpSurfaceContourFocusCardInitialIndex,
  renderKpSurfaceContourFocusCard
} from
  "../kinetic-figure-surface-contour/kinetic-figure-surface-contour-entry.ts";
import {
  createKpTypeScriptFocusCardAuthority,
  mountKpTypeScriptFocusCard,
  readKpTypeScriptFocusCardInitialIndex,
  renderKpTypeScriptFocusCard
} from
  "../kinetic-figure-typescript-focus-card/kinetic-figure-typescript-focus-card.ts";
import {
  readKpSupplyTaxScrollScorePhraseFromHash,
  type KpSupplyTaxScrollScorePhraseV1,
  type KpSupplyTaxScrollScoreV1
} from
  "../kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-score.ts";
import {
  type kpSupplyTaxScrollScoreStageFacts,
  projectKpSupplyTaxScrollScoreStageLens
} from
  "../kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-stage-lens.ts";
import { projectKpSupplyTaxScrollScoreStageLensDom } from
  "../kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-stage-lens-dom.ts";
import {
  projectKpSupplyTaxSceneDom,
  projectKpSupplyTaxSceneTransitionDom,
  kpSupplyTaxBeatHash,
  type KpSupplyTaxSceneProjectionV1
} from "./kinetic-figure-supply-tax-scene.ts";
import {
  type KpSupplyTaxPedagogicalScoreV1,
  type KpSupplyTaxPedagogicalBeatV1
} from "./kinetic-figure-supply-tax-score.ts";
import {
  projectKpSupplyTaxTransitSvgDom,
  renderKpSupplyTaxInteractiveSvg
} from "./kinetic-figure-supply-tax-svg.ts";

const focusDeckAttentionTransitionDurationMs = 480;
const scrollEndFallbackMs = 220;
const wheelQuietWindowMs = 140;
const endpointTolerancePx = 1;
const mouseDragActivationPx = 6;
const swipeCommitRatio = 0.08;
const wheelCommitRatio = 0.025;
const mouseSwipeVelocityPxPerMs = 0.25;
const mouseSwipeVelocityFreshnessMs = 120;
const nativeSwipeVelocityPagesPerMs = 0.0003;

interface KpSupplyTaxFocusPhraseScene {
  readonly phrase: KpSupplyTaxScrollScorePhraseV1;
  readonly beat: KpSupplyTaxPedagogicalBeatV1;
}

interface SemanticEdge {
  readonly lowerIndex: number;
  readonly upperIndex: number;
}

interface PendingNavigation {
  readonly targetIndex: number;
  readonly history: "none" | "push" | "replace";
}

interface ProgrammaticPlayback {
  readonly edgeStartProgress: number;
  readonly edgeTargetProgress: number;
  readonly clockStartProgress: number;
  readonly clockTargetProgress: number;
}

interface MouseDrag {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  readonly startPosition: number;
  active: boolean;
  lastSampleTime: number;
  velocityPxPerMs: number;
}

interface NativeScrollGesture {
  readonly originIndex: number;
  peakDisplacement: number;
  lastPosition: number;
  lastSampleTime: number;
  peakVelocityPagesPerMs: number;
}

interface WheelGesture {
  readonly originIndex: number;
  intentPages: number;
  lastEventTime: number;
}

type NavigationMode =
  "idle" | "native" | "programmatic" | "correcting" | "scrubber";

export interface KpSupplyTaxKineticFigureSession {
  dispose(): void;
}

/**
 * This projection keeps the Scroll Score's authored phrases and stage lens,
 * while native scrolling owns physical input. The passive scroll adapter only
 * seeks the existing reader clock, which remains the sole semantic playhead.
 */
export function mountKpSupplyTaxKineticFigure(input: {
  readonly root: HTMLElement;
  readonly source: {
    readonly authority: KpEconomicsSupplyTaxAnimationAsset;
    readonly sampleFrame: (progress: number) => KpPerUnitTaxWelfareFrameV1;
    readonly exactLabels?: boolean;
    readonly instruction: {
      readonly authority: KpEconomicsSupplyTaxAnimationAsset;
      readonly score: KpSupplyTaxPedagogicalScoreV1;
      readonly scrollScore: KpSupplyTaxScrollScoreV1;
      readonly sceneForBeat: (beatId: string) => KpSupplyTaxSceneProjectionV1;
      readonly stageFacts: typeof kpSupplyTaxScrollScoreStageFacts;
      readonly phraseHtml: Readonly<Record<string, string>>;
    };
  };
}): KpSupplyTaxKineticFigureSession {
  applyKpSemanticVisualDomTheme({ root: input.root, theme: "light" });
  const { authority, instruction } = input.source;
  if (instruction.authority !== authority) {
    throw new Error("Supply-tax instruction must belong to this exact source authority.");
  }
  const scrollScore = instruction.scrollScore;
  const scenes = createPhraseScenes(scrollScore);
  const logExponentAuthority = createKpLogExponentFocusCardAuthority();
  const logExponentInitialIndex = readKpLogExponentFocusCardInitialIndex(
    logExponentAuthority,
    window.location.hash
  );
  const surfaceContourAuthority = createKpSurfaceContourFocusCardAuthority();
  const surfaceContourInitialIndex = readKpSurfaceContourFocusCardInitialIndex(
    surfaceContourAuthority,
    window.location.hash
  );
  const typeScriptAuthority = createKpTypeScriptFocusCardAuthority();
  const typeScriptInitialIndex = readKpTypeScriptFocusCardInitialIndex(
    typeScriptAuthority,
    window.location.hash
  );
  input.root.innerHTML = renderPage({
    authority,
    stageFacts: instruction.stageFacts,
    phraseHtml: instruction.phraseHtml,
    scenes,
    logExponentAuthority,
    logExponentInitialIndex,
    surfaceContourAuthority,
    surfaceContourInitialIndex,
    typeScriptAuthority,
    typeScriptInitialIndex
  });
  const logExponentSession = mountKpLogExponentFocusCard({
    root: input.root,
    authority: logExponentAuthority
  });
  const surfaceContourSession = mountKpSurfaceContourFocusCard({
    root: input.root,
    authority: surfaceContourAuthority
  });
  const typeScriptSession = mountKpTypeScriptFocusCard({
    root: input.root,
    authority: typeScriptAuthority
  });

  const deck = requiredElement<HTMLElement>(input.root,
    "[data-kp-supply-tax-focus-deck]");
  const graph = requiredElement<SVGSVGElement>(deck, ".kp-supply-tax-graph");
  const viewport = requiredElement<HTMLElement>(deck,
    "[data-kp-supply-tax-card-viewport]");
  const scrubber = requiredElement<HTMLInputElement>(deck,
    "[data-kp-supply-tax-state-scrubber]");
  const caption = requiredElement<HTMLElement>(deck,
    "[data-kp-supply-tax-stage-caption]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const authoredDurationMs = authority.animation.timeline?.durationMs;
  if (authoredDurationMs === undefined) {
    throw new Error("Supply-tax animation requires its canonical timeline.");
  }
  const initialIndex = readSceneIndexFromHash(scenes, scrollScore,
    window.location.hash);
  const clock = createKpReaderTimelinePlaybackClock({
    id: "clock.focus-deck.economics.supply-tax.v1",
    // The canonical clock retains enough temporal room for the domain motion.
    // Attention-only page turns use a shorter named range on this same clock.
    durationMs: authoredDurationMs,
    initialProgress: 1,
    ownerWindow: window
  });
  const projections = scenes.map(({ beat }) => instruction.sceneForBeat(beat.id));
  let settledIndex = initialIndex;
  let position = initialIndex;
  let activeEdge: SemanticEdge | undefined;
  let pendingNavigation: PendingNavigation | undefined;
  let programmaticPlayback: ProgrammaticPlayback | undefined;
  let navigationMode: NavigationMode = "idle";
  let scrollFrame: number | undefined;
  let scrollEndTimer: number | undefined;
  let restoreSnapFrame: number | undefined;
  let projectedModelProgress: number | undefined;
  let mouseDrag: MouseDrag | undefined;
  let nativeScrollGesture: NativeScrollGesture | undefined;
  let wheelGesture: WheelGesture | undefined;
  let disposed = false;

  const projectFrame = (modelProgress: number): void => {
    if (projectedModelProgress !== undefined &&
        Math.abs(projectedModelProgress - modelProgress) < 0.000001) return;
    // A supplied source owns its samples; never run a second interpolation
    // or silently fall back after an authored sampling failure.
    const frame = input.source.sampleFrame(modelProgress);
    projectKpSupplyTaxTransitSvgDom({
      root: graph,
      semantics: authority.semantics,
      frame,
      exactLabels: input.source.exactLabels ?? true
    });
    projectedModelProgress = modelProgress;
    deck.dataset["kpSupplyTaxModelProgress"] = modelProgress.toFixed(4);
  };

  const projectNavigationPosition = (nextPosition: number): void => {
    position = boundedPosition(nextPosition, scenes.length);
    scrubber.value = position.toFixed(4);
    scrubber.style.setProperty("--kp-supply-tax-scrubber-progress",
      `${(position / Math.max(1, scenes.length - 1) * 100).toFixed(3)}%`);
    scrubber.setAttribute("aria-valuetext",
      scrubberValueText(position, scenes));
    deck.dataset["kpSupplyTaxDeckPosition"] = position.toFixed(4);
  };

  const projectLens = (
    from: KpSupplyTaxFocusPhraseScene,
    to: KpSupplyTaxFocusPhraseScene,
    progress: number
  ): void => {
    projectKpSupplyTaxScrollScoreStageLensDom({
      root: deck,
      lens: projectKpSupplyTaxScrollScoreStageLens({
        authority,
        fromBeat: from.beat,
        toBeat: to.beat,
        progress
      })
    });
  };

  const projectEndpoint = (index: number): void => {
    const scene = scenes[index]!;
    projectNavigationPosition(index);
    projectFrame(modelProgressForScene(scene));
    projectKpSupplyTaxSceneDom({ root: deck, scene: projections[index]! });
    projectLens(scene, scene, 1);
    caption.textContent = scene.beat.claim;
    deck.dataset["kpSupplyTaxClockProgress"] = "1.0000";
    deck.dataset["kpSupplyTaxGestureProgress"] = "1.0000";
    deck.dataset["kpSupplyTaxInteraction"] = "settled";
  };

  const projectEdge = (edge: SemanticEdge, progress: number): void => {
    const bounded = Math.max(0, Math.min(1, progress));
    const from = scenes[edge.lowerIndex]!;
    const to = scenes[edge.upperIndex]!;
    const fromProjection = projections[edge.lowerIndex]!;
    const toProjection = projections[edge.upperIndex]!;
    projectNavigationPosition(edge.lowerIndex + bounded);
    projectFrame(interpolate(
      modelProgressForProjection(fromProjection),
      modelProgressForProjection(toProjection),
      bounded
    ));
    if (bounded <= 0) {
      projectKpSupplyTaxSceneDom({ root: deck, scene: fromProjection });
    } else if (bounded >= 1) {
      projectKpSupplyTaxSceneDom({ root: deck, scene: toProjection });
    } else {
      projectKpSupplyTaxSceneTransitionDom({
        root: deck,
        from: fromProjection,
        to: toProjection,
        progress: bounded,
        profile: "scrub"
      });
    }
    projectLens(from, to, bounded);
    caption.textContent = bounded < 0.5 ? from.beat.claim : to.beat.claim;
    deck.dataset["kpSupplyTaxClockProgress"] = bounded.toFixed(4);
    deck.dataset["kpSupplyTaxGestureProgress"] = bounded.toFixed(4);
    deck.dataset["kpSupplyTaxInteraction"] = pendingNavigation === undefined
      ? "scrubbing"
      : "snapping";
  };

  const projectChrome = (index: number): void => {
    const scene = scenes[index]!;
    deck.dataset["kpFocusDeckActiveBeat"] = scene.beat.slug;
    deck.dataset["kpFocusDeckActivePhrase"] = scene.phrase.id;
    scenes.forEach((candidate, candidateIndex) => {
      const selected = candidateIndex === index;
      const section = requiredElement<HTMLElement>(deck,
        `[data-kp-focus-deck-beat="${candidate.beat.slug}"]`);
      section.dataset["kpFocusDeckBeatActive"] = String(selected);
      if (selected) section.setAttribute("aria-current", "page");
      else section.removeAttribute("aria-current");
    });
    const previous = requiredElement<HTMLButtonElement>(deck,
      "[data-kp-focus-deck-previous]");
    const next = requiredElement<HTMLButtonElement>(deck,
      "[data-kp-focus-deck-next]");
    previous.disabled = index === 0;
    next.disabled = index === scenes.length - 1;
    deck.querySelectorAll<HTMLOutputElement>("[data-kp-focus-deck-position]")
      .forEach((output) => {
        output.value = `Step ${scene.beat.ordinal} of ${scenes.length}: ` +
          scene.beat.title;
      });
    const replay = requiredElement<HTMLButtonElement>(deck,
      "[data-kp-supply-tax-replay]");
    replay.hidden = scene.beat.transitionFromPrevious !==
      "sample-tax-imposition";
  };

  const updateLocation = (
    index: number,
    mode: "none" | "push" | "replace"
  ): void => {
    if (mode === "none") return;
    const hash = kpSupplyTaxBeatHash(scenes[index]!.beat);
    if (window.location.hash === hash) return;
    if (mode === "push") history.pushState(null, "", hash);
    else history.replaceState(null, "", hash);
  };

  const cancelScrollProjection = (): void => {
    if (scrollFrame === undefined) return;
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = undefined;
  };

  const cancelScrollEndFallback = (): void => {
    if (scrollEndTimer === undefined) return;
    window.clearTimeout(scrollEndTimer);
    scrollEndTimer = undefined;
  };

  const cancelSnapRestore = (): void => {
    if (restoreSnapFrame === undefined) return;
    window.cancelAnimationFrame(restoreSnapFrame);
    restoreSnapFrame = undefined;
  };

  const disableNativeSnap = (): void => {
    cancelSnapRestore();
    viewport.dataset["kpSupplyTaxSnapDisabled"] = "true";
    // WebKit can otherwise resolve a same-task scrollLeft write against the
    // previous snap style and pull the viewport back to its current page.
    void viewport.offsetWidth;
  };

  const restoreNativeSnapSoon = (): void => {
    cancelSnapRestore();
    restoreSnapFrame = window.requestAnimationFrame(() => {
      restoreSnapFrame = undefined;
      // A native gesture can move the viewport before this deferred correction
      // runs. Restoring the old snap target would steal that newer input.
      const settledOffset = settledIndex * Math.max(1, viewport.clientWidth);
      if (Math.abs(viewport.scrollLeft - settledOffset) > endpointTolerancePx) {
        navigationMode = "native";
        scheduleNativeProjection();
        scheduleScrollEndFallback();
        return;
      }
      delete viewport.dataset["kpSupplyTaxSnapDisabled"];
      navigationMode = "idle";
    });
  };

  const readNativePosition = (): number => boundedPosition(
    viewport.scrollLeft / Math.max(1, viewport.clientWidth),
    scenes.length
  );

  const writeNativePosition = (nextPosition: number): void => {
    viewport.scrollLeft = boundedPosition(nextPosition, scenes.length) *
      Math.max(1, viewport.clientWidth);
  };

  const finishAt = (
    index: number,
    historyMode: PendingNavigation["history"]
  ): void => {
    cancelScrollProjection();
    cancelScrollEndFallback();
    const bounded = boundedIndex(index, scenes.length);
    nativeScrollGesture = undefined;
    wheelGesture = undefined;
    delete deck.dataset["kpSupplyTaxWheelIntent"];
    delete deck.dataset["kpSupplyTaxPlaybackKind"];
    delete deck.dataset["kpSupplyTaxPlaybackDurationMs"];
    pendingNavigation = undefined;
    programmaticPlayback = undefined;
    activeEdge = undefined;
    clock.pause();
    clock.seek(1, historyMode === "none" ? "url" : "controls");
    navigationMode = "correcting";
    disableNativeSnap();
    writeNativePosition(bounded);
    settledIndex = bounded;
    projectEndpoint(bounded);
    projectChrome(bounded);
    updateLocation(bounded, historyMode);
    restoreNativeSnapSoon();
  };

  const directSeek = (
    index: number,
    historyMode: PendingNavigation["history"]
  ): void => finishAt(index, historyMode);

  const startProgrammaticNavigation = (
    targetIndex: number,
    historyMode: PendingNavigation["history"]
  ): void => {
    cancelScrollProjection();
    cancelScrollEndFallback();
    nativeScrollGesture = undefined;
    wheelGesture = undefined;
    programmaticPlayback = undefined;
    const target = boundedIndex(targetIndex, scenes.length);
    const currentPosition = readNativePosition();
    projectNavigationPosition(currentPosition);
    if (reducedMotion.matches || Math.abs(target - currentPosition) > 1) {
      directSeek(target, historyMode);
      return;
    }
    const lowerIndex = Math.min(Math.floor(currentPosition), target);
    const upperIndex = Math.max(Math.ceil(currentPosition), target);
    if (lowerIndex === upperIndex) {
      directSeek(target, historyMode);
      return;
    }
    navigationMode = "programmatic";
    disableNativeSnap();
    activeEdge = Object.freeze({ lowerIndex, upperIndex });
    pendingNavigation = Object.freeze({
      targetIndex: target,
      history: historyMode
    });
    const currentProgress = currentPosition - lowerIndex;
    const targetProgress = target - lowerIndex;
    const domainMotion = scenes[upperIndex]!.beat.transitionFromPrevious ===
      "sample-tax-imposition";
    const fullEdgeDurationMs = domainMotion
      ? authoredDurationMs
      : Math.min(authoredDurationMs, focusDeckAttentionTransitionDurationMs);
    const remainingEdge = Math.abs(targetProgress - currentProgress);
    const clockDistance = Math.min(1,
      fullEdgeDurationMs / authoredDurationMs * remainingEdge);
    const forward = targetProgress > currentProgress;
    const clockStartProgress = forward ? 0 : clockDistance;
    const clockTargetProgress = forward ? clockDistance : 0;
    programmaticPlayback = Object.freeze({
      edgeStartProgress: currentProgress,
      edgeTargetProgress: targetProgress,
      clockStartProgress,
      clockTargetProgress
    });
    deck.dataset["kpSupplyTaxPlaybackKind"] = domainMotion
      ? "domain-motion"
      : "attention";
    deck.dataset["kpSupplyTaxPlaybackDurationMs"] = String(Math.round(
      fullEdgeDurationMs * remainingEdge
    ));
    clock.seek(clockStartProgress);
    clock.play({
      direction: forward ? "forward" : "rewind",
      stopAt: clockTargetProgress
    });
  };

  const requestIndex = (index: number): void => {
    const target = boundedIndex(index, scenes.length);
    if (target === settledIndex && navigationMode === "idle") return;
    if (Math.abs(target - settledIndex) !== 1) {
      directSeek(target, "push");
      return;
    }
    startProgrammaticNavigation(target, "push");
  };

  const requestAdjacent = (direction: -1 | 1): void => {
    requestIndex(settledIndex + direction);
  };

  const replay = (): void => {
    const scene = scenes[settledIndex]!;
    if (scene.beat.transitionFromPrevious !== "sample-tax-imposition") return;
    const target = settledIndex;
    directSeek(target - 1, "none");
    startProgrammaticNavigation(target, "none");
  };

  const projectPosition = (nextPosition: number): void => {
    const nearest = Math.round(nextPosition);
    if (Math.abs(nextPosition - nearest) <= 0.0001) {
      activeEdge = undefined;
      pendingNavigation = undefined;
      projectEndpoint(boundedIndex(nearest, scenes.length));
      return;
    }
    const lowerIndex = Math.floor(nextPosition);
    const upperIndex = Math.min(scenes.length - 1, lowerIndex + 1);
    if (lowerIndex === upperIndex) {
      projectEndpoint(lowerIndex);
      return;
    }
    activeEdge = Object.freeze({ lowerIndex, upperIndex });
    pendingNavigation = undefined;
    programmaticPlayback = undefined;
    clock.seek(nextPosition - lowerIndex);
  };

  const recordNativeScrollSample = (
    nextPosition: number,
    sampleTime: number
  ): void => {
    const gesture = nativeScrollGesture;
    if (gesture === undefined) {
      nativeScrollGesture = {
        originIndex: settledIndex,
        peakDisplacement: nextPosition - settledIndex,
        lastPosition: nextPosition,
        lastSampleTime: sampleTime,
        peakVelocityPagesPerMs: 0
      };
      return;
    }
    const displacement = nextPosition - gesture.originIndex;
    if (Math.abs(displacement) > Math.abs(gesture.peakDisplacement)) {
      gesture.peakDisplacement = displacement;
    }
    const elapsed = Math.max(1, sampleTime - gesture.lastSampleTime);
    const velocity = (nextPosition - gesture.lastPosition) / elapsed;
    if (Math.abs(velocity) > Math.abs(gesture.peakVelocityPagesPerMs)) {
      gesture.peakVelocityPagesPerMs = velocity;
    }
    gesture.lastPosition = nextPosition;
    gesture.lastSampleTime = sampleTime;
  };

  const projectNativeScroll = (): void => {
    scrollFrame = undefined;
    if (navigationMode === "programmatic" ||
        navigationMode === "correcting" ||
        navigationMode === "scrubber") return;
    navigationMode = "native";
    const nextPosition = readNativePosition();
    recordNativeScrollSample(nextPosition, performance.now());
    projectPosition(nextPosition);
  };

  const scheduleNativeProjection = (): void => {
    if (scrollFrame !== undefined) return;
    // Native scrolling may emit more samples than the display can paint. The
    // passive listener records no semantic state; one frame samples the reader
    // clock and projects all renderers together.
    scrollFrame = window.requestAnimationFrame(projectNativeScroll);
  };

  const flushNativeProjection = (): void => {
    cancelScrollProjection();
    projectNativeScroll();
  };

  const settleNativeScroll = (): void => {
    cancelScrollEndFallback();
    if (navigationMode === "programmatic" ||
        navigationMode === "correcting" ||
        navigationMode === "scrubber" || mouseDrag?.active) return;
    const wheel = wheelGesture;
    if (wheel !== undefined &&
        performance.now() - wheel.lastEventTime < wheelQuietWindowMs) {
      scheduleScrollEndFallback();
      return;
    }
    flushNativeProjection();
    const nextPosition = readNativePosition();
    const gesture = nativeScrollGesture;
    nativeScrollGesture = undefined;
    wheelGesture = undefined;
    const wheelCommitted = wheel !== undefined &&
      Math.abs(wheel.intentPages) >= wheelCommitRatio;
    const nativeCommitted = gesture !== undefined && (
      Math.abs(gesture.peakDisplacement) >= swipeCommitRatio ||
      Math.abs(gesture.peakVelocityPagesPerMs) >=
        nativeSwipeVelocityPagesPerMs
    );
    const direction = Math.sign(wheel?.intentPages ||
      gesture?.peakDisplacement ||
      gesture?.peakVelocityPagesPerMs || 0);
    const origin = wheel?.originIndex ?? gesture?.originIndex ?? settledIndex;
    const visibleTarget = boundedIndex(nextPosition, scenes.length);
    // Intent rescues a short Safari gesture that snap resistance erased. Once
    // the reader has visibly crossed a page boundary, their observed position
    // is stronger evidence than the gesture's (possibly much older) origin.
    const target = visibleTarget !== origin
      ? visibleTarget
      : (wheelCommitted || nativeCommitted) && direction !== 0
        ? boundedIndex(origin + direction, scenes.length)
        : visibleTarget;
    const exactOffset = target * Math.max(1, viewport.clientWidth);
    const historyMode = target === settledIndex ? "none" : "push";
    if (Math.abs(viewport.scrollLeft - exactOffset) <= endpointTolerancePx &&
        target === settledIndex && navigationMode === "idle") return;
    finishAt(target, historyMode);
  };

  const scheduleScrollEndFallback = (): void => {
    cancelScrollEndFallback();
    scrollEndTimer = window.setTimeout(settleNativeScroll,
      scrollEndFallbackMs);
  };

  const interruptProgrammaticNavigation = (): void => {
    if (navigationMode !== "programmatic") return;
    clock.pause();
    pendingNavigation = undefined;
    programmaticPlayback = undefined;
    activeEdge = undefined;
    cancelSnapRestore();
    delete viewport.dataset["kpSupplyTaxSnapDisabled"];
    navigationMode = "native";
  };

  const handlePointerDown = (event: PointerEvent): void => {
    interruptProgrammaticNavigation();
    if (event.pointerType !== "mouse" || event.button !== 0 ||
        !event.isPrimary) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(
      "a, button, input, select, textarea, [contenteditable]"
    ) !== null) return;
    mouseDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: readNativePosition(),
      active: false,
      lastSampleTime: event.timeStamp,
      velocityPxPerMs: 0
    };
    viewport.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent): void => {
    const drag = mouseDrag;
    if (drag === undefined || drag.pointerId !== event.pointerId) return;
    const deltaX = drag.startX - event.clientX;
    const deltaY = drag.startY - event.clientY;
    if (!drag.active) {
      if (Math.abs(deltaX) < mouseDragActivationPx) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        mouseDrag = undefined;
        if (viewport.hasPointerCapture(event.pointerId)) {
          viewport.releasePointerCapture(event.pointerId);
        }
        return;
      }
      drag.active = true;
      clock.pause();
      pendingNavigation = undefined;
      activeEdge = undefined;
      navigationMode = "native";
      disableNativeSnap();
      viewport.dataset["kpSupplyTaxMouseDragging"] = "true";
      window.getSelection()?.removeAllRanges();
    }
    event.preventDefault();
    const width = Math.max(1, viewport.clientWidth);
    const before = viewport.scrollLeft;
    writeNativePosition(drag.startPosition + deltaX / width);
    const elapsed = Math.max(1, event.timeStamp - drag.lastSampleTime);
    const instantaneousVelocity = (viewport.scrollLeft - before) / elapsed;
    drag.velocityPxPerMs = drag.velocityPxPerMs * 0.55 +
      instantaneousVelocity * 0.45;
    drag.lastSampleTime = event.timeStamp;
  };

  const finishMouseDrag = (event: PointerEvent, canceled = false): void => {
    const drag = mouseDrag;
    if (drag === undefined || drag.pointerId !== event.pointerId) return;
    mouseDrag = undefined;
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    delete viewport.dataset["kpSupplyTaxMouseDragging"];
    if (!drag.active) return;
    const currentPosition = readNativePosition();
    const displacement = currentPosition - drag.startPosition;
    const velocityIsFresh = event.timeStamp - drag.lastSampleTime <=
      mouseSwipeVelocityFreshnessMs;
    const committed = !canceled && (
      Math.abs(displacement) >= swipeCommitRatio ||
      velocityIsFresh && Math.abs(drag.velocityPxPerMs) >=
        mouseSwipeVelocityPxPerMs
    );
    const direction = Math.sign(displacement || drag.velocityPxPerMs);
    const origin = boundedIndex(drag.startPosition, scenes.length);
    const visibleTarget = boundedIndex(currentPosition, scenes.length);
    const target = visibleTarget !== origin
      ? visibleTarget
      : committed && direction !== 0
        ? boundedIndex(origin + direction, scenes.length)
        : visibleTarget;
    startProgrammaticNavigation(target, "push");
  };

  const handlePointerUp = (event: PointerEvent): void => {
    finishMouseDrag(event);
  };

  const handlePointerCancel = (event: PointerEvent): void => {
    finishMouseDrag(event, true);
  };

  const handleScroll = (event: Event): void => {
    if (navigationMode === "programmatic" ||
        navigationMode === "correcting" ||
        navigationMode === "scrubber") return;
    recordNativeScrollSample(readNativePosition(), event.timeStamp);
    scheduleNativeProjection();
    scheduleScrollEndFallback();
  };

  const handleWheel = (event: WheelEvent): void => {
    interruptProgrammaticNavigation();
    const deltaX = wheelDeltaPixels(event, viewport.clientWidth);
    const deltaY = wheelDeltaPixels(event, viewport.clientHeight, "y");
    if (Math.abs(deltaX) < Math.max(1, Math.abs(deltaY) * 0.65)) return;
    const sampleTime = performance.now();
    const stale = wheelGesture === undefined ||
      sampleTime - wheelGesture.lastEventTime > scrollEndFallbackMs * 2;
    if (stale) {
      wheelGesture = {
        originIndex: settledIndex,
        intentPages: 0,
        lastEventTime: sampleTime
      };
    }
    wheelGesture!.intentPages += deltaX / Math.max(1, viewport.clientWidth);
    wheelGesture!.lastEventTime = sampleTime;
    deck.dataset["kpSupplyTaxWheelIntent"] =
      wheelGesture!.intentPages.toFixed(4);
    // WebKit's snap physics can erase a short gesture from scrollLeft. This
    // passive intent sample lets exact semantic settlement remain independent
    // of that renderer-owned resistance.
    scheduleScrollEndFallback();
  };

  const handleScrollEnd = (): void => settleNativeScroll();

  const beginScrubberNavigation = (): void => {
    if (navigationMode === "scrubber") return;
    cancelScrollProjection();
    cancelScrollEndFallback();
    clock.pause();
    nativeScrollGesture = undefined;
    wheelGesture = undefined;
    pendingNavigation = undefined;
    programmaticPlayback = undefined;
    activeEdge = undefined;
    navigationMode = "scrubber";
    disableNativeSnap();
  };

  const handleScrubberInput = (): void => {
    beginScrubberNavigation();
    const nextPosition = boundedPosition(Number(scrubber.value), scenes.length);
    writeNativePosition(nextPosition);
    projectPosition(nextPosition);
  };

  const finishScrubberNavigation = (): void => {
    if (navigationMode !== "scrubber") return;
    startProgrammaticNavigation(
      boundedIndex(Number(scrubber.value), scenes.length),
      "push"
    );
  };

  const handleScrubberKeydown = (event: KeyboardEvent): void => {
    const target = readKpFocusDeckScrubberKeyTarget(event, position, scenes.length);
    if (target === undefined) return;
    event.preventDefault();
    requestIndex(target);
  };

  const handleScrubberBlur = (): void => finishScrubberNavigation();

  const handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("[data-kp-focus-deck-previous]") !== null) {
      requestAdjacent(-1);
      return;
    }
    if (target?.closest("[data-kp-focus-deck-next]") !== null) {
      requestAdjacent(1);
      return;
    }
    if (target?.closest("[data-kp-supply-tax-replay]") !== null) {
      replay();
    }
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.target instanceof HTMLElement && event.target.closest(
      "a, button, input, select, textarea, [contenteditable]"
    ) !== null) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      requestAdjacent(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      requestAdjacent(1);
    }
  };

  const handleLocation = (): void => {
    const index = findSceneIndexFromHash(
      scenes,
      scrollScore,
      window.location.hash
    );
    if (index !== undefined) directSeek(index, "none");
  };

  const revealMatchedScene = (element: Element | null): void => {
    const slug = element?.closest<HTMLElement>("[data-kp-focus-deck-beat]")
      ?.dataset["kpFocusDeckBeat"];
    const index = scenes.findIndex(({ beat }) => beat.slug === slug);
    if (index >= 0 && index !== settledIndex) directSeek(index, "replace");
  };

  const handleBeforeMatch = (event: Event): void => {
    revealMatchedScene(event.target instanceof Element ? event.target : null);
  };

  const handleSelectionChange = (): void => {
    // Browser find may intentionally seek through beforematch, but incidental
    // selection churn must not redirect a touch or trackpad gesture in flight.
    if (navigationMode !== "idle") return;
    const anchor = window.getSelection()?.anchorNode;
    revealMatchedScene(anchor instanceof Element ? anchor :
      anchor?.parentElement ?? null);
  };

  const handleResize = (): void => {
    if (navigationMode === "idle") {
      finishAt(settledIndex, "none");
      return;
    }
    const mode = navigationMode;
    const preservedPosition = mode === "native"
      ? nativeScrollGesture?.lastPosition ?? position
      : position;
    disableNativeSnap();
    writeNativePosition(preservedPosition);
    // A resize during endpoint correction canceled its pending snap restore;
    // active gestures and clocks restore snap through their normal settlement.
    if (mode === "correcting") restoreNativeSnapSoon();
  };
  const handleReducedMotion = (): void => {
    if (activeEdge !== undefined) directSeek(Math.round(position), "none");
  };

  const unsubscribe = clock.subscribe((sample) => {
    const edge = activeEdge;
    if (edge === undefined) return;
    const playback = programmaticPlayback;
    const edgeProgress = navigationMode === "programmatic" &&
        playback !== undefined
      ? projectProgrammaticEdgeProgress(playback, sample.progress)
      : sample.progress;
    if (navigationMode === "programmatic") {
      writeNativePosition(edge.lowerIndex + edgeProgress);
    }
    projectEdge(edge, edgeProgress);
    const navigation = pendingNavigation;
    if (!sample.settled || navigation === undefined) return;
    const targetProgress = navigation.targetIndex - edge.lowerIndex;
    if (Math.abs(edgeProgress - targetProgress) <= 0.0001) {
      finishAt(navigation.targetIndex, navigation.history);
    }
  });

  finishAt(initialIndex, "none");
  deck.addEventListener("click", handleClick);
  deck.addEventListener("keydown", handleKeydown);
  deck.addEventListener("beforematch", handleBeforeMatch, true);
  viewport.addEventListener("scroll", handleScroll, { passive: true });
  viewport.addEventListener("scrollend", handleScrollEnd);
  // Touch and trackpad input remain browser-native. Desktop browsers do not
  // make overflow surfaces mouse-draggable, so this adapter changes only the
  // real scroll offset and lets the existing scroll sampler own semantics.
  viewport.addEventListener("pointerdown", handlePointerDown,
    { passive: true });
  viewport.addEventListener("pointermove", handlePointerMove);
  viewport.addEventListener("pointerup", handlePointerUp, { passive: true });
  viewport.addEventListener("pointercancel", handlePointerCancel,
    { passive: true });
  viewport.addEventListener("wheel", handleWheel,
    { passive: true });
  scrubber.addEventListener("input", handleScrubberInput);
  scrubber.addEventListener("change", finishScrubberNavigation);
  scrubber.addEventListener("keydown", handleScrubberKeydown);
  scrubber.addEventListener("blur", handleScrubberBlur);
  document.addEventListener("selectionchange", handleSelectionChange);
  window.addEventListener("resize", handleResize);
  window.addEventListener("popstate", handleLocation);
  window.addEventListener("hashchange", handleLocation);
  reducedMotion.addEventListener("change", handleReducedMotion);

  return Object.freeze({
    dispose: () => {
      if (disposed) return;
      disposed = true;
      deck.removeEventListener("click", handleClick);
      deck.removeEventListener("keydown", handleKeydown);
      deck.removeEventListener("beforematch", handleBeforeMatch, true);
      viewport.removeEventListener("scroll", handleScroll);
      viewport.removeEventListener("scrollend", handleScrollEnd);
      viewport.removeEventListener("pointerdown", handlePointerDown);
      viewport.removeEventListener("pointermove", handlePointerMove);
      viewport.removeEventListener("pointerup", handlePointerUp);
      viewport.removeEventListener("pointercancel", handlePointerCancel);
      viewport.removeEventListener("wheel", handleWheel);
      scrubber.removeEventListener("input", handleScrubberInput);
      scrubber.removeEventListener("change", finishScrubberNavigation);
      scrubber.removeEventListener("keydown", handleScrubberKeydown);
      scrubber.removeEventListener("blur", handleScrubberBlur);
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("popstate", handleLocation);
      window.removeEventListener("hashchange", handleLocation);
      reducedMotion.removeEventListener("change", handleReducedMotion);
      cancelScrollProjection();
      cancelScrollEndFallback();
      cancelSnapRestore();
      logExponentSession.dispose();
      surfaceContourSession.dispose();
      typeScriptSession.dispose();
      unsubscribe();
      clock.dispose();
    }
  });
}

function createPhraseScenes(
  score: KpSupplyTaxScrollScoreV1
): readonly KpSupplyTaxFocusPhraseScene[] {
  return Object.freeze(score.phrases.map((phrase) => {
    const passage = score.passages.find(({ id }) => id === phrase.passageId);
    if (passage === undefined) {
      throw new Error(`Missing Focus Deck passage ${phrase.passageId}.`);
    }
    return Object.freeze({
      phrase,
      beat: phrase.beat
    });
  }));
}

function readSceneIndexFromHash(
  scenes: readonly KpSupplyTaxFocusPhraseScene[],
  score: KpSupplyTaxScrollScoreV1,
  hash: string
): number {
  return findSceneIndexFromHash(scenes, score, hash) ?? 0;
}

function findSceneIndexFromHash(
  scenes: readonly KpSupplyTaxFocusPhraseScene[],
  score: KpSupplyTaxScrollScoreV1,
  hash: string
): number | undefined {
  const phrase = readKpSupplyTaxScrollScorePhraseFromHash(score, hash);
  if (phrase !== undefined) {
    return scenes.findIndex((scene) => scene.phrase.id === phrase.id);
  }
  if (!hash.startsWith("#beat.")) return undefined;
  const slug = hash.slice("#beat.".length);
  const index = scenes.findIndex((scene) => scene.beat.slug === slug);
  return index < 0 ? undefined : index;
}

function modelProgressForScene(scene: KpSupplyTaxFocusPhraseScene): number {
  return scene.beat.settledFrame === "untaxed" ? 0 : 1;
}

function modelProgressForProjection(scene: KpSupplyTaxSceneProjectionV1): number {
  return scene.settledFrame === "untaxed" ? 0 : 1;
}

function boundedIndex(index: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.round(index)));
}

function boundedPosition(value: number, count: number): number {
  return Math.max(0, Math.min(count - 1, value));
}

function projectProgrammaticEdgeProgress(
  playback: ProgrammaticPlayback,
  clockProgress: number
): number {
  const clockDistance = playback.clockTargetProgress -
    playback.clockStartProgress;
  if (Math.abs(clockDistance) <= 0.000001) {
    return playback.edgeTargetProgress;
  }
  const traversal = Math.max(0, Math.min(1,
    (clockProgress - playback.clockStartProgress) / clockDistance));
  return interpolate(
    playback.edgeStartProgress,
    playback.edgeTargetProgress,
    traversal
  );
}

function scrubberValueText(
  position: number,
  scenes: readonly KpSupplyTaxFocusPhraseScene[]
): string {
  const index = boundedIndex(position, scenes.length);
  return `Step ${index + 1} of ${scenes.length}: ${scenes[index]!.beat.title}`;
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function wheelDeltaPixels(
  event: WheelEvent,
  pageSize: number,
  axis: "x" | "y" = "x"
): number {
  const delta = axis === "x" ? event.deltaX : event.deltaY;
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return delta * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return delta * pageSize;
  return delta;
}

function renderPage(input: {
  readonly authority: KpEconomicsSupplyTaxAnimationAsset;
  readonly stageFacts: typeof kpSupplyTaxScrollScoreStageFacts;
  readonly phraseHtml: Readonly<Record<string, string>>;
  readonly scenes: readonly KpSupplyTaxFocusPhraseScene[];
  readonly logExponentAuthority: ReturnType<
    typeof createKpLogExponentFocusCardAuthority
  >;
  readonly logExponentInitialIndex: number;
  readonly surfaceContourAuthority: ReturnType<
    typeof createKpSurfaceContourFocusCardAuthority
  >;
  readonly surfaceContourInitialIndex: number;
  readonly typeScriptAuthority: ReturnType<
    typeof createKpTypeScriptFocusCardAuthority
  >;
  readonly typeScriptInitialIndex: number;
}): string {
  const scenes = input.scenes;
  return `<main class="kp-supply-tax-page">
    <article class="kp-supply-tax-article" aria-labelledby="kp-supply-tax-page-title">
      <header class="kp-supply-tax-page__intro">
        <p>Focus Deck · Economics</p>
        <h1 id="kp-supply-tax-page-title">How does a tax reshape a market?</h1>
      </header>
      ${renderKpFocusDeckScaffold({
        id: "focus-deck.economics.supply-tax.v1",
        ariaLabel: "Per-unit tax Focus Deck",
        activeBeatSlug: scenes[0]!.beat.slug,
        stageHtml: renderStaticStage(input.authority, input.stageFacts),
        beats: scenes.map((scene) => ({
          slug: scene.beat.slug,
          title: scene.beat.title,
          html: input.phraseHtml[scene.phrase.referenceAddress]!,
          domId: `phrase.${scene.phrase.id}`,
          attributes: {
            "data-kp-focus-deck-phrase": scene.phrase.id
          }
        })),
        rootAttributes: {
          "data-kp-supply-tax-focus-deck": true,
          "data-kp-focus-deck-active-phrase": scenes[0]!.phrase.id
        },
        viewportAttributes: {
          "data-kp-supply-tax-card-viewport": true
        },
        scrubberAttributes: {
          "data-kp-supply-tax-state-scrubber": true
        },
        replayAttributes: {
          "data-kp-supply-tax-replay": true
        },
        classAliases: {
          root: "kp-supply-tax-deck",
          header: "kp-supply-tax-deck__header",
          body: "kp-supply-tax-deck__body",
          main: "kp-supply-tax-deck__main",
          card: "kp-supply-tax-card",
          narrative: "kp-supply-tax-narrative",
          passagePage: "kp-supply-tax-narrative__page",
          navigation: "kp-supply-tax-navigation",
          navigationRail: "kp-supply-tax-navigation__rail",
          scrubber: "kp-supply-tax-navigation__scrubber",
          ticks: "kp-supply-tax-navigation__ticks",
          visuallyHidden: "kp-supply-tax-visually-hidden"
        }
      })}
      ${renderKpLogExponentFocusCard({
        authority: input.logExponentAuthority,
        initialIndex: input.logExponentInitialIndex
      })}
      ${renderKpSurfaceContourFocusCard({
        authority: input.surfaceContourAuthority,
        initialIndex: input.surfaceContourInitialIndex
      })}
      ${renderKpTypeScriptFocusCard({
        authority: input.typeScriptAuthority,
        initialIndex: input.typeScriptInitialIndex
      })}
    </article>
  </main>`;
}

function renderStaticStage(authority: KpEconomicsSupplyTaxAnimationAsset, stageFacts: typeof kpSupplyTaxScrollScoreStageFacts): string {
  return `<figure class="kp-focus-deck__stage kp-supply-tax-figure kp-scroll-score-stage" data-kp-supply-tax-stage data-kp-supply-tax-stage-state="baseline-market">
    <figcaption class="kp-focus-deck__visually-hidden kp-supply-tax-visually-hidden" data-kp-supply-tax-stage-caption>Demand and original supply intersect at five units and a price of seven before the tax.</figcaption>
    <div class="kp-supply-tax-stage__visual">
      <div class="kp-supply-tax-stage__graph">
        ${renderKpSupplyTaxInteractiveSvg(authority.semantics)}
        <div class="kp-scroll-score-stage-facts" aria-hidden="true">
          ${stageFacts.map(({ id, latex }) =>
            `<span data-kp-scroll-score-stage-fact="${id}" data-kp-scroll-score-stage-fact-present="false">${renderLatexToHtml(latex, { displayMode: false })}</span>`
          ).join("")}
        </div>
      </div>
    </div>
  </figure>`;
}

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing supply-tax element ${selector}.`);
  return element;
}
