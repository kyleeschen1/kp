import "katex/dist/katex.min.css";
import "../../document-base.css";
import "../../rendering/focus-card-runtime.css";
import "../focus-deck-scaffold.css";
import "../kinetic-figure-surface-contour/kinetic-figure-surface-contour.css";
import { createDeferredCardSession } from "./deferred-card-session.ts";
import "../kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card.css";
import "../../rendering/typescript-refactor.css";
import "../kinetic-figure-typescript-focus-card/kinetic-figure-typescript-focus-card.css";
import "../kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score.css";
import "./kinetic-figure-supply-tax.css";
import { mountKpFocusDeckNativeInput } from "../focus-deck-native-input.ts";
import { createKpFocusDeckTravelPlayback } from "../focus-deck-checkpoint-playback.ts";
import { settleKpFocusDeckTravel } from "../focus-deck-continuous-navigation.ts";

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
  readKpLogExponentFocusCardInitialIndex,
  renderKpLogExponentFocusCard
} from
  "../kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card-static.ts";
import {
  createKpSurfaceContourFocusCardAuthority,
  readKpSurfaceContourFocusCardInitialIndex,
  renderKpSurfaceContourFocusCard
} from
  "../kinetic-figure-surface-contour/kinetic-figure-surface-contour-entry-static.ts";
import {
  createKpTypeScriptFocusCardAuthority,
  readKpTypeScriptFocusCardInitialIndex,
  renderKpTypeScriptFocusCard
} from
  "../kinetic-figure-typescript-focus-card/kinetic-figure-typescript-focus-card-static.ts";
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
  // Keep canonical static content present, but let actual visibility or direct
  // intent request each independent playback capability. No second clock.
  const companions = [
    {
      selector: "[data-kp-log-exponent-focus-card]",
      stageSelector: "[data-kp-log-exponent-focus-card-stage]",
      hashes: logExponentAuthority.score.beats.map(beat => `#beat.log-exponent.${beat.slug}`),
      session: createDeferredCardSession(async () => {
        const { mountKpLogExponentFocusCard } = await import("../kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card.ts");
        return () => mountKpLogExponentFocusCard({ root: input.root, authority: logExponentAuthority });
      })
    },
    {
      selector: "[data-kp-surface-contour-deck]",
      stageSelector: "[data-kp-surface-contour-stage]",
      hashes: surfaceContourAuthority.score.beats.map(beat => `#beat.${beat.slug}`),
      session: createDeferredCardSession(async () => {
        const { mountKpSurfaceContourFocusCard } = await import("../kinetic-figure-surface-contour/kinetic-figure-surface-contour-entry.ts");
        return () => mountKpSurfaceContourFocusCard({ root: input.root, authority: surfaceContourAuthority });
      })
    },
    {
      selector: "[data-kp-typescript-focus-card]",
      stageSelector: "[data-kp-typescript-focus-card-stage]",
      hashes: typeScriptAuthority.score.beats.map(beat => `#beat.typescript.${beat.slug}`),
      session: createDeferredCardSession(async () => {
        const { mountKpTypeScriptFocusCard } = await import("../kinetic-figure-typescript-focus-card/kinetic-figure-typescript-focus-card.ts");
        return () => mountKpTypeScriptFocusCard({ root: input.root, authority: typeScriptAuthority });
      })
    }
  ].map(companion => {
    const element = requiredElement<HTMLElement>(input.root, companion.selector);
    return { ...companion, pendingControls: [] as Array<() => void>, pendingPointers: new Map<number, HTMLElement>(), element, stage: requiredElement<HTMLElement>(element, companion.stageSelector) };
  });
  const activateCompanion = (companion: typeof companions[number]) => {
    if (["disposed", "ready", "loading"].includes(companion.session.status())) return;
    companion.element.dataset["kpDeferredCard"] = "loading";
    companion.element.setAttribute("aria-busy", "true");
    void companion.session.activate().then(result => {
      if (result.kind === "disposed") return;
      companion.element.dataset["kpDeferredCard"] = result.kind;
      companion.element.setAttribute("aria-busy", String(result.kind !== "ready"));
      if (result.kind === "failed") companion.element.setAttribute("data-kp-deferred-card-error", "capability-load-failed");
      else companion.element.removeAttribute("data-kp-deferred-card-error");
      if (result.kind === "ready") for (const replay of companion.pendingControls.splice(0)) replay();
    });
  };
  const companionObserver = typeof IntersectionObserver === "undefined" ? undefined : new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      const companion = companions.find(item => item.stage === entry.target);
      if (companion) activateCompanion(companion);
    }
  });
  const activateRequestedCompanion = () => {
    for (const companion of companions) if (companion.hashes.includes(window.location.hash)) activateCompanion(companion);
  };
  const activateIntent = (event: Event) => {
    for (const companion of companions) if (event.target instanceof Node && companion.element.contains(event.target)) activateCompanion(companion);
  };
  const preservePendingControl = (event: Event) => {
    // Icon buttons deliver clicks from SVG descendants, not necessarily an
    // HTMLElement. Queue the semantic control so activation cannot lose them.
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>("button, [data-kp-focus-deck-scrubber]") ?? event.target
      : event.target;
    if (!(target instanceof HTMLElement)) return;
    const companion = companions.find(item => item.element.contains(target));
    if (!companion || companion.session.status() === "ready" || companion.session.status() === "disposed") return;
    // Buttons retain their native keyboard-to-click default; replaying a
    // synthetic keydown cannot recreate that trusted browser behavior.
    if (event instanceof KeyboardEvent && (event.ctrlKey || event.altKey || event.metaKey
      || !target.matches("[data-kp-focus-deck-scrubber]")
      || !["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(event.key))) return;
    if (!target.closest("[data-kp-focus-deck-scrubber], button")) return;
    // Preserve commands, not a second navigation implementation: the canonical
    // controller interprets them in order once its handlers own the card.
    const replay = event instanceof KeyboardEvent
      ? new KeyboardEvent(event.type, { key: event.key, code: event.code, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, altKey: event.altKey, metaKey: event.metaKey, bubbles: true, cancelable: true })
      : new Event(event.type, { bubbles: true, cancelable: true });
    const value = target instanceof HTMLInputElement ? target.value : undefined;
    event.preventDefault(); event.stopImmediatePropagation();
    companion.pendingControls.push(() => {
      if (!target.isConnected || companion.session.status() !== "ready") return;
      if (value !== undefined && target instanceof HTMLInputElement && event.type !== "keydown") target.value = value;
      target.dispatchEvent(replay);
    });
    activateCompanion(companion);
  };
  const preservePendingPassage = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const viewport = target.closest<HTMLElement>("[data-kp-focus-deck-viewport]");
    const companion = companions.find(item => item.element.contains(target));
    if (!viewport || !companion || ["ready", "disposed"].includes(companion.session.status())) return;
    if (event.type === "pointerdown" && event instanceof PointerEvent) companion.pendingPointers.set(event.pointerId, viewport);
    const replay = event instanceof PointerEvent
      ? new PointerEvent(event.type, { pointerId: event.pointerId, pointerType: event.pointerType, isPrimary: event.isPrimary, clientX: event.clientX, clientY: event.clientY, bubbles: true })
      : event instanceof WheelEvent
        ? new WheelEvent(event.type, { deltaX: event.deltaX, deltaY: event.deltaY, deltaMode: event.deltaMode, shiftKey: event.shiftKey, bubbles: true })
        : new Event(event.type, { bubbles: event.bubbles });
    const left = viewport.scrollLeft;
    // Native travel remains native while loading. Replay its ownership signals
    // and observed position through the installed controller, never a new clock.
    companion.pendingControls.push(() => {
      if (!target.isConnected) return;
      if (event.type === "scroll") viewport.scrollLeft = left;
      target.dispatchEvent(replay);
    });
    activateCompanion(companion);
  };
  const preservePendingPointerEnd = (event: PointerEvent) => {
    for (const companion of companions) {
      const viewport = companion.pendingPointers.get(event.pointerId);
      companion.pendingPointers.delete(event.pointerId);
      if (!viewport || ["ready", "disposed"].includes(companion.session.status())) continue;
      companion.pendingControls.push(() => viewport.dispatchEvent(new PointerEvent(event.type, {
        pointerId: event.pointerId, pointerType: event.pointerType, isPrimary: event.isPrimary, bubbles: true
      })));
    }
  };
  for (const companion of companions) {
    companion.element.dataset["kpDeferredCard"] = "idle";
    if (companionObserver) companionObserver.observe(companion.stage);
    else activateCompanion(companion);
  }
  input.root.addEventListener("pointerover", activateIntent, true);
  input.root.addEventListener("focusin", activateIntent, true);
  for (const type of ["keydown", "click", "input", "change"]) input.root.addEventListener(type, preservePendingControl, true);
  for (const type of ["pointerdown", "wheel", "scroll", "scrollend"]) input.root.addEventListener(type, preservePendingPassage, { capture: true, passive: true });
  window.addEventListener("pointerup", preservePendingPointerEnd);
  window.addEventListener("pointercancel", preservePendingPointerEnd);
  window.addEventListener("hashchange", activateRequestedCompanion);
  window.addEventListener("popstate", activateRequestedCompanion);
  activateRequestedCompanion();

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
  let projectedModelProgress: number | undefined;
  let nativeInput: ReturnType<typeof mountKpFocusDeckNativeInput> | undefined;
  let disposed = false;
  // One input owner performs semantic settlement; native CSS snap must not
  // independently choose endpoints or fight continuous travel in WebKit.
  viewport.dataset["kpFocusDeckSnapDisabled"] = "true";

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
    nativeInput?.cancel();
    const bounded = boundedIndex(index, scenes.length);
    delete deck.dataset["kpSupplyTaxPlaybackKind"];
    delete deck.dataset["kpSupplyTaxPlaybackDurationMs"];
    pendingNavigation = undefined;
    programmaticPlayback = undefined;
    activeEdge = undefined;
    clock.pause();
    clock.seek(1, historyMode === "none" ? "url" : "controls");
    navigationMode = "correcting";
    writeNativePosition(bounded);
    settledIndex = bounded;
    projectEndpoint(bounded);
    projectChrome(bounded);
    updateLocation(bounded, historyMode);
    navigationMode = "idle";
  };

  const directSeek = (
    index: number,
    historyMode: PendingNavigation["history"]
  ): void => finishAt(index, historyMode);

  const startProgrammaticNavigation = (
    targetIndex: number,
    historyMode: PendingNavigation["history"]
  ): void => {
    nativeInput?.cancel();
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

  let travelKind: "wheel" | "native-touch" | "pointer" = "native-touch";
  const travel = createKpFocusDeckTravelPlayback({
    last: scenes.length - 1, position: () => position,
    pause: () => {
      clock.pause(); pendingNavigation = undefined; programmaticPlayback = undefined;
      activeEdge = undefined; navigationMode = "native";
    },
    update: projectPosition,
    // Preserve the accepted tax commitment profile during transport convergence.
    // Removing its independent listeners/timers does not authorize changing feel.
    resolveTarget: sample => settleKpFocusDeckTravel({
      position: sample.position, origin: sample.origin, lastCheckpoint: scenes.length - 1,
      committed: travelKind === "wheel" ? Math.abs(sample.position - sample.origin) >= .025
        : Math.abs(sample.peakDisplacement) >= .08
          || (travelKind === "native-touch" ? Math.abs(sample.peakVelocity) >= .0003
            : Math.abs(sample.velocity) * viewport.clientWidth >= .25),
      direction: Math.sign(sample.position - sample.origin || sample.peakDisplacement || sample.peakVelocity)
    }),
    settle: (target, animate) => {
      const historyMode = target === settledIndex ? "none" : "push";
      if (animate && travelKind === "pointer") startProgrammaticNavigation(target, historyMode);
      else finishAt(target, historyMode);
    }
  });

  const beginScrubberNavigation = (): void => {
    if (navigationMode === "scrubber") return;
    nativeInput?.cancel();
    clock.pause();
    pendingNavigation = undefined;
    programmaticPlayback = undefined;
    activeEdge = undefined;
    navigationMode = "scrubber";
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
    // Preserve the semantic position when the physical lane changes size.
    writeNativePosition(position);
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
  nativeInput = mountKpFocusDeckNativeInput({
    viewport, region: deck, enabled: () => !disposed, position: () => position,
    begin: (now, kind) => { travelKind = kind; return travel.begin(now); }, reduced: () => reducedMotion.matches,
    interrupt: () => nativeInput?.cancel()
  });
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
      nativeInput?.dispose(); travel.dispose();
      scrubber.removeEventListener("input", handleScrubberInput);
      scrubber.removeEventListener("change", finishScrubberNavigation);
      scrubber.removeEventListener("keydown", handleScrubberKeydown);
      scrubber.removeEventListener("blur", handleScrubberBlur);
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("popstate", handleLocation);
      window.removeEventListener("hashchange", handleLocation);
      reducedMotion.removeEventListener("change", handleReducedMotion);
      companionObserver?.disconnect();
      for (const companion of companions) { companion.pendingControls.length = 0; companion.pendingPointers.clear(); companion.session.dispose(); }
      input.root.removeEventListener("pointerover", activateIntent, true);
      input.root.removeEventListener("focusin", activateIntent, true);
      for (const type of ["keydown", "click", "input", "change"]) input.root.removeEventListener(type, preservePendingControl, true);
      for (const type of ["pointerdown", "wheel", "scroll", "scrollend"]) input.root.removeEventListener(type, preservePendingPassage, true);
      window.removeEventListener("pointerup", preservePendingPointerEnd);
      window.removeEventListener("pointercancel", preservePendingPointerEnd);
      window.removeEventListener("hashchange", activateRequestedCompanion);
      window.removeEventListener("popstate", activateRequestedCompanion);
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
