import '../dot-product-passage/page.css';
import { mountDotPlayer } from '../dot-product-passage/player.ts';
import { context } from './source.ts';

const root = document.querySelector<HTMLElement>('#rectangular-player')!;
let cleanup: (() => void) | undefined, disposed = false;
const mount = new URLSearchParams(location.search).get('view') === 'pouring'
  ? import('./pouring-player.ts').then(({ mountPouringPlayer }) => mountPouringPlayer(root))
  : mountDotPlayer(root, context.passage, true, context);
void mount.then(dispose => {
  if (disposed) dispose(); else cleanup = dispose;
}).catch(error => {
  root.setAttribute('aria-busy', 'false'); root.dataset['gap'] = 'true';
  root.textContent = `The rectangular passage could not be prepared: ${error instanceof Error ? error.message : String(error)}`;
});
import.meta.hot?.dispose(() => { disposed = true; cleanup?.(); });
