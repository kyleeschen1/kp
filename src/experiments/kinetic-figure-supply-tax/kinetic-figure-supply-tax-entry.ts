import "katex/dist/katex.min.css";
import "../../styles.css";
import "./kinetic-figure-supply-tax.css";

import articleText from
  "../../../content/lessons/economics-supply-tax.kp.md?raw";
import importLockValue from
  "../../../content/lessons/economics-supply-tax.kp.lock.json" with { type: "json" };

import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import { compileKpArticleMarkdownFragmentHtml } from
  "../../article/kp-article-static-html.ts";
import { applyKpSemanticVisualDomTheme } from
  "../../rendering/semantic-visual-dom-theme.ts";
import {
  compileKpSupplyTaxArticle,
  type KpSupplyTaxArticleDeckSceneV1
} from "./kinetic-figure-supply-tax-article.ts";
import { renderKpSupplyTaxBaselineSvg } from
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
  return Object.freeze({ dispose: () => undefined });
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
            <header><span>Steps</span><output>1 of ${scenes.length}</output></header>
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
              <button type="button" aria-label="Previous step" title="Previous step" disabled>←</button>
              <output aria-live="polite">Step 1 of ${scenes.length}</output>
              <button type="button" aria-label="Next step" title="Next step" disabled>→</button>
            </footer>
          </div>
        </div>
      </section>
    </article>
  </main>`;
}

function renderStaticStage(): string {
  return `<figure class="kp-supply-tax-figure" data-kp-supply-tax-stage data-kp-supply-tax-stage-state="baseline-market">
    <figcaption class="kp-supply-tax-visually-hidden">Demand and original supply intersect at five units and a price of seven before the tax.</figcaption>
    <div class="kp-supply-tax-stage__graph">${renderKpSupplyTaxBaselineSvg()}</div>
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
