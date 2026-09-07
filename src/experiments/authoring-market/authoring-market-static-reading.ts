import { compileKpArticleStaticHtml, compileKpArticleMarkdownFragmentHtml } from "../../article/kp-article-static-html.ts";
import { prepareKpAuthoredMarketSource } from "../../tutorial/authoring-market/authoring-market-prepare.ts";
import { renderKpAuthoringMarketStaticFacts } from "../../tutorial/authoring-market/authoring-market-facts.ts";
import type { KpAuthoredMarketSourceData, KpAuthoredMarketArticleProjection } from "../../tutorial/authoring-market/authoring-market-source-data.ts";
import { compileKpEquationSeriesLogarithmBaseDraft } from "../../authoring/equation-series-logarithm-base-draft.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

export function compileKpAuthoringMarketStaticReading(input: {
  readonly data: KpAuthoredMarketSourceData;
  readonly article: KpAuthoredMarketArticleProjection;
}) {
  const prepared = prepareKpAuthoredMarketSource(input.data, input.article);
  // The imported vignette's fixed baseline SVG is not authority for variants.
  // This explicit reading-only projection keeps links and prose, not that image.
  const readingDocument = { ...input.article.document,
    blocks: input.article.document.blocks.map(block => {
      if (block.kind === "motion") throw Object.assign(new Error("This bounded reading projection does not publish motion checkpoints."), {
        code: "kp.authoring.market-static-gap", path: "article.blocks"
      });
      if (block.kind !== "stage") return block;
      const anchors = [block.id, ...input.article.document.references
        .filter(reference => reference.stageId === block.id).map(reference => reference.staticFragment)];
      return { kind: "markdown" as const, key: `reading.${block.id}`, referenceIds: [],
        markdown: `${[...new Set(anchors)].map(id => `<a id="${escape(id)}"></a>`).join("\n")}\n\nStatic reading: exact market facts follow below; graphical motion is not included.` };
    })
  };
  const reading = compileKpArticleStaticHtml(readingDocument);
  if (reading.assets.length !== 0) throw new Error("Reading-only publication cannot silently acquire graphical assets.");
  return Object.freeze({ mode: "text-and-exact-facts" as const,
    html: `${reading.articleHtml}\n${renderKpAuthoringMarketStaticFacts(prepared.facts)}` });
}

export function compileKpAuthoringEquationStaticReading(value: unknown) {
  const result = compileKpEquationSeriesLogarithmBaseDraft(value);
  if (result.status !== "compiled" || result.active === undefined) {
    throw Object.assign(new Error("Repair the equation draft before publishing its reading output."), {
      code: "kp.authoring.equation-static-gap", repairs: result.repairs
    });
  }
  const states = result.active.request.states.map(state => {
    const math = renderLatexToHtml(state.latex, { output: "htmlAndMathml", trust: false });
    if (math.includes('class="katex-error"')) throw new Error("Equation static math failed to render.");
    return `<li>${state.narration === undefined ? "" : compileKpArticleMarkdownFragmentHtml(state.narration)}${math}</li>`;
  });
  return `<section data-kp-authoring-equation-static><h2>Change logarithm base</h2><p>For a positive base other than one and a positive argument, changing the base preserves the logarithm's value.</p><ol>${states.join("\n")}</ol></section>`;
}

function escape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
