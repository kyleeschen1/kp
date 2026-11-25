import 'prosemirror-view/style/prosemirror.css';
import '@fontsource/source-serif-4/latin-300.css';
import '@fontsource/source-serif-4/latin-300-italic.css';
import '@fontsource/source-serif-4/latin-500.css';
import '@fontsource/source-serif-4/latin-600.css';
import 'katex/dist/katex.min.css';
import './style.css';
import './focused.css';
import './theme.css';
import canonical from '../../content/authoring/algebra/fractional-linear-reasoning.article.md?raw';
import { importFractionReading, readNotebook, object, type FractionNotebook } from './model.ts';
import { fromProse, mountFractionEditor } from './editor.ts';
import { openFractionDraft } from './storage.ts';
import { addAuthor, annotateSelection, mountInspector } from './inspector.ts';
import type { Node as ProseNode } from 'prosemirror-model';
import { mountStructureControls } from './structure-controls.ts';
import { setVimMode } from './vim.ts';
import { mountWorkspace } from './workspace.ts';
import { mountStyles } from './styles.ts';
import { mountCommands } from './commands.ts';
import { mountLineNumbers } from './numbers.ts';
import { mountChat } from '../editor-chat/panel.ts';
import { mountWindows } from './windows.ts';
import './windows.css';

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
const writing = el('details', 'fn-menu fn-writing fn-edit-control'), writingSummary = el('summary', '', 'Writing');
const writingPanel = el('div', 'fn-menu-panel'); writing.append(writingSummary, writingPanel);
const readingOptions = button('Reading options', () => {
  if (root.classList.contains('fn-editing') && !editor.sourceOpen()) { editorHost.querySelector('.fn-animation-slot')?.scrollIntoView({ block: 'center' }); layout.refresh(); }
  send({ kind: 'options', open: readingOptions.getAttribute('aria-expanded') !== 'true' });
});
readingOptions.setAttribute('aria-expanded', 'false'); readingOptions.disabled = true;
const download = button('Download JSON', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' })); const a = el('a'); a.href = url; a.download = 'fraction-notebook.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
const details = (show: boolean, id?: string) => { root.classList.toggle('fn-details', show); metadata.setAttribute('aria-pressed', String(show)); metadata.textContent = show ? 'Hide details' : 'Show details'; inspector?.show(show, id); };
const metadata = button('Show details', () => details(!root.classList.contains('fn-details'))); metadata.setAttribute('aria-pressed', 'false');
const reference = el('a', '', 'Original reading ↗'); reference.href = '/reader/solve-fractional-linear/?reading=reasoning'; reference.target = '_blank'; reference.rel = 'noopener';
writingPanel.append(metadata, download, reference); actions.append(writing, readingOptions); header.append(branding, status, actions);
const workspace = el('div', 'fn-workspace'), left = el('section', 'fn-left'), right = el('section', 'fn-right');
const sourcePane = el('section', 'fn-source-pane'); sourcePane.setAttribute('aria-label', 'Animation source buffer');
const sourceTools = el('div', 'fn-source-tools'), sourceHost = el('div', 'fn-source-host');
const runButton = button('Run · Shift-Enter', () => runSource()), closeBuffer = button('Close buffer', () => editor.closeSource());
const resultStatus = el('p', 'fn-result-status'); resultStatus.setAttribute('role', 'status');
sourceTools.append(runButton, closeBuffer); sourcePane.append(sourceTools, sourceHost);
left.setAttribute('aria-label', 'Editable notebook'); right.setAttribute('aria-label', 'Reading preview');
const tools = el('div', 'fn-tools');
const editorHost = el('div', 'fn-editor');
const mode = button('NORMAL', () => editor.toggleMode()); mode.onmousedown = event => event.preventDefault();
mode.className = 'fn-vim-mode fn-edit-control'; mode.setAttribute('aria-label', 'Vim mode'); branding.append(mode);
const previewTools = el('div', 'fn-tools');
const follow = el('input'); follow.type = 'checkbox'; follow.checked = false; const followLabel = el('label', 'fn-follow', 'Follow selection'); followLabel.prepend(follow);
const reveal = button('Show selected passage', () => { if (selected) send({ kind: 'reveal', id: selected }); }); previewTools.append(reveal, followLabel);
const frame = el('iframe', 'fn-preview'); frame.title = 'Fraction reading preview'; frame.src = '/reader/fraction-notebook-preview/?surface=window';
const split = el('div', 'fn-divider'); split.tabIndex = 0; split.setAttribute('role', 'separator'); split.setAttribute('aria-orientation', 'vertical'); split.setAttribute('aria-label', 'Notebook width');
split.setAttribute('aria-valuemin', '30'); split.setAttribute('aria-valuemax', '70'); split.setAttribute('aria-valuenow', '50');
let splitPercent = 50;
const resize = (percent: number) => { splitPercent = Math.max(30, Math.min(70, percent)); workspace.style.setProperty('--notebook-width', `${splitPercent}%`); split.setAttribute('aria-valuenow', String(Math.round(splitPercent))); layout.refresh(); };
split.onpointerdown = event => { split.setPointerCapture(event.pointerId); };
split.onpointermove = event => { if (split.hasPointerCapture(event.pointerId)) { const rect = workspace.getBoundingClientRect(); resize((event.clientX - rect.left) / rect.width * 100); } };
split.onpointerup = event => split.releasePointerCapture(event.pointerId);
split.onkeydown = event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); resize(splitPercent + (event.key === 'ArrowLeft' ? -2 : 2)); } };
left.append(editorHost); right.append(resultStatus, frame); writingPanel.prepend(tools); writingPanel.append(previewTools);
const editorBody = el('div', 'kp-editor-body');
const pageWindow = el('section', 'kp-page-window'); pageWindow.setAttribute('aria-label', 'KP page');
workspace.append(left, sourcePane, split, right); pageWindow.append(workspace); editorBody.append(pageWindow); root.append(header, editorBody);
const editor = mountFractionEditor(editorHost, notebook, changed, id => { const moved = selected !== id; selected = id; inspector?.refresh(); structure?.refresh(); if (moved && follow.checked) send({ kind: 'reveal', id }); }, name => { mode.textContent = name.toUpperCase(); }, {
  host: sourceHost, run: runSource,
  open() { root.classList.add('fn-focus'); split.inert = false; layout.refresh(); },
  close() { root.classList.remove('fn-focus'); split.inert = true; layout.refresh(); }
});
const layout = mountWorkspace(root, workspace, left, editorHost, right);
const windows = mountWindows(editorBody);
windows.register('page', pageWindow, () => {
  if (editor.sourceOpen()) sourceHost.querySelector<HTMLElement>('.cm-content')?.focus({ preventScroll: true });
  else if (root.classList.contains('fn-editing')) editor.view.focus();
  // Until the iframe installs its keyboard bridge, keep shortcuts in the host.
  else if (frameReady) frame.focus({ preventScroll: true });
  else editToggle.focus({ preventScroll: true });
});
const chat = mountChat(editorBody, actions, () => layout.refresh(), {
  attach: (element, focus) => windows.register('chat', element, focus),
  active: () => windows.active('chat'),
  activate: () => windows.activate('chat'), cycle: () => windows.cycle(), closed: () => windows.activate('page')
});
const styles = mountStyles(workspace, settings => { send({ kind: 'styles', settings }); layout.refresh(); });
actions.append(button('Styles', () => styles.toggle()));
const numbers = mountLineNumbers(editorHost, editor.view);
const commands = mountCommands(workspace, editor.view, {
  async save() {
    await saving;
    if (storedError || !store) throw new Error(storedError ?? 'Persistent storage is unavailable; download JSON to retain this draft.');
    status.textContent = pendingSource() ? 'Saved locally · source changes need Run' : 'Saved locally · preview up to date';
  },
  close() { if (editor.sourceOpen()) editor.closeSource(); else setEditing(false); }, run: runSource,
  numbers(value) { numbers.set(value); editor.numbers(value); }, message(text) { status.textContent = text; }
});
actions.append(button('Help', () => commands.help()));
tools.append(button('Bold', () => editor.mark('strong')), button('Italic', () => editor.mark('em')), button('Code', () => editor.mark('code')),
  button('Undo', () => editor.undo()), button('Redo', () => editor.redo()), button('Add author', () => { addAuthor(editor.view); editor.run(setVimMode('insert')); }),
  button('Annotate', () => { try { details(true, annotateSelection(editor.view)); } catch (error) { status.textContent = String(error); } }));
inspector = mountInspector(left, editor.view);
structure = mountStructureControls(actions, editor.view, message => { status.textContent = message; });
actions.querySelector('.fn-structure')!.classList.add('fn-menu', 'fn-edit-control');
actions.querySelector('.fn-structure-controls')!.classList.add('fn-menu-panel');
// Tools belong to the single masthead. Their actions retain the editor's
// selection, then dismiss so a popup cannot cover the passage being edited.
header.addEventListener('click', event => {
  const control = event.target instanceof Element ? event.target.closest('button,summary,select') : null;
  if (control && control.getAttribute('aria-controls') !== 'kp-chat') windows.activate('page');
  if (event.target instanceof Element && event.target.closest('button')) event.target.closest<HTMLDetailsElement>('details.fn-menu')?.removeAttribute('open');
});
header.addEventListener('change', event => {
  if (event.target instanceof HTMLSelectElement) event.target.closest<HTMLDetailsElement>('details.fn-menu')?.removeAttribute('open');
});
const dismissMenus = (event: Event) => {
  if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
  for (const menu of header.querySelectorAll<HTMLDetailsElement>('.fn-menu[open]')) {
    if (event instanceof KeyboardEvent || (event.target instanceof Node && !menu.contains(event.target))) menu.open = false;
  }
};
document.addEventListener('pointerdown', dismissMenus); document.addEventListener('keydown', dismissMenus);
const cellDetails = el('p', 'fn-cell-details'); left.append(cellDetails);
function setEditing(enabled: boolean) {
  editor.closeSource();
  root.classList.toggle('fn-editing', enabled); editToggle.setAttribute('aria-pressed', String(enabled));
  split.inert = true; left.setAttribute('aria-hidden', String(!enabled));
  sessionStorage.setItem('kp.fraction-editing', String(enabled));
  if (enabled) { editor.normal(); editor.view.focus(); }
  else { details(false); writing.open = false; actions.querySelector('details.fn-structure')?.removeAttribute('open'); editToggle.focus(); }
  send({ kind: 'presentation', animationOnly: enabled }); layout.refresh();
}
setEditing(sessionStorage.getItem('kp.fraction-editing') !== 'false');
windows.restore();
function send(data: Record<string, unknown>) { frame.contentWindow?.postMessage({ protocol: 'kp.fraction-notebook.v1', ...data }, location.origin); }
const sourceOf = (value: FractionNotebook) => value.cells.find(cell => cell.type === 'story')?.source;
function pendingSource() { return sourceOf(notebook) !== sourceOf(lastValid); }
function runSource() { clearTimeout(timer); void prepare(); }
function pendingMessage() {
  resultStatus.textContent = 'Previous result · source changes have not run';
  status.textContent = storedError ?? 'Draft retained · source changes need Run'; status.dataset['state'] = 'pending';
}
function changed(doc: ProseNode) {
  generation++; request?.abort(); clearTimeout(timer);
  try {
    const basis = notebook.revision, previousSource = sourceOf(notebook); notebook = fromProse(doc, notebook); const draft = notebook;
    try { sessionStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* The persistent save still runs. */ }
    saving = saving.then(async () => {
      if (!store || storedError) return;
      await store.save(basis, draft);
      if (draft.revision === notebook.revision) sessionStorage.removeItem(storageKey);
    }).catch(error => { storedError = String(error); status.textContent = storedError; });
    status.textContent = storedError ?? 'Saving draft · checking preview…'; status.dataset['state'] = 'checking';
    if (pendingSource()) {
      pendingMessage();
      // Text/caption edits can update against the last admitted source. This
      // projection is never accepted as the persisted draft's runnable revision.
      const source = sourceOf(lastValid);
      if (source !== undefined && previousSource === sourceOf(draft)) timer = setTimeout(() => { void prepare({ ...notebook, cells: notebook.cells.map(cell => cell.type === 'story' ? { ...cell, source } : cell) }, false, false); }, 300);
    } else timer = setTimeout(() => { void prepare(); }, 300);
  } catch (error) { status.textContent = `${String(error)} Last valid preview retained. Undo to recover the supported structure.`; status.dataset['state'] = 'invalid'; }
}
async function prepare(value: FractionNotebook = notebook, restoration = false, accept = true) {
  const token = ++generation; request?.abort(); request = new AbortController();
  try {
    const response = await fetch('/api/dev/fraction-notebook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value), signal: request.signal });
    const data: unknown = await response.json();
    if (disposed || token !== generation) return;
    if (!response.ok) throw new Error(String(object(data)['error'] ?? 'Preview could not be prepared.'));
    const valid = object(data), checked = readNotebook(valid['notebook']);
    await saving;
    if (disposed || token !== generation) return;
    if (store && !storedError && !restoration && accept) await store.accept(checked.revision);
    if (disposed || token !== generation) return;
    latest = { value: data, revision: checked.revision };
    if (accept && !restoration) lastValid = checked;
    if (frameReady) send({ kind: 'apply', value: latest.value });
    if (!restoration) { status.textContent = storedError ?? 'Preview checked · waiting for the reading'; status.dataset['state'] = 'checking'; }
    if (pendingSource()) pendingMessage();
  } catch (error) {
    if (disposed || token !== generation || (error instanceof DOMException && error.name === 'AbortError')) return;
    status.textContent = `${error instanceof Error ? error.message : String(error)} Last valid preview retained.`; status.dataset['state'] = 'invalid';
    resultStatus.textContent = `Previous result · ${error instanceof Error ? error.message : String(error)}`;
  }
}
const onMessage = (event: MessageEvent) => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow || !event.data || event.data.protocol !== 'kp.fraction-notebook.v1') return;
  const data = event.data;
  // A recovering draft can finish checking before the iframe mounts. Commands
  // become available only after its listener acknowledges readiness.
  if (data.kind === 'ready') { frameReady = true; readingOptions.disabled = false; send({ kind: 'styles', settings: styles.settings() }); send({ kind: 'presentation', animationOnly: root.classList.contains('fn-editing') }); if (latest) send({ kind: 'apply', value: latest.value }); }
  if (data.kind === 'applied' && latest?.revision === data.revision && notebook.revision === data.revision) {
    if (pendingSource()) pendingMessage();
    else { status.textContent = storedError ?? 'Saved in this browser · preview up to date'; status.dataset['state'] = 'valid'; resultStatus.textContent = ''; }
  }
  if (data.kind === 'error') { status.textContent = String(data.message); status.dataset['state'] = 'invalid'; }
  if (data.kind === 'options-state') readingOptions.setAttribute('aria-expanded', String(data.open === true));
  if (data.kind === 'window-focus') windows.activate('page');
  if (data.kind === 'window-cycle') windows.cycle(data.reverse === true);
  if (data.kind === 'select' && typeof data.id === 'string') editor.reveal(data.id);
};
window.addEventListener('message', onMessage);
cellDetails.textContent = `Notebook ${notebook.id} · source: fractional-linear-reasoning · local draft; original reading unchanged`;
void (async () => { if (lastValid.revision !== notebook.revision) await prepare(lastValid, true); if (!disposed) { if (pendingSource()) pendingMessage(); else await prepare(); } })();
function dispose() { if (disposed) return; disposed = true; clearTimeout(timer); request?.abort(); window.removeEventListener('message', onMessage); document.removeEventListener('pointerdown', dismissMenus); document.removeEventListener('keydown', dismissMenus); chat.dispose(); windows.dispose(); inspector?.dispose(); numbers.dispose(); commands.dispose(); editor.dispose(); layout.dispose(); styles.dispose(); void saving.finally(() => store?.close()); }
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(dispose);
