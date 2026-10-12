import { requireCollectionSource, type CollectionModel } from '../rectangular-product/collection-source.ts';
import { polynomialSource } from '../rectangular-product/polynomial-model.ts';
import { linearSystemSource } from '../rectangular-product/linear-system-source.ts';
import { polynomialHtml, mountPolynomialView } from '../rectangular-product/polynomial-view.ts';
import { createKpReaderTimelinePlaybackClock } from '../../reader/runtime/timeline-playback-clock.ts';
import type { MountedReading } from './cases.ts';
import '../dot-product-passage/page.css';

export function collectionExample(index: number): CollectionModel {
  const source = index % 2 ? linearSystemSource : polynomialSource;
  return requireCollectionSource({ ...source, id: `cost.collection.${index}`,
    coefficients: source.coefficients.map(row => row.map(n => n === 0 ? 0 : Math.sign(n) * (1 + (Math.abs(n) + index) % 9))),
  });
}

// The real view and clock, excluding standalone controls and reading prose.
export async function mountCollection(root: HTMLElement, model: CollectionModel): Promise<MountedReading> {
  root.classList.add('matrix-player');
  root.innerHTML = `<section class="matrix-card kp-focus-deck">${polynomialHtml(model)}</section>`;
  root.getBoundingClientRect();
  await document.fonts.ready;
  const view = mountPolynomialView(root, model);
  const clock = createKpReaderTimelinePlaybackClock({ id: root.id, durationMs: model.durationMs });
  const stop = clock.subscribe(() => view.render(clock.getSnapshot().progress));
  view.render(0);
  let disposed = false;
  return {
    seek(p) { clock.pause(); clock.seek(p); },
    play() { clock.play({ direction: 'forward', stopAt: 1 }); },
    pause() { clock.pause(); },
    dispose() { if (disposed) return; disposed = true; stop(); clock.dispose(); view.dispose(); },
  };
}
