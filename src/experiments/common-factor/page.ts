import katex from "katex";
import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import { assertKpPreparedCommonFactorDraft, prepareKpCommonFactorDraft, type KpPreparedCommonFactorDraft } from "../../authoring/common-factor-draft.ts";
import { createKpCommonFactorExample } from "../../authoring/common-factor-author-check.ts";
import { commonFactorEndpoints } from "./endpoints.ts";
import { projectCommonFactorReading } from "./readings.ts";

export const escapeCommonFactorText = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
export function commonFactorBeats(draft: KpPreparedCommonFactorDraft) {
  assertKpPreparedCommonFactorDraft(draft);
  return draft.source.states.map((state, index) => ({ slug: state.id, title: index === 0 ? "Two products" : "One shared factor",
    html: `<p>${escapeCommonFactorText(state.narration)}</p>`, attributes: { "data-common-factor-state": state.id } }));
}
export function renderCommonFactorCard(draft: KpPreparedCommonFactorDraft) {
  assertKpPreparedCommonFactorDraft(draft);
  const beats = commonFactorBeats(draft);
  return renderKpFocusDeckScaffold({ id: "common-factor", ariaLabel: draft.source.editorial.title, activeBeatSlug: beats[0]!.slug, beats,
    stageHtml: '<div class="kp-focus-deck__stage" data-distribution-stage aria-label="Verified common factoring"></div>', replayHidden: false,
    headerTrailingHtml: '<span data-common-factor-count aria-label="Beat 1 of 2">1 / 2</span>',
    rootAttributes: { "data-kp-focus-card-enhancement": "preparing", "data-kp-reasoning-card": true, "data-common-factor-card": true } });
}
export function renderCommonFactorPage(draft: KpPreparedCommonFactorDraft) {
  assertKpPreparedCommonFactorDraft(draft);
  const escape = escapeCommonFactorText;
  return `<h1 data-common-factor-title>${escape(draft.source.editorial.title)}</h1><p class="source-label">Verified common factoring · two stops, one transformation</p>
    <p data-common-factor-setup>${escape(draft.source.editorial.setup)}</p>
    <div data-common-factor-reader>${renderCommonFactorCard(draft)}</div>
    <p class="review-help">Swipe or scroll horizontally to control the transformation. Release to settle; arrows play one complete step.</p>
    <p data-common-factor-summary>${escape(draft.source.editorial.summary)}</p>
    <div class="reasoning-toolbar"><label>Reading <select data-common-factor-reading><option value="full">Full</option><option value="compact">Compact</option></select></label></div>
    <section data-common-factor-reading-output data-revision="${escape(draft.revisionId)}" aria-label="Verified factoring reading">${projectCommonFactorReading(draft, "full").html}</section>
    <details data-reasoning-editor><summary>Edit source JSON</summary>
    <p>Declare single-letter real scalars. This task preserves product and addend order; it does not solve general polynomial factoring. Prose is editorial, not proof.</p>
    <label>Factoring source JSON<textarea data-reasoning-json rows="20" spellcheck="false"></textarea></label>
    <div class="reasoning-toolbar"><button type="button" data-common-factor-apply>Apply source</button><button type="button" data-common-factor-download>Download displayed source</button></div>
    <p data-reasoning-draft-status role="status">Only successfully prepared revisions replace the displayed card.</p>
    <p>Displayed revision: <code data-reasoning-revision>${escape(draft.revisionId)}</code></p></details>
    <p data-common-factor-error role="alert" hidden></p>`;
}
export function buildKpCommonFactorInitialPage() {
  const draft = prepareKpCommonFactorDraft(createKpCommonFactorExample());
  const staticTruth = commonFactorEndpoints(draft).map(e => katex.renderToString(e.annotated.rawLatex, { displayMode: true, throwOnError: true })).join("");
  return renderCommonFactorPage(draft) + `<noscript><style>[data-common-factor-reader],[data-reasoning-editor]{display:none}</style><h2>Verified endpoints</h2>${staticTruth}</noscript>`;
}
