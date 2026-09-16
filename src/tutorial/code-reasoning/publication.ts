import { createKpArticleSource } from "../../article/kp-article-source.ts";
import { resolveKpArticleImports } from "../../article/kp-article-import-lock.ts";
import { compileKpArticleDocument } from "../../article/kp-article-document.ts";
import { compileKpArticleMarkdownFragmentHtml as markdownHtml } from "../../article/kp-article-static-html.ts";
import { createKpTypeScriptFreeShippingAnimationAsset } from "../../semantic/typescript-free-shipping-animation-asset.ts";
import { renderKpTypeScriptRefactorCodeHtml } from "../../rendering/typescript-refactor-code-html.ts";
import { encodeKpHtmlText as text, encodeKpHtmlAttribute as attribute } from "../../rendering/html-output-encoding.ts";
import { sha256 } from "../../kernel/sha256.ts";

export const codeReasoningArticlePath = "examples/programming/shared-rule.article.md";

/** The publication owns prose placement; the language asset alone issues source,
 * correspondence, score and evidence. Inspection markup is inert until opened. */
export function compileCodeReasoningPublication(markdown: string) {
  const source = createKpArticleSource(codeReasoningArticlePath, markdown);
  const { lock } = resolveKpArticleImports(source, []);
  const article = compileKpArticleDocument({ source, registry: [], lock });
  const passages = article.document.blocks.filter(block => block.kind === "passage");
  if (passages.map(block => block.id).join(",") !== "before,transition,after,why,check") {
    throw new Error("Code reasoning requires ordered before, transition, after, why and check passages");
  }
  const asset = createKpTypeScriptFreeShippingAnimationAsset();
  const pin = sha256(JSON.stringify(asset.semantics));
  const first = asset.score.stages[0]!;
  const stage = renderKpTypeScriptRefactorCodeHtml({ semantics: asset.semantics,
    stageId: first.id, narration: first.narration, activeProjectionId: "projection.typescript.before",
    focusSelectorIds: first.focusSelectorIds, accessibleDescription: asset.accessibility.title, theme: "light" });
  const inspection = `<details class="code-inspection" data-code-inspection hidden>
    <summary>Inspect where the rule goes</summary>
    <p class="code-inspection-label">Local inspection · drag to hold any moment; arrows move between beats</p>
    <div data-code-stage-host></div><template data-code-stage-template>${stage}</template>
    <div class="code-controls"><button type="button" data-code-previous disabled>Previous</button>
      <button type="button" data-code-play disabled>Play</button><button type="button" data-code-next disabled>Next</button>
      <output data-code-position>1 / ${asset.score.stages.length}</output>
      <input type="range" min="0" max="1" step="0.001" value="0" aria-label="Inspect the refactor" data-code-seek disabled>
    </div>
    <p data-code-error role="status" hidden></p>
  </details>`;
  const endpoint = (revision: "before" | "after") => `<pre class="code-record kp-typescript-refactor__revision" data-code-record="${revision}"><code>${text(asset.staticEndpoints[revision])}</code></pre>`;
  const cases = asset.behavior.cases.map(item => `<tr><td>${item.total}</td><td>${text(String(item.before.shippingCost))}</td><td>${text(item.before.shippingMessage)}</td><td>${item.equivalent ? "Same" : "Different"}</td></tr>`).join("");
  const html = article.document.blocks.map(block => {
    if (block.kind === "markdown") return markdownHtml(block.markdown);
    if (block.kind !== "passage") throw new Error("Code record supports prose and the pinned TypeScript inspection only");
    const body = markdownHtml(block.markdown);
    if (block.id === "why") return `<details class="code-justification" id="why"><summary>Why is this allowed? What has been checked?</summary>${body}
      <table><caption>Declared-case evidence · before and after</caption><thead><tr><th>Total</th><th>Cost</th><th>Message</th><th>After</th></tr></thead><tbody>${cases}</tbody></table></details>`;
    return `<section id="${attribute(block.id)}">${body}${block.id === "before" || block.id === "after" ? endpoint(block.id) : block.id === "transition" ? inspection : ""}</section>`;
  }).join("\n");
  return Object.freeze({ article, pin, html: `<article data-code-reasoning data-code-source-pin="${attribute(pin)}">${html}</article>` });
}
