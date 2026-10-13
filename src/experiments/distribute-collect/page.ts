import katex from "katex";
import { prepareDistributeCollect, assertDistributeCollect, type DistributeCollectPresentation } from "../../authoring/distribute-collect-presentation.ts";
import primary from "../../authoring/examples/distribute-collect.json" with { type: "json" };
import transfer from "../../authoring/examples/distribute-collect-transfer.json" with { type: "json" };
import { distributeCollectSequence } from "../composed-algebra/sequence.ts";
import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";

export function distributeCollectExample(url: string) {
  return prepareDistributeCollect(new URL(url, "http://localhost").searchParams.get("variant") === "transfer" ? transfer : primary);
}
export function renderDistributeCollect(draft: DistributeCollectPresentation) {
  assertDistributeCollect(draft);
  const beats = distributeCollectSequence(draft).beats;
  const card = renderKpFocusDeckScaffold({ id: "distribute-collect", ariaLabel: "Distribute, then collect", activeBeatSlug: beats[0]!.slug, beats,
    replayHidden: false, stageHtml: '<div class="kp-focus-deck__stage" data-distribution-stage aria-label="Distribution, collection and evaluation"></div>',
    headerTrailingHtml: '<span data-composed-count aria-label="Step 1 of 4">1 / 4</span>',
    rootAttributes: { "data-kp-focus-card-enhancement": "preparing", "data-kp-reasoning-card": true, "data-composed-card": true } });
  const truth = draft.checked.source.states.map(s => `<li>${katex.renderToString(s.latex, { throwOnError: true })}<p>${escape(s.narration)}</p></li>`).join("");
  return `<h1>Distribute, then collect</h1><p>Watch what is copied, what is kept, and what is evaluated.</p>
    <nav class="reasoning-toolbar" aria-label="Algebra examples"><a href="?example=distribute-collect">Three copies of x + x</a>
    <a href="?example=distribute-collect&amp;variant=transfer">Four copies of y + y</a></nav>
    <div data-composed-reader>${card}</div><p>Use the arrows for one step, or drag the slider to inspect and reverse the motion.</p>
    <p data-composed-error role="alert" hidden></p>
    <details><summary>Read the steps</summary><ol>${truth}</ol></details>
    <details><summary>Source</summary><pre>${escape(JSON.stringify(draft.source, null, 2))}</pre></details>
    <noscript><style>[data-composed-reader]{display:none}</style><ol>${truth}</ol></noscript>`;
}
export function buildDistributeCollectPage(url = "http://localhost") {
  return renderDistributeCollect(distributeCollectExample(url));
}
