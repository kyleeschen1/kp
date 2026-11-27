import { prepareColumnGeometry } from './column-geometry.ts';
import { mountColumnGraph } from './column-graph.ts';
import { mountColumnExplanation } from '../experiments/matrix-column-combinations/embed.ts';
import type { matrixProduct } from '../math/matrix-product.ts';
import { applyMatrixConfig, readMatrixConfig } from '../experiments/matrix-examples/config.ts';
import './candidate.css';

export function mountGeometryExplanation(root: HTMLElement, product: ReturnType<typeof matrixProduct>,
  progress: number, settled: (progress: number) => void, id: string) {
  const prepared = prepareColumnGeometry(product);
  root.classList.add('reference-comparison');
  const symbols = root.ownerDocument.createElement('div'); symbols.className = 'reference-symbols'; root.append(symbols);
  const graph = mountColumnGraph(root, prepared, id);
  try {
    const player = mountColumnExplanation(symbols, product, progress, settled, graph.render);
    return { pause: player.pause, dispose() { player.dispose(); graph.dispose(); symbols.remove(); } };
  } catch (error) { graph.dispose(); symbols.remove(); throw error; }
}

export function mountReferenceTheme() {
  const html = document.documentElement;
  html.dataset['referenceGeometry'] = ''; html.dataset['kpTheme'] = 'light';
  applyMatrixConfig(document, { ...readMatrixConfig(document), theme: 'light' });
  const toggle = document.createElement('button'); toggle.className = 'reference-theme'; toggle.textContent = 'Dark theme';
  toggle.onclick = () => {
    const dark = html.dataset['kpTheme'] !== 'dark'; html.dataset['kpTheme'] = dark ? 'dark' : 'light';
    toggle.textContent = dark ? 'Light theme' : 'Dark theme';
    // Native paint clones cache measured styles; use their existing preparation
    // boundary when the host theme changes, keeping the same playhead.
    applyMatrixConfig(document, { ...readMatrixConfig(document), theme: dark ? 'dark' : 'light' });
  };
  document.querySelector('.reference-tools')!.append(toggle);
  return () => { toggle.onclick = null; toggle.remove(); };
}
