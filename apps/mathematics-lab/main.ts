import katex from 'katex';
import 'katex/dist/katex.min.css';
import { createGraph2DObject, createAxis2DObject, type Graph2DObject } from '../../src/semantic/graph.ts';
import { renderGraphToSvg } from '../../src/rendering/graph-2d-svg.ts';
import { projectGraphPoint } from '../../src/rendering/graph-2d-scene.ts';
import { createMatrixVectorDocument, readMatrixVectorDocument, editMatrixVectorDocument,
  editOccurrenceExtent, invalidResourceFields, createMatrixVectorRuntime, matrixFields, vectorFields,
  type MathOccurrence, type ResourceEdit, type Vector2 } from '../../src/math-resources/public-api.ts';
import './style.css';

const storageKey = 'kp.lab.mathematics.matrix-vector.v1';
let initial = createMatrixVectorDocument(), recoveryIssue = '';
try { const saved = localStorage.getItem(storageKey); if (saved) initial = readMatrixVectorDocument(JSON.parse(saved)); }
catch { recoveryIssue = 'The saved data could not be opened. It remains in storage; reset explicitly to replace it.'; }
let documentState = initial, maySave = !recoveryIssue;
const runtime = createMatrixVectorRuntime(documentState), app = document.querySelector<HTMLElement>('#app')!;
app.innerHTML = `<header><p class="eyebrow">Mathematical objects · independent lab</p><h1>A matrix acts on a vector</h1>
  <p>Change either source. The equation and both graphs share one dependent result; each graph keeps its own zoom.</p></header>
  <section class="controls" aria-label="Source objects"><fieldset id="matrix"><legend>Matrix A</legend></fieldset>
  <fieldset id="vector"><legend>Vector v</legend></fieldset></section>
  <p id="draft-status" role="status"></p><section id="equation" aria-label="Matrix-vector equation"></section>
  <output id="result" aria-label="Result vector"></output><section class="views" id="views"></section>
  <footer><p id="persistence" role="status"></p><button id="reset" type="button">Reset example</button>
  <details><summary>Object identities and dependencies</summary><pre id="identities"></pre></details></footer>`;
const inputs = new Map<string, HTMLInputElement>();
function addInput(kind: ResourceEdit['kind'], field: string, label: string) {
  const wrap = window.document.createElement('label'), input = window.document.createElement('input');
  wrap.textContent = label; input.type = 'text'; input.inputMode = 'decimal'; input.maxLength = 32;
  input.setAttribute('aria-label', `${kind === 'matrix' ? 'Matrix' : 'Vector'} ${label}`);
  input.dataset['field'] = `${kind}.${field}`; wrap.append(input); app.querySelector(`#${kind}`)!.append(wrap);
  inputs.set(`${kind}.${field}`, input);
  input.addEventListener('input', () => {
    const edit: ResourceEdit = kind === 'matrix'
      ? { kind, field: matrixFields.find(key => key === field)!, text: input.value }
      : { kind, field: vectorFields.find(key => key === field)!, text: input.value };
    documentState = editMatrixVectorDocument(documentState, edit); runtime.update(documentState); render(); save();
  });
}
matrixFields.forEach((field, index) => addInput('matrix', field, `row ${Math.floor(index / 2) + 1}, column ${index % 2 + 1}`));
vectorFields.forEach(field => addInput('vector', field, field));
const graphViews = documentState.occurrences.filter(o => o.view === 'graph').map((occurrence, index) => {
  const section = window.document.createElement('section'); section.className = 'graph-view'; section.dataset['occurrence'] = occurrence.id;
  const title = window.document.createElement('h2'); title.textContent = `View ${index + 1}`;
  const host = window.document.createElement('div'); host.className = 'graph';
  const label = window.document.createElement('label'); label.textContent = 'Visible range ± ';
  const zoom = window.document.createElement('select'); zoom.setAttribute('aria-label', `View ${index + 1} range`);
  for (const value of [...new Set([2, 5, 10, 25, 100, 250, occurrence.extent])].sort((a, b) => a - b)) {
    const option = window.document.createElement('option'); option.value = String(value); option.textContent = String(value); zoom.append(option);
  }
  zoom.value = String(occurrence.extent); label.append(zoom); section.append(title, host, label); app.querySelector('#views')!.append(section);
  zoom.addEventListener('change', () => { documentState = editOccurrenceExtent(documentState, occurrence.id, Number(zoom.value)); render(); save(); });
  return { id: occurrence.id, host };
});
function paintVector(svg: SVGSVGElement, graph: Graph2DObject, value: Vector2, role: 'input' | 'result', clipId: string) {
  const start = projectGraphPoint(graph, { x: 0, y: 0 }), end = projectGraphPoint(graph, { x: value[0], y: value[1] });
  const line = window.document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.classList.add('vector', `vector--${role}`); line.setAttribute('x1', String(start.x)); line.setAttribute('y1', String(start.y));
  line.setAttribute('x2', String(end.x)); line.setAttribute('y2', String(end.y)); line.setAttribute('clip-path', `url(#${clipId})`); svg.append(line);
  const endpoint = window.document.createElementNS('http://www.w3.org/2000/svg', 'circle'); endpoint.classList.add(`vector-end--${role}`);
  endpoint.setAttribute('cx', String(end.x)); endpoint.setAttribute('cy', String(end.y)); endpoint.setAttribute('r', '3');
  endpoint.setAttribute('clip-path', `url(#${clipId})`); svg.append(endpoint);
}
function draw(host: HTMLElement, occurrence: MathOccurrence, input: Vector2, result: Vector2) {
  const extent = occurrence.extent, graph = createGraph2DObject({ id: occurrence.id, label: `Input v (${input.join(', ')}), result Av (${result.join(', ')}). Range ±${extent}.`,
    xAxisId: `${occurrence.id}.x`, yAxisId: `${occurrence.id}.y`, xDomain: [-extent, extent], yDomain: [-extent, extent], width: 360, height: 260 });
  const axes = (['x', 'y'] as const).map(orientation => createAxis2DObject({ id: `${occurrence.id}.${orientation}`, graphId: graph.id,
    orientation, label: orientation, domain: [-extent, extent], tickStep: 1 }));
  host.innerHTML = renderGraphToSvg(axes, graph).trim();
  const svg = host.querySelector<SVGSVGElement>('svg')!, defs = window.document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const clip = window.document.createElementNS('http://www.w3.org/2000/svg', 'clipPath'), rect = window.document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  clip.id = `${occurrence.id}-clip`; rect.setAttribute('width', '360'); rect.setAttribute('height', '260'); clip.append(rect); defs.append(clip); svg.prepend(defs);
  paintVector(svg, graph, result, 'result', clip.id); paintVector(svg, graph, input, 'input', clip.id);
  const legend = window.document.createElement('p'); legend.className = 'legend'; legend.innerHTML = '<span class="input-key">○ v</span> <span class="result-key">● Av</span>';
  const clipped = [...input, ...result].some(value => Math.abs(value) > extent);
  if (clipped) legend.append(' · A vector extends beyond this view; increase its range.'); host.append(legend);
}
function render() {
  for (const key of matrixFields) inputs.get(`matrix.${key}`)!.value = documentState.matrix.draft[key];
  for (const key of vectorFields) inputs.get(`vector.${key}`)!.value = documentState.vector.draft[key];
  const invalid = invalidResourceFields(documentState);
  for (const [key, input] of inputs) input.setAttribute('aria-invalid', String(invalid.includes(key)));
  app.querySelector('#draft-status')!.textContent = invalid.length ? `Incomplete or out-of-range input: ${invalid.join(', ')}. Showing the last valid mathematics (values −10 to 10).` : '';
  const sample = runtime.sample(); katex.render(sample.latex, app.querySelector<HTMLElement>('#equation')!, { displayMode: true, throwOnError: true });
  app.querySelector('#result')!.textContent = `Av = (${sample.result.join(', ')})`;
  for (const view of graphViews) draw(view.host, documentState.occurrences.find(o => o.id === view.id)!, sample.input, sample.result);
  app.querySelector('#identities')!.textContent = JSON.stringify({ document: documentState.id, matrix: documentState.matrix.id,
    vector: documentState.vector.id, result: documentState.result, occurrences: documentState.occurrences, computations: runtime.inspect().calls }, null, 2);
}
function save() {
  const status = app.querySelector('#persistence')!;
  if (!maySave) { status.textContent = recoveryIssue; return; }
  try { localStorage.setItem(storageKey, JSON.stringify(documentState)); status.textContent = 'Saved in this browser. Reload retains sources, drafts, identities and view ranges.'; }
  catch { status.textContent = 'Browser storage is unavailable. Changes remain in this open page.'; }
}
app.querySelector('#reset')!.addEventListener('click', () => {
  try { localStorage.setItem(storageKey, JSON.stringify(createMatrixVectorDocument())); location.reload(); }
  catch { app.querySelector('#persistence')!.textContent = 'Browser storage is unavailable; the example was not reset.'; }
});
window.addEventListener('pagehide', event => { if (!event.persisted) runtime.dispose(); });
render(); save();
