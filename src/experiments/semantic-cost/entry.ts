import { costExample, type CostProduct, type MountedReading } from './cases.ts';

const query = new URLSearchParams(location.search);
const reading = query.get('reading') ?? 'dot';
if (reading !== 'dot' && reading !== 'rows' && reading !== 'columns') throw new Error('Unknown cost reading');
const host = document.querySelector<HTMLElement>('#cost-instances')!;
const mountReading = reading === 'dot'
  ? (await import('./dot.ts')).mount
  : (root: HTMLElement, product: CostProduct, column: number) => import('./readings.ts').then(module => module.mount(root, product, reading, column));
let models: CostProduct[] = [], players: MountedReading[] = [];
let serial = 0;
const dispose = () => {
  for (const player of players) player.dispose();
  players = []; models = []; host.replaceChildren();
};
const api = {
  prepare(count: number, different: boolean) {
    if (![1, 10].includes(count)) throw new Error('Benchmark supports one or ten instances');
    dispose();
    const start = performance.now();
    const first = costExample(0, reading);
    models = Array.from({ length: count }, (_, i) => different && i > 0 ? costExample(i, reading) : first);
    return { prepareMs: performance.now() - start, models: models.length, uniqueProducts: new Set(models).size };
  },
  async mount() {
    if (players.length) throw new Error('Dispose mounted instances before remounting');
    const start = performance.now();
    for (const [index, product] of models.entries()) {
      const root = document.createElement('div'); root.id = `cost-player-${serial++}`;
      host.append(root);
      players.push(await mountReading(root, product, index % 2));
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return { mountMs: performance.now() - start, nodes: host.querySelectorAll('*').length };
  },
  seek(progress: number) { for (const player of players) player.seek(progress); },
  play() { for (const player of players) player.play(); },
  pause() { for (const player of players) player.pause(); },
  dispose,
};
declare global { interface Window { semanticCost: typeof api } }
window.semanticCost = api;
document.documentElement.dataset['ready'] = 'true';
import.meta.hot?.dispose(dispose);
