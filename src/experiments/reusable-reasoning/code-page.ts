import { bindCodeReasoningEvidence } from "./code-evidence.ts";
import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import { renderKpTypeScriptRefactorCodeHtml } from "../../rendering/typescript-refactor-code-html.ts";
import { sampleKpTypeScriptRefactorMotionFrame } from "../../animation/typescript-refactor-motion-frame.ts";
import { encodeKpHtmlText as escape } from "../../rendering/html-output-encoding.ts";

export function buildCodeReasoningPage() {
  const evidence = bindCodeReasoningEvidence();
  const { runtime, context } = evidence;
  const initial = runtime.score.stages[0]!;
  const motion = sampleKpTypeScriptRefactorMotionFrame({ score: runtime.score, progress: 0 });
  const code = renderKpTypeScriptRefactorCodeHtml({ semantics: runtime.semantics,
    stageId: initial.id, narration: initial.narration, focusSelectorIds: initial.focusSelectorIds,
    activeProjectionId: motion.accessibleProjectionId, theme: "light", accessibleDescription: runtime.accessibility.title });
  return `<h1>${escape(evidence.source.title)}</h1><p data-code-reasoning-statement>${escape(evidence.source.statement)}</p>
    <div class="reasoning-toolbar"><button data-code-reasoning-open>Why does this refactor work?</button><button data-code-reasoning-return hidden>← Return to the argument</button><span data-code-reasoning-view-label>Argument</span></div>
    ${renderKpFocusDeckScaffold({ id: "reasoning.typescript-extract-helper", ariaLabel: evidence.source.title,
      activeBeatSlug: context.steps[0]!.slug, classAliases: { root: "kp-typescript-focus-card" },
      rootAttributes: { "data-code-reasoning-card": true }, viewportAttributes: { "data-kp-focus-deck-snap-disabled": true },
      headerTrailingHtml: '<span data-code-reasoning-count>1 / 7</span>', replayHidden: false,
      stageHtml: `<figure class="kp-focus-deck__stage kp-typescript-focus-card__stage">${code}</figure>`,
      beats: context.steps.map(step => ({ slug: step.slug, title: step.title, html: step.html,
        attributes: { "data-code-stage": step.stageId, "data-code-source-block": step.sourceBlockId } })) })}
    <section data-reasoning-context><h2>Reason and limits</h2><p>${escape(evidence.source.explanation)}</p>
      <ul>${context.assumptions.map(item => `<li>${escape(item)}</li>`).join("")}</ul>
      <details><summary>Inspect source identities and behavioral evidence</summary>
      <ul>${context.sources.map(item => `<li>${escape(item.path)} · <code>${escape(item.revisionId)}</code></li>`).join("")}</ul>
      <p>Declared cases: ${context.certificate.cases.map(item => escape(item.id)).join(", ")}.</p>
      <code>${escape(evidence.revisionId)}</code></details></section>
    <p class="review-help">Swipe or scroll continuously; release to settle. Arrows move one semantic stage at a time. Opening a reason preserves your exact place.</p>
    <p data-code-reasoning-error role="alert" hidden></p>`;
}
