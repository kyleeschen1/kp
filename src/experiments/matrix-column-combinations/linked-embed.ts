import type { matrixProduct } from '../../math/matrix-product.ts';
import { MatrixColumnGap } from '../matrix-column-product/environment.ts';
import { prepareColumnGeometry } from './column-geometry.ts';
import { mountColumnGraph } from './column-graph.ts';
import { mountColumnExplanation } from './embed.ts';
import './linked-embed.css';

export { prepareColumnExplanationFonts } from './embed.ts';
const mounts = new WeakSet<HTMLElement>();

/** Two projections share the existing symbolic player's clock. Hosts retain
 * source revisions, persistence, theme changes and replacement authority. */
export function mountLinkedColumnExplanation(root: HTMLElement, product: ReturnType<typeof matrixProduct>,
  progress: number, settled: (progress: number) => void, id: string,
  onFrame?: (progress: number) => void): ReturnType<typeof mountColumnExplanation> {
  if (!root.isConnected) throw new MatrixColumnGap('Attach the linked explanation host before mounting.');
  if (mounts.has(root)) throw new MatrixColumnGap('Dispose this host’s linked explanation before replacing it.');
  if (!Number.isFinite(progress) || progress < 0 || progress > 1)
    throw new MatrixColumnGap('Explanation progress must be between 0 and 1.');
  if (!id.trim()) throw new MatrixColumnGap('A linked explanation needs an occurrence ID.');
  const prepared = prepareColumnGeometry(product), document = root.ownerDocument;
  const container = document.createElement('div'); container.className = 'kp-linked-column';
  const comparison = document.createElement('div'); comparison.className = 'reference-comparison';
  const symbols = document.createElement('div'); symbols.className = 'reference-symbols';
  comparison.append(symbols); container.append(comparison);
  let player: ReturnType<typeof mountColumnExplanation> | undefined;
  let graph: ReturnType<typeof mountColumnGraph> | undefined;
  let disposed = false;
  const dispose = () => {
    if (disposed) return; disposed = true;
    try { player?.dispose(); }
    finally { graph?.dispose(); container.remove(); mounts.delete(root); }
  };
  const live = () => {
    if (disposed || !player) throw new MatrixColumnGap('This linked explanation has been disposed.');
    return player;
  };
  // Reserve the host before the first synchronous frame/callback. Any failed
  // preparation releases only this occurrence and permits a clean remount.
  mounts.add(root);
  try {
    root.append(container);
    graph = mountColumnGraph(comparison, prepared, id);
    const paint = graph.render;
    player = mountColumnExplanation(symbols, product, progress, settled, value => { paint(value); onFrame?.(value); });
  } catch (error) { dispose(); throw error; }
  return {
    pause() { live().pause(); },
    progress() { return live().progress(); },
    seek(value) { live().seek(value); },
    prepare() { live().prepare(); },
    dispose,
  };
}
