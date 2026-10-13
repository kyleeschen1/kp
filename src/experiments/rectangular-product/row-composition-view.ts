import { collectionLayout, mountPolynomialView, polynomialHtml } from './polynomial-view.ts';
import { mountRowWorkbenchView, rowWorkbenchStageHtml, type RowWorkbenchLayout } from './row-workbench-view.ts';
import { rowComposition, sampleRowComposition } from './row-composition-model.ts';
import './row-composition.css';
export { rowCompositionBeats, rowCompositionDurationMs, rowCompositionStops, rowCompositionReading, sampleRowComposition } from './row-composition-model.ts';

const collection = collectionLayout(rowComposition.before);
// Collection owns the docking geometry. Arithmetic uses its existing sampler
// with an outward lane, leaving the compact receiving matrix in place.
const layout: RowWorkbenchLayout = {
  width: 680, height: 390, columns: [240 + collection.offsets[0]!, 240 + collection.offsets[1]!, 240 + collection.offsets[2]!, 112],
  rows: [202, 250], lanes: [154, 298], equality: [174, 226], copyClearance: 32,
  unknowns: collection.offsets.map(offset => [collection.vectorLeft + 26, 226 - collection.span / 2 + offset] as const),
  brackets: [[215, 177, collection.matrixWidth, 98], [collection.vectorLeft, 226 - collection.span / 2 - 25, 52, collection.span + 50], [75, 177, 74, 98]], stroke: 1.5,
};
export function rowCompositionHtml() {
  return `<div class="row-composition-stage" aria-hidden="true"><div data-composition-layer="before">${polynomialHtml(rowComposition.before)}</div><div data-composition-layer="operation">${rowWorkbenchStageHtml(rowComposition.before.inputs, layout, false)}</div><div data-composition-layer="after">${polynomialHtml(rowComposition.after)}</div></div>`;
}
export function mountRowCompositionView(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('.row-composition-stage')!;
  const layer = (id: string) => stage.querySelector<HTMLElement>(`[data-composition-layer="${id}"]`)!;
  const before = mountPolynomialView(layer('before'), rowComposition.before);
  const after = mountPolynomialView(layer('after'), rowComposition.after);
  const operation = mountRowWorkbenchView(layer('operation'), layout);
  let arithmetic: (p: number) => void, disposed = false;
  const prepare = () => { if (disposed) return; before.prepare(); after.prepare(); arithmetic = operation.prepare(rowComposition.step); };
  const render = (p: number) => {
    if (disposed) return;
    const frame = sampleRowComposition(p);
    // Exactly one composited surface owns paint. Toggling ancestor visibility
    // dropped unchanged child glyphs in Chromium; binary opacity retains their
    // raster layers. This is endpoint ownership, never a crossfade.
    for (const id of ['before', 'operation', 'after']) layer(id).style.opacity = id === frame.layer ? '1' : '0';
    if (frame.layer === 'before') before.render(frame.local);
    else if (frame.layer === 'after') after.render(frame.local);
    else arithmetic(frame.local);
    stage.dataset['owner'] = frame.layer; stage.dataset['phase'] = String(frame.phase);
  };
  prepare();
  return { prepare, render, dispose() { disposed = true; before.dispose(); after.dispose(); operation.dispose(); } };
}
