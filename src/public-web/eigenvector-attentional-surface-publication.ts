import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import {
  escapeKpTutorialHtmlAttribute,
  escapeKpTutorialHtmlText
} from "../tutorial/generated-html-escaping.ts";
import {
  renderKpEigenvectorEquationBankHtml,
  renderKpEigenvectorSettledEndpointHtml
} from "../tutorial/eigenvector-attentional-surface/eigenvector-settled-html.ts";
import { kpEigenvectorPrediction } from
  "../tutorial/eigenvector-attentional-surface/eigenvector-prediction.ts";
import {
  kpEigenvectorScalarControl
} from "../tutorial/eigenvector-attentional-surface/eigenvector-manipulation.ts";
import {
  kpEigenvectorTranscript,
  type KpEigenvectorPassage
} from "../tutorial/eigenvector-attentional-surface/eigenvector-transcript.ts";
import { renderKpEigenvectorTransportHtml } from
  "../tutorial/eigenvector-attentional-surface/eigenvector-transport.ts";

export const kpEigenvectorPublicPath = "/learn/math/eigenvectors/" as const;

export function renderKpEigenvectorPublicLesson(): string {
  return `<div class="kp-eigenvector-public" data-kp-eigenvector-public data-kp-theme="dark">
    <header class="kp-eigenvector-public__masthead">
      <a href="/" class="kp-eigenvector-public__wordmark">Kinetic Press</a>
      <span>One way of seeing · Eigenvectors</span>
    </header>
    <main>
      <header class="kp-eigenvector-public__intro">
        <p>Three-minute conceptual experience</p>
        <h1>A direction that survives</h1>
        <p>Read normally. When a passage crosses the quiet line, your scroll carries the diagram into its next settled thought.</p>
      </header>
      <section class="kp-eigenvector-experience" data-kp-eigenvector-experience aria-label="Eigenvector explanation">
        <div class="kp-eigenvector-experience__stage-column">
          <div class="kp-eigenvector-experience__stage-host" data-kp-eigenvector-stage-host>
            ${renderKpEigenvectorSettledEndpointHtml("most-vectors-turn")}
            ${renderKpEigenvectorEquationBankHtml()}
          </div>
        </div>
        <div class="kp-eigenvector-experience__passages" data-kp-eigenvector-passages>
          <div class="kp-eigenvector-experience__reading-line" data-kp-eigenvector-reading-line aria-hidden="true"></div>
          ${kpEigenvectorTranscript.map(renderPassage).join("\n")}
        </div>
      </section>
      <section class="kp-eigenvector-public__afterword">
        <h2>What to keep</h2>
        <p>An eigenvector is not merely an arrow that happens to look stable. It is a nonzero vector whose direction a linear transformation preserves; its eigenvalue records the scale along that direction.</p>
      </section>
    </main>
    <div data-kp-eigenvector-transport-host>${renderKpEigenvectorTransportHtml("most-vectors-turn")}</div>
    <p class="kp-eigenvector-public__announcer" data-kp-eigenvector-announcer aria-live="polite"></p>
  </div>`;
}

function renderPassage(
  passage: KpEigenvectorPassage,
  index: number
): string {
  const active = index === 0;
  return `<article class="kp-eigenvector-passage${active ? " is-active" : ""}" id="${escapeKpTutorialHtmlAttribute(passage.beatId)}" data-kp-eigenvector-passage="${escapeKpTutorialHtmlAttribute(passage.beatId)}"${active ? ' aria-current="step"' : ""}>
    <span class="kp-eigenvector-passage__marker" aria-hidden="true"></span>
    <div>
      <h2>${escapeKpTutorialHtmlText(passage.heading)}</h2>
      <p>${renderPassageText(passage.text)}</p>
      ${passage.beatId === "predict-a-multiple" ? renderPrediction() : ""}
      ${passage.beatId === "reveal-the-eigenspace" ? renderScalarControl() : ""}
    </div>
  </article>`;
}

function renderPrediction(): string {
  return `<fieldset class="kp-eigenvector-prediction" data-kp-eigenvector-prediction>
    <legend>Choose before the diagram answers.</legend>
    <div>${kpEigenvectorPrediction.choices.map((choice) =>
      `<button type="button" data-kp-eigenvector-prediction-choice="${choice.id}">${escapeKpTutorialHtmlText(choice.label)}</button>`
    ).join("")}</div>
    <p data-kp-eigenvector-prediction-feedback aria-live="polite"></p>
  </fieldset>`;
}

function renderScalarControl(): string {
  return `<div class="kp-eigenvector-scalar" data-kp-eigenvector-scalar>
    <label for="kp-eigenvector-coefficient">Move along the line: <span data-kp-eigenvector-coefficient-output>1</span>v</label>
    <input id="kp-eigenvector-coefficient" type="range" min="${kpEigenvectorScalarControl.minimum}" max="${kpEigenvectorScalarControl.maximum}" step="${kpEigenvectorScalarControl.step}" value="${kpEigenvectorScalarControl.initial}" data-kp-eigenvector-scalar-input>
    <p data-kp-eigenvector-scalar-feedback>${escapeKpTutorialHtmlText("Every nonzero multiple stays on this line and is an eigenvector.")}</p>
  </div>`;
}

const mathFragments = [
  ["A(2v) = 2Av = 6v", String.raw`A(2\mathbf{v})=2A\mathbf{v}=6\mathbf{v}`],
  ["Av = λv", String.raw`A\mathbf{v}=\lambda\mathbf{v}`],
  ["Av = 3v", String.raw`A\mathbf{v}=3\mathbf{v}`],
  ["2v", String.raw`2\mathbf{v}`],
  ["3v", String.raw`3\mathbf{v}`],
  ["span(v)", String.raw`\operatorname{span}(\mathbf{v})`],
  ["λ", String.raw`\lambda`]
] as const;

function renderPassageText(text: string): string {
  let cursor = 0;
  const output: string[] = [];
  while (cursor < text.length) {
    const matches = mathFragments.flatMap(([plain, latex]) => {
      const index = text.indexOf(plain, cursor);
      return index < 0 ? [] : [{ plain, latex, index }];
    }).sort((left, right) => left.index - right.index ||
      right.plain.length - left.plain.length);
    const next = matches[0];
    if (next === undefined) {
      output.push(escapeKpTutorialHtmlText(text.slice(cursor)));
      break;
    }
    output.push(escapeKpTutorialHtmlText(text.slice(cursor, next.index)));
    output.push(`<span class="kp-eigenvector-inline-math" data-kp-latex="${escapeKpTutorialHtmlAttribute(next.latex)}">${renderLatexToHtml(next.latex, {
      displayMode: false,
      output: "htmlAndMathml"
    })}</span>`);
    cursor = next.index + next.plain.length;
  }
  return output.join("");
}
