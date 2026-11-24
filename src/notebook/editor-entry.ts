import { mountNotebookApp } from './app.ts';
import { attachNotebookEditor } from './editor.ts';
const root = document.querySelector<HTMLElement>('#notebook')!;
let dispose: (() => void) | undefined, departed = false;
const release = () => { departed = true; dispose?.(); window.removeEventListener('pagehide', pagehide); };
const pagehide = (event: PageTransitionEvent) => { if (!event.persisted) release(); };
window.addEventListener('pagehide', pagehide);
void mountNotebookApp(root, attachNotebookEditor).then(cleanup => { if (departed) cleanup(); else dispose = cleanup; }).catch(error => { if (!departed) root.textContent = `Unable to open notebooks: ${String(error)}`; });
import.meta.hot?.dispose(release);
