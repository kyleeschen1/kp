import { collectionLayout, mountPolynomialView, polynomialHtml } from './polynomial-view.ts';
import { mountRowWorkbenchView, rowWorkbenchStageHtml, type RowWorkbenchLayout } from './row-workbench-view.ts';
import { rowComposition, sampleCompiledRowComposition, type RowComposition } from './row-composition-model.ts';
import './row-composition.css';
export { rowCompositionBeats, rowCompositionDurationMs, rowCompositionStops, rowCompositionReading, sampleRowComposition } from './row-composition-model.ts';

export function createRowCompositionView(model: RowComposition = rowComposition) {
const collection = collectionLayout(model.before);
// Collection owns the docking geometry. Arithmetic uses its existing sampler
// with an outward lane, leaving the compact receiving matrix in place.
const layout: RowWorkbenchLayout = {
  width: 680, height: 390, columns: [...collection.offsets.map(offset => 240 + offset), 112],
  rows: model.before.coefficients.map((_, r) => 202 + r * 48),
  lanes: model.before.coefficients.map((_, r) => r === 0 ? 154 : 202 + model.before.coefficients.length * 48),
  equality: [174, collection.rowCenter], copyClearance: 32,
  unknowns: collection.offsets.map(offset => [collection.vectorLeft + 26, collection.rowCenter - collection.span / 2 + offset] as const),
  brackets: [[215, 177, collection.matrixWidth, collection.rowHeight], [collection.vectorLeft, collection.rowCenter - collection.span / 2 - 25, 52, collection.span + 50], [75, 177, 74, collection.rowHeight]], stroke: 1.5,
};
function rowCompositionHtml() {
  return `<div class="row-composition-stage" aria-hidden="true"><div data-composition-layer="before">${polynomialHtml(model.before)}</div><div data-composition-layer="operation">${model.steps.map((_, i) => `<div data-operation-index="${i}">${rowWorkbenchStageHtml(model.before.inputs, layout, false)}</div>`).join('')}</div><div data-composition-layer="after">${polynomialHtml(model.after)}</div></div>`;
}
function mountRowCompositionView(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('.row-composition-stage')!;
  const layer = (id: string) => stage.querySelector<HTMLElement>(`[data-composition-layer="${id}"]`)!;
  const before = mountPolynomialView(layer('before'), model.before);
  const after = mountPolynomialView(layer('after'), model.after);
  const operations = model.steps.map((step, i) => {
    const root = layer('operation').querySelector<HTMLElement>(`[data-operation-index="${i}"]`)!;
    return { root, view: mountRowWorkbenchView(root, layout), step: step.checked };
  });
  let arithmetic: ((p: number) => void)[] = [], disposed = false;
  // Prepare bounded operation surfaces once, not during seek or playback.
  // Each incoming surface starts from the preceding checker's actual result.
  const prepare = () => { if (disposed) return; before.prepare(); after.prepare(); arithmetic = operations.map(op => op.view.prepare(op.step)); };
  const render = (p: number) => {
    if (disposed) return;
    const frame = sampleCompiledRowComposition(model, p);
    // Exactly one composited surface owns paint. Toggling ancestor visibility
    // dropped unchanged child glyphs in Chromium; binary opacity retains their
    // raster layers. This is endpoint ownership, never a crossfade.
    for (const id of ['before', 'operation', 'after']) layer(id).style.opacity = id === frame.layer ? '1' : '0';
    if (frame.layer === 'before') before.render(frame.local);
    else if (frame.layer === 'after') after.render(frame.local);
    else arithmetic[frame.operationIndex]!(frame.local);
    for (const [i, operation] of operations.entries()) operation.root.style.opacity = i === frame.operationIndex ? '1' : '0';
    stage.dataset['operationIndex'] = String(frame.operationIndex);
    stage.dataset['owner'] = frame.layer; stage.dataset['phase'] = String(frame.phase);
  };
  prepare();
  return { prepare, render, dispose() { disposed = true; before.dispose(); after.dispose(); operations.forEach(op => op.view.dispose()); } };
}
return { title: model.title, introduction: model.introduction,
  rowCompositionBeats: model.beats, rowCompositionStops: model.stops,
  rowCompositionDurationMs: model.durationMs, rowCompositionReading: model.reading,
  sampleRowComposition: (p: number) => sampleCompiledRowComposition(model, p), rowCompositionHtml, mountRowCompositionView };
}
