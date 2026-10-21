import { example, columnExampleFromProduct, numberOf } from "./model.ts";
import { MatrixColumnGap } from "../matrix-column-product/environment.ts";
import { stageHtml, calculationLatex } from "./presentation.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";
import { matrixSources, loadMatrixSource } from "../../../content/authoring/convergence/matrix-sources.ts";

// Resolve and render text before replacing the live player. A failed source load
// must not tear down the currently usable explanation.
export async function loadColumnPage(url: URL) {
  const query = url.searchParams;
  const column = Number(query.get("column") ?? "0");
  const basisMode = query.get('basis') ?? 'adapted';
  if (query.get('example') === 'composition' && basisMode !== 'adapted' && basisMode !== 'standard') {
    const { BasisCompositionGap } = await import('./basis-composition.ts');
    throw new BasisCompositionGap('Choose the adapted or standard intermediate basis.');
  }
  const composition = query.get("example") === "composition"
    ? (await import('./basis-composition.ts')).basisComposition(query.get('basis') === 'standard' ? 'standard' : 'adapted', column)
    : undefined;
  const input = query.get("input");
  if (input && query.has("example")) throw new MatrixColumnGap("Choose either a source input or a named interpretation.");
  const authored = input ? await loadMatrixSource(input) : undefined;
  const scene = authored ? columnExampleFromProduct(authored.product, column, authored.reading) : composition?.scene ?? example(query.get("example") ?? "columns", column);
  const { beats } = scene;
  const introduction = scene.reading?.introduction ?? (composition ? "The same two maps have different matrices in different bases. Their composition is unchanged when the coordinates at the join agree." : scene.evidence ? "Each entry of QᵀQ is a dot product between two columns of Q. Diagonal entries measure squared length; off-diagonal entries measure orthogonality." : "Each column of the right matrix tells us how to combine the columns of the left matrix.");
  const links = ["columns", "identity", "orthonormality"].map((kind, i) => `<a href="?example=${kind}&column=0#weights">${["Column combinations", "Identity", "Orthonormality"][i]}</a>`).join(" · ");
  const contextHtml = composition ? (await import('./basis-composition-view.ts')).basisCompositionHtml(composition) : '';
  const basisQuery = composition ? `&basis=${composition.mode}` : '';
  const html = `<nav aria-label="Matrix examples">${links}</nav>
    <nav aria-label="Matrix source inputs">Inputs: <a href="?column=${column}">Original</a> · ${matrixSources.map(({ id, title }) => `<a href="?input=${encodeURIComponent(id)}&column=${column}">${escape(title)}</a>`).join(" · ")}</nav>
    ${contextHtml}
    <p data-column-navigation>Result column: <a href="?${input ? `input=${encodeURIComponent(input)}` : `example=${scene.kind}${basisQuery}`}&column=0#weights">1</a> · <a href="?${input ? `input=${encodeURIComponent(input)}` : `example=${scene.kind}${basisQuery}`}&column=1#weights">2</a></p>
    <section class="matrix-card kp-focus-deck" aria-label="Column combination animation">
    <div class="matrix-cue" data-cue aria-live="polite"></div>
    <div class="matrix-scroll" tabindex="0" role="region" aria-label="Column combination; scroll horizontally on narrow screens">${stageHtml(scene)}</div>
    <div class="matrix-controls"><button data-back aria-label="Previous milestone">Previous</button><button data-play>Play</button><button data-next aria-label="Next milestone">Next</button>
    <input data-scrub type="range" min="0" max="1" step="0.0001" value="0" aria-label="Animation position">
    <select aria-label="Milestone">${beats.map((beat, i) => `<option value="${i}">${i + 1}. ${beat.id}</option>`).join("")}</select></div></section>
    <p class="matrix-help">Follow the columns, then watch each scalar reach every entry. Use the scrubber to revisit any moment. On narrow screens, scroll the stage horizontally.</p>
    ${scene.reading ? `<section aria-label="What the comparison shows">${scene.reading.conclusion.map(text => `<p>${escape(text)}</p>`).join("")}
      <p>${escape(scene.reading.question.prompt)}</p><details><summary>Check your reasoning</summary><p>${escape(scene.reading.question.answer)}</p></details></section>` : ""}
    <details><summary>Read the calculation</summary><div class="comb-static">${renderLatexToHtml(calculationLatex(scene), { output: "htmlAndMathml" })}</div>
    <p>The copied columns and weights refer to the original entries of the two factors. Multiplication produces derived entries; addition produces the result column. The columns of the left matrix do not need to form a basis.</p></details>
    ${scene.evidence ? `<section aria-label="Column dot products"><h2>Why the result is the identity</h2>
      <p>The columns of Q are (0.6, 0.8) and (−0.8, 0.6). Each has squared length 1, and their dot product is 0.</p>
      ${scene.evidence.gram.cells.map(cell => `<p>${renderLatexToHtml(`q_${cell.rowIndex + 1} \\cdot q_${cell.columnIndex + 1} = ${cell.dot.pairs.map(pair => `(${numberOf(pair.left)})(${numberOf(pair.right)})`).join("+")} = ${numberOf(cell.result)}`, { output: "htmlAndMathml" })}</p>`).join("")}
      <p>Numerical check for this Q: ${scene.evidence.status}; tolerance ${scene.evidence.tolerance}. This checks the displayed example, not a symbolic proof for arbitrary matrices.</p></section>` : ""}
    <p><a href="/experiments/matrix-column-product/">Compare the row–column dot-product view</a></p>`;
  return { scene, introduction, html };
}
