import { createKpArticleSource } from "../../article/kp-article-source.ts";
import { resolveKpArticleImports } from "../../article/kp-article-import-lock.ts";
import { compileKpArticleDocument } from "../../article/kp-article-document.ts";
import { compileKpArticleMarkdownFragmentHtml as html } from "../../article/kp-article-static-html.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";
import { compileFractionChain } from "../../authoring/fraction-chain-compilation.ts";
import { checkFractionChainHostEligibility } from "../../authoring/fraction-chain-host-eligibility.ts";

export function compileFractionChainPublication(markdown: string, input: unknown) {
  const result = compileFractionChain(input);
  if (result.status !== "compiled") throw new Error(`${result.code}: ${result.expected}`);
  const { source, revision } = result.compilation;
  const eligibility = checkFractionChainHostEligibility(result.compilation);
  if (eligibility.status !== "eligible") throw new Error(`${eligibility.code} ${eligibility.path}: ${eligibility.expected}`);
  const end = source.states.length - 1;
  const articleSource = createKpArticleSource("examples/algebra/fraction-chain.article.md", markdown);
  const { lock } = resolveKpArticleImports(articleSource, []);
  const article = compileKpArticleDocument({ source: articleSource, registry: [], lock });
  const math = (latex: string) => renderLatexToHtml(latex, { displayMode: true });
  const pair = source.states[1]!.expression;
  if (pair.kind !== "pair") throw new Error("The canonical fraction passage requires its aligned pair.");
  const intermediate = `\\frac{${pair.terms[0].numerator}${pair.operator}${pair.terms[1].numerator}}{${pair.terms[0].denominator}}`;
  const row = (position: number, latex: string, prose: string, detail = false) => `<li data-fraction-row data-position="${position}"${detail ? ' data-fraction-detail data-nested-step data-nested-first="true" data-nested-last="true" hidden' : ''}>
    <div class="energy-derivation-equation">${math(latex)}</div><div class="fraction-reason energy-derivation-reason"><div class="energy-derivation-interleave-text">${html(prose)}${position === 1
      ? `<details data-fraction-static-detail><summary>Smaller combination steps</summary>${math(intermediate)}<p>Gather the numerators over one denominator, then evaluate their ordered combination.</p></details><div class="energy-derivation-actions"><button type="button" data-fraction-disclosure aria-expanded="false" hidden>Inspect smaller steps</button></div>` : ""}</div></div></li>`;
  const rows = source.states.map((state, index) => row(index, state.latex, source.moves[index]?.prose ?? "The same quantity is now written as a single fraction.") +
    (index === 1 ? row(1.5, intermediate, "Both counts now share one denominator. Combine only the numerator terms, preserving their operator.", true) : "")).join("");
  const passage = `<div class="energy-derivation fraction-passage" data-fraction-passage data-source-revision="${revision}" data-rail-refinement="true" data-inset-fenceposts="true">
    <p data-fraction-status role="status" hidden>Preparing inspection…</p>
    <p class="energy-derivation-key" data-fraction-help hidden>Click the rail to jump; drag the handle to inspect. Use arrow keys to move between equations.</p>
    <div class="fraction-history"><ol class="energy-derivation-history">${rows}</ol>
      <div class="energy-derivation-rail" data-fraction-rail hidden>${source.states.map((_, i) => `<span data-position="${i}"></span>`).join("")}<span data-position="1.5" data-fraction-detail hidden></span></div>
      <div class="fraction-inspection" data-fraction-inspection aria-hidden="true">
        ${["alignment", "merge", "evaluation", ...(end === 3 ? ["reduction"] : [])].map(kind => `<div class="fraction-stage" data-fraction-stage="${kind}" data-distribution-stage></div>`).join("")}
      </div>
      <div class="energy-derivation-scope" data-fraction-scope hidden><button type="button" data-derivation-handle role="slider" aria-label="Fraction derivation" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="${end}" aria-valuenow="0"><span aria-hidden="true"></span></button></div>
    </div><div class="energy-derivation-actions" data-fraction-navigation hidden><button type="button" data-fraction-back>Previous</button><button type="button" data-fraction-next>Next</button></div>
  </div>`;
  let found = false;
  const body = article.document.blocks.map(block => {
    if (block.kind === "markdown") return html(block.markdown);
    if (block.kind !== "passage" || block.id !== "counting-parts" || found) throw new Error("Fraction Article requires one counting-parts passage and prose only.");
    found = true; return `<section id="counting-parts">${html(block.markdown)}${passage}</section>`;
  }).join("\n");
  if (!found) throw new Error("Missing fraction passage.");
  // The published and interactive views consume the same bytes; escaping '<'
  // prevents source prose from terminating this inert JSON script element.
  return `<article data-kp-article="${escape(article.document.id)}">${body}</article><script type="application/json" id="fraction-chain-source">${JSON.stringify(input).replaceAll("<", "\\u003c")}</script>`;
}
