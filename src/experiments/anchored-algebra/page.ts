import katex from "katex";
import source from "../../../content/authoring/algebra/what-counts.json" with { type: "json" };
import { compile } from "../../authoring/algebra/compile.ts";
import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";
import { bindAnchoredCommentary } from "./commentary.ts";

export function buildAnchoredAlgebraPage() {
  const draft = compile(source), commentary = bindAnchoredCommentary(draft), states = draft.checked.source.states;
  const math = (latex: string) => katex.renderToString(latex, { displayMode: true, throwOnError: true });
  const beats = states.map(state => ({ slug: state.id, title: state.narration, html: `<p>${escape(state.narration)}</p>` }));
  return `<article data-anchored-algebra data-source-revision="${escape(draft.revisionId)}">
    <p class="source-label">An algebra study</p><h1>${escape(source.editorial.title)}</h1><p class="anchored-introduction">${escape(source.editorial.setup)}</p>
    ${renderKpFocusDeckScaffold({ id: "anchored-algebra", ariaLabel: source.editorial.title, activeBeatSlug: states[0]!.id, beats,
      stageHtml: `<div class="kp-focus-deck__stage" data-distribution-stage aria-label="Count the whole, then its parts"><div data-anchored-static>${math(states[0]!.latex)}</div></div>`,
      headerTrailingHtml: '<span data-composed-count>1 / 4</span>', replayHidden: false,
      rootAttributes: { "data-composed-card": true, "data-kp-focus-card-enhancement": "static" } })}
    <p class="review-help">Use the arrows to follow a move. At the third stop, predict the result before opening the group. Drag the slider to inspect or reverse the motion.</p>
    <nav class="anchored-stops" aria-label="Jump to a mathematical state">${states.map((state, index) => `<a data-anchored-jump="${escape(state.id)}" href="?example=anchored-algebra&amp;revision=${encodeURIComponent(draft.revisionId)}#${escape(state.id)}">${["The repeated whole", "Combine counts", "Look inside", "Every contribution"][index]}</a>`).join("")}</nav>
    <p data-anchored-error role="alert" hidden></p>
    <details class="anchored-reading"><summary>Read the explanation without motion</summary>${states.map((state, index) => `<section aria-label="${escape(state.id)}"><h2>${["The repeated whole", "Combine the counts", "Change the question", "Count the parts"][index]}</h2>${math(state.latex)}<p>${escape(state.narration)}</p><ul>${commentary.stops[index]!.notes.map(note => `<li><strong>${escape(note.text)}</strong> ${escape(note.detail)}</li>`).join("")}</ul></section>`).join("")}</details>
    <p class="anchored-conclusion">${escape(source.editorial.summary)}</p>
    <script type="application/json" data-anchored-source>${JSON.stringify(draft.checked.source).replaceAll("<", "\\u003c")}</script>
    <noscript><style>[data-anchored-algebra] .kp-focus-deck__navigation,[data-anchored-algebra] .review-help,[data-anchored-algebra] .anchored-stops{display:none}</style><p>Open the reading above for all four states and their commentary.</p></noscript></article>`;
}
