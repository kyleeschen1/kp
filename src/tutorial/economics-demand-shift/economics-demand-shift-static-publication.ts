import type {
  KpEconomicsDemandShiftLessonPassage
} from "./economics-demand-shift-lesson-compiler.ts";
import type {
  KpEconomicsDemandShiftPublication
} from "./economics-demand-shift-publication.ts";
import {
  findKpEconomicsMotionBlock
} from "./economics-demand-shift-motion-blocks.ts";
import {
  renderKpEconomicsDemandShiftStaticStage
} from "./economics-demand-shift-static-stage.ts";
import {
  renderKpTutorialProgressRail
} from "../kp-tutorial-progress-rail-renderer.ts";
import {
  kpEconomicsDemandShiftDeckScenes
} from "./economics-demand-shift-deck.ts";
import {
  projectKpEconomicsDemandShiftAttentionCue
} from "./economics-demand-shift-attention-stage.ts";
import type {
  KpEconomicsDemandShiftView
} from "./economics-demand-shift-view.ts";

/**
 * The route publishes complete narrative truth without requiring Svelte,
 * runtime Markdown, or runtime KaTeX. The retained stage joins this shell in
 * the next independently reversible publication slice.
 */
export function renderKpEconomicsDemandShiftStaticNarrative(
  publication: KpEconomicsDemandShiftPublication
): string {
  const { lesson } = publication;
  return `${renderViewSelector()}<main class="kp-economics-static-publication" data-kp-economics-static-publication data-kp-economics-static-projection="narrative">
    <article class="kp-economics-static-publication__prose" aria-label="Economics lesson">
      <header class="kp-economics-static-publication__intro">
        <p class="kp-economics-static-publication__eyebrow">${escapeHtml(lesson.kicker)}</p>
        <h1>${escapeHtml(lesson.title)}</h1>
        <p>${escapeHtml(lesson.assumption)}</p>
      </header>
      <div class="kp-economics-static-publication__projection">
        ${renderKpEconomicsDemandShiftStaticStage()}
        ${renderDeck(publication)}
      </div>
      ${publication.tocHtml}
      <div class="kp-economics-static-publication__reader-seam" data-kp-economics-reader-seam>
        <span>Full lesson</span>
      </div>
      ${lesson.sections.map((section) => `<section id="kp-section-${escapeAttribute(section.id)}" data-kp-tutorial-destination="section" data-kp-tutorial-destination-id="${escapeAttribute(section.id)}" aria-labelledby="kp-heading-${escapeAttribute(section.id)}">
        <h3 id="kp-heading-${escapeAttribute(section.id)}">${escapeHtml(section.heading)}</h3>
        ${section.passages.map((passage) =>
          renderPassage(passage, publication)).join("")}
      </section>`).join("")}
    </article>
  </main>`;
}

export function renderKpEconomicsDemandShiftStaticNarrativeStyles(): string {
  return `<style data-kp-economics-static-publication-styles>
    .kp-economics-static-publication { box-sizing: border-box; margin: 0 auto; max-width: 76rem; padding: clamp(2rem, 6vw, 5rem); }
    .kp-economics-static-publication__prose { margin: 0 auto; max-width: 68ch; }
    .kp-economics-static-publication h1 { font-size: clamp(1.5rem, 3vw, 2.25rem); line-height: 1.2; }
    .kp-economics-static-publication h3 { font-size: 1.2rem; margin-top: 2.5rem; }
    .kp-economics-static-publication p { font-family: var(--kp-economics-non-katex-font-family, Georgia, "Times New Roman", serif); font-size: 1rem; font-weight: var(--kp-lesson-theme-prose-weight, 300); line-height: 1.75; }
    .kp-economics-static-publication__eyebrow { letter-spacing: 0.08em; text-transform: uppercase; }
    .kp-economics-static-publication__stage { margin: 2rem auto; max-width: 46rem; }
    .kp-economics-static-publication__stage-slot { aspect-ratio: 640 / 420; width: 100%; }
    .kp-economics-static-publication__stage figcaption { font-size: 0.875rem; margin-top: 0.5rem; }
    .kp-economics-static-publication__accessible-state { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); border: 0; white-space: nowrap; }
    .kp-economics-static-publication .editor-graph-stage { display: block; height: 100%; width: 100%; }
    .kp-economics-static-publication .editor-graph-stage__plot-plane { fill: transparent; }
    .kp-economics-static-publication [data-kp-editor-graph-axis] { stroke: var(--kp-graph-axis, currentColor); stroke-width: var(--kp-graph-stroke-axis, 1px); }
    .kp-economics-static-publication .editor-graph-stage__economics-curve,
    .kp-economics-static-publication .editor-graph-stage__economics-guide,
    .kp-economics-static-publication .editor-graph-stage__economics-grid-line { fill: none; stroke-width: var(--kp-graph-line-effective, 1px); }
    .kp-economics-static-publication .editor-graph-stage__economics-grid-line { stroke: var(--kp-graph-grid, #7f8793); }
    .kp-economics-static-publication .editor-graph-stage__economics-guide { stroke: var(--kp-graph-guide, #7f8793); }
    .kp-economics-static-publication .editor-graph-stage__economics-curve--supply { stroke: var(--kp-graph-stable, #7db9ff); }
    .kp-economics-static-publication .editor-graph-stage__economics-curve--demand { stroke: var(--kp-graph-changing, #ff7b72); }
    .kp-economics-static-publication .editor-graph-stage__economics-equilibrium { fill: var(--kp-graph-intersection-fill, #0d0e1c); stroke: var(--kp-graph-intersection-stroke, #f3f4fa); }
    .kp-economics-static-publication [data-kp-economics-screen-space-label] { color: currentColor; font-size: 16px; }
    .kp-economics-static-publication__motion-controls { margin-block: 1.25rem 2rem; }
    .kp-economics-static-publication kp-tutorial-progress-rail,
    .kp-economics-static-publication kp-tutorial-scrub-bar { display: block; }
    .kp-economics-static-publication [data-kp-tutorial-toc-list] { padding-inline-start: 1.25rem; }
    .kp-economics-static-publication .katex-html { display: none; }
    .kp-economics-static-publication math { display: inline math; }
    .kp-economics-static-publication__deck { display: none; margin: 1.25rem auto 2.5rem; max-width: 46rem; }
    html:is([data-kp-economics-view="deck"], [data-kp-economics-view="attention-stage"]) .kp-economics-static-publication { max-width: 82rem; }
    html:is([data-kp-economics-view="deck"], [data-kp-economics-view="attention-stage"]) .kp-economics-static-publication__prose { max-width: 76rem; }
    html:is([data-kp-economics-view="deck"], [data-kp-economics-view="attention-stage"]) .kp-economics-static-publication__intro,
    html:is([data-kp-economics-view="deck"], [data-kp-economics-view="attention-stage"]) .kp-economics-static-publication__prose > section,
    html:is([data-kp-economics-view="deck"], [data-kp-economics-view="attention-stage"]) .kp-economics-static-publication__prose > kp-tutorial-toc,
    html:is([data-kp-economics-view="deck"], [data-kp-economics-view="attention-stage"]) .kp-economics-static-publication__reader-seam { margin-inline: auto; max-width: 68ch; }
    html:is([data-kp-economics-view="deck"], [data-kp-economics-view="attention-stage"]) .kp-economics-static-publication__projection { margin: 1.5rem auto 4rem; max-width: 54rem; }
    html:is([data-kp-economics-view="deck"], [data-kp-economics-view="attention-stage"]) .kp-economics-static-publication__stage { inline-size: min(100%, 73vh); margin-bottom: 1.5rem; max-width: 46rem; }
    html:is([data-kp-economics-view="deck"], [data-kp-economics-view="attention-stage"]) .kp-economics-static-publication__deck { display: block; }
    .kp-economics-static-publication__deck-progress { display: grid; gap: 0.55rem; grid-template-columns: auto 1fr; align-items: center; }
    .kp-economics-static-publication__deck-progress output { font: 500 0.78rem/1.2 var(--kp-economics-ui-font-family, system-ui, sans-serif); letter-spacing: 0.04em; white-space: nowrap; }
    .kp-economics-static-publication__deck-progress progress { accent-color: var(--kp-salience-green, #65d6a6); block-size: 0.18rem; border: 0; inline-size: 100%; }
    .kp-economics-static-publication__deck-viewport { margin-block: 1.4rem 1.25rem; overflow: hidden; }
    .kp-economics-static-publication__deck-track { display: grid; grid-auto-columns: 100%; grid-auto-flow: column; transform: translateX(calc(var(--kp-economics-deck-scene-index, 0) * -100%)); transition: transform 260ms cubic-bezier(.2,.8,.2,1); }
    .kp-economics-static-publication__deck-scene { align-content: center; box-sizing: border-box; min-block-size: clamp(8rem, 20vh, 12rem); padding: clamp(0.5rem, 2vw, 1.25rem); opacity: 0.42; transform: scale(0.985); transition: opacity 180ms ease, transform 220ms cubic-bezier(.2,.8,.2,1); }
    .kp-economics-static-publication__deck-scene[data-kp-economics-deck-scene-active="true"] { opacity: 1; transform: scale(1); }
    .kp-economics-static-publication__deck-scene h3 { margin: 0 0 0.4rem; }
    .kp-economics-static-publication__deck-scene p { margin: 0; }
    .kp-economics-static-publication [data-kp-economics-attention-cue] { display: none; }
    .kp-economics-static-publication__deck-controls { display: flex; gap: 0.75rem; justify-content: space-between; }
    .kp-economics-static-publication__deck-controls button { appearance: none; background: transparent; border: 1px solid color-mix(in srgb, currentColor 32%, transparent); color: inherit; cursor: pointer; font: 500 0.9rem/1 var(--kp-economics-ui-font-family, system-ui, sans-serif); min-block-size: 2.5rem; padding: 0.7rem 1rem; }
    .kp-economics-static-publication__deck-controls button:disabled { cursor: default; opacity: 0.35; }
    .kp-economics-static-publication__reader-seam { align-items: center; display: flex; gap: 0.75rem; margin-block: 3rem 1rem; color: color-mix(in srgb, currentColor 62%, transparent); font: 500 0.75rem/1.2 var(--kp-economics-ui-font-family, system-ui, sans-serif); letter-spacing: 0.08em; text-transform: uppercase; }
    .kp-economics-static-publication__reader-seam::before,
    .kp-economics-static-publication__reader-seam::after { background: currentColor; content: ""; block-size: 1px; flex: 1; }
    html:not([data-kp-economics-view="deck"]):not([data-kp-economics-view="attention-stage"]) .kp-economics-static-publication__reader-seam { display: none; }
    @media (prefers-reduced-motion: reduce) {
      .kp-economics-static-publication__deck-track,
      .kp-economics-static-publication__deck-scene { transition: none; }
    }
    @media (max-width: 42rem) {
      .kp-economics-static-publication { padding: 1.25rem; }
      .kp-economics-static-publication__deck-scene { min-block-size: 10rem; padding-inline: 0; }
    }
  </style>`;
}

function renderViewSelector(): string {
  return `<nav class="kp-economics-view-selector" data-kp-economics-view-selector aria-label="Lesson view">
    <div class="kp-economics-view-selector__primary">
      ${viewLink("reader", "Reader")}
      ${viewLink("deck", "Deck")}
    </div>
    <details class="kp-economics-view-selector__experiments">
      <summary>Experiments</summary>
      <div>
        ${viewLink("attention-stage", "Attention stage")}
        ${viewLink("split", "Split")}
        ${viewLink("inline-sticky", "Sticky")}
        ${viewLink("two-column-scroll", "Columns")}
        ${viewLink("animation-station", "Station")}
      </div>
    </details>
  </nav>`;
}

function viewLink(view: KpEconomicsDemandShiftView, label: string): string {
  return `<a href="?view=${view}" data-kp-economics-view-link="${view}">${label}</a>`;
}

function renderDeck(publication: KpEconomicsDemandShiftPublication): string {
  const passages = new Map(publication.twoColumnParagraphs.map(
    (passage) => [passage.id, passage] as const
  ));
  return `<section class="kp-economics-static-publication__deck" data-kp-economics-deck aria-label="Interactive lesson deck">
    <div class="kp-economics-static-publication__deck-progress">
      <output data-kp-economics-deck-count>1 of ${kpEconomicsDemandShiftDeckScenes.length}</output>
      <progress data-kp-economics-deck-progress max="${kpEconomicsDemandShiftDeckScenes.length}" value="1">Scene 1 of ${kpEconomicsDemandShiftDeckScenes.length}</progress>
    </div>
    <div class="kp-economics-static-publication__deck-viewport">
      <div class="kp-economics-static-publication__deck-track" data-kp-economics-deck-track>
        ${kpEconomicsDemandShiftDeckScenes.map((scene, index) => {
          const passage = passages.get(scene.passageId);
          if (passage === undefined) {
            throw new Error(`Deck scene ${scene.id} references missing passage ${scene.passageId}.`);
          }
          return `<section class="kp-economics-static-publication__deck-scene" data-kp-economics-deck-scene="${escapeAttribute(scene.id)}" data-kp-economics-deck-passage="${escapeAttribute(scene.passageId)}" data-kp-economics-deck-scene-active="${index === 0}" aria-labelledby="kp-economics-deck-heading-${escapeAttribute(scene.id)}">
            <h3 id="kp-economics-deck-heading-${escapeAttribute(scene.id)}">${escapeHtml(scene.label)}</h3>
            <div data-kp-economics-deck-passage-copy>${passage.paragraphs.map(({ html }) => `<p>${html}</p>`).join("")}</div>
            <p data-kp-economics-attention-cue>${escapeHtml(projectKpEconomicsDemandShiftAttentionCue(scene))}</p>
          </section>`;
        }).join("")}
      </div>
    </div>
    <div class="kp-economics-static-publication__deck-controls">
      <button type="button" data-kp-economics-deck-previous disabled>Back</button>
      <button type="button" data-kp-economics-deck-next>Continue</button>
    </div>
  </section>`;
}

function renderPassage(
  passage: KpEconomicsDemandShiftLessonPassage,
  publication: KpEconomicsDemandShiftPublication
): string {
  const motion = findKpEconomicsMotionBlock(passage.motionBlockId);
  const destination = motion === undefined
    ? ""
    : ` id="kp-block-${escapeAttribute(motion.id)}" data-kp-tutorial-motion-block="${escapeAttribute(motion.id)}" data-kp-tutorial-destination="block" data-kp-tutorial-destination-id="${escapeAttribute(motion.id)}" role="group" aria-label="${escapeAttribute(motion.label)} animation step"`;
  const checkpointAnchors = motion?.checkpoints.map((checkpoint) =>
    `<span id="kp-checkpoint-${escapeAttribute(checkpoint.id)}" data-kp-tutorial-destination="checkpoint" data-kp-tutorial-destination-id="${escapeAttribute(checkpoint.id)}" data-kp-tutorial-destination-block="${escapeAttribute(motion.id)}" aria-hidden="true"></span>`
  ).join("") ?? "";
  const controls = motion === undefined
    ? ""
    : `<div class="kp-economics-static-publication__motion-controls" data-kp-economics-static-motion-controls="${escapeAttribute(motion.id)}">
      ${renderKpTutorialProgressRail({
        blockId: motion.id,
        label: `${motion.label} progress`,
        initialLabel: motion.checkpoints[0]!.label,
        progress: 0
      })}
      ${publication.motionScrubBarHtml[motion.id]}
    </div>`;
  return `<div class="kp-economics-static-publication__passage" data-kp-economics-tutorial-passage="${escapeAttribute(passage.id)}" data-kp-lesson-passage-role="${escapeAttribute(passage.role)}"${destination}>
    ${checkpointAnchors}
    ${passage.paragraphs.map(({ html }) => `<p>${html}</p>`).join("")}
    ${controls}
  </div>`;
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
