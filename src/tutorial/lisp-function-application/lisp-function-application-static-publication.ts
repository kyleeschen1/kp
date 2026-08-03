import type { KpLispFunctionApplicationPublication } from "./lisp-function-application-publication.ts";
import {
  kpLispLessonMotionBlocks,
  type KpLispLessonMotionBlockId
} from "./lisp-function-application-motion-blocks.ts";

export function renderKpLispFunctionApplicationStaticPublication(input: {
  readonly publication: KpLispFunctionApplicationPublication;
  readonly stageHtml: string;
  readonly animationId: string;
}): string {
  const { lesson } = input.publication;
  return `<main class="kp-lisp-tutorial" data-kp-lisp-function-application-tutorial data-kp-lisp-tutorial-projection="static">
    <h1 class="kp-lisp-tutorial__visually-hidden">Lisp function application tutorial</h1>
    <div class="kp-lisp-tutorial__layout">
      <aside class="kp-lisp-tutorial__toc" aria-label="Lesson navigation">${input.publication.tocHtml}</aside>
      <article class="kp-lisp-tutorial__prose" aria-label="Lisp lesson">
        <header class="kp-lisp-tutorial__intro">
          <p class="kp-lisp-tutorial__eyebrow">${escapeHtml(lesson.kicker)}</p>
          <p class="kp-lisp-tutorial__question">${escapeHtml(lesson.title)}</p>
          <p class="kp-lisp-tutorial__assumption">${escapeHtml(lesson.assumption)}</p>
        </header>
        ${lesson.sections.map((section) => `<section id="kp-section-${section.id}" data-kp-tutorial-destination="section" data-kp-tutorial-destination-id="${section.id}" aria-labelledby="kp-heading-${section.id}">
          <h3 id="kp-heading-${section.id}">${escapeHtml(section.heading)}</h3>
          ${section.blocks.map((block) => block.kind === "passage"
            ? `<div class="kp-lisp-tutorial__passage" data-kp-lisp-tutorial-passage="${block.id}">${block.paragraphs.map(({ html }) => `<p>${html}</p>`).join("")}</div>`
            : renderMotion(input.publication.motionScrubBarHtml, block.id)
          ).join("")}
        </section>`).join("")}
        <footer class="kp-lisp-tutorial__footer"><a href="/?artifact=${escapeHtml(input.animationId)}">Open the animation catalogue</a></footer>
      </article>
      <aside class="kp-lisp-tutorial__stage" aria-label="Static Lisp function application stage">${input.stageHtml}</aside>
    </div>
  </main>`;
}

function renderMotion(
  scrubbers: Readonly<Record<KpLispLessonMotionBlockId, string>>,
  id: KpLispLessonMotionBlockId
): string {
  const block = kpLispLessonMotionBlocks.find((candidate) => candidate.id === id)!;
  return `<div class="kp-lisp-tutorial__motion-block" id="kp-block-${block.id}" data-kp-tutorial-motion-block="${block.id}" data-kp-tutorial-destination="block" data-kp-tutorial-destination-id="${block.id}" role="group" aria-label="${escapeHtml(block.label)} animation step">
    ${block.checkpoints.map((checkpoint) => `<span class="kp-lisp-tutorial__checkpoint-anchor" id="kp-checkpoint-${checkpoint.id}" data-kp-tutorial-destination="checkpoint" data-kp-tutorial-destination-id="${checkpoint.id}" data-kp-tutorial-destination-block="${block.id}" aria-hidden="true"></span>`).join("")}
    ${scrubbers[id]}
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
