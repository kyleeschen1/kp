import katex from "katex";
import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import { assertKpComposedAlgebraPresentation, type KpComposedAlgebraPresentation } from "../../authoring/composed-algebra-presentation.ts";
import { prepareKpComposedAlgebraDraft } from "../../authoring/composed-algebra-session.ts";
import { projectComposedAlgebraReading } from "./readings.ts";
import { encodeKpHtmlAttribute } from "../../rendering/html-output-encoding.ts";

export const escapeComposedAlgebraText = encodeKpHtmlAttribute;
export function composedAlgebraBeats(draft: KpComposedAlgebraPresentation) {
  assertKpComposedAlgebraPresentation(draft);
  const titles = ["Count the copies", "Factor the shared expression", "Evaluate the count"] as const;
  return draft.checked.source.states.map((state, index) => ({ slug: state.id, title: titles[index]!,
    html: `<p>${escapeComposedAlgebraText(state.narration)}</p>` }));
}
export function renderComposedAlgebraCard(draft: KpComposedAlgebraPresentation) {
  const beats = composedAlgebraBeats(draft);
  return renderKpFocusDeckScaffold({ id: "composed-algebra", ariaLabel: draft.checked.source.editorial.title, activeBeatSlug: beats[0]!.slug, beats,
    replayHidden: false,
    stageHtml: '<div class="kp-focus-deck__stage" data-distribution-stage aria-label="Verified factoring and coefficient evaluation"></div>',
    headerTrailingHtml: '<span data-composed-count aria-label="Step 1 of 3">1 / 3</span>',
    rootAttributes: { "data-kp-focus-card-enhancement": "preparing", "data-kp-reasoning-card": true, "data-composed-card": true } });
}
export function renderComposedAlgebraPage(draft: KpComposedAlgebraPresentation) {
  assertKpComposedAlgebraPresentation(draft);
  const escape = escapeComposedAlgebraText, source = draft.checked.source;
  return `<h1 data-composed-title>${escape(source.editorial.title)}</h1><p class="source-label">Verified composed algebra · three stops, two transformations</p>
    <p data-composed-setup>${escape(source.editorial.setup)}</p><div data-composed-reader>${renderComposedAlgebraCard(draft)}</div>
    <p class="review-help">Swipe or scroll horizontally to control each transformation. Release to settle; arrows play one complete step. Three stops show the original expression, its factored form, and the evaluated count.</p>
    <p data-composed-summary>${escape(source.editorial.summary)}</p>
    <div class="reasoning-toolbar" data-composed-reading-toolbar><label>Reading <select data-composed-reading><option value="full">Full</option><option value="compact">Compact</option></select></label>
    <button type="button" data-composed-practice="prediction">Predict</button><button type="button" data-composed-practice="reconstruction">Reconstruct</button></div>
    <section data-composed-practice-panel hidden aria-label="Composed algebra self-check"><h2 data-composed-prompt-title></h2><p data-composed-prompt></p>
    <p>All symbols are real scalars. Preserve product and addend order.</p><label>Your working (self-check, not automatic grading)<textarea data-composed-working rows="3"></textarea></label>
    <div class="reasoning-toolbar"><button type="button" data-composed-reveal>Compare with the verified answer</button><button type="button" data-composed-return>Return to reading</button></div>
    <p data-composed-answer hidden></p></section>
    <section data-composed-reading-output data-revision="${escape(draft.revisionId)}" aria-label="Verified composed algebra reading">${projectComposedAlgebraReading(draft, "full").html}</section>
    <details data-reasoning-editor><summary>Edit source JSON</summary>
    <p>Declare single-letter real scalars. Factor two integer multiples of a shared compound expression, then evaluate its coefficient sum. Product and addend order are preserved. Prose is editorial, not proof.</p>
    <label>Composed algebra source JSON<textarea data-reasoning-json rows="20" spellcheck="false"></textarea></label>
    <div class="reasoning-toolbar"><button type="button" data-composed-apply>Apply source</button><button type="button" data-composed-download>Download displayed source</button></div>
    <p data-reasoning-draft-status role="status">Only successfully prepared revisions replace the displayed card.</p>
    <p>Build an immutable local static edition from the displayed source: <code>npm run author:composed-algebra-publication -- --source &lt;composed-algebra.json&gt;</code>. Template changes apply to new builds, not existing edition bytes.</p>
    <p>Displayed revision: <code data-reasoning-revision>${escape(draft.revisionId)}</code></p></details>
    <p data-composed-error role="alert" hidden></p>`;
}
export function buildKpComposedAlgebraInitialPage() {
  const draft = prepareKpComposedAlgebraDraft();
  const truth = draft.checked.source.states.map(s => katex.renderToString(s.latex, { displayMode: true, throwOnError: true })).join("");
  return renderComposedAlgebraPage(draft) + `<noscript><style>[data-composed-reader],[data-reasoning-editor]{display:none}</style><h2>Verified endpoints</h2>${truth}</noscript>`;
}
