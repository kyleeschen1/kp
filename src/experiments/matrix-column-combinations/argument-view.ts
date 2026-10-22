import type { MatrixArgument } from "./argument.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";

export function argumentHtml(source: MatrixArgument) {
  return source.sections.map(section => `<section id="${escape(section.id)}" data-argument-section>
    <h2>${escape(section.title)}</h2>
    ${section.blocks.map(block => {
      switch (block.kind) {
        case "text": return `<p>${escape(block.text)}</p>`;
        case "math": return `<div class="kp-article-math">${renderLatexToHtml(block.latex, { output: "htmlAndMathml", displayMode: true })}</div>`;
        case "question": return `<p>${escape(block.prompt)}</p><details><summary>Check your reasoning</summary><p>${escape(block.answer)}</p></details>`;
        case "inspect": {
          const { id, label } = block.inspection;
          return `<div class="argument-inspection">
            <div class="energy-derivation-actions"><button data-inspect="${escape(id)}" aria-expanded="false" aria-controls="inspection-${escape(id)}">${escape(label)}</button></div>
            <div id="inspection-${escape(id)}" data-inspection="${escape(id)}" role="region" aria-label="${escape(label)}" hidden></div>
          </div>`;
        }
      }
    }).join("")}
  </section>`).join("");
}
