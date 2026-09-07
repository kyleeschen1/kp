import "katex/dist/katex.min.css";
import "../../styles.css";
import "../../tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax.css";
import "../../tutorial/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score.css";

import articleText from
  "../../../content/lessons/economics-supply-tax-scroll-score.kp.md?raw";
import importLockValue from
  "../../../content/lessons/economics-supply-tax-scroll-score.kp.lock.json" with { type: "json" };

import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import { compileKpArticleMarkdownFragmentHtml } from
  "../../article/kp-article-static-html.ts";
import {
  createKpEconomicsSupplyTaxAnimationAsset,
  sampleKpEconomicsSupplyTaxAnimationFrame
} from "../../animation/economics-supply-tax-asset.ts";
import { applyKpSemanticVisualDomTheme } from
  "../../rendering/semantic-visual-dom-theme.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { createKpReaderTimelinePlaybackClock } from
  "../../reader/runtime/timeline-playback-clock.ts";
import { compileKpSupplyTaxScrollScoreArticle } from
  "../../tutorial/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-article.ts";
import {
  projectKpSupplyTaxScrollScoreCoverageUnits,
  projectKpSupplyTaxScrollScorePhraseAttention,
  projectKpSupplyTaxScrollScoreReceptionWaveUnits,
  readKpSupplyTaxScrollScorePhraseFocusProfile,
  type KpSupplyTaxScrollScorePhraseFocusProfile
} from "./kinetic-figure-supply-tax-scroll-score-attention.ts";
import {
  canonicalKpSupplyTaxScrollScorePhraseUnits,
  createKpSupplyTaxScrollScore,
  kpSupplyTaxScrollScorePhraseHash,
  readKpSupplyTaxScrollScorePhraseFromHash,
  sampleKpSupplyTaxScrollScore,
  type KpSupplyTaxScrollScorePassageV1,
  type KpSupplyTaxScrollScorePhraseV1,
  type KpSupplyTaxScrollScoreV1
} from "../../tutorial/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-score.ts";
import {
  kpSupplyTaxScrollScoreStageFacts,
  projectKpSupplyTaxScrollScoreStageLens
} from "../../tutorial/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-stage-lens.ts";
import { projectKpSupplyTaxScrollScoreStageLensDom } from
  "../../tutorial/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-stage-lens-dom.ts";
import {
  projectKpSupplyTaxScene,
  projectKpSupplyTaxSceneDom,
  projectKpSupplyTaxSceneTransitionDom,
  type KpSupplyTaxSceneProjectionV1
} from
  "../../tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax-scene.ts";
import { createKpSupplyTaxPedagogicalScore } from
  "../../tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";
import {
  projectKpSupplyTaxTransitSvgDom,
  renderKpSupplyTaxInteractiveSvg
} from "../../tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax-svg.ts";

const importLock = importLockValue as KpArticleImportLock;
const stationTopPx = 0;
const stationGapPx = 20;
const readerScrollIdleMs = 150;
const readerWheelIdleMs = 240;
const attentionTransitionDurationMs = 480;
const snapMinimumDurationMs = 180;
const snapMaximumDurationMs = 340;
const snapDurationPerPixelMs = 0.45;
const snapPositionTolerancePx = 0.75;

interface PhraseLayout {
  readonly phrase: KpSupplyTaxScrollScorePhraseV1;
  readonly copy: HTMLElement;
  readonly snapY: number;
}

interface SemanticTransition {
  readonly targetIndex: number;
  readonly edgeStartUnits: number;
  readonly edgeEndUnits: number;
  readonly clockExtent: number;
}

interface ScrollSettlement {
  readonly targetIndex: number;
  readonly startY: number;
  readonly targetY: number;
  readonly startedAtMs: number;
  readonly durationMs: number;
  frameHandle: number | undefined;
  lastWrittenY: number;
}

interface PhraseBinding {
  readonly element: HTMLElement;
  readonly coverageUnits: readonly HTMLElement[];
}

export interface KpSupplyTaxScrollScoreSession {
  dispose(): void;
}

/**
 * Browser input owns live movement and momentum. Once it becomes quiet, one
 * interruptible correction settles the nearest semantic paragraph while the
 * shared reader clock interpolates the corresponding lesson edge.
 */
export function mountKpSupplyTaxScrollScore(input: {
  readonly root: HTMLElement;
}): KpSupplyTaxScrollScoreSession {
  applyKpSemanticVisualDomTheme({ root: input.root, theme: "light" });
  const compiled = compileKpSupplyTaxScrollScoreArticle({
    text: articleText,
    lock: importLock
  });
  const pedagogicalScore = createKpSupplyTaxScrollScore({
    document: compiled.document,
    score: createKpSupplyTaxPedagogicalScore()
  });
  input.root.innerHTML = renderPage(pedagogicalScore);

  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const passage = requiredElement<HTMLElement>(input.root,
    "[data-kp-supply-tax-scroll-score]");
  const station = requiredElement<HTMLElement>(passage,
    "[data-kp-scroll-score-station]");
  const graph = requiredElement<SVGSVGElement>(station, ".kp-supply-tax-graph");
  const caption = requiredElement<HTMLElement>(station,
    "[data-kp-supply-tax-stage-caption]");
  const rail = requiredElement<HTMLInputElement>(station,
    "[data-kp-scroll-score-rail]");
  const railOutput = requiredElement<HTMLOutputElement>(station,
    "[data-kp-scroll-score-position]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const authoredDurationMs = authority.animation.timeline?.durationMs;
  if (authoredDurationMs === undefined) {
    throw new Error("Supply-tax animation requires its canonical timeline.");
  }
  const clock = createKpReaderTimelinePlaybackClock({
    id: "clock.scroll-score.economics.supply-tax.v1",
    durationMs: authoredDurationMs,
    initialProgress: 1,
    ownerWindow: window
  });
  const phraseFocusProfile = readKpSupplyTaxScrollScorePhraseFocusProfile(
    window.location.search
  );
  passage.dataset["kpScrollScorePhraseFocusProfile"] = phraseFocusProfile;
  const phraseBindings = bindPhraseElements(
    passage,
    pedagogicalScore,
    phraseFocusProfile
  );
  const sceneBySlug = new Map(
    createKpSupplyTaxPedagogicalScore(authority).beats.map((beat) => [
      beat.slug,
      projectKpSupplyTaxScene({ authority, beat })
    ] as const));
  let layouts: readonly PhraseLayout[] = [];
  let disposed = false;
  let frameRequest: number | undefined;
  let scrollSettlementTimer: number | undefined;
  let activePhraseId: string | undefined;
  let projectedUnits = 0;
  let fit: "stationary" | "ordinary" = "stationary";
  let seekAnchor: Readonly<{ units: number; scrollY: number }> | undefined;
  let settledIndex = 0;
  let transition: SemanticTransition | undefined;
  let scrollSettlement: ScrollSettlement | undefined;
  let lastReaderIntentAtMs = Number.NEGATIVE_INFINITY;
  let lastReaderScrollAtMs = Number.NEGATIVE_INFINITY;
  let readerIntentIdleMs = readerScrollIdleMs;

  const projectFrame = (modelProgress: number): void => {
    const frame = sampleKpEconomicsSupplyTaxAnimationFrame({
      asset: authority,
      progress: exactProgress(modelProgress)
    });
    projectKpSupplyTaxTransitSvgDom({
      root: graph,
      semantics: authority.semantics,
      frame
    });
    passage.dataset["kpSupplyTaxModelProgress"] = modelProgress.toFixed(4);
  };

  const projectUnits = (
    units: number,
    updateHistory: boolean,
    focusPhrase?: KpSupplyTaxScrollScorePhraseV1
  ): void => {
    const sample = sampleKpSupplyTaxScrollScore(pedagogicalScore, units);
    const focusSample = focusPhrase === undefined
      ? sample
      : sampleKpSupplyTaxScrollScore(
        pedagogicalScore,
        canonicalKpSupplyTaxScrollScorePhraseUnits(
          pedagogicalScore,
          focusPhrase
        )
      );
    projectedUnits = sample.units;
    const from = requiredScene(sceneBySlug, sample.fromBeat.slug);
    const to = requiredScene(sceneBySlug, sample.toBeat.slug);
    // A canonical endpoint may round a fraction of a pixel short after the
    // document coordinate is restored. Reduced motion still owes the learner
    // the discrete semantic stop, not an accidental pre-transition state.
    const directProgress = reducedMotion.matches
      ? sample.phraseProgress >= 0.999 ? 1 : 0
      : sample.phraseProgress;
    const modelProgress = interpolate(
      modelProgressForScene(from),
      modelProgressForScene(to),
      directProgress
    );
    projectFrame(modelProgress);
    if (directProgress <= 0) {
      projectKpSupplyTaxSceneDom({ root: passage, scene: from });
    } else if (directProgress >= 1) {
      projectKpSupplyTaxSceneDom({ root: passage, scene: to });
    } else {
      projectKpSupplyTaxSceneTransitionDom({
        root: passage,
        from,
        to,
        progress: directProgress,
        profile: "scrub"
      });
    }
    projectKpSupplyTaxScrollScoreStageLensDom({
      root: passage,
      lens: projectKpSupplyTaxScrollScoreStageLens({
        authority,
        fromBeat: sample.fromBeat,
        toBeat: sample.toBeat,
        progress: directProgress
      })
    });
    caption.textContent = sample.toBeat.claim;
    passage.dataset["kpScrollScoreActivePassage"] = focusSample.passage.id;
    passage.dataset["kpScrollScoreActivePhrase"] = focusSample.phrase.id;
    passage.dataset["kpScrollScoreActiveBeat"] = sample.toBeat.slug;
    passage.dataset["kpScrollScorePhraseProgress"] =
      sample.phraseProgress.toFixed(4);
    passage.dataset["kpScrollScoreResting"] = String(sample.resting);
    const phraseAttention = new Map(
      projectKpSupplyTaxScrollScorePhraseAttention({
        score: pedagogicalScore,
        sample: focusSample,
        discrete: reducedMotion.matches,
        profile: phraseFocusProfile
      }).map((attention) => [attention.phraseId, attention] as const)
    );
    phraseBindings.forEach((binding, id) => {
      const active = id === focusSample.phrase.id;
      const attention = phraseAttention.get(id);
      if (attention === undefined) {
        throw new Error(`Missing prose attention projection for ${id}.`);
      }
      const { element } = binding;
      element.dataset["kpScrollScorePhraseActive"] = String(active);
      element.dataset["kpScrollScorePhraseAttention"] = attention.role;
      element.style.setProperty("--kp-scroll-score-phrase-focus",
        attention.strength.toFixed(4));
      element.style.setProperty("--kp-scroll-score-phrase-focus-percent",
        `${(attention.strength * 100).toFixed(2)}%`);
      const unitProjection = phraseFocusProfile === "reception-wave"
        ? projectKpSupplyTaxScrollScoreReceptionWaveUnits({
          unitCount: binding.coverageUnits.length,
          progress: attention.coverage
        })
        : projectKpSupplyTaxScrollScoreCoverageUnits({
          unitCount: binding.coverageUnits.length,
          coverage: attention.coverage
        });
      binding.coverageUnits.forEach((unit, index) => {
        const unitStrength = unitProjection[index]?.strength ?? 0;
        const paintStrength = phraseFocusProfile === "reception-wave"
          ? Math.max(attention.strength, unitStrength)
          : attention.strength * unitStrength;
        unit.style.setProperty("--kp-scroll-score-unit-coverage",
          paintStrength.toFixed(4));
        unit.style.setProperty("--kp-scroll-score-unit-coverage-percent",
          `${(paintStrength * 100).toFixed(2)}%`);
      });
    });
    rail.value = sample.units.toFixed(3);
    const percent = Math.round(sample.phraseProgress * 100);
    rail.setAttribute("aria-valuetext",
      `${plainLabel(focusSample.phrase.label)}, ${percent}%`);
    railOutput.value = plainLabel(focusSample.phrase.label);
    if (updateHistory && activePhraseId !== focusSample.phrase.id) {
      history.replaceState(null, "", kpSupplyTaxScrollScorePhraseHash(
        focusSample.phrase));
    }
    activePhraseId = focusSample.phrase.id;
  };

  const phraseIndex = (phrase: KpSupplyTaxScrollScorePhraseV1): number =>
    pedagogicalScore.phrases.findIndex(({ id }) => id === phrase.id);

  const projectStationPhase = (): void => {
    const first = layouts[0];
    const last = layouts[layouts.length - 1];
    if (first === undefined || last === undefined) return;
    passage.dataset["kpScrollScoreStationPhase"] =
      window.scrollY < first.snapY
        ? "approach"
        : window.scrollY > last.snapY
          ? "release"
          : "score";
  };

  const measure = (): void => {
    if (disposed) return;
    const stationHeight = station.getBoundingClientRect().height;
    const phraseEntries = pedagogicalScore.phrases.map((phrase) => ({
      phrase,
      copy: requiredElement<HTMLElement>(passage,
        `[data-kp-scroll-score-phrase="${phrase.id}"]`)
    }));
    const maxCopyHeight = Math.max(...phraseEntries.map(({ copy }) =>
      copy.getBoundingClientRect().height));
    const fitsStation = stationHeight + maxCopyHeight + stationGapPx <=
      window.innerHeight;
    fit = fitsStation ? "stationary" : "ordinary";
    passage.dataset["kpScrollScoreFit"] = fit;
    const readingY = fit === "stationary"
      ? stationTopPx + stationHeight + stationGapPx
      : window.innerHeight * 0.58;
    passage.style.setProperty("--kp-scroll-score-snap-top", `${readingY}px`);
    document.documentElement.style.setProperty(
      "--kp-scroll-score-snap-top",
      `${readingY}px`
    );
    layouts = Object.freeze(phraseEntries.map((entry) => Object.freeze({
      ...entry,
      snapY: window.scrollY + entry.copy.getBoundingClientRect().top - readingY
    })));
    projectStationPhase();
    if (activePhraseId !== undefined) return;
    const target = readKpSupplyTaxScrollScorePhraseFromHash(
      pedagogicalScore,
      window.location.hash
    );
    if (target !== undefined) {
      seekPhrase(target, false);
      return;
    }
    settleAtIndex(closestPhraseIndex(), false);
  };

  const closestPhraseIndex = (): number => {
    if (layouts.length === 0) return settledIndex;
    const closest = layouts.reduce((winner, candidate) =>
      Math.abs(window.scrollY - candidate.snapY) <
          Math.abs(window.scrollY - winner.snapY)
        ? candidate
        : winner);
    return Math.max(0, phraseIndex(closest.phrase));
  };

  const scrollYForUnits = (units: number): number => {
    const sample = sampleKpSupplyTaxScrollScore(pedagogicalScore, units);
    return layouts.find(({ phrase }) => phrase.id === sample.phrase.id)?.snapY ??
      window.scrollY;
  };

  const settleAtIndex = (index: number, updateHistory: boolean): void => {
    const targetIndex = Math.max(0, Math.min(
      pedagogicalScore.phrases.length - 1,
      index
    ));
    const phrase = pedagogicalScore.phrases[targetIndex]!;
    clock.pause();
    transition = undefined;
    settledIndex = targetIndex;
    passage.dataset["kpScrollScoreTransition"] = "settled";
    projectUnits(canonicalKpSupplyTaxScrollScorePhraseUnits(
      pedagogicalScore,
      phrase
    ), updateHistory);
  };

  const startTransitionTo = (index: number, updateHistory: boolean): void => {
    const targetIndex = Math.max(0, Math.min(
      pedagogicalScore.phrases.length - 1,
      index
    ));
    if (targetIndex === settledIndex) return;
    if (reducedMotion.matches || Math.abs(targetIndex - settledIndex) !== 1) {
      settleAtIndex(targetIndex, updateHistory);
      return;
    }
    const forward = targetIndex > settledIndex;
    const edgePhrase = pedagogicalScore.phrases[
      forward ? targetIndex : settledIndex
    ]!;
    const edgePassage = pedagogicalScore.passages.find(({ id }) =>
      id === edgePhrase.passageId);
    if (edgePassage === undefined) {
      throw new Error(`Missing transition passage ${edgePhrase.passageId}.`);
    }
    const edgeStartUnits = edgePassage.offsetUnits + edgePhrase.startUnits +
      Number.EPSILON * 1024;
    const edgeEndUnits = edgePassage.offsetUnits + edgePhrase.motionEndUnits;
    const clockExtent = edgePhrase.act === "motion"
      ? 1
      : attentionTransitionDurationMs / authoredDurationMs;
    clock.pause();
    clock.seek(forward ? 0 : clockExtent);
    transition = Object.freeze({
      targetIndex,
      edgeStartUnits,
      edgeEndUnits,
      clockExtent
    });
    const targetPhrase = pedagogicalScore.phrases[targetIndex]!;
    passage.dataset["kpScrollScoreTransition"] = "playing";
    projectUnits(forward ? edgeStartUnits : edgeEndUnits,
      updateHistory, targetPhrase);
    clock.play({
      direction: forward ? "forward" : "rewind",
      stopAt: forward ? clockExtent : 0
    });
  };

  function seekUnits(units: number, updateHistory: boolean): void {
    const bounded = Math.max(0, Math.min(pedagogicalScore.totalUnits, units));
    const scrollY = scrollYForUnits(bounded);
    cancelScrollSettlement("settled");
    cancelScrollSettlementTimer();
    clock.pause();
    transition = undefined;
    const sample = sampleKpSupplyTaxScrollScore(pedagogicalScore, bounded);
    settledIndex = Math.max(0, phraseIndex(sample.phrase));
    seekAnchor = Object.freeze({ units: bounded, scrollY });
    // Rail and URL navigation restore one exact semantic landmark even though
    // the browser may round the corresponding document coordinate.
    window.scrollTo({ top: scrollY, behavior: "auto" });
    passage.dataset["kpScrollScoreTransition"] = "settled";
    projectUnits(bounded, updateHistory);
  }

  function seekPhrase(
    phrase: KpSupplyTaxScrollScorePhraseV1,
    updateHistory: boolean
  ): void {
    seekUnits(canonicalKpSupplyTaxScrollScorePhraseUnits(
      pedagogicalScore,
      phrase
    ), updateHistory);
  }

  const scheduleStationProjection = (): void => {
    if (frameRequest !== undefined) return;
    frameRequest = window.requestAnimationFrame(() => {
      frameRequest = undefined;
      projectStationPhase();
    });
  };

  const cancelScrollSettlementTimer = (): void => {
    if (scrollSettlementTimer === undefined) return;
    window.clearTimeout(scrollSettlementTimer);
    scrollSettlementTimer = undefined;
  };

  const cancelScrollSettlement = (
    nextPhase: "reader" | "settled" = "reader"
  ): void => {
    const active = scrollSettlement;
    if (active?.frameHandle !== undefined) {
      window.cancelAnimationFrame(active.frameHandle);
    }
    scrollSettlement = undefined;
    passage.dataset["kpScrollScoreScrollPhase"] = nextPhase;
    delete passage.dataset["kpScrollScoreSnapTarget"];
    delete passage.dataset["kpScrollScoreSnapDurationMs"];
  };

  const finishScrollSettlement = (): void => {
    const active = scrollSettlement;
    if (active === undefined) return;
    if (active.frameHandle !== undefined) {
      window.cancelAnimationFrame(active.frameHandle);
    }
    window.scrollTo({ top: active.targetY, behavior: "auto" });
    seekAnchor = Object.freeze({
      units: projectedUnits,
      scrollY: active.targetY
    });
    passage.dataset["kpScrollScoreLastSnapTarget"] =
      pedagogicalScore.phrases[active.targetIndex]!.id;
    passage.dataset["kpScrollScoreLastSnapY"] = active.targetY.toFixed(2);
    passage.dataset["kpScrollScoreLastSnapDurationMs"] =
      active.durationMs.toFixed(2);
    passage.dataset["kpScrollScoreLastSnapDistancePx"] =
      Math.abs(active.targetY - active.startY).toFixed(2);
    scrollSettlement = undefined;
    passage.dataset["kpScrollScoreScrollPhase"] = "settled";
    delete passage.dataset["kpScrollScoreSnapTarget"];
    delete passage.dataset["kpScrollScoreSnapDurationMs"];
    projectStationPhase();
  };

  const tickScrollSettlement = (nowMs: number): void => {
    const active = scrollSettlement;
    if (active === undefined || disposed) return;
    active.frameHandle = undefined;
    const progress = Math.max(0, Math.min(1,
      (nowMs - active.startedAtMs) / active.durationMs));
    const eased = 1 - (1 - progress) ** 3;
    const candidate = interpolate(active.startY, active.targetY, eased);
    // The correction must never overshoot or reverse, even if a renderer
    // reports a fractional scroll position differently between frames.
    const nextY = active.targetY >= active.startY
      ? Math.min(active.targetY, Math.max(active.lastWrittenY, candidate))
      : Math.max(active.targetY, Math.min(active.lastWrittenY, candidate));
    active.lastWrittenY = nextY;
    window.scrollTo({ top: nextY, behavior: "auto" });
    if (progress >= 1) {
      finishScrollSettlement();
      return;
    }
    active.frameHandle = window.requestAnimationFrame(tickScrollSettlement);
  };

  const requestSemanticTarget = (targetIndex: number): void => {
    if (transition?.targetIndex === targetIndex) return;
    startTransitionTo(targetIndex, true);
  };

  const beginScrollSettlement = (): void => {
    cancelScrollSettlementTimer();
    if (layouts.length === 0 || scrollSettlement !== undefined) return;
    if (seekAnchor !== undefined &&
        Math.abs(window.scrollY - seekAnchor.scrollY) <= 1) return;
    seekAnchor = undefined;
    const targetIndex = closestPhraseIndex();
    requestSemanticTarget(targetIndex);
    const maximumY = Math.max(0,
      document.documentElement.scrollHeight - window.innerHeight);
    const targetY = Math.max(0, Math.min(maximumY,
      layouts[targetIndex]?.snapY ?? window.scrollY));
    const startY = window.scrollY;
    passage.dataset["kpScrollScoreSnapTarget"] =
      pedagogicalScore.phrases[targetIndex]!.id;
    if (fit === "ordinary" || reducedMotion.matches ||
        Math.abs(targetY - startY) <= snapPositionTolerancePx) {
      passage.dataset["kpScrollScoreScrollPhase"] = "snapping";
      scrollSettlement = {
        targetIndex,
        startY,
        targetY,
        startedAtMs: performance.now(),
        durationMs: 1,
        frameHandle: undefined,
        lastWrittenY: startY
      };
      finishScrollSettlement();
      return;
    }
    const durationMs = Math.max(snapMinimumDurationMs, Math.min(
      snapMaximumDurationMs,
      snapMinimumDurationMs + Math.abs(targetY - startY) *
        snapDurationPerPixelMs
    ));
    passage.dataset["kpScrollScoreScrollPhase"] = "snapping";
    passage.dataset["kpScrollScoreSnapDurationMs"] =
      durationMs.toFixed(2);
    scrollSettlement = {
      targetIndex,
      startY,
      targetY,
      startedAtMs: performance.now(),
      durationMs,
      frameHandle: undefined,
      lastWrittenY: startY
    };
    scrollSettlement.frameHandle = window.requestAnimationFrame(
      tickScrollSettlement
    );
  };

  const scheduleScrollSettlement = (delayMs = readerScrollIdleMs): void => {
    cancelScrollSettlementTimer();
    scrollSettlementTimer = window.setTimeout(() => {
      scrollSettlementTimer = undefined;
      const nowMs = performance.now();
      const remainingQuietMs = Math.max(
        lastReaderIntentAtMs + readerIntentIdleMs - nowMs,
        lastReaderScrollAtMs + readerScrollIdleMs - nowMs
      );
      if (remainingQuietMs > 0) {
        scheduleScrollSettlement(remainingQuietMs);
        return;
      }
      beginScrollSettlement();
    }, Math.max(0, delayMs));
  };

  const interruptForReaderInput = (event?: Event): void => {
    lastReaderIntentAtMs = performance.now();
    readerIntentIdleMs = event instanceof WheelEvent
      ? readerWheelIdleMs
      : readerScrollIdleMs;
    cancelScrollSettlementTimer();
    cancelScrollSettlement("reader");
    seekAnchor = undefined;
    if (transition !== undefined) {
      // Rapid navigation resolves the already selected beat directly before
      // accepting another target, so interruption cannot leave mixed scenes.
      settleAtIndex(transition.targetIndex, false);
    }
  };

  const handleReaderKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)) {
      return;
    }
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]
      .includes(event.key)) {
      interruptForReaderInput();
    }
  };

  const handleScroll = (): void => {
    scheduleStationProjection();
    if (scrollSettlement !== undefined) return;
    if (seekAnchor !== undefined &&
        Math.abs(window.scrollY - seekAnchor.scrollY) <= 1) return;
    lastReaderScrollAtMs = performance.now();
    passage.dataset["kpScrollScoreScrollPhase"] = "reader";
    scheduleScrollSettlement();
  };

  const handleScrollEnd = (): void => {
    if (scrollSettlement !== undefined ||
        (seekAnchor !== undefined &&
          Math.abs(window.scrollY - seekAnchor.scrollY) <= 1)) return;
    const nowMs = performance.now();
    const remainingQuietMs = Math.max(
      lastReaderIntentAtMs + readerIntentIdleMs - nowMs,
      lastReaderScrollAtMs + readerScrollIdleMs - nowMs
    );
    scheduleScrollSettlement(Math.max(0, remainingQuietMs));
  };
  // The rail seeks the same document corridor as scrolling, so prose, stage,
  // URL, and the continuous semantic sample cannot drift into separate states.
  const handleRailInput = (): void => seekUnits(Number(rail.value), true);
  const handleRailKeydown = (event: KeyboardEvent): void => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]
      .includes(event.key)) return;
    event.preventDefault();
    const checkpoints = pedagogicalScore.phrases.map((phrase) =>
      canonicalKpSupplyTaxScrollScorePhraseUnits(pedagogicalScore, phrase));
    const activeIndex = pedagogicalScore.phrases.findIndex(({ id }) =>
      id === activePhraseId);
    const target = event.key === "Home"
      ? 0
      : event.key === "End"
        ? pedagogicalScore.totalUnits
        : event.key === "ArrowRight" || event.key === "ArrowDown"
          ? checkpoints[Math.min(checkpoints.length - 1, activeIndex + 1)] ??
            pedagogicalScore.totalUnits
          : checkpoints[Math.max(0, activeIndex - 1)] ?? 0;
    seekUnits(target, true);
  };
  const handleHashChange = (): void => {
    const phrase = readKpSupplyTaxScrollScorePhraseFromHash(
      pedagogicalScore,
      window.location.hash
    );
    if (phrase !== undefined) seekPhrase(phrase, false);
  };
  const handleSelection = (): void => {
    const selection = document.getSelection();
    if (selection === null || selection.isCollapsed || selection.anchorNode === null) {
      return;
    }
    const element = selection.anchorNode instanceof Element
      ? selection.anchorNode
      : selection.anchorNode.parentElement;
    const phraseId = element?.closest<HTMLElement>(
      "[data-kp-scroll-score-phrase]"
    )?.dataset["kpScrollScorePhrase"];
    const phrase = pedagogicalScore.phrases.find(({ id }) => id === phraseId);
    if (phrase !== undefined && phrase.id !== activePhraseId) {
      seekPhrase(phrase, true);
    }
  };
  const handleBeforeMatch = (event: Event): void => {
    const element = event.target instanceof Element ? event.target : null;
    const phraseId = element?.closest<HTMLElement>(
      "[data-kp-scroll-score-phrase]"
    )?.dataset["kpScrollScorePhrase"];
    const phrase = pedagogicalScore.phrases.find(({ id }) => id === phraseId);
    if (phrase !== undefined) seekPhrase(phrase, true);
  };
  const handleReducedMotion = (): void => {
    if (scrollSettlement !== undefined) finishScrollSettlement();
    if (transition !== undefined) {
      settleAtIndex(transition.targetIndex, false);
      return;
    }
    projectUnits(projectedUnits, false);
  };

  const unsubscribe = clock.subscribe((sample) => {
    const activeTransition = transition;
    if (activeTransition === undefined || sample.source !== "autoplay") return;
    const progress = activeTransition.clockExtent === 0
      ? 1
      : Math.max(0, Math.min(1,
        sample.progress / activeTransition.clockExtent));
    const targetPhrase = pedagogicalScore.phrases[
      activeTransition.targetIndex
    ]!;
    projectUnits(interpolate(
      activeTransition.edgeStartUnits,
      activeTransition.edgeEndUnits,
      progress
    ), false, targetPhrase);
    if (!sample.settled) return;
    settleAtIndex(activeTransition.targetIndex, false);
  });

  const resizeObserver = new ResizeObserver(() => measure());
  resizeObserver.observe(station);
  passage.querySelectorAll<HTMLElement>("[data-kp-scroll-score-phrase]")
    .forEach((phrase) => resizeObserver.observe(phrase));
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("scrollend", handleScrollEnd);
  window.addEventListener("wheel", interruptForReaderInput, { passive: true });
  window.addEventListener("touchstart", interruptForReaderInput,
    { passive: true });
  window.addEventListener("pointerdown", interruptForReaderInput,
    { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("hashchange", handleHashChange);
  document.addEventListener("keydown", handleReaderKeydown);
  document.addEventListener("selectionchange", handleSelection);
  passage.addEventListener("beforematch", handleBeforeMatch, true);
  rail.addEventListener("input", handleRailInput);
  rail.addEventListener("keydown", handleRailKeydown);
  reducedMotion.addEventListener("change", handleReducedMotion);
  window.requestAnimationFrame(measure);
  void document.fonts?.ready.then(() => measure());

  return Object.freeze({
    dispose: () => {
      disposed = true;
      if (frameRequest !== undefined) window.cancelAnimationFrame(frameRequest);
      cancelScrollSettlementTimer();
      cancelScrollSettlement("settled");
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scrollend", handleScrollEnd);
      window.removeEventListener("wheel", interruptForReaderInput);
      window.removeEventListener("touchstart", interruptForReaderInput);
      window.removeEventListener("pointerdown", interruptForReaderInput);
      window.removeEventListener("resize", measure);
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("keydown", handleReaderKeydown);
      document.removeEventListener("selectionchange", handleSelection);
      passage.removeEventListener("beforematch", handleBeforeMatch, true);
      rail.removeEventListener("input", handleRailInput);
      rail.removeEventListener("keydown", handleRailKeydown);
      reducedMotion.removeEventListener("change", handleReducedMotion);
      unsubscribe();
      clock.dispose();
      document.documentElement.style.removeProperty(
        "--kp-scroll-score-snap-top"
      );
    }
  });
}

function renderPage(score: KpSupplyTaxScrollScoreV1): string {
  return `<main class="kp-scroll-score-page">
    <article class="kp-scroll-score-article" aria-labelledby="kp-scroll-score-title">
      <header class="kp-scroll-score-intro">
        <p>Vertical Score · Economics</p>
        <h1 id="kp-scroll-score-title">How does a tax reshape a market?</h1>
        <p>The figure stays with the argument while each ordinary paragraph selects a semantic state.</p>
      </header>
      <section class="kp-scroll-score-passage" data-kp-supply-tax-scroll-score data-kp-scroll-score-projection="inline-sticky-score" data-kp-scroll-score-fit="stationary" data-kp-scroll-score-station-phase="approach" data-kp-scroll-score-scroll-phase="settled" data-kp-scroll-score-transition="settled" aria-label="Per-unit tax vertical Scroll Score">
        <div class="kp-scroll-score-station" data-kp-scroll-score-station>
          ${renderStaticStage()}
          ${renderScoreRail(score)}
        </div>
        <div class="kp-scroll-score-narrative" aria-label="Explanation">
          ${score.passages.map((passage) => renderPassage(passage)).join("")}
        </div>
      </section>
      <p class="kp-scroll-score-release-note">The market now contains less trade and an unrecovered loss from the transactions that no longer occur.</p>
    </article>
  </main>`;
}

function renderStaticStage(): string {
  return `<figure class="kp-supply-tax-figure kp-scroll-score-stage" data-kp-supply-tax-stage data-kp-supply-tax-stage-state="baseline-market">
    <figcaption class="kp-supply-tax-visually-hidden" data-kp-supply-tax-stage-caption>Demand and original supply intersect at five units and a price of seven before the tax.</figcaption>
    <div class="kp-supply-tax-stage__visual">
      <div class="kp-supply-tax-stage__graph">
        ${renderKpSupplyTaxInteractiveSvg()}
        <div class="kp-scroll-score-stage-facts" aria-hidden="true">
          ${kpSupplyTaxScrollScoreStageFacts.map(({ id, latex }) =>
            `<span data-kp-scroll-score-stage-fact="${id}" data-kp-scroll-score-stage-fact-present="false">${renderLatexToHtml(latex, { displayMode: false })}</span>`
          ).join("")}
        </div>
      </div>
    </div>
  </figure>`;
}

function renderScoreRail(score: KpSupplyTaxScrollScoreV1): string {
  const ticks = score.phrases.map((phrase) => {
    const units = canonicalKpSupplyTaxScrollScorePhraseUnits(score, phrase);
    const position = score.totalUnits === 0 ? 0 : units / score.totalUnits * 100;
    return `<span style="left:${position.toFixed(3)}%"></span>`;
  }).join("");
  return `<div class="kp-scroll-score-rail">
    <div class="kp-scroll-score-rail__status">
      <span>Argument</span>
      <output data-kp-scroll-score-position>Orient the market</output>
    </div>
    <div class="kp-scroll-score-rail__control">
      <input data-kp-scroll-score-rail type="range" min="0" max="${score.totalUnits}" step="0.01" value="0" aria-label="Supply-tax semantic score" aria-valuetext="Orient the market, 0%">
      <div class="kp-scroll-score-rail__ticks" aria-hidden="true">${ticks}</div>
    </div>
  </div>`;
}

function renderPassage(passage: KpSupplyTaxScrollScorePassageV1): string {
  return `<section class="kp-scroll-score-corridor" data-kp-scroll-score-corridor="${passage.id}" aria-label="${plainLabel(passage.id)}">
    ${passage.phrases.map((phrase, index) => renderPhrase(phrase, index)).join("")}
  </section>`;
}

function renderPhrase(
  phrase: KpSupplyTaxScrollScorePhraseV1,
  passageIndex: number
): string {
  const first = passageIndex === 0 ? "true" : "false";
  return `<div class="kp-scroll-score-beat" data-kp-scroll-score-beat="${phrase.id}" data-kp-scroll-score-act="${phrase.act}" data-kp-scroll-score-first-in-passage="${first}">
    <div class="kp-scroll-score-phrase" data-kp-scroll-score-cue data-kp-scroll-score-passage="${phrase.passageId}" data-kp-scroll-score-phrase="${phrase.id}" data-kp-scroll-score-phrase-active="false" data-kp-scroll-score-act="${phrase.act}">
      ${compileKpArticleMarkdownFragmentHtml(phrase.label)}
    </div>
  </div>`;
}

function bindPhraseElements(
  root: HTMLElement,
  score: KpSupplyTaxScrollScoreV1,
  profile: KpSupplyTaxScrollScorePhraseFocusProfile
): ReadonlyMap<string, PhraseBinding> {
  const elements = new Map<string, PhraseBinding>();
  for (const phrase of score.phrases) {
    const span = requiredElement<HTMLElement>(root,
      `[data-kp-scroll-score-phrase="${phrase.id}"]`);
    const scorePassage = score.passages.find(({ id }) =>
      id === phrase.passageId)!;
    span.dataset["kpScrollScoreStartUnits"] = String(
      scorePassage.offsetUnits + phrase.startUnits);
    span.dataset["kpScrollScoreEndUnits"] = String(
      scorePassage.offsetUnits + phrase.motionEndUnits);
    const coverageUnits = profile === "reception"
      ? Object.freeze([])
      : bindPhraseCoverageUnits(span);
    elements.set(phrase.id, Object.freeze({
      element: span,
      coverageUnits
    }));
  }
  if (elements.size !== score.phrases.length) {
    throw new Error("Every Scroll Score phrase requires one rendered owner.");
  }
  return elements;
}

function bindPhraseCoverageUnits(root: HTMLElement): readonly HTMLElement[] {
  const units: HTMLElement[] = [];
  const bindNode = (node: Node): void => {
    if (node instanceof Text) {
      bindTextCoverageUnits(node, units);
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    // Native inline KaTeX remains one display atom; its internal renderer DOM
    // must never become reading-progress authority.
    if (node.classList.contains("kp-article-math--inline")) {
      registerCoverageUnit(node, units);
      return;
    }
    Array.from(node.childNodes).forEach(bindNode);
  };
  Array.from(root.childNodes).forEach(bindNode);
  return Object.freeze(units);
}

function bindTextCoverageUnits(
  node: Text,
  units: HTMLElement[]
): void {
  const value = node.data;
  const matches = Array.from(value.matchAll(/\s*\S+/gu));
  if (matches.length === 0) return;
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  for (const match of matches) {
    const index = match.index ?? cursor;
    if (index > cursor) fragment.append(value.slice(cursor, index));
    const unit = document.createElement("span");
    unit.textContent = match[0];
    registerCoverageUnit(unit, units);
    fragment.append(unit);
    cursor = index + match[0].length;
  }
  if (cursor < value.length) fragment.append(value.slice(cursor));
  node.replaceWith(fragment);
}

function registerCoverageUnit(
  element: HTMLElement,
  units: HTMLElement[]
): void {
  element.classList.add("kp-scroll-score-coverage-unit");
  element.dataset["kpScrollScoreCoverageUnit"] = String(units.length);
  units.push(element);
}

function requiredScene(
  scenes: ReadonlyMap<string, KpSupplyTaxSceneProjectionV1>,
  slug: string
): KpSupplyTaxSceneProjectionV1 {
  const scene = scenes.get(slug);
  if (scene === undefined) throw new Error(`Missing supply-tax scene ${slug}.`);
  return scene;
}

function modelProgressForScene(scene: KpSupplyTaxSceneProjectionV1): number {
  return scene.settledFrame === "untaxed" ? 0 : 1;
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function plainLabel(value: string): string {
  return value.replaceAll("$", "").replace(/\s+/gu, " ").trim();
}

function exactProgress(value: number): { numerator: string; denominator: string } {
  if (value <= 0) return { numerator: "0", denominator: "1" };
  if (value >= 1) return { numerator: "1", denominator: "1" };
  const denominator = 1_000_000;
  return {
    numerator: String(Math.round(value * denominator)),
    denominator: String(denominator)
  };
}

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing Scroll Score element ${selector}.`);
  return element;
}
