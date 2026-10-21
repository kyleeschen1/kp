import { costExample, type CostProduct, type MountedReading } from './cases.ts';
import { collectionExample, mountCollection } from './collection.ts';
import type { CollectionModel } from '../rectangular-product/collection-source.ts';
import { watchPlayback } from '../../reader/runtime/playback-visibility.ts';

const query = new URLSearchParams(location.search);
const reading = query.get('reading') ?? 'dot';
if (reading !== 'dot' && reading !== 'rows' && reading !== 'columns' && reading !== 'collection') throw new Error('Unknown cost reading');
const host = document.querySelector<HTMLElement>('#cost-instances')!;
const mountOrdinary = reading === 'dot'
  ? (await import('./dot.ts')).mount
  : (root: HTMLElement, product: CostProduct, column: number) => {
    if (reading === 'collection') throw new Error('Collection requires its own typed model.');
    return import('./readings.ts').then(module => module.mount(root, product, reading, column));
  };
let models: (CostProduct | CollectionModel)[] = [], players: MountedReading[] = [];
let serial = 0;
let visibility = new AbortController();
let pauses = 0;
const dispose = () => {
  visibility.abort();
  for (const player of players) player.dispose();
  players = []; models = []; host.replaceChildren();
};
const api = {
  prepare(count: number, different: boolean) {
    if (![1, 10].includes(count)) throw new Error('Benchmark supports one or ten instances');
    dispose();
    const start = performance.now();
    const example = (i: number) => reading === 'collection' ? collectionExample(i) : costExample(i, reading);
    const first = example(0);
    models = Array.from({ length: count }, (_, i) => different && i > 0 ? example(i) : first);
    return { prepareMs: performance.now() - start, models: models.length, uniqueProducts: new Set(models).size };
  },
  async mount(options: { suspendOffscreen?: boolean } = {}) {
    if (players.length) throw new Error('Dispose mounted instances before remounting');
    const start = performance.now();
    visibility = new AbortController(); pauses = 0;
    for (const [index, product] of models.entries()) {
      const root = document.createElement('div'); root.id = `cost-player-${serial++}`;
      host.append(root);
      const player = await ('status' in product ? mountCollection(root, product) : mountOrdinary(root, product, index % 2));
      players.push(player);
      if (options.suspendOffscreen) watchPlayback(root, () => { pauses++; player.pause(); }, visibility.signal);
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return { mountMs: performance.now() - start, nodes: host.querySelectorAll('*').length };
  },
  seek(progress: number) { for (const player of players) player.seek(progress); },
  play() { for (const player of players) player.play(); },
  pause() { for (const player of players) player.pause(); },
  visibilityPauses: () => pauses,
  // Expose the real boundary only in this measurement host for lifecycle tests.
  watchPlayback,
  dispose,
};
declare global { interface Window { semanticCost: typeof api } }
window.semanticCost = api;
document.documentElement.dataset['ready'] = 'true';
import.meta.hot?.dispose(dispose);
