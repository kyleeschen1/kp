import "katex/dist/katex.min.css";
import "../../styles.css";
import "../kinetic-figure-supply-tax/kinetic-figure-supply-tax.css";
import "./kinetic-figure-supply-tax-scroll-score.css";

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
import { compileKpSupplyTaxScrollScoreArticle } from
  "./kinetic-figure-supply-tax-scroll-score-article.ts";
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
} from "./kinetic-figure-supply-tax-scroll-score-score.ts";
import {
  projectKpSupplyTaxScene,
  projectKpSupplyTaxSceneDom,
  projectKpSupplyTaxSceneTransitionDom,
  type KpSupplyTaxSceneProjectionV1
} from
  "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-scene.ts";
import { createKpSupplyTaxPedagogicalScore } from
  "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";
import {
  projectKpSupplyTaxTransitSvgDom,
  renderKpSupplyTaxInteractiveSvg,
  renderKpSupplyTaxWelfareLedger
} from "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-svg.ts";

const importLock = importLockValue as KpArticleImportLock;
const stationTopPx = 12;
const stationGapPx = 12;

interface PassageLayout {
  readonly passage: KpSupplyTaxScrollScorePassageV1;
  readonly corridor: HTMLElement;
  readonly cue: HTMLElement;
  readonly startY: number;
  readonly endY: number;
}

interface PhraseBinding {
  readonly element: HTMLElement;
  readonly coverageUnits: readonly HTMLElement[];
}

export interface KpSupplyTaxScrollScoreSession {
  dispose(): void;
}

/**
 * This host treats document position as a seekable playhead. It samples the
 * existing economics authority directly; it never starts a competing clock.
 */
export function mountKpSupplyTaxScrollScore(input: {
  readonly root: HTMLElement;
}): KpSupplyTaxScrollScoreSession {
  applyKpSemanticVisualDomTheme({ root: input.root, theme: "dark" });
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
  let layouts: readonly PassageLayout[] = [];
  let disposed = false;
  let frameRequest: number | undefined;
  let activePhraseId: string | undefined;
  let projectedUnits = 0;
  let fit: "stationary" | "ordinary" = "stationary";

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

  const projectUnits = (units: number, updateHistory: boolean): void => {
    const sample = sampleKpSupplyTaxScrollScore(pedagogicalScore, units);
    projectedUnits = sample.units;
    const from = requiredScene(sceneBySlug, sample.fromBeat.slug);
    const to = requiredScene(sceneBySlug, sample.toBeat.slug);
    const directProgress = reducedMotion.matches
      ? sample.phraseProgress >= 1 ? 1 : 0
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
    caption.textContent = sample.toBeat.claim;
    passage.dataset["kpScrollScoreActivePassage"] = sample.passage.id;
    passage.dataset["kpScrollScoreActivePhrase"] = sample.phrase.id;
    passage.dataset["kpScrollScorePhraseProgress"] =
      sample.phraseProgress.toFixed(4);
    passage.dataset["kpScrollScoreResting"] = String(sample.resting);
    const phraseAttention = new Map(
      projectKpSupplyTaxScrollScorePhraseAttention({
        score: pedagogicalScore,
        sample,
        discrete: reducedMotion.matches,
        profile: phraseFocusProfile
      }).map((attention) => [attention.phraseId, attention] as const)
    );
    phraseBindings.forEach((binding, id) => {
      const active = id === sample.phrase.id;
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
      `${plainLabel(sample.phrase.label)}, ${percent}%`);
    railOutput.value = plainLabel(sample.phrase.label);
    if (updateHistory && activePhraseId !== sample.phrase.id) {
      history.replaceState(null, "", kpSupplyTaxScrollScorePhraseHash(
        sample.phrase));
    }
    activePhraseId = sample.phrase.id;
  };

  const measure = (): void => {
    if (disposed) return;
    const stationHeight = station.getBoundingClientRect().height;
    const corridorEntries = pedagogicalScore.passages.map((scorePassage) => {
      const corridor = requiredElement<HTMLElement>(passage,
        `[data-kp-scroll-score-corridor="${scorePassage.id}"]`);
      const cue = requiredElement<HTMLElement>(corridor,
        "[data-kp-scroll-score-cue]");
      corridor.style.setProperty("--kp-scroll-score-cue-height",
        `${cue.getBoundingClientRect().height}px`);
      return { passage: scorePassage, corridor, cue };
    });
    const maxCueHeight = Math.max(...corridorEntries.map(({ cue }) =>
      cue.getBoundingClientRect().height));
    const fitsStation = stationHeight + maxCueHeight + stationGapPx +
      stationTopPx * 2 <= window.innerHeight;
    passage.dataset["kpScrollScoreFit"] = fitsStation
      ? "stationary"
      : "ordinary";
    const nextFit: "stationary" | "ordinary" = fitsStation
      ? "stationary"
      : "ordinary";
    fit = nextFit;
    passage.style.setProperty("--kp-scroll-score-cue-top",
      `${stationTopPx + stationHeight + stationGapPx}px`);
    // Setting cue height changes the corridor's realized height, so measure
    // document endpoints only after all renderer-owned size variables exist.
    layouts = Object.freeze(corridorEntries.map((entry) => {
      const corridorRect = entry.corridor.getBoundingClientRect();
      const cueHeight = entry.cue.getBoundingClientRect().height;
      const documentTop = window.scrollY + corridorRect.top;
      const cueTop = stationTopPx + stationHeight + stationGapPx;
      return Object.freeze({
        ...entry,
        startY: documentTop - cueTop,
        endY: Math.max(documentTop - cueTop,
          documentTop + corridorRect.height - cueHeight - cueTop)
      });
    }));
    const target = readKpSupplyTaxScrollScorePhraseFromHash(
      pedagogicalScore,
      window.location.hash
    );
    if (target !== undefined && activePhraseId === undefined) {
      seekPhrase(target, false);
    } else {
      projectFromScroll(false);
    }
  };

  const unitsFromScroll = (): number => {
    if (layouts.length === 0) return projectedUnits;
    if (fit === "ordinary") {
      const readingY = window.innerHeight * 0.58;
      const closest = layouts.reduce((winner, candidate) => {
        const candidateDistance = Math.abs(
          candidate.cue.getBoundingClientRect().top - readingY);
        const winnerDistance = Math.abs(
          winner.cue.getBoundingClientRect().top - readingY);
        return candidateDistance < winnerDistance ? candidate : winner;
      });
      return closest.passage.offsetUnits + closest.passage.totalUnits;
    }
    const y = window.scrollY;
    const first = layouts[0]!;
    if (y <= first.startY) return 0;
    for (const [index, layout] of layouts.entries()) {
      if (y <= layout.endY) {
        const progress = layout.endY === layout.startY
          ? 1
          : (y - layout.startY) / (layout.endY - layout.startY);
        return layout.passage.offsetUnits +
          Math.max(0, Math.min(1, progress)) * layout.passage.totalUnits;
      }
      const next = layouts[index + 1];
      if (next !== undefined && y < next.startY) {
        return layout.passage.offsetUnits + layout.passage.totalUnits;
      }
    }
    return pedagogicalScore.totalUnits;
  };

  const projectFromScroll = (updateHistory = true): void => {
    const first = layouts[0];
    const last = layouts[layouts.length - 1];
    if (first !== undefined && last !== undefined) {
      const y = window.scrollY;
      passage.dataset["kpScrollScoreStationPhase"] = y < first.startY
        ? "approach"
        : y > last.endY
          ? "release"
          : "score";
    }
    projectUnits(unitsFromScroll(), updateHistory);
  };

  const scrollYForUnits = (units: number): number => {
    const sample = sampleKpSupplyTaxScrollScore(pedagogicalScore, units);
    const layout = layouts.find(({ passage: candidate }) =>
      candidate.id === sample.passage.id);
    if (layout === undefined) return window.scrollY;
    if (fit === "ordinary") {
      return window.scrollY + layout.cue.getBoundingClientRect().top -
        window.innerHeight * 0.55;
    }
    const localProgress = sample.passage.totalUnits === 0
      ? 0
      : (sample.units - sample.passage.offsetUnits) /
        sample.passage.totalUnits;
    return interpolate(layout.startY, layout.endY, localProgress);
  };

  function seekUnits(units: number, updateHistory: boolean): void {
    const bounded = Math.max(0, Math.min(pedagogicalScore.totalUnits, units));
    window.scrollTo({ top: scrollYForUnits(bounded), behavior: "auto" });
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

  const scheduleProjection = (): void => {
    if (frameRequest !== undefined) return;
    frameRequest = window.requestAnimationFrame(() => {
      frameRequest = undefined;
      projectFromScroll();
    });
  };
  const handleRailInput = (): void => seekUnits(Number(rail.value), true);
  const handleRailKeydown = (event: KeyboardEvent): void => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]
      .includes(event.key)) return;
    event.preventDefault();
    const checkpoints = pedagogicalScore.phrases.map((phrase) =>
      canonicalKpSupplyTaxScrollScorePhraseUnits(pedagogicalScore, phrase));
    const current = Number(rail.value);
    const target = event.key === "Home"
      ? 0
      : event.key === "End"
        ? pedagogicalScore.totalUnits
        : event.key === "ArrowRight" || event.key === "ArrowDown"
          ? checkpoints.find((value) => value > current + 0.01) ??
            pedagogicalScore.totalUnits
          : [...checkpoints].reverse().find((value) =>
            value < current - 0.01) ?? 0;
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
  const handleReducedMotion = (): void => projectUnits(projectedUnits, false);

  const resizeObserver = new ResizeObserver(() => measure());
  resizeObserver.observe(station);
  passage.querySelectorAll<HTMLElement>("[data-kp-scroll-score-cue]")
    .forEach((cue) => resizeObserver.observe(cue));
  window.addEventListener("scroll", scheduleProjection, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("hashchange", handleHashChange);
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
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleProjection);
      window.removeEventListener("resize", measure);
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("selectionchange", handleSelection);
      passage.removeEventListener("beforematch", handleBeforeMatch, true);
      rail.removeEventListener("input", handleRailInput);
      rail.removeEventListener("keydown", handleRailKeydown);
      reducedMotion.removeEventListener("change", handleReducedMotion);
    }
  });
}

function renderPage(score: KpSupplyTaxScrollScoreV1): string {
  return `<main class="kp-scroll-score-page">
    <article class="kp-scroll-score-article" aria-labelledby="kp-scroll-score-title">
      <header class="kp-scroll-score-intro">
        <p>Scroll Score · Economics</p>
        <h1 id="kp-scroll-score-title">How does a tax reshape a market?</h1>
        <p>Scroll normally. The paragraph is the score; the stage follows its argument.</p>
      </header>
      <section class="kp-scroll-score-passage" data-kp-supply-tax-scroll-score data-kp-scroll-score-fit="stationary" data-kp-scroll-score-station-phase="approach" aria-label="Per-unit tax Scroll Score Station">
        <div class="kp-scroll-score-station" data-kp-scroll-score-station>
          ${renderStaticStage()}
          ${renderScoreRail(score)}
        </div>
        <div class="kp-scroll-score-narrative" aria-label="Explanation">
          ${score.passages.map((passage) => renderPassage(passage)).join("")}
        </div>
      </section>
      <p class="kp-scroll-score-release-note">The stage has settled. Continue scrolling to leave this visual argument.</p>
    </article>
  </main>`;
}

function renderStaticStage(): string {
  return `<figure class="kp-supply-tax-figure kp-scroll-score-stage" data-kp-supply-tax-stage data-kp-supply-tax-stage-state="baseline-market">
    <figcaption class="kp-supply-tax-visually-hidden" data-kp-supply-tax-stage-caption>Demand and original supply intersect at five units and a price of seven before the tax.</figcaption>
    <div class="kp-supply-tax-stage__visual">
      <div class="kp-supply-tax-stage__graph">${renderKpSupplyTaxInteractiveSvg()}</div>
      ${renderKpSupplyTaxWelfareLedger()}
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
  return `<section class="kp-scroll-score-corridor" data-kp-scroll-score-corridor="${passage.id}" style="--kp-scroll-score-unit-count:${passage.totalUnits}">
    <div class="kp-scroll-score-cue" data-kp-scroll-score-cue data-kp-scroll-score-passage="${passage.id}">
      ${compileKpArticleMarkdownFragmentHtml(passage.markdown)}
    </div>
  </section>`;
}

function bindPhraseElements(
  root: HTMLElement,
  score: KpSupplyTaxScrollScoreV1,
  profile: KpSupplyTaxScrollScorePhraseFocusProfile
): ReadonlyMap<string, PhraseBinding> {
  const elements = new Map<string, PhraseBinding>();
  for (const phrase of score.phrases) {
    const passage = requiredElement<HTMLElement>(root,
      `[data-kp-scroll-score-passage="${phrase.passageId}"]`);
    const link = Array.from(passage.querySelectorAll<HTMLAnchorElement>(
      'a[href^="kp-ref:"]'
    )).find((candidate) => candidate.getAttribute("href") ===
      `kp-ref:${phrase.referenceAddress}`);
    if (link === undefined) {
      throw new Error(`Rendered Scroll Score phrase ${phrase.id} is missing.`);
    }
    const span = document.createElement("span");
    span.id = `phrase.${phrase.id}`;
    span.className = "kp-scroll-score-phrase";
    span.dataset["kpScrollScorePhrase"] = phrase.id;
    span.dataset["kpScrollScorePhraseActive"] = "false";
    span.dataset["kpScrollScoreAct"] = phrase.act;
    const scorePassage = score.passages.find(({ id }) =>
      id === phrase.passageId)!;
    span.dataset["kpScrollScoreStartUnits"] = String(
      scorePassage.offsetUnits + phrase.startUnits);
    span.dataset["kpScrollScoreEndUnits"] = String(
      scorePassage.offsetUnits + phrase.motionEndUnits);
    while (link.firstChild !== null) span.append(link.firstChild);
    link.replaceWith(span);
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
