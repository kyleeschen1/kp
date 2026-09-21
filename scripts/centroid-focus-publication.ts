import { renderKpFocusDeckScaffold } from "../src/tutorial/focus-deck-scaffold.ts";
import { compileKpArticleMarkdownFragmentHtml as markdown } from "../src/article/kp-article-static-html.ts";
import { centroidMotionReading } from "../src/tutorial/code-reasoning/centroid-motion-reading.ts";
import { centroidReading } from "../src/tutorial/code-reasoning/centroid-reading.ts";

export function renderCentroidFocusPublication() {
  return `<div data-centroid-focus hidden>${renderKpFocusDeckScaffold({
    id: "centroid.extraction.focus", ariaLabel: "Inspect the extraction of a helper",
    activeBeatSlug: "calculation", classAliases: { root: "centroid-focus-card" },
    headerTrailingHtml: "<span>Extract a helper</span>",
    stageHtml: `<div data-centroid-card-surface><div class="code-controls centroid-focus-actions" role="group" aria-label="Animate to a moment">${centroidMotionReading.map(thought => `<button type="button" data-centroid-card-target="${thought.id}">${thought.action}</button>`).join("")}</div><div data-centroid-card-slot></div></div>`,
    beats: centroidMotionReading.map(thought => ({ slug: thought.id, title: thought.title,
      html: `<p><strong>${thought.title}</strong> ${markdown(thought.focusText).trim().replace(/^<p>|<\/p>$/g, "")}</p>` }))
  })}<p class="centroid-focus-hint" data-centroid-card-fit-note>Drag to inspect. Scroll within the code when needed.</p><details><summary>More about this extraction</summary>${centroidReading.map(reason => `<h3>${reason.question}</h3>${markdown(reason.detail)}`).join("")}</details></div>`;
}
