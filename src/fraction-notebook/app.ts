import 'prosemirror-view/style/prosemirror.css';
import '@fontsource/source-serif-4/latin-300.css';
import '@fontsource/source-serif-4/latin-300-italic.css';
import '@fontsource/source-serif-4/latin-500.css';
import '@fontsource/source-serif-4/latin-600.css';
import 'katex/dist/katex.min.css';
import './style.css';
import canonical from '../../content/authoring/algebra/fractional-linear-reasoning.article.md?raw';
import { importFractionReading, readNotebook, object, type FractionNotebook } from './model.ts';
import { fromProse, mountFractionEditor } from './editor.ts';
import { openFractionDraft } from './storage.ts';
import { addAuthor, annotateSelection, mountInspector } from './inspector.ts';
import type { Node as ProseNode } from 'prosemirror-model';
import { mountStructureControls } from './structure-controls.ts';
import { setVimMode, vimKey } from './vim.ts';

const root = document.querySelector<HTMLElement>('#app')!;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; return node; };
const button = (text: string, action: () => void) => { const node = el('button', '', text); node.type = 'button'; node.onclick = action; return node; };
const storageKey = 'kp.fraction-notebook.v3';
let notebook = importFractionReading(canonical).notebook;
let lastValid = notebook;
let store: Awaited<ReturnType<typeof openFractionDraft>> | undefined;
let storedError: string | undefined;
try {
  store = await openFractionDraft(notebook);
  const saved = await store.read(); notebook = saved.draft; lastValid = saved.lastValid;
  const recovery = sessionStorage.getItem(storageKey) ?? sessionStorage.getItem('kp.fraction-notebook.v2') ?? sessionStorage.getItem('kp.fraction-notebook.v1');
  if (recovery) {
    const draft = readNotebook(JSON.parse(recovery));
    sessionStorage.setItem(storageKey, JSON.stringify(draft)); sessionStorage.removeItem('kp.fraction-notebook.v1'); sessionStorage.removeItem('kp.fraction-notebook.v2');
    if (JSON.stringify(draft) !== JSON.stringify(notebook)) {
      notebook = draft; storedError = 'Recovered a separate unsaved draft. Download it before reloading to reconcile with saved content.';
    } else sessionStorage.removeItem(storageKey);
  }
} catch (error) { storedError = `Saved content has not been overwritten. ${String(error)}`; }
let saving = Promise.resolve();
let generation = 0, disposed = false, frameReady = false, latest: { value: unknown; revision: number } | undefined, request: AbortController | undefined;
let timer: ReturnType<typeof setTimeout> | undefined, selected: string | undefined;
let inspector: ReturnType<typeof mountInspector> | undefined;
let structure: ReturnType<typeof mountStructureControls> | undefined;
const header = el('header', 'fn-header'), branding = el('div', 'fn-branding');
const wordmark = el('a', 'fn-wordmark', 'Kinetic Press'); wordmark.href = '/'; branding.append(wordmark);
const editToggle = button('Edit', () => setEditing(!root.classList.contains('fn-editing'))); editToggle.setAttribute('aria-pressed', 'false'); branding.append(editToggle);
const actions = el('div', 'fn-header-actions'), status = el('p', 'fn-status', storedError ?? 'Opening your local notebook…'); status.setAttribute('role', 'status');
const download = button('Download JSON', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' })); const a = el('a'); a.href = url; a.download = 'fraction-notebook.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
const details = (show: boolean, id?: string) => { root.classList.toggle('fn-details', show); metadata.setAttribute('aria-pressed', String(show)); metadata.textContent = show ? 'Hide details' : 'Show details'; inspector?.show(show, id); };
const metadata = button('Show details', () => details(!root.classList.contains('fn-details'))); metadata.setAttribute('aria-pressed', 'false');
const reference = el('a', '', 'Original reading ↗'); reference.href = '/reader/solve-fractional-linear/?reading=reasoning'; reference.target = '_blank'; reference.rel = 'noopener';
actions.append(metadata, download, reference); header.append(branding, actions);
const workspace = el('div', 'fn-workspace'), left = el('section', 'fn-left'), right = el('section', 'fn-right');
left.setAttribute('aria-label', 'Editable notebook'); right.setAttribute('aria-label', 'Reading preview');
const tools = el('div', 'fn-tools'); tools.append(el('span', 'fn-pane-title', 'NOTEBOOK'));
const editorHost = el('div', 'fn-editor');
const mode = button('NORMAL', () => { const current = vimKey.getState(editor.view.state); editor.run(setVimMode(current === 'insert' ? 'normal' : 'insert')); });
mode.className = 'fn-vim-mode'; mode.setAttribute('aria-label', 'Vim mode');
const previewTools = el('div', 'fn-tools'); previewTools.append(el('span', 'fn-pane-title', 'READING'));
const follow = el('input'); follow.type = 'checkbox'; follow.checked = false; const followLabel = el('label', 'fn-follow', 'Follow selection'); followLabel.prepend(follow);
const reveal = button('Show selected passage', () => { if (selected) send({ kind: 'reveal', id: selected }); }); previewTools.append(reveal, followLabel);
const frame = el('iframe', 'fn-preview'); frame.title = 'Fraction reading preview'; frame.src = '/reader/fraction-notebook-preview/';
const split = el('div', 'fn-divider'); split.tabIndex = 0; split.setAttribute('role', 'separator'); split.setAttribute('aria-orientation', 'vertical'); split.setAttribute('aria-label', 'Notebook width');
split.setAttribute('aria-valuemin', '30'); split.setAttribute('aria-valuemax', '70'); split.setAttribute('aria-valuenow', '50');
let splitPercent = 50;
const resize = (percent: number) => { splitPercent = Math.max(30, Math.min(70, percent)); workspace.style.setProperty('--notebook-width', `${splitPercent}%`); split.setAttribute('aria-valuenow', String(Math.round(splitPercent))); };
split.onpointerdown = event => { split.setPointerCapture(event.pointerId); };
split.onpointermove = event => { if (split.hasPointerCapture(event.pointerId)) { const rect = workspace.getBoundingClientRect(); resize((event.clientX - rect.left) / rect.width * 100); } };
split.onpointerup = event => split.releasePointerCapture(event.pointerId);
split.onkeydown = event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); resize(splitPercent + (event.key === 'ArrowLeft' ? -2 : 2)); } };
left.append(tools, editorHost); right.append(previewTools, frame); workspace.append(left, split, right); root.append(header, status, workspace);
const editor = mountFractionEditor(editorHost, notebook, changed, id => { const moved = selected !== id; selected = id; inspector?.refresh(); structure?.refresh(); if (moved && follow.checked) send({ kind: 'reveal', id }); }, name => { mode.textContent = name.toUpperCase(); });
tools.append(button('Bold', () => editor.mark('strong')), button('Italic', () => editor.mark('em')), button('Code', () => editor.mark('code')),
  button('Undo', () => editor.undo()), button('Redo', () => editor.redo()), button('Add author', () => { addAuthor(editor.view); editor.run(setVimMode('insert')); }), mode,
  button('Annotate', () => { try { details(true, annotateSelection(editor.view)); } catch (error) { status.textContent = String(error); } }));
inspector = mountInspector(left, editor.view);
structure = mountStructureControls(left, editor.view, message => { status.textContent = message; });
left.insertBefore(left.querySelector('.fn-structure')!, editorHost);
const hint = el('p', 'fn-writing-hint', 'i to write · Esc for Normal · h j k l / w b to move · v to select · u / Ctrl-r to undo/redo · Tab to nest · Alt-↑↓ to move.');
left.insertBefore(hint, editorHost);
const cellDetails = el('p', 'fn-cell-details'); left.append(cellDetails);
function setEditing(enabled: boolean) {
  root.classList.toggle('fn-editing', enabled); editToggle.setAttribute('aria-pressed', String(enabled));
  sessionStorage.setItem('kp.fraction-editing', String(enabled));
  if (enabled) { editor.normal(); editor.view.focus(); }
}
setEditing(sessionStorage.getItem('kp.fraction-editing') === 'true');
function send(data: Record<string, unknown>) { frame.contentWindow?.postMessage({ protocol: 'kp.fraction-notebook.v1', ...data }, location.origin); }
function changed(doc: ProseNode) {
  generation++; request?.abort(); clearTimeout(timer);
  try {
    const basis = notebook.revision; notebook = fromProse(doc, notebook); const draft = notebook;
    try { sessionStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* The persistent save still runs. */ }
    saving = saving.then(async () => {
      if (!store || storedError) return;
      await store.save(basis, draft);
      if (draft.revision === notebook.revision) sessionStorage.removeItem(storageKey);
    }).catch(error => { storedError = String(error); status.textContent = storedError; });
    status.textContent = storedError ?? 'Saving draft · checking preview…'; status.dataset['state'] = 'checking';
    timer = setTimeout(() => { void prepare(); }, 300);
  } catch (error) { status.textContent = `${String(error)} Last valid preview retained. Undo to recover the supported structure.`; status.dataset['state'] = 'invalid'; }
}
async function prepare(value: FractionNotebook = notebook, restoration = false) {
  const token = ++generation; request?.abort(); request = new AbortController();
  try {
    const response = await fetch('/api/dev/fraction-notebook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value), signal: request.signal });
    const data: unknown = await response.json();
    if (disposed || token !== generation) return;
    if (!response.ok) throw new Error(String(object(data)['error'] ?? 'Preview could not be prepared.'));
    const valid = object(data), checked = readNotebook(valid['notebook']);
    await saving;
    if (disposed || token !== generation) return;
    if (store && !storedError && !restoration) await store.accept(checked.revision);
    if (disposed || token !== generation) return;
    latest = { value: data, revision: checked.revision };
    if (frameReady) send({ kind: 'apply', value: latest.value });
    if (!restoration) { status.textContent = storedError ?? 'Preview checked · waiting for the reading'; status.dataset['state'] = 'checking'; }
  } catch (error) {
    if (disposed || token !== generation || (error instanceof DOMException && error.name === 'AbortError')) return;
    status.textContent = `${error instanceof Error ? error.message : String(error)} Last valid preview retained.`; status.dataset['state'] = 'invalid';
  }
}
const onMessage = (event: MessageEvent) => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow || !event.data || event.data.protocol !== 'kp.fraction-notebook.v1') return;
  const data = event.data;
  if (data.kind === 'ready') { frameReady = true; if (latest) send({ kind: 'apply', value: latest.value }); }
  if (data.kind === 'applied' && latest?.revision === data.revision && notebook.revision === data.revision) { status.textContent = storedError ?? 'Saved in this browser · preview up to date'; status.dataset['state'] = 'valid'; }
  if (data.kind === 'error') { status.textContent = String(data.message); status.dataset['state'] = 'invalid'; }
  if (data.kind === 'select' && typeof data.id === 'string') editor.reveal(data.id);
};
window.addEventListener('message', onMessage);
cellDetails.textContent = `Notebook ${notebook.id} · source: fractional-linear-reasoning · local draft; original reading unchanged`;
void (async () => { if (lastValid.revision !== notebook.revision) await prepare(lastValid, true); if (!disposed) await prepare(); })();
function dispose() { if (disposed) return; disposed = true; clearTimeout(timer); request?.abort(); window.removeEventListener('message', onMessage); inspector?.dispose(); editor.dispose(); void saving.finally(() => store?.close()); }
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(dispose);
