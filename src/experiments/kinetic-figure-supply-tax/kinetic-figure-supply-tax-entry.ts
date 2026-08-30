import "katex/dist/katex.min.css";
import "../../styles.css";
import "./kinetic-figure-supply-tax.css";

import articleText from
  "../../../content/lessons/economics-supply-tax.kp.md?raw";
import importLockValue from
  "../../../content/lessons/economics-supply-tax.kp.lock.json" with { type: "json" };

import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import {
  createKpEconomicsSupplyTaxAnimationAsset,
  sampleKpEconomicsSupplyTaxAnimationFrame
} from "../../animation/economics-supply-tax-asset.ts";
import { compileKpArticleMarkdownFragmentHtml } from
  "../../article/kp-article-static-html.ts";
import { applyKpSemanticVisualDomTheme } from
  "../../rendering/semantic-visual-dom-theme.ts";
import { createKpReaderTimelinePlaybackClock } from
  "../../reader/runtime/timeline-playback-clock.ts";
import {
  renderKpFocusDeckControlIcon
} from "../focus-deck-control-icons.ts";
import {
  compileKpSupplyTaxArticle,
  type KpSupplyTaxArticleDeckSceneV1
} from "./kinetic-figure-supply-tax-article.ts";
import {
  projectKpSupplyTaxScene,
  projectKpSupplyTaxSceneDom,
  kpSupplyTaxBeatHash,
  readKpSupplyTaxBeatFromHash,
  resolveKpSupplyTaxNavigationDisposition
} from "./kinetic-figure-supply-tax-scene.ts";
import {
  projectKpSupplyTaxTransitSvgDom,
  renderKpSupplyTaxInteractiveSvg,
  renderKpSupplyTaxWelfareLedger
} from
  "./kinetic-figure-supply-tax-svg.ts";

const importLock = importLockValue as KpArticleImportLock;

export interface KpSupplyTaxKineticFigureSession {
  dispose(): void;
}

/**
 * The first route slice mounts a static semantic checkpoint. Later slices add
 * SVG projection and clock-driven enhancement without changing Article prose.
 */
export function mountKpSupplyTaxKineticFigure(input: {
  readonly root: HTMLElement;
}): KpSupplyTaxKineticFigureSession {
  applyKpSemanticVisualDomTheme({ root: input.root, theme: "light" });
  const compiled = compileKpSupplyTaxArticle({
    text: articleText,
    lock: importLock
  });
  input.root.innerHTML = renderPage(compiled.deck.scenes);
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const deck = requiredElement<HTMLElement>(
    input.root,
    "[data-kp-supply-tax-focus-deck]"
  );
  const scenes = compiled.deck.scenes;
  const graph = requiredElement<SVGSVGElement>(deck, ".kp-supply-tax-graph");
  const caption = requiredElement<HTMLElement>(deck,
    "[data-kp-supply-tax-stage-caption]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const durationMs = authority.animation.timeline?.durationMs;
  if (durationMs === undefined) {
    throw new Error("Supply-tax animation requires its canonical timeline.");
  }
  const initialBeat = readKpSupplyTaxBeatFromHash(
    scenes.map(({ beat }) => beat),
    window.location.hash
  );
  const initialScene = scenes.find(({ beat }) => beat.id === initialBeat.id)!;
  const clock = createKpReaderTimelinePlaybackClock({
    id: "clock.focus-deck.economics.supply-tax.v1",
    durationMs,
    initialProgress: initialScene.beat.settledFrame === "untaxed" ? 0 : 1,
    ownerWindow: window
  });
  let active = initialScene;
  let pendingSettledScene: KpSupplyTaxArticleDeckSceneV1 | undefined;

  const projectScene = (scene: KpSupplyTaxArticleDeckSceneV1): void => {
    projectKpSupplyTaxSceneDom({
      root: deck,
      scene: projectKpSupplyTaxScene({ authority, beat: scene.beat })
    });
  };
  const projectFrame = (progress: number): void => {
    const frame = sampleKpEconomicsSupplyTaxAnimationFrame({
      asset: authority,
      progress: exactProgress(progress)
    });
    projectKpSupplyTaxTransitSvgDom({
      root: graph,
      semantics: authority.semantics,
      // The shared clock stores global model progress. Rewind changes the
      // clock direction, not the pure domain sampler's coordinate system.
      frame
    });
    caption.textContent = frame.phase === "taxed"
      ? authority.accessibility.settledDescription
      : authority.accessibility.description;
    deck.dataset["kpSupplyTaxClockProgress"] = progress.toFixed(4);
  };
  const projectBeatChrome = (scene: KpSupplyTaxArticleDeckSceneV1): void => {
    deck.dataset["kpFocusDeckActiveBeat"] = scene.beat.slug;
    scenes.forEach((candidate) => {
      const selected = candidate.beat.id === scene.beat.id;
      const section = requiredElement<HTMLElement>(deck,
        `[data-kp-focus-deck-beat="${candidate.beat.slug}"]`);
      section.dataset["kpFocusDeckBeatActive"] = String(selected);
      if (selected) section.removeAttribute("hidden");
      else section.setAttribute("hidden", "until-found");
      const button = requiredElement<HTMLButtonElement>(deck,
        `[data-kp-focus-deck-select="${candidate.beat.slug}"]`);
      button.disabled = false;
      if (selected) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    const index = scenes.indexOf(scene);
    const previous = requiredElement<HTMLButtonElement>(deck,
      "[data-kp-focus-deck-previous]");
    const next = requiredElement<HTMLButtonElement>(deck,
      "[data-kp-focus-deck-next]");
    previous.disabled = index === 0;
    next.disabled = index === scenes.length - 1;
    deck.querySelectorAll<HTMLOutputElement>("[data-kp-focus-deck-position]")
      .forEach((output) => {
        output.value = `Step ${scene.beat.ordinal} of ${scenes.length}`;
      });
    requiredElement<HTMLOutputElement>(deck,
      "[data-kp-focus-deck-position-short]").value =
        `${scene.beat.ordinal} of ${scenes.length}`;
    const replay = requiredElement<HTMLButtonElement>(deck,
      "[data-kp-supply-tax-replay]");
    replay.hidden = scene.beat.transitionFromPrevious !== "sample-tax-imposition";
  };
  const settleAt = (scene: KpSupplyTaxArticleDeckSceneV1): void => {
    const progress = scene.beat.settledFrame === "untaxed" ? 0 : 1;
    clock.seek(progress);
    projectScene(scene);
  };
  const updateLocation = (
    scene: KpSupplyTaxArticleDeckSceneV1,
    mode: "none" | "push" | "replace"
  ): void => {
    if (mode === "none") return;
    const hash = kpSupplyTaxBeatHash(scene.beat);
    if (window.location.hash === hash) return;
    if (mode === "push") history.pushState(null, "", hash);
    else history.replaceState(null, "", hash);
  };
  const select = (
    scene: KpSupplyTaxArticleDeckSceneV1,
    options: {
      readonly animate?: boolean | undefined;
      readonly history?: "none" | "push" | "replace" | undefined;
    } = {}
  ): void => {
    const interrupted = clock.getStatus() === "playing";
    if (scene.beat.id === active.beat.id) {
      if (options.animate === false || interrupted) settleAt(scene);
      updateLocation(scene, options.history ?? "push");
      return;
    }
    const previous = active;
    active = scene;
    pendingSettledScene = undefined;
    projectBeatChrome(active);
    const disposition = resolveKpSupplyTaxNavigationDisposition({
      from: previous.beat,
      to: active.beat,
      interrupted,
      reducedMotion: reducedMotion.matches,
      allowMotion: options.animate
    });
    updateLocation(active, options.history ?? "push");
    if (disposition === "direct-settle") {
      settleAt(active);
      return;
    }
    if (disposition === "animate-forward") {
      projectScene(active);
      clock.seek(0);
      clock.play({ direction: "forward", stopAt: 1 });
      return;
    }
    // Keep the taxed scene present while its geometry rewinds, then remove
    // derived objects only at the categorical untaxed endpoint.
    clock.seek(1);
    pendingSettledScene = active;
    clock.play({ direction: "rewind", stopAt: 0 });
  };
  const replay = (): void => {
    if (active.beat.transitionFromPrevious !== "sample-tax-imposition") return;
    pendingSettledScene = undefined;
    projectScene(active);
    clock.seek(0);
    if (reducedMotion.matches) clock.seek(1);
    else clock.play({ direction: "forward", stopAt: 1 });
  };
  const selectAdjacent = (direction: -1 | 1): void => {
    const index = scenes.indexOf(active);
    const next = scenes[index + direction];
    if (next !== undefined) select(next, { history: "push" });
  };
  const handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("[data-kp-focus-deck-previous]") !== null) {
      selectAdjacent(-1);
      return;
    }
    if (target?.closest("[data-kp-focus-deck-next]") !== null) {
      selectAdjacent(1);
      return;
    }
    if (target?.closest("[data-kp-supply-tax-replay]") !== null) {
      replay();
      return;
    }
    const slug = target?.closest<HTMLElement>("[data-kp-focus-deck-select]")
      ?.dataset["kpFocusDeckSelect"];
    const scene = scenes.find(({ beat }) => beat.slug === slug);
    if (scene !== undefined) select(scene, { history: "push" });
  };

  const handleLocation = (): void => {
    const beat = readKpSupplyTaxBeatFromHash(
      scenes.map(({ beat }) => beat),
      window.location.hash
    );
    const scene = scenes.find((candidate) => candidate.beat.id === beat.id)!;
    select(scene, { animate: false, history: "none" });
  };
  const handleBeforeMatch = (event: Event): void => {
    const section = event.target instanceof Element
      ? event.target.closest<HTMLElement>("[data-kp-focus-deck-beat]")
      : null;
    const slug = section?.dataset["kpFocusDeckBeat"];
    const scene = scenes.find((candidate) => candidate.beat.slug === slug);
    if (scene === undefined) return;
    // Native find owns discovery and scrolling. The deck only restores the
    // matched semantic state, directly and without replaying prior beats.
    select(scene, { animate: false, history: "replace" });
  };

  const unsubscribe = clock.subscribe((sample) => {
    projectFrame(sample.progress);
    if (sample.settled && pendingSettledScene !== undefined) {
      const pending = pendingSettledScene;
      pendingSettledScene = undefined;
      projectScene(pending);
    }
  });
  projectBeatChrome(active);
  projectScene(active);
  projectFrame(active.beat.settledFrame === "untaxed" ? 0 : 1);
  deck.addEventListener("click", handleClick);
  deck.addEventListener("beforematch", handleBeforeMatch, true);
  window.addEventListener("popstate", handleLocation);
  window.addEventListener("hashchange", handleLocation);
  return Object.freeze({
    dispose: () => {
      deck.removeEventListener("click", handleClick);
      deck.removeEventListener("beforematch", handleBeforeMatch, true);
      window.removeEventListener("popstate", handleLocation);
      window.removeEventListener("hashchange", handleLocation);
      unsubscribe();
      clock.dispose();
    }
  });
}

function renderPage(
  scenes: readonly KpSupplyTaxArticleDeckSceneV1[]
): string {
  return `<main class="kp-supply-tax-page">
    <article class="kp-supply-tax-article" aria-labelledby="kp-supply-tax-page-title">
      <header class="kp-supply-tax-page__intro">
        <p>Focus Deck · Economics</p>
        <h1 id="kp-supply-tax-page-title">What changes when a market is taxed?</h1>
      </header>
      <section class="kp-supply-tax-deck" data-kp-supply-tax-focus-deck data-kp-focus-deck-active-beat="${escapeAttribute(scenes[0]!.beat.slug)}" aria-label="Per-unit tax Focus Deck">
        <header class="kp-supply-tax-deck__header">
          <span>Kinetic Figure</span>
          <span>Supply, tax, and welfare</span>
        </header>
        <div class="kp-supply-tax-deck__body">
          <nav class="kp-supply-tax-steps" aria-label="Figure steps">
            <header><span>Steps</span><output data-kp-focus-deck-position-short>1 of ${scenes.length}</output></header>
            <ol>${scenes.map(({ beat }, index) => `<li>
              <button type="button" data-kp-focus-deck-select="${escapeAttribute(beat.slug)}"${index === 0 ? ' aria-current="step"' : ""} disabled>
                <span aria-hidden="true">${beat.ordinal}</span>
                <span>${escapeHtml(beat.title)}</span>
              </button>
            </li>`).join("")}</ol>
          </nav>
          <div class="kp-supply-tax-deck__main">
            ${renderStaticStage()}
            <section class="kp-supply-tax-narrative" aria-label="Explanation">
              ${scenes.map((scene, index) => renderScene(scene, index === 0)).join("")}
            </section>
            <footer class="kp-supply-tax-navigation" aria-label="Figure navigation">
              <button type="button" data-kp-focus-deck-previous aria-label="Previous step" title="Previous step" disabled>${renderKpFocusDeckControlIcon("previous")}</button>
              <div class="kp-supply-tax-navigation__status">
                <output data-kp-focus-deck-position aria-live="polite">Step 1 of ${scenes.length}</output>
                <button type="button" data-kp-supply-tax-replay aria-label="Replay transformation" title="Replay transformation" hidden>${renderKpFocusDeckControlIcon("replay")}</button>
              </div>
              <button type="button" data-kp-focus-deck-next aria-label="Next step" title="Next step">${renderKpFocusDeckControlIcon("next")}</button>
            </footer>
          </div>
        </div>
      </section>
    </article>
  </main>`;
}

function renderStaticStage(): string {
  return `<figure class="kp-supply-tax-figure" data-kp-supply-tax-stage data-kp-supply-tax-stage-state="baseline-market">
    <figcaption class="kp-supply-tax-visually-hidden" data-kp-supply-tax-stage-caption>Demand and original supply intersect at five units and a price of seven before the tax.</figcaption>
    <div class="kp-supply-tax-stage__visual">
      <div class="kp-supply-tax-stage__graph">${renderKpSupplyTaxInteractiveSvg()}</div>
      ${renderKpSupplyTaxWelfareLedger()}
    </div>
  </figure>`;
}

function renderScene(
  scene: KpSupplyTaxArticleDeckSceneV1,
  active: boolean
): string {
  const source = scene.articleScene.kind === "reading"
    ? scene.articleScene.markdown
    : [
        scene.articleScene.beforeMarkdown,
        scene.articleScene.afterMarkdown ?? ""
      ].filter(Boolean).join("\n\n");
  return `<section id="beat.${escapeAttribute(scene.beat.slug)}" data-kp-focus-deck-beat="${escapeAttribute(scene.beat.slug)}" data-kp-focus-deck-beat-active="${String(active)}"${active ? "" : ' hidden="until-found"'}>
    ${compileKpArticleMarkdownFragmentHtml(source)}
  </section>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing supply-tax element ${selector}.`);
  return element;
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
