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
import { mountModeline } from './modeline.ts';
import { mountFruitPicker } from './fruit-picker.ts';
import { mountCommandPicker } from './command-picker.ts';
import { mountVimCoverage } from './vim-coverage-panel.ts';
import { CommandRegistry, available, unavailable, type Availability, type CommandScope } from '../editor-commands/registry.ts';
import './windows.css';
import './modeline.css';
import './active-line.css';
import './fruit-picker.css';

const root = document.querySelector<HTMLElement>('#app')!;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; return node; };
const registry = new CommandRegistry(() => ({ scope: root.querySelector('.kp-editor-body')?.getAttribute('data-active-window') === 'chat' ? 'chat' : 'notebook',
  element: document.activeElement instanceof HTMLElement ? document.activeElement : null }), message => reportStatus(message, 'invalid'));
const commandKeys: Readonly<Record<string, string[]>> = { 'notebook.bold': ['Ctrl/⌘-b'], 'notebook.italic': ['Ctrl/⌘-i'], 'notebook.undo': ['Ctrl/⌘-z'], 'notebook.redo': ['Ctrl/⌘-Shift-z'], 'animation.run': ['Shift-Enter', ':run'], 'animation.close-source': ['Ctrl/⌘-Enter'], 'workspace.help': [':h'] };
const button = (text: string, action: () => unknown, id: string, scope: CommandScope = 'notebook', state?: () => Availability) => {
  const node = el('button', '', text); node.type = 'button';
  registry.add({ id, title: text.replace(' · Shift-Enter', ''), category: scope === 'workspace' ? 'Workspace' : 'Notebook', scope,
    keys: commandKeys[id] ?? [],
    ...(state ? { state } : {}), run: action }).bind(node); return node;
};
const notebookKind = new URLSearchParams(location.search).get('notebook');
const mathModule = notebookKind === 'matrix' ? await import('./matrix-notebook.ts') : notebookKind === 'quadratic' ? await import('./math-notebook.ts') : undefined;
const storageKey = notebookKind === 'matrix' ? 'kp.matrix-notebook.v1' : mathModule ? 'kp.mathematical-notebook.v1' : 'kp.fraction-notebook.v3';
let notebook = mathModule?.seed ?? importFractionReading(canonical).notebook;
let lastValid = notebook;
let store: Awaited<ReturnType<typeof openFractionDraft>> | undefined;
let storedError: string | undefined;
try {
  store = mathModule ? await openFractionDraft(notebook, notebookKind === 'matrix' ? 'kp-matrix-notebook-v1' : 'kp-mathematical-notebook-v1', null) : await openFractionDraft(notebook);
  const saved = await store.read(); notebook = saved.draft; lastValid = saved.lastValid;
  const recovery = sessionStorage.getItem(storageKey) ?? (mathModule ? null : sessionStorage.getItem('kp.fraction-notebook.v2') ?? sessionStorage.getItem('kp.fraction-notebook.v1'));
  if (recovery) {
    const draft = readNotebook(JSON.parse(recovery));
    sessionStorage.setItem(storageKey, JSON.stringify(draft));
    if (!mathModule) { sessionStorage.removeItem('kp.fraction-notebook.v1'); sessionStorage.removeItem('kp.fraction-notebook.v2'); }
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
registry.add({ id: 'notebook.open-mathematics', title: mathModule ? 'Open fraction notebook' : 'Open mathematical notebook', category: 'Notebook', scope: 'notebook', keywords: ['quadratic', 'polynomial', 'graph'],
  run: async () => { await saving; if (storedError) throw new Error(storedError); location.assign(mathModule ? '/experiments/fraction-notebook/' : '/experiments/fraction-notebook/?notebook=quadratic'); } });
registry.add({ id: 'notebook.open-matrix', title: 'Open matrix notebook', category: 'Notebook', scope: 'notebook', keywords: ['linear algebra', 'vector', 'product'],
  state: () => notebookKind === 'matrix' ? unavailable('This notebook is already open') : available(),
  run: async () => { await saving; if (storedError) throw new Error(storedError); location.assign('/experiments/fraction-notebook/?notebook=matrix'); } });
if (notebookKind === 'matrix') registry.add({ id: 'notebook.open-quadratic', title: 'Open quadratic notebook', category: 'Notebook', scope: 'notebook', keywords: ['polynomial', 'tangent'],
  run: async () => { await saving; if (storedError) throw new Error(storedError); location.assign('/experiments/fraction-notebook/?notebook=quadratic'); } });
header.hidden = sessionStorage.getItem('kp.workspace.header') !== 'true';
registry.add({ id: 'workspace.toggle-header', title: 'Toggle site header', category: 'Workspace', scope: 'workspace',
  state: () => available(!header.hidden), run: () => { header.hidden = !header.hidden; sessionStorage.setItem('kp.workspace.header', String(!header.hidden)); } });
const wordmark = el('a', 'fn-wordmark', 'Kinetic Press'); wordmark.href = '/'; branding.append(wordmark);
const editToggle = button('Edit', () => setEditing(!root.classList.contains('fn-editing')), 'notebook.toggle-editing', 'notebook', () => available(root.classList.contains('fn-editing'))); editToggle.setAttribute('aria-pressed', 'false'); branding.append(editToggle);
const actions = el('div', 'fn-header-actions'), status = el('p', 'fn-status', storedError ?? 'Opening your local notebook…'); status.setAttribute('role', 'status');
function reportStatus(message: string, state: 'checking' | 'pending' | 'valid' | 'invalid' | 'notice' = 'notice') {
  // Persistent-save failures remain visible even if a later preview succeeds.
  status.textContent = storedError ?? message;
  status.dataset['state'] = storedError ? 'invalid' : state;
  status.title = status.textContent;
}
reportStatus('Opening your local notebook…', 'checking');
const writing = el('details', 'fn-menu fn-writing fn-edit-control'), writingSummary = el('summary', '', 'Writing');
const writingPanel = el('div', 'fn-menu-panel'); writing.append(writingSummary, writingPanel);
const readingOptions = button('Reading options', () => {
  if (root.classList.contains('fn-editing') && !editor.sourceOpen()) { editorHost.querySelector('.fn-animation-slot')?.scrollIntoView({ block: 'center' }); layout.refresh(); }
  send({ kind: 'options', open: readingOptions.getAttribute('aria-expanded') !== 'true' });
}, 'notebook.reading-options', 'notebook', () => mathModule ? unavailable('Use each mathematical object’s controls') : frameReady ? available(readingOptions.getAttribute('aria-expanded') === 'true') : unavailable('Reading is loading'));
readingOptions.setAttribute('aria-expanded', 'false'); readingOptions.disabled = true;
const download = button('Download JSON', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' })); const a = el('a'); a.href = url; a.download = mathModule ? 'mathematical-notebook.json' : 'fraction-notebook.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }, 'notebook.export-json');
const details = (show: boolean, id?: string) => { root.classList.toggle('fn-details', show); metadata.setAttribute('aria-pressed', String(show)); metadata.textContent = show ? 'Hide details' : 'Show details'; inspector?.show(show, id); };
const metadata = button('Show details', () => details(!root.classList.contains('fn-details')), 'notebook.toggle-details', 'notebook', () => available(root.classList.contains('fn-details'))); metadata.setAttribute('aria-pressed', 'false');
const reference = el('a', '', 'Original reading ↗'); reference.href = '/reader/solve-fractional-linear/?reading=reasoning'; reference.target = '_blank'; reference.rel = 'noopener';
writingPanel.append(metadata, download, reference); actions.append(writing, readingOptions); header.append(branding, status, actions);
const workspace = el('div', 'fn-workspace'), left = el('section', 'fn-left'), right = el('section', 'fn-right');
const sourcePane = el('section', 'fn-source-pane'); sourcePane.setAttribute('aria-label', 'Animation source buffer');
const sourceTools = el('div', 'fn-source-tools'), sourceHost = el('div', 'fn-source-host');
const runButton = button('Run · Shift-Enter', () => runSource(), 'animation.run', 'notebook', () => mathModule ? unavailable('Mathematical fields update directly') : available()), closeBuffer = button('Close buffer', () => editor.closeSource(), 'animation.close-source', 'notebook', () => root.classList.contains('fn-focus') ? available() : unavailable('Animation source is closed'));
const resultStatus = el('p', 'fn-result-status'); resultStatus.setAttribute('role', 'status');
sourceTools.append(runButton, closeBuffer); sourcePane.append(sourceTools, sourceHost);
left.setAttribute('aria-label', 'Editable notebook'); right.setAttribute('aria-label', 'Reading preview');
const tools = el('div', 'fn-tools');
const editorHost = el('div', 'fn-editor');
const previewTools = el('div', 'fn-tools');
const follow = el('input'); follow.type = 'checkbox'; follow.checked = false; const followLabel = el('label', 'fn-follow', 'Follow selection'); followLabel.prepend(follow);
const reveal = button('Show selected passage', () => { if (selected) send({ kind: 'reveal', id: selected }); }, 'notebook.reveal-selection', 'notebook', () => selected ? available() : unavailable('Select a passage')); previewTools.append(reveal, followLabel);
const frame = el('iframe', 'fn-preview'); frame.title = mathModule ? 'Mathematical reading preview' : 'Fraction reading preview';
frame.src = mathModule ? `/experiments/fraction-notebook/math-preview.html${notebookKind === 'matrix' ? '?notebook=matrix' : ''}` : '/reader/fraction-notebook-preview/?surface=window';
// A bookmark names the real passage. Let the reader restore its native state
// and commentary instead of treating the iframe as a separate address space.
if (!mathModule && window.location.hash) frame.src += window.location.hash;
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
pageWindow.tabIndex = -1;
workspace.append(left, sourcePane, split, right); pageWindow.append(workspace); editorBody.append(pageWindow); root.append(header, editorBody);
const mathematics = mathModule?.createMathematicalExtension(notebook, registry, message => reportStatus(message, 'invalid'));
const editor = mountFractionEditor(editorHost, notebook, changed, id => { const moved = selected !== id; selected = id; inspector?.refresh(); structure?.refresh(); registry.notify(); if (moved && follow.checked) send({ kind: 'reveal', id }); }, undefined, {
  host: sourceHost, run: runSource,
  open() { root.classList.add('fn-focus'); split.inert = false; layout.refresh(); registry.notify(); },
  close() { root.classList.remove('fn-focus'); split.inert = true; layout.refresh(); registry.notify(); }
}, registry, id => structure?.fold(id), mathematics?.extension);
registry.add({ id: 'animation.toggle-source', title: 'Edit animation source', category: 'Notebook', scope: 'notebook', keywords: ['JSON', 'specification'], state: () => mathModule ? unavailable('Use the mathematical object’s fields') : available(editor.sourceOpen()), run: () => { if (!root.classList.contains('fn-editing')) setEditing(true); editor.toggleSource(); } });
const layout = mountWorkspace(root, workspace, left, editorHost, right);
const windows = mountWindows(editorBody, registry);
const focused = new Map<string, HTMLElement>();
const rememberFocus = (event: FocusEvent) => { if (event.target instanceof HTMLElement) { const pane = event.target.closest<HTMLElement>('[data-kp-window]'); if (pane?.dataset['kpWindow']) focused.set(pane.dataset['kpWindow'], event.target); } };
document.addEventListener('focusin', rememberFocus);
windows.register('page', pageWindow, () => {
  if (editor.sourceOpen()) sourceHost.querySelector<HTMLElement>('.cm-content')?.focus({ preventScroll: true });
  else if (root.classList.contains('fn-editing')) editor.view.focus();
  // Until the iframe installs its keyboard bridge, keep shortcuts in the host.
  else if (frameReady) frame.focus({ preventScroll: true });
  else if (!header.hidden) editToggle.focus({ preventScroll: true });
  else pageWindow.focus({ preventScroll: true });
});
const chat = mountChat(editorBody, actions, () => layout.refresh(), {
  attach: (element, focus) => windows.register('chat', element, focus),
  active: () => windows.active('chat'),
  activate: () => windows.activate('chat'), cycle: () => windows.cycle(), closed: () => windows.activate('page')
}, registry);
const styles = mountStyles(workspace, settings => { send({ kind: 'styles', settings }); layout.refresh(); }, registry);
const modeline = mountModeline(root, windows, status);
const captureReturn = () => {
  const { active, windows: panes } = windows.snapshot(), pane = panes.find(entry => entry.id === active)?.element;
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const previous = activeElement && (header.contains(activeElement) || modeline.element.contains(activeElement)) ? focused.get(active) ?? null : activeElement;
  const chatReturn = active === 'chat' ? chat.capture(previous) : undefined;
  const scroll = [...(pane?.querySelectorAll<HTMLElement>('.fn-editor, .cm-scroller, .kp-chat-history, .kp-chat-draft, .kp-chat-notes') ?? [])]
    .map(element => ({ element, top: element.scrollTop, left: element.scrollLeft }));
  return { origin: { scope: active === 'chat' ? 'chat' as const : 'notebook' as const, element: previous,
    ...(chatReturn ? { valid: chatReturn.valid } : {}) }, restore: () => {
    windows.activate(active, true);
    if (chatReturn) chatReturn.restore();
    else if (previous?.isConnected && previous.closest('input, textarea, select, .cm-content, iframe') && !previous.closest('[hidden]')) previous.focus({ preventScroll: true });
    for (const { element, top, left } of scroll) if (element.isConnected) { element.scrollTop = top; element.scrollLeft = left; }
  } };
};
const picker = mountFruitPicker(root, actions, () => captureReturn().restore, registry, message => reportStatus(message));
const commandPicker = mountCommandPicker(root, actions, registry, captureReturn);
const vimCoverage = mountVimCoverage(root, registry, captureReturn);
actions.append(button('Styles', () => styles.toggle(), 'workspace.open-styles', 'workspace'));
const numbers = mountLineNumbers(editorHost, editor.view);
const commands = mountCommands(workspace, editor.view, {
  async save() {
    await saving;
    if (storedError || !store) throw new Error(storedError ?? 'Persistent storage is unavailable; download JSON to retain this draft.');
    reportStatus(pendingSource() ? 'Source changes need Run' : 'Saved locally · preview up to date', pendingSource() ? 'pending' : 'valid');
  },
  close() { if (editor.sourceOpen()) editor.closeSource(); else setEditing(false); }, run: runSource,
  numbers(value) { numbers.set(value); editor.numbers(value); }, message(text) { reportStatus(text); }
}, registry);
actions.append(button('Help', () => commands.help(), 'workspace.help', 'workspace'));
tools.append(button('Bold', () => editor.mark('strong'), 'notebook.bold', 'notebook', () => editor.canMark('strong') ? available() : unavailable('Select editable prose')), button('Italic', () => editor.mark('em'), 'notebook.italic', 'notebook', () => editor.canMark('em') ? available() : unavailable('Select editable prose')), button('Code', () => editor.mark('code'), 'notebook.code', 'notebook', () => editor.canMark('code') ? available() : unavailable('Select editable prose')),
  button('Undo', () => editor.undo(), 'notebook.undo', 'notebook', () => editor.canUndo() ? available() : unavailable('Nothing to undo')), button('Redo', () => editor.redo(), 'notebook.redo', 'notebook', () => editor.canRedo() ? available() : unavailable('Nothing to redo')), button('Add author', () => { addAuthor(editor.view); editor.run(setVimMode('insert')); }, 'notebook.add-author'),
  button('Annotate', () => { details(true, annotateSelection(editor.view)); }, 'notebook.annotate', 'notebook', () => editor.view.state.selection.empty ? unavailable('Select text to annotate') : available()));
inspector = mountInspector(left, editor.view, registry);
structure = mountStructureControls(actions, editor.view, message => reportStatus(message), registry);
actions.querySelector('.fn-structure')!.classList.add('fn-menu', 'fn-edit-control');
actions.querySelector('.fn-structure-controls')!.classList.add('fn-menu-panel');
// Tools belong to the single masthead. Their actions retain the editor's
// selection, then dismiss so a popup cannot cover the passage being edited.
header.addEventListener('click', event => {
  const control = event.target instanceof Element ? event.target.closest('button,summary,select') : null;
  // Workspace commands borrow focus without changing the active pane.
  if (control && !control.hasAttribute('data-workspace-command') && control.getAttribute('aria-controls') !== 'kp-chat') windows.activate('page');
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
  if (!enabled) { details(false); writing.open = false; actions.querySelector('details.fn-structure')?.removeAttribute('open'); }
  // Layout clears the document's inert state before it can receive focus.
  // Requesting focus first leaves keyboard input on the reading container.
  send({ kind: 'presentation', animationOnly: enabled }); layout.refresh();
  if (enabled) { editor.normal(); editor.view.focus(); }
  else if (!header.hidden) editToggle.focus();
  else if (frameReady) frame.focus({ preventScroll: true });
  else pageWindow.focus({ preventScroll: true });
}
setEditing(new URL(location.href).searchParams.get('reading') === '1' ? false : sessionStorage.getItem('kp.fraction-editing') !== 'false');
windows.restore();
function send(data: Record<string, unknown>) { frame.contentWindow?.postMessage({ protocol: 'kp.fraction-notebook.v1', ...data }, location.origin); }
const sourceOf = (value: FractionNotebook) => value.cells.find(cell => cell.type === 'story')?.source;
function pendingSource() { return sourceOf(notebook) !== sourceOf(lastValid); }
function runSource() { clearTimeout(timer); void prepare(); }
function pendingMessage() {
  resultStatus.textContent = 'Previous result · source changes have not run';
  reportStatus('Draft retained · source changes need Run', 'pending');
}
function changed(doc: ProseNode) {
  registry.notify();
  generation++; request?.abort(); clearTimeout(timer);
  try {
    const basis = notebook.revision, previousSource = sourceOf(notebook); notebook = fromProse(doc, notebook); const draft = notebook;
    try { sessionStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* The persistent save still runs. */ }
    saving = saving.then(async () => {
      if (!store || storedError) return;
      await store.save(basis, draft);
      if (draft.revision === notebook.revision) sessionStorage.removeItem(storageKey);
    }).catch(error => { storedError = String(error); reportStatus(storedError, 'invalid'); });
    reportStatus('Saving draft · checking preview…', 'checking');
    if (pendingSource()) {
      pendingMessage();
      // Text/caption edits can update against the last admitted source. This
      // projection is never accepted as the persisted draft's runnable revision.
      const source = sourceOf(lastValid);
      if (source !== undefined && previousSource === sourceOf(draft)) timer = setTimeout(() => { void prepare({ ...notebook, cells: notebook.cells.map(cell => cell.type === 'story' ? { ...cell, source } : cell) }, false, false); }, 300);
    } else timer = setTimeout(() => { void prepare(); }, 300);
  } catch (error) { reportStatus(`${String(error)} Last valid preview retained. Undo to recover the supported structure.`, 'invalid'); }
}
async function prepare(value: FractionNotebook = notebook, restoration = false, accept = true) {
  const token = ++generation; request?.abort(); request = new AbortController();
  try {
    let data: unknown;
    if (mathModule) data = mathModule.prepare(value);
    else {
      const response = await fetch('/api/dev/fraction-notebook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value), signal: request.signal });
      data = await response.json();
      if (disposed || token !== generation) return;
      if (!response.ok) throw new Error(String(object(data)['error'] ?? 'Preview could not be prepared.'));
    }
    const valid = object(data), checked = readNotebook(valid['notebook']);
    await saving;
    if (disposed || token !== generation) return;
    if (store && !storedError && !restoration && accept) await store.accept(checked.revision);
    if (disposed || token !== generation) return;
    latest = { value: data, revision: checked.revision };
    if (accept && !restoration) lastValid = checked;
    if (frameReady) send({ kind: 'apply', value: latest.value });
    if (!restoration) reportStatus(mathModule ? 'Saved locally · mathematical views up to date' : 'Preview checked · waiting for the reading', mathModule ? 'valid' : 'checking');
    if (pendingSource()) pendingMessage();
  } catch (error) {
    if (disposed || token !== generation || (error instanceof DOMException && error.name === 'AbortError')) return;
    reportStatus(`${error instanceof Error ? error.message : String(error)} Last valid preview retained.`, 'invalid');
    resultStatus.textContent = `Previous result · ${error instanceof Error ? error.message : String(error)}`;
  }
}
const onMessage = (event: MessageEvent) => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow || !event.data || event.data.protocol !== 'kp.fraction-notebook.v1') return;
  const data = event.data;
  // A recovering draft can finish checking before the iframe mounts. Commands
  // become available only after its listener acknowledges readiness.
  if (data.kind === 'ready') { frameReady = true; readingOptions.disabled = false; registry.notify(); send({ kind: 'styles', settings: styles.settings() }); send({ kind: 'presentation', animationOnly: root.classList.contains('fn-editing') }); if (latest) send({ kind: 'apply', value: latest.value }); }
  if (data.kind === 'applied' && latest?.revision === data.revision && notebook.revision === data.revision) {
    if (pendingSource()) pendingMessage();
    else { reportStatus('Saved in this browser · preview up to date', 'valid'); resultStatus.textContent = ''; }
  }
  if (data.kind === 'error') reportStatus(String(data.message), 'invalid');
  if (data.kind === 'options-state') readingOptions.setAttribute('aria-expanded', String(data.open === true));
  if (data.kind === 'window-focus') windows.activate('page');
  if (data.kind === 'window-cycle') windows.cycle(data.reverse === true);
  if (data.kind === 'commands-open') { windows.activate('page'); commandPicker.open(); }
  if (data.kind === 'select' && typeof data.id === 'string') editor.reveal(data.id);
};
window.addEventListener('message', onMessage);
cellDetails.textContent = `Notebook ${notebook.id} · source: ${mathModule ? 'mathematical objects' : 'fractional-linear-reasoning'} · local draft; original reading unchanged`;
void (async () => { if (lastValid.revision !== notebook.revision) await prepare(lastValid, true); if (!disposed) { if (pendingSource()) pendingMessage(); else await prepare(); } })();
function dispose() { if (disposed) return; disposed = true; clearTimeout(timer); request?.abort(); window.removeEventListener('message', onMessage); document.removeEventListener('focusin', rememberFocus); document.removeEventListener('pointerdown', dismissMenus); document.removeEventListener('keydown', dismissMenus); vimCoverage.dispose(); commandPicker.dispose(); picker.dispose(); modeline.dispose(); chat.dispose(); windows.dispose(); structure?.dispose(); inspector?.dispose(); numbers.dispose(); commands.dispose(); editor.dispose(); mathematics?.dispose(); layout.dispose(); styles.dispose(); registry.dispose(); void saving.finally(() => store?.close()); }
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(dispose);
