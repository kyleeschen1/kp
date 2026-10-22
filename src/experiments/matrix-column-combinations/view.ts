import { type ColumnExample, numberOf } from "./model.ts";
import { stageHtml, calculationLatex } from "./presentation.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";

/** Both hosts use the accepted controls and native presentation. Host navigation
 * is separate from the mathematical scene and its authored reading. */
export function columnPageHtml(scene: ColumnExample, options: { selection: string; navigation?: string; context?: string; comparison?: boolean; hash?: string }) {
  const selection = options.selection ? `${options.selection}&` : "";
  const hash = escape(options.hash ?? "#weights");
  const html = `${options.navigation ?? ""}
    ${options.context ?? ""}
    <p data-column-navigation>Result column: <a href="?${selection}column=0${hash}">1</a> · <a href="?${selection}column=1${hash}">2</a></p>
    ${columnCardHtml(scene)}
    <p class="matrix-help">Follow the columns, then watch each scalar reach every entry. Use the scrubber to revisit any moment. On narrow screens, scroll the stage horizontally.</p>
    ${scene.reading ? `<section aria-label="What the comparison shows">${scene.reading.conclusion.map(text => `<p>${escape(text)}</p>`).join("")}
      <p>${escape(scene.reading.question.prompt)}</p><details><summary>Check your reasoning</summary><p>${escape(scene.reading.question.answer)}</p></details></section>` : ""}
    <details><summary>Read the calculation</summary><div class="comb-static">${renderLatexToHtml(calculationLatex(scene), { output: "htmlAndMathml" })}</div>
    <p>The copied columns and weights refer to the original entries of the two factors. Multiplication produces derived entries; addition produces the result column. The columns of the left matrix do not need to form a basis.</p></details>
    ${scene.evidence ? `<section aria-label="Column dot products"><h2>Why the result is the identity</h2>
      <p>The columns of Q are (0.6, 0.8) and (−0.8, 0.6). Each has squared length 1, and their dot product is 0.</p>
      ${scene.evidence.gram.cells.map(cell => `<p>${renderLatexToHtml(`q_${cell.rowIndex + 1} \\cdot q_${cell.columnIndex + 1} = ${cell.dot.pairs.map(pair => `(${numberOf(pair.left)})(${numberOf(pair.right)})`).join("+")} = ${numberOf(cell.result)}`, { output: "htmlAndMathml" })}</p>`).join("")}
      <p>Numerical check for this Q: ${scene.evidence.status}; tolerance ${scene.evidence.tolerance}. This checks the displayed example, not a symbolic proof for arbitrary matrices.</p></section>` : ""}
    ${options.comparison ? `<p><a href="/experiments/matrix-column-product/">Compare the row–column dot-product view</a></p>` : ""}`;
  return html;
}

/** The same native card can be inspected inside a reading or a standalone page. */
export function columnCardHtml(scene: ColumnExample) {
  const { beats } = scene;
  return `    <section class="matrix-card kp-focus-deck" aria-label="Column combination animation">
    <div class="matrix-cue" data-cue aria-live="polite"></div>
    <div class="matrix-scroll" tabindex="0" role="region" aria-label="Column combination; scroll horizontally on narrow screens">${stageHtml(scene)}</div>
    <div class="matrix-controls"><button data-back aria-label="Previous milestone">Previous</button><button data-play>Play</button><button data-next aria-label="Next milestone">Next</button>
    <input data-scrub type="range" min="0" max="1" step="0.0001" value="0" aria-label="Animation position">
    <select aria-label="Milestone">${beats.map((beat, i) => `<option value="${i}">${i + 1}. ${beat.id}</option>`).join("")}</select></div></section>`;
}
