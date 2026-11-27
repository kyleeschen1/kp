import 'prosemirror-view/style/prosemirror.css';
import '@fontsource/source-serif-4/latin-300.css';
import '@fontsource/source-serif-4/latin-300-italic.css';
import '@fontsource/source-serif-4/latin-500.css';
import '@fontsource/source-serif-4/latin-600.css';
import 'katex/dist/katex.min.css';
import './style.css';
import './theme.css';
import './math.css';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { readNotebook, type FractionNotebook } from './model.ts';
import { toProse } from './schema.ts';
import { BlockView } from './block-view.ts';
import { applyStyles, readStyleSettings } from './styles.ts';
import { createNotebookMathRuntime, type NotebookMathRuntime } from '../notebook/math-runtime.ts';
import { createMathNodeView, type MathViewOwner } from './math-view.ts';
import { CommandShortcut } from '../editor-commands/shortcut.ts';

const host = document.querySelector<HTMLElement>('#math-reading')!;
// Own cancellation before the first await: Firefox rejects in-flight imports
// when a preview leaves. A retired bootstrap must neither report nor mount.
let bootstrapStopped = false, bootstrapped = false;
const stopBootstrap = () => { bootstrapStopped = true; };
const resumeBootstrap = (event: PageTransitionEvent) => { if (event.persisted && !bootstrapped) location.reload(); };
window.addEventListener('pagehide', stopBootstrap, { once: true });
window.addEventListener('pageshow', resumeBootstrap);
async function startReading() {
  const matrixModule = new URLSearchParams(location.search).get('notebook') === 'matrix' ? await import('./matrix-reading.ts') : undefined;
  const projectionModule = new URLSearchParams(location.search).get('notebook') === 'projection' ? await import('./projection-reading.ts') : undefined;
  const compositionModule = new URLSearchParams(location.search).get('notebook') === 'composition' ? await import('./composition-reading.ts') : undefined;
  if (bootstrapStopped) return;
  bootstrapped = true;
  window.removeEventListener('pagehide', stopBootstrap); window.removeEventListener('pageshow', resumeBootstrap);
  let projectionReading: ReturnType<NonNullable<typeof projectionModule>['mountProjectionReading']> | undefined;
  let compositionReading: ReturnType<NonNullable<typeof compositionModule>['mountCompositionReading']> | undefined;
  let matrixReading: ReturnType<NonNullable<typeof matrixModule>['mountMatrixReading']> | undefined;
  const send = (data: object) => window.parent.postMessage({ protocol: 'kp.fraction-notebook.v1', ...data }, location.origin);
  let view: EditorView | undefined, runtime: NotebookMathRuntime | undefined, latest: FractionNotebook | undefined, active = false, disposed = false;
  const listeners = new Set<() => void>(), shortcut = new CommandShortcut();
  const render = () => {
    if (disposed || !active || !latest) return;
    if (compositionModule) {
      if (!latest.compositionResources) throw new Error('The composition reading requires matrix pairs.');
      if (!compositionReading) compositionReading = compositionModule.mountCompositionReading(host, latest, id => send({ kind: 'select', id }));
      else compositionReading.update(latest);
      send({ kind: 'applied', revision: latest.revision }); return;
    }
    if (projectionModule) {
      if (!latest.projectionResources) throw new Error('The projection reading requires vector pairs.');
      if (!projectionReading) projectionReading = projectionModule.mountProjectionReading(host, latest, id => send({ kind: 'select', id }));
      else projectionReading.update(latest);
      send({ kind: 'applied', revision: latest.revision }); return;
    }
    if (matrixModule) {
      if (!latest.matrixResources) throw new Error('The matrix reading requires matrix resources.');
      if (!matrixReading) matrixReading = matrixModule.mountMatrixReading(host, latest, id => send({ kind: 'select', id }));
      else matrixReading.update(latest);
      send({ kind: 'applied', revision: latest.revision }); return;
    }
    if (!runtime) runtime = createNotebookMathRuntime(latest.id);
    runtime.update(latest.mathematics!);
    if (!view) {
      const owner: MathViewOwner = { runtime, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }, select(id) { send({ kind: 'select', id }); },
        coefficient() {}, tangent() {}, cancelPreview() {}, bind() {}, undo() {} };
      view = new EditorView(host, { state: EditorState.create({ doc: toProse(latest) }), editable: () => false,
        attributes: { 'aria-label': 'Mathematical notebook reading' }, nodeViews: { mathObject: node => createMathNodeView(node, owner, false), block: node => new BlockView(node, () => {}) } });
    } else view.updateState(EditorState.create({ doc: toProse(latest) }));
    for (const listener of listeners) listener();
    send({ kind: 'applied', revision: latest.revision });
  };
  const message = (event: MessageEvent) => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.protocol !== 'kp.fraction-notebook.v1') return;
    try {
      const data = event.data;
      if (data.kind === 'styles') applyStyles(readStyleSettings(data.settings));
      if (data.kind === 'presentation') {
        active = data.animationOnly === false;
        // A hidden matrix reading must not keep a player/clock alive or publish
        // obsolete playback state while its editable counterpart is in use.
        if (!active) { matrixReading?.dispose(); matrixReading = undefined; projectionReading?.dispose(); projectionReading = undefined; compositionReading?.dispose(); compositionReading = undefined; }
        render();
      }
      if (data.kind === 'apply') { latest = readNotebook(data.value.notebook); render(); }
      if (data.kind === 'reveal' && typeof data.id === 'string') [...host.querySelectorAll<HTMLElement>('[data-cell-id]')].find(el => el.dataset['cellId'] === data.id)?.scrollIntoView({ block: 'center' });
    } catch (error) { send({ kind: 'error', message: String(error) }); }
  };
  const focus = () => send({ kind: 'window-focus' });
  const key = (event: KeyboardEvent) => {
    const command = shortcut.next(event, performance.now());
    if (command !== 'pass') { event.preventDefault(); if (command === 'open') send({ kind: 'commands-open' }); }
    else if (event.ctrlKey && event.code === 'Backquote') { event.preventDefault(); send({ kind: 'window-cycle', reverse: event.shiftKey }); }
  };
  window.addEventListener('message', message); document.addEventListener('pointerdown', focus); document.addEventListener('keydown', key, true);
  const dispose = () => {
    if (disposed) return; disposed = true;
    window.removeEventListener('pagehide', leaving); window.removeEventListener('pageshow', returning);
    window.removeEventListener('message', message); document.removeEventListener('pointerdown', focus); document.removeEventListener('keydown', key, true);
    view?.destroy(); runtime?.dispose(); matrixReading?.dispose(); projectionReading?.dispose(); compositionReading?.dispose(); listeners.clear();
  };
  const leaving = (event: PageTransitionEvent) => {
    if (!event.persisted) { dispose(); return; }
    // A frozen page releases active playback but retains its message owner. The
    // parent also survives BFCache, so restore from the latest admitted notebook.
    matrixReading?.dispose(); matrixReading = undefined;
    projectionReading?.dispose(); projectionReading = undefined; compositionReading?.dispose(); compositionReading = undefined;
  };
  const returning = (event: PageTransitionEvent) => { if (event.persisted) render(); };
  window.addEventListener('pagehide', leaving); window.addEventListener('pageshow', returning);
  if (import.meta.hot) import.meta.hot.dispose(dispose);
  send({ kind: 'ready' });
}
void startReading().catch(error => {
  if (bootstrapStopped) return;
  const message = `Could not load the mathematical reading: ${String(error)}. Reload to retry.`;
  host.textContent = message; host.setAttribute('role', 'alert');
  window.parent.postMessage({ protocol: 'kp.fraction-notebook.v1', kind: 'error', message }, location.origin);
});
if (import.meta.hot) import.meta.hot.dispose(() => {
  stopBootstrap(); window.removeEventListener('pagehide', stopBootstrap); window.removeEventListener('pageshow', resumeBootstrap);
});
