import katex from 'katex';
import { sampleCircle, formatReadout, readoutSpecs, type Readout } from './model.ts';
import { renderCircleGraphs } from './graph.ts';
import { renderKpFocusDeckAnnotation } from '../../tutorial/focus-deck-annotation.ts';

export function renderCircleReference() {
  const frame = sampleCircle(45), graphs = renderCircleGraphs(frame);
  const math = (latex: string) => katex.renderToString(latex, { throwOnError: true, output: 'htmlAndMathml' });
  const number = (id: Readout) => `<span data-number="${id}" style="--digits:${readoutSpecs[id].columns}">${formatReadout(id, frame[id])}</span>`;
  return `<!doctype html>
<html lang="en" data-kp-theme="light"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Where do sine and cosine come from? · Kinetic Press</title>
<link rel="stylesheet" href="/src/experiments/circle-trig/style.css"></head>
<body><main id="circle-trig">
<h1>Where do sine and cosine come from?</h1>
<p>Turn a radius around a circle of radius 1. The point’s horizontal coordinate is cosine; its vertical coordinate is sine.</p>
<div class="tools"><button type="button" data-theme>Dark theme</button><a href="/experiments/composition-area/">Composition reference</a></div>
<div class="controls" aria-label="Angle controls">
<label>Angle <input data-angle aria-label="Angle in degrees" inputmode="decimal" maxlength="24" value="45" disabled> °</label>
<button data-back aria-label="Previous quarter turn" disabled>←</button><button data-play disabled>Play</button><button data-next aria-label="Next quarter turn" disabled>→</button>
<input data-slider aria-label="Angle slider" type="range" min="-360" max="720" step="0.1" value="45" disabled>
</div>
<p data-diagnostic role="status"></p>
<p class="instruction kp-annotation-plane">${renderKpFocusDeckAnnotation({ entityId: 'circle-trig.coordinates', text: 'Follow the same coordinates from the circle to the two waves.' })}</p>
<div class="figures">
<section aria-label="Circle coordinates"><h2>The point on the circle</h2>
<div class="definition">${math('P=(\\cos\\theta,\\sin\\theta)')}</div>
<figure data-circle>${graphs.circle}</figure>
<p data-region>${frame.region.replaceAll('>', '&gt;')}</p>
</section>
<section aria-label="Function values"><h2>The coordinates as functions</h2>
<div class="key"><span class="cosine">● cosine · horizontal · solid</span><span class="sine">■ sine · vertical · dashed</span></div>
<figure data-functions>${graphs.functions}<figcaption class="ticks"><span>0</span><span>π/2</span><span>π</span><span>3π/2</span><span>2π</span></figcaption></figure>
<p>Horizontal axis: angle in radians. Vertical axis: coordinate, from −1 to 1.</p>
</section>
</div>
<div class="readouts" aria-label="Approximate coordinate values">
<span>θ ≈ ${number('angle')}°</span><span>within one turn ≈ ${number('wrapped')}°</span>
<span class="cosine">cos θ ≈ ${number('x')}</span><span class="sine">sin θ ≈ ${number('y')}</span>
</div>
<p class="wrap-note">The point returns after each full turn. The wave marker wraps to 0 at that boundary; the entered angle keeps its turns.</p>
<p>Angles begin on the positive x-axis; positive angles turn counterclockwise.
One radian measures an arc as long as the radius, so a full turn is ${math('2\\pi')} radians, or 360°.
The radius remains 1: ${math('\\cos^2\\theta+\\sin^2\\theta=1')}.</p>
<details><summary>Predict the signs before moving the point</summary>
<table><thead><tr><th>Angle within one turn</th><th>cosine / x</th><th>sine / y</th></tr></thead>
<tbody><tr><td>0° to 90°</td><td>positive</td><td>positive</td></tr><tr><td>90° to 180°</td><td>negative</td><td>positive</td></tr>
<tr><td>180° to 270°</td><td>negative</td><td>negative</td></tr><tr><td>270° to 360°</td><td>positive</td><td>negative</td></tr></tbody></table>
<p>Intervals exclude their endpoints. On an axis, one coordinate is zero.
At 210°, the point lies left of and below the origin, so both coordinates are negative.
At 570°, it reaches the same point after one more revolution.</p></details>
<noscript><p>The diagram shows 45°. Angle controls need JavaScript; the definitions and sign table remain available.</p></noscript>
</main><script type="module" src="/src/experiments/circle-trig/app.ts"></script></body></html>\n`;
}
