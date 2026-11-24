import seedA from '../../content/notebooks/shared-matrix.json';
import seedB from '../../content/notebooks/compare-inputs.json';
import { prepareColumnFonts } from '../experiments/matrix-column-combinations/fonts.ts';
import { parseWorkspace } from './validation.ts';
import { uuid, type Notebook, type Reference, type UUID } from './model.ts';
import { openNotebookStore, type NotebookStore } from './persistence.ts';
import { resolveNotebook } from './resolve.ts';
import { element, mountNotebookView } from './view.ts';
import '../reader/app/exemplar.css';
import '../experiments/matrix-player.css';
import '../experiments/matrix-column-combinations/style.css';
import './notebook.css';

export interface EditorContext {
  readonly store: NotebookStore;
  documents(): readonly Notebook[];
  current(): Notebook;
  refresh(): Promise<void>;
  navigate(id: UUID, nodeId?: UUID): Promise<void>;
  status(message: string): void;
}
export type AttachEditor = (root: HTMLElement, controls: HTMLElement, context: EditorContext) => {
  select(source: Reference): void; dispose(): void;
};

export async function mountNotebookApp(root: HTMLElement, attachEditor?: AttachEditor) {
  const seed = parseWorkspace([seedA, seedB]);
  const store = await openNotebookStore(seed);
  let disposed = false, generation = 0, documents = await store.read();
  try { await prepareColumnFonts(); } catch (error) { store.close(); throw error; }
  const requested = new URL(location.href).searchParams.get('notebook');
  let selected = seed[1]!.id;
  try { if (requested && documents.some(d => d.id === uuid(requested))) selected = uuid(requested); } catch { /* An invalid URL cannot select an unrelated resource. */ }
  const heading = element('header', 'nb-page-heading'), eyebrow = element('p', 'nb-eyebrow', 'KINETIC PRESS · NOTEBOOK LAB');
  const title = element('h1'), help = element('p', 'nb-help', attachEditor ? 'Compose locally. Reuse deliberately. Keep your place.' : 'Read, fold and explore. Each animation has its own place.');
  const toolbar = element('nav', 'nb-toolbar'), chooser = element('select'), chooserLabel = element('label', '', 'Notebook ');
  chooser.setAttribute('aria-label', 'Notebook'); chooserLabel.append(chooser);
  const alternate = element('a', '', attachEditor ? 'Open reader' : 'Open editor'); toolbar.append(chooserLabel, alternate);
  const revision = element('span', 'nb-provenance'); toolbar.append(revision);
  const controls = element('div', 'nb-document-controls'), status = element('p', 'nb-status'); status.setAttribute('role', 'status');
  const grid = element('div', 'nb-layout'), outline = element('nav', 'nb-outline'), article = element('main', 'nb-document'), inspector = element('aside', 'nb-inspector');
  outline.setAttribute('aria-label', 'Notebook outline'); inspector.setAttribute('aria-label', 'Block editor');
  heading.append(eyebrow, title, help, toolbar, controls, status); grid.append(outline, article); if (attachEditor) grid.append(inspector);
  root.replaceChildren(heading, grid); root.dataset['mode'] = attachEditor ? 'editor' : 'reader';
  let editor: ReturnType<AttachEditor> | undefined, view: ReturnType<typeof mountNotebookView> | undefined, viewed: UUID | undefined;
  const current = () => documents.find(d => d.id === selected) ?? documents[0]!;
  const context: EditorContext = { store, documents: () => documents, current, refresh, navigate, status: text => { status.textContent = text; } };
  async function refresh() {
    const token = ++generation, fresh = await store.read(); if (disposed || token !== generation) return;
    documents = fresh; render();
  }
  async function navigate(id: UUID, nodeId?: UUID) {
    selected = id;
    const url = new URL(location.href); url.searchParams.set('notebook', id); url.hash = ''; history.replaceState(null, '', url);
    await refresh();
    if (nodeId) editor?.select({ notebookId: selected, nodeId });
  }
  function render() {
    const doc = current(); selected = doc.id;
    title.textContent = doc.title; document.title = `${doc.title} · KP Notebook`;
    revision.textContent = `Revision ${doc.revision}`;
    chooser.replaceChildren(...documents.map(d => { const o = element('option', '', d.title); o.value = d.id; return o; })); chooser.value = selected;
    alternate.href = `${attachEditor ? './reader.html' : './'}?notebook=${selected}`;
    if (viewed !== selected) {
      view?.dispose(); editor?.dispose(); inspector.replaceChildren(); controls.replaceChildren(); viewed = selected;
      editor = attachEditor?.(inspector, controls, context);
      view = mountNotebookView(article, outline, selected, editor ? source => { if (source.notebookId !== selected) void navigate(source.notebookId, source.nodeId); else editor?.select(source); } : undefined);
      status.textContent = 'Saved locally in this browser. Download JSON for a portable copy.';
    }
    view!.update(resolveNotebook(documents, selected).blocks);
    root.dataset['revision'] = String(doc.revision); root.dataset['ready'] = 'true';
  }
  chooser.onchange = () => { void navigate(uuid(chooser.value)).catch(error => context.status(String(error))); };
  const unsubscribe = store.subscribe(() => { void refresh().catch(error => context.status(String(error))); });
  render();
  const dispose = () => { if (disposed) return; disposed = true; generation++; unsubscribe(); editor?.dispose(); view?.dispose(); store.close(); window.removeEventListener('pagehide', pagehide); };
  const pagehide = (event: PageTransitionEvent) => { if (!event.persisted) dispose(); };
  window.addEventListener('pagehide', pagehide);
  return dispose;
}
