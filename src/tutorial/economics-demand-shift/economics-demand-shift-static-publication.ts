import type {
  KpEconomicsDemandShiftLessonPassage
} from "./economics-demand-shift-lesson-compiler.ts";
import type {
  KpEconomicsDemandShiftPublication
} from "./economics-demand-shift-publication.ts";
import {
  findKpEconomicsMotionBlock
} from "./economics-demand-shift-motion-blocks.ts";

/**
 * The route publishes complete narrative truth without requiring Svelte,
 * runtime Markdown, or runtime KaTeX. The retained stage joins this shell in
 * the next independently reversible publication slice.
 */
export function renderKpEconomicsDemandShiftStaticNarrative(
  publication: KpEconomicsDemandShiftPublication
): string {
  const { lesson } = publication;
  return `<main class="kp-economics-static-publication" data-kp-economics-static-publication data-kp-economics-static-projection="narrative">
    <article class="kp-economics-static-publication__prose" aria-label="Economics lesson">
      <header class="kp-economics-static-publication__intro">
        <p class="kp-economics-static-publication__eyebrow">${escapeHtml(lesson.kicker)}</p>
        <h1>${escapeHtml(lesson.title)}</h1>
        <p>${escapeHtml(lesson.assumption)}</p>
      </header>
      ${publication.tocHtml}
      ${lesson.sections.map((section) => `<section id="kp-section-${escapeAttribute(section.id)}" data-kp-tutorial-destination="section" data-kp-tutorial-destination-id="${escapeAttribute(section.id)}" aria-labelledby="kp-heading-${escapeAttribute(section.id)}">
        <h3 id="kp-heading-${escapeAttribute(section.id)}">${escapeHtml(section.heading)}</h3>
        ${section.passages.map(renderPassage).join("")}
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
    .kp-economics-static-publication p { font-family: Georgia, "Times New Roman", serif; font-size: 1rem; line-height: 1.75; }
    .kp-economics-static-publication__eyebrow { letter-spacing: 0.08em; text-transform: uppercase; }
    .kp-economics-static-publication [data-kp-tutorial-toc-list] { padding-inline-start: 1.25rem; }
    .kp-economics-static-publication .katex-html { display: none; }
    .kp-economics-static-publication math { display: inline math; }
  </style>`;
}

function renderPassage(passage: KpEconomicsDemandShiftLessonPassage): string {
  const motion = findKpEconomicsMotionBlock(passage.motionBlockId);
  const destination = motion === undefined
    ? ""
    : ` id="kp-block-${escapeAttribute(motion.id)}" data-kp-tutorial-motion-block="${escapeAttribute(motion.id)}" data-kp-tutorial-destination="block" data-kp-tutorial-destination-id="${escapeAttribute(motion.id)}" role="group" aria-label="${escapeAttribute(motion.label)} animation step"`;
  const checkpointAnchors = motion?.checkpoints.map((checkpoint) =>
    `<span id="kp-checkpoint-${escapeAttribute(checkpoint.id)}" data-kp-tutorial-destination="checkpoint" data-kp-tutorial-destination-id="${escapeAttribute(checkpoint.id)}" data-kp-tutorial-destination-block="${escapeAttribute(motion.id)}" aria-hidden="true"></span>`
  ).join("") ?? "";
  return `<div class="kp-economics-static-publication__passage" data-kp-economics-tutorial-passage="${escapeAttribute(passage.id)}" data-kp-lesson-passage-role="${escapeAttribute(passage.role)}"${destination}>
    ${checkpointAnchors}
    ${passage.paragraphs.map(({ html }) => `<p>${html}</p>`).join("")}
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
