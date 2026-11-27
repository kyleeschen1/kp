import seed from '../../content/notebooks/matrix-object-exemplar.json';
import { openAtomicRecord } from '../notebook/atomic-record.ts';
import { createMatrixVectorRuntime } from '../math-resources/public-api.ts';
import { mountColumnExplanation, prepareColumnExplanationFonts } from '../experiments/matrix-column-combinations/embed.ts';
import { readReferenceRecord, referenceSeed, type ReferenceRecord } from './record.ts';
import { createReferenceSession, type MountReference } from './session.ts';
import './style.css';

const stage = document.querySelector<HTMLElement>('.reference-stage')!;
const message = document.querySelector<HTMLElement>('.reference-message')!;
const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
const failed = (error: unknown) => {
  message.textContent = `${error instanceof Error ? error.message : String(error)} The previous saved card is unchanged.`;
  message.dataset['state'] = 'error';
};
const changed = (record: ReferenceRecord) => {
  message.textContent = ''; delete message.dataset['state'];
  stage.dataset['sourceId'] = record.source.id;
  stage.dataset['savedProgress'] = String(record.view.progress);
  document.querySelector('[data-filename]')!.textContent = record.view.filename;
  const list = document.querySelector('dl')!; list.replaceChildren();
  for (const [label, value] of [['Resource', record.source.id], ['Matrix', record.source.matrix.id],
    ['Vector', record.source.vector.id], ['Result', record.source.result.id]] as const) {
    const term = document.createElement('dt'), detail = document.createElement('dd');
    term.textContent = label; detail.textContent = value; list.append(term, detail);
  }
};
const mount: MountReference = (record, settled) => {
  const runtime = createMatrixVectorRuntime(record.source);
  const root = document.createElement('div'); root.className = 'reference-candidate';
  root.setAttribute('aria-hidden', 'true'); root.inert = true; stage.append(root);
  try {
    const player = mountColumnExplanation(root, runtime.explanation().product, record.view.progress, settled);
    return {
      reveal() { root.classList.remove('reference-candidate'); root.removeAttribute('aria-hidden'); root.inert = false; },
      pause: player.pause,
      dispose() { player.dispose(); runtime.dispose(); root.remove(); }
    };
  } catch (error) { runtime.dispose(); root.remove(); throw error; }
};

let disposed = false, session: ReturnType<typeof createReferenceSession> | undefined;
const cleanup = () => { disposed = true; input.onchange = null; session?.dispose(); };
window.addEventListener('pagehide', cleanup, { once: true });
// A bfcache restoration must reopen its closed storage and disposed player.
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
async function start() {
  const store = await openAtomicRecord('kp-matrix-reference-v1', readReferenceRecord, referenceSeed(seed.matrixResources[0]));
  try {
    const record = await store.read(); await prepareColumnExplanationFonts();
    if (disposed) { store.close(); return; }
    session = createReferenceSession(store, record, mount, changed, failed);
    input.disabled = false; stage.setAttribute('aria-busy', 'false');
    input.onchange = () => {
      const file = input.files?.[0]; input.value = '';
      if (file) void session!.importFile(file);
    };
  } catch (error) { store.close(); throw error; }
}
void start().catch(error => {
  if (disposed) return;
  message.textContent = `Could not open the reference card: ${error instanceof Error ? error.message : String(error)} Reload to retry.`;
  message.dataset['state'] = 'error'; stage.setAttribute('aria-busy', 'false');
});
