import katex from 'katex';
import { expressionToLatex } from '../../math/expression.ts';
import { polynomials, sampleAccumulation, formatReadout, readoutSpecs, exactText, type AccumulationPolynomial, type Readout } from '../../math/authoring/polynomial-accumulation.ts';
import { renderAccumulationGraphs } from './graph.ts';
import { renderKpFocusDeckAnnotation } from '../../tutorial/focus-deck-annotation.ts';

const math = (latex: string) => katex.renderToString(latex, { throwOnError: true, output: 'htmlAndMathml' });
const definition = (model: AccumulationPolynomial) => `<span>${math('f(t)=' + expressionToLatex(model.f).replaceAll('x', 't'))}</span><span>${math('F(t)=' + expressionToLatex(model.F).replaceAll('x', 't'))}</span>`;
export function renderAccumulationReference() {
  const model = polynomials[0]!, frame = sampleAccumulation(model, -200, 200, 1), graphs = renderAccumulationGraphs(model, frame);
  const number = (id: Readout, value: number) => `<span data-number="${id}" style="--digits:${readoutSpecs[id].columns}">${formatReadout(id, value)}</span>`;
  const ticks = `<div class="ticks">${[-3, -2, -1, 0, 1, 2, 3].map((value, i) => `<span data-tick="${value}" style="left:${i / 6 * 100}%">${String(value).replace('-', '−')}</span>`).join('')}</div>`;
  return `<!doctype html>
<html lang="en" data-kp-theme="light"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>How can area cancel? · Kinetic Press</title><link rel="stylesheet" href="/src/experiments/polynomial-accumulation/style.css"></head>
<body><main id="polynomial-accumulation">
<h1>How can area cancel?</h1>
<p>As you move right, regions above the axis add to the integral; regions below subtract. Geometric area counts both positively.</p>
<div class="tools"><button data-theme type="button">Dark theme</button><a href="/experiments/circle-trig/">Circle reference</a></div>
<div class="controls" aria-label="Polynomial and interval">
<label>Function <select data-case disabled>${polynomials.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}</select></label>
<label>Start a <input data-a aria-label="Starting bound" inputmode="decimal" maxlength="12" value="-2" disabled></label>
<label>End b <input data-b aria-label="Ending bound" inputmode="decimal" maxlength="12" value="2" disabled></label>
<button data-swap disabled>Reverse bounds</button></div>
<p data-diagnostic role="status"></p>
<div class="definitions" data-definition>${definition(model)}</div>
<p class="instruction kp-annotation-plane">${renderKpFocusDeckAnnotation({ entityId: 'accumulation.endpoint', text: 'Follow the moving endpoint: the shaded contributions become the total in the second graph.' })}</p>
<div class="figures">
<section><h2>The contributions · f(t)</h2><figure data-function>${graphs.f}</figure>${ticks}<p class="key"><span class="above">Solid: above the axis</span><span class="below">Hatched: below the axis</span></p></section>
<section><h2>The running total · A(x)</h2><figure data-total>${graphs.A}</figure>${ticks}<p>${math('A(x)=\\int_a^x f(t)\\,dt')}<br>${math('=F(x)-F(a)')}</p></section>
</div>
<div class="playback"><button data-play disabled>Play</button><button data-start disabled>Start</button><button data-end disabled>End</button>
<input data-progress aria-label="Accumulation progress" type="range" min="0" max="1" step="0.001" value="1" disabled></div>
<p class="direction" data-direction>Moving right: above adds; below subtracts.</p>
<div class="readouts" aria-label="Approximate values"><span>x = ${number('x', frame.x / 100)}</span><span>f(x) ≈ ${number('value', frame.value)}</span><span>Signed total ≈ ${number('total', frame.total)}</span><span>Geometric area ≈ ${number('area', frame.area)}</span></div>
<p class="axis-note">Both horizontal axes run from −3 to 3. Each graph keeps its vertical scale fixed while you sweep. The dashed line marks the start a; the solid line and dot mark x.</p>
<p>A thin strip contributes its height times its width, with a negative height below the axis. An antiderivative F has derivative f, so the accumulated total from a to x is F(x) − F(a). The running total starts at zero at a; its slope at x is f(x).</p>
<p>Reversing the bounds negates the signed integral. It leaves the same geometric region, so geometric area does not change. When moving left, above-axis contributions subtract and below-axis contributions add.</p>
<details data-exact-panel><summary>Inspect the exact totals</summary><p>Bounds and the moving endpoint use hundredths. The power rule gives exact rational totals; plotted curves and displayed decimals are approximations.</p>
<dl><dt>Signed integral</dt><dd data-exact="signed">${exactText(frame.signed)}</dd><dt>Geometric area</dt><dd data-exact="geometric">${exactText(frame.geometric)}</dd></dl></details>
<details><summary>Predict a cancellation</summary><p>Choose f(t) = t, start at −2 and end at 2. Why is the signed total zero while the geometric area is 4?</p><p>The equal triangles contribute −2 and +2 to the integral, so they cancel. Their geometric areas add to 4. Reversing these bounds still gives zero; try unequal bounds to see a nonzero total change sign.</p></details>
<noscript><p>The complete figure shows f(t) = t² − 1 from −2 to 2. Controls need JavaScript; the explanation and exact totals remain readable.</p></noscript>
${polynomials.map(p => `<template data-definition-case="${p.id}">${definition(p)}</template>`).join('')}
</main><script type="module" src="/src/experiments/polynomial-accumulation/app.ts"></script></body></html>\n`;
}
