import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { encodeKpHtmlText as escape } from "../../rendering/html-output-encoding.ts";
import { renderKpFocusDeckScaffold } from "../focus-deck-scaffold.ts";
import { renderKpFocusDeckAnnotation } from "../focus-deck-annotation.ts";
import { formatChangeNumber, type ChangeModel, type ChangeSample } from "./model.ts";

const math = (latex: string) => renderLatexToHtml(latex, { displayMode: false, output: "htmlAndMathml" });
const annotation = (id: string, text: string, role: "label" | "support" | "meta" = "support") => renderKpFocusDeckAnnotation({ entityId: id, text, role });
export const changeReadouts = ["x", "h", "u", "y", "deltaU", "deltaY", "du", "dy", "firstScale", "secondScale", "derivative", "error", "errorPerH"] as const;
function number(key: typeof changeReadouts[number], sample: ChangeSample) {
  return `<output aria-live="off" data-change-value="${key}">${formatChangeNumber(sample[key])}</output>`;
}

export function renderChangeCard(model: ChangeModel): string {
  const { source, latex } = model, sample = model.sample(source.x, source.h), scales = model.scales(source.x);
  const stages = [
    { id: "input", title: "Input", formula: "x", value: "x", gain: "h=\\Delta x", gainKey: "h", exact: source.h, linear: source.h, exactKey: "h", linearKey: "h", exactLabel: "h", linearLabel: "h" },
    { id: "inner", title: "First transformation", formula: `u=f(x)=${latex.inner}`, value: "u", gain: `f'(x)=${latex.innerDerivative}`, gainKey: "firstScale", exact: sample.deltaU, linear: sample.du, exactKey: "deltaU", linearKey: "du", exactLabel: "\\Delta u", linearLabel: "du" },
    { id: "outer", title: "Second transformation", formula: `y=g(u)=${latex.outer}`, value: "y", gain: `g'(u)=${latex.outerDerivative}`, gainKey: "secondScale", exact: sample.deltaY, linear: sample.dy, exactKey: "deltaY", linearKey: "dy", exactLabel: "\\Delta y", linearLabel: "dy" }
  ] as const;
  const stageHtml = `<div class="change-stage" data-change-stage>
    <div class="change-flow">${stages.map((s, i) => `<section class="change-node" data-change-entity="${s.id}" aria-label="${s.title}">
      ${annotation(s.id, s.title, "meta")}<div class="change-formula">${math(s.formula)}</div>
      <div class="change-base">${annotation(`${s.id}.base`, "Starting value", "meta")}${number(s.value, sample)}</div>
      <div class="change-gain">${math(s.gain)}<span>${number(s.gainKey, sample)}</span></div>
      <svg class="change-meter" viewBox="0 0 240 82" role="img" aria-label="${s.title}: actual and predicted change" data-change-meter="${i}">
        <title>${s.title}: filled marker is actual change, ring is linear prediction</title>
        <path class="change-axis" d="M 20 39 H 220 M 120 9 V 70"/>
        <line class="change-actual-line" x1="120" y1="26" x2="${120 + 95 * s.exact / scales[i]!}" y2="26"/>
        <line class="change-prediction-line" x1="120" y1="53" x2="${120 + 95 * s.linear / scales[i]!}" y2="53"/>
        <circle class="change-actual" r="5" cx="${120 + 95 * s.exact / scales[i]!}" cy="26"/>
        <circle class="change-prediction" r="6" cx="${120 + 95 * s.linear / scales[i]!}" cy="53"/>
      </svg>
      <div class="change-axis-labels">${annotation(`${s.id}.negative`, `−${scales[i]!.toFixed(2)}`, "meta")}${annotation(`${s.id}.zero`, "0", "meta")}${annotation(`${s.id}.positive`, `+${scales[i]!.toFixed(2)}`, "meta")}</div>
      <div class="change-reading actual">${math(s.exactLabel)} ${number(s.exactKey, sample)}</div>
      <div class="change-reading prediction">${math(s.linearLabel)} ${number(s.linearKey, sample)}</div>
    </section>`).join("")}</div>
    <div class="change-rule" data-change-entity="compose">
      <div>${math("\\frac{dy}{dx}=g'(f(x))\\,f'(x)")}</div>
      <div class="change-product">${number("secondScale", sample)} ${math("\\cdot")} ${number("firstScale", sample)} ${math("\\approx")} ${number("derivative", sample)}</div>
      <div>${math("du=f'(x)h,\\qquad dy=g'(u)du")}</div>
    </div>
    <div class="change-error" data-change-entity="limit">
      <span>${math("\\Delta y-dy")} ${number("error", sample)}</span>
      <span>${math("(\\Delta y-dy)/h")} ${number("errorPerH", sample)}</span>
    </div>
    <p class="change-legend">${annotation("legend", "● Actual finite change · ○ Linear prediction. Each column has its own scale; scales stay fixed as h changes.", "meta")}</p>
    <div class="change-controls" data-change-controls hidden>
      <label>Base point <span>${math("x")}</span><input data-change-x type="range" min="-2" max="2" step="0.01" value="${source.x}" aria-label="Base point x"></label>
      <label>Trial input change <span>${math("h")}</span><input data-change-h type="range" min="-0.5" max="0.5" step="0.001" value="${source.h}" aria-label="Trial input change h"></label>
      <button type="button" data-change-zero>Try x = 0</button><button type="button" data-change-reset>Reset example</button>
    </div>
  </div>`;
  return renderKpFocusDeckScaffold({ id: "change-propagation", ariaLabel: source.title, activeBeatSlug: "input", stageHtml,
    rootAttributes: { "data-kp-focus-deck-static": "true" },
    classAliases: { root: "change-card" }, headerTrailingHtml: "<span>Change · composition</span>",
    beats: source.steps.map(step => ({ slug: step.id, title: step.title, html: `<h2>${escape(step.title)}</h2><p>${escape(step.text)}</p>` })) });
}

export function renderChangePublication(model: ChangeModel, bytes: string, mode: "editor" | "reader" = "editor"): string {
  return `<header class="change-intro"><p>Kinetic Press · Calculus</p><h1>${escape(model.source.title)}</h1><p>What does the chain rule predict—and what does it leave out?</p></header>
    <div data-change-host>${renderChangeCard(model)}</div>
    <details class="change-reading-source"><summary>Read the mathematics without animation</summary>
      <p>For ${math(`u=f(x)=${model.latex.inner}`)} and ${math(`y=g(u)=${model.latex.outer}`)}, the finite changes are defined by</p>
      <p>${math("\\Delta u=f(x+h)-f(x),\\qquad \\Delta y=g(f(x+h))-g(f(x)).")}</p>
      <p>The local linear predictions are ${math("du=f'(x)h")} and ${math("dy=g'(f(x))f'(x)h")}. The derivative is exact; the prediction of a finite change generally is not.</p>
      <p>These supported functions are differentiable everywhere. Differentiability gives ${math("\\Delta u=f'(x)h+o(h)")} and ${math("\\Delta y=g'(u)\\Delta u+o(\\Delta u)")}. Since ${math("\\Delta u=O(h)")}, substitution gives ${math("\\Delta y=g'(u)f'(x)h+o(h)")}, including when ${math("f'(x)=0")}.</p>
      <p>Readouts are rounded floating-point evaluations. “Actual” identifies the finite-difference definition, not exact numerical arithmetic. The ratio is undefined at h = 0 and is shown as a dash. Displayed zero may mean smaller than the shown precision.</p>
    </details>
    ${mode === "editor" ? `<details class="change-author" data-change-author hidden><summary>Edit the functions and explanation</summary>
      <p>This local preview accepts sums, explicit products such as 2*x, integer coefficients up to 10, integer powers 0–4, sin and cos. The first function binds x; the second binds u. Edit the five passages too: prose is author-supplied and is not checked for mathematical truth.</p>
      <label for="change-source">Explanation source</label><textarea id="change-source" spellcheck="false">${escape(bytes)}</textarea>
      <button type="button" data-change-apply>Preview this source</button><button type="button" data-change-download>Download current source</button>
      <p data-change-diagnostic role="status">Edits stay in this browser tab until downloaded. A rejected draft leaves the last valid card intact.</p>
    </details>` : `<p data-change-diagnostic role="status"></p>`}<script id="change-source-bytes" type="application/json">${JSON.stringify(bytes).replaceAll("<", "\\u003c")}</script>`;
}
