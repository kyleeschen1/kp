import katex from "katex";
import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import { assertKpComposedAlgebraPresentationV2, type KpComposedAlgebraPresentationV2 } from "../../authoring/composed-algebra-presentation-v2.ts";
import * as algebra from "../../authoring/algebra/compile.ts";
import primary from "../../authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import wholeAndParts from "../../../content/authoring/algebra/whole-and-parts.json" with { type: "json" };
import { composedAlgebraSequenceV2, composedAlgebraWindowV2 } from "../composed-algebra/sequence.ts";
import { projectComposedAlgebraSubexplanations, type KpComposedAlgebraSubexplanation } from "../composed-algebra/subexplanations.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";
import { projectComposedAlgebraReadingV2 } from "../composed-algebra/readings.ts";
import { algebraIntuitionPracticeButtons, algebraIntuitionPracticePanel } from "./practice.ts";

export function renderAlgebraIntuitionCard(draft: KpComposedAlgebraPresentationV2, reference?: KpComposedAlgebraSubexplanation, textFirst = false) {
  const sequence = reference ? composedAlgebraWindowV2(draft, reference) : composedAlgebraSequenceV2(draft), total = sequence.beats.length;
  return renderKpFocusDeckScaffold({ id: reference ? `composed-algebra-${reference.kind}` : "composed-algebra-intuition", ariaLabel: reference?.question ?? draft.checked.source.editorial.title,
    activeBeatSlug: sequence.beats[0]!.slug, beats: sequence.beats, replayHidden: false,
    stageHtml: '<div class="kp-focus-deck__stage" data-distribution-stage aria-label="Verified regrouping and distribution"></div>',
    headerTrailingHtml: `<span data-composed-count aria-label="Step 1 of ${total}">1 / ${total}</span>`,
    rootAttributes: { "data-kp-focus-card-enhancement": "preparing", "data-kp-reasoning-card": true, "data-composed-card": true,
      ...(textFirst ? { "data-composed-text-first": true } : {}) } });
}
export function algebraIntuitionVariant(url: string) {
  const variants = new URL(url, "http://localhost").searchParams.getAll("variant");
  if (variants.length > 1 || (variants.length && variants[0] !== "whole-and-parts")) throw new Error("Unsupported algebra source variant; use whole-and-parts or omit variant for the original example.");
  return variants.length ? "whole-and-parts" as const : undefined;
}
export function renderAlgebraIntuitionLinks(draft: KpComposedAlgebraPresentationV2, variant?: "whole-and-parts") {
  return `<h2>Two smaller intuitions</h2><p>Open either question independently, then return to the exact moment you left.</p><ul>${projectComposedAlgebraSubexplanations(draft).map(reference =>
    `<li><a data-composed-intuition="${reference.kind}" href="?example=algebra-intuition${variant ? `&amp;variant=${variant}` : ""}&amp;intuition=${reference.kind}&amp;revision=${encodeURIComponent(reference.revisionId)}">${escape(reference.question)}</a></li>`).join("")}</ul>`;
}
export function renderAlgebraIntuitionPage(draft: KpComposedAlgebraPresentationV2, variant?: "whole-and-parts") {
  assertKpComposedAlgebraPresentationV2(draft);
  const source = draft.checked.source;
  return `<h1 data-composed-title>${escape(source.editorial.title)}</h1>
    <p class="source-label" data-composed-sequence-summary>${source.states.length} states · ${draft.steps.length} verified moves</p>
    <p data-composed-setup>${escape(source.editorial.setup)}</p>
    <div data-composed-reader>${renderAlgebraIntuitionCard(draft, undefined, Boolean(variant))}</div>
    <p class="review-help">Swipe or scroll horizontally to follow each move. Release to settle; arrows play one complete move. Drag the slider to inspect an intermediate moment.</p>
    <p data-composed-summary>${escape(source.editorial.summary)}</p>
    <p data-composed-context>All symbols are real scalars. No division is used, so the repeated group may equal zero. This explains preserving contributions—not a claim that collecting first is always the fastest method.</p>
    <section data-composed-subexplanations>${renderAlgebraIntuitionLinks(draft, variant)}</section>
    <div class="reasoning-toolbar" data-composed-reading-toolbar><label>Reading <select data-composed-reading><option value="full">Full</option><option value="compact">Compact</option></select></label>${algebraIntuitionPracticeButtons}</div>
    <section data-composed-reading-output data-revision="${escape(draft.revisionId)}" aria-label="Verified composed algebra reading">${projectComposedAlgebraReadingV2(draft, "full").html}</section>
    <section data-composed-intuition-panel hidden aria-label="Independent intuition"><h1 data-composed-intuition-question></h1>
      <p data-composed-intuition-setup></p><div data-composed-intuition-reader></div><p data-composed-intuition-answer></p>
      <p>All symbols are real scalars. Product and addend order are preserved.</p>
      <div class="reasoning-toolbar" data-composed-intuition-practice>${algebraIntuitionPracticeButtons}</div>
      <button type="button" data-composed-intuition-return>Return to the whole explanation</button></section>
    ${algebraIntuitionPracticePanel}
    <details data-reasoning-editor><summary>Edit source JSON</summary>
      <p>Factor the repeated group, evaluate its count, distribute, and optionally evaluate the final constant product. Product and addend order are preserved. Prose is editorial, not proof.</p>
      <label>Algebra source JSON<textarea data-reasoning-json rows="20" spellcheck="false"></textarea></label>
      <div class="reasoning-toolbar"><button type="button" data-composed-apply>Apply source</button><button type="button" data-composed-download>Download displayed source</button></div>
      <p data-reasoning-draft-status role="status">Only successfully prepared revisions replace the displayed card.</p>
      <p>Displayed revision: <code data-reasoning-revision>${escape(draft.revisionId)}</code></p>
      <p>Build a static edition from the downloaded source: <code>npm run author:composed-algebra-publication -- --source &lt;source.json&gt;</code>. This exports readings and self-checks, not interactive animation. Template changes apply to newly built editions; existing edition bytes stay immutable.</p>
    </details><p data-composed-error role="alert" hidden></p>
    <p><a href="/experiments/reusable-reasoning/?example=composed-algebra">Earlier three-state exemplar</a></p>`;
}
export function buildKpAlgebraIntuitionInitialPage(url = "http://localhost") {
  const variant = algebraIntuitionVariant(url), draft = algebra.compile(variant ? wholeAndParts : primary);
  const truth = draft.checked.source.states.map(state => katex.renderToString(state.latex, { displayMode: true, throwOnError: true })).join("");
  // The browser consumes the same checked source as the initial markup, not a
  // separately imported default. Escape '<' inside the inert JSON script.
  const source = JSON.stringify(draft.checked.source).replaceAll("<", "\\u003c");
  return renderAlgebraIntuitionPage(draft, variant) + `<script type="application/json" data-composed-initial-source>${source}</script><noscript><style>[data-composed-reader],[data-reasoning-editor]{display:none}</style><h2>Verified endpoints</h2>${truth}</noscript>`;
}
