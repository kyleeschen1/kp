import type { EditorView } from 'prosemirror-view';
import { closeHistory } from 'prosemirror-history';
import { NodeSelection } from 'prosemirror-state';
import { CommandRegistry, available, unavailable } from '../editor-commands/registry.ts';
import { newId } from '../notebook/model.ts';
import { invalidResourceFields } from '../math-resources/data-api.ts';
import { schema, fromProse } from './schema.ts';
import { selectedObject } from './inspector.ts';
import type { FractionNotebook } from './model.ts';
import { readMatrixCell } from './matrix-view.ts';
import { openMatrixPublications } from './matrix-publications.ts';
import { importMatrixPublication, matrixNote, refreshMatrixBinding, type MatrixPublication, type MatrixBinding } from './matrix-reuse-data.ts';
import './matrix-reuse.css';

export async function mountMatrixReuse(host: HTMLElement, editor: EditorView, basis: FractionNotebook,
  registry: CommandRegistry, saved: () => Promise<void>, report: (text: string) => void, signal: AbortSignal) {
  const store = await openMatrixPublications();
  if (signal.aborted) { store.close(); return { dispose() {} }; }
  let disposed = false, generation = 0;
  let publications: readonly MatrixPublication[] = [];
  const doc = () => fromProse(editor.state.doc, basis);
  const selected = () => {
    const value = selectedObject(editor.state);
    if (value?.node.type.name !== 'matrixObject') throw new Error('Select a matrix object first.');
    const cell = readMatrixCell(value.node), notebook = doc();
    return { ...value, cell, notebook, source: notebook.matrixResources!.find(d => d.id === cell.resource)!,
      binding: notebook.matrixBindings?.find(b => b.resource === cell.resource) };
  };
  const readiness = () => { try { selected(); return available(); } catch { return unavailable('Select a matrix object'); } };
  const handles: { dispose(): void }[] = [];
  const add = (id: string, title: string, run: () => void | Promise<void>, state = readiness) => handles.push(registry.add({
    id: `matrix.${id}`, title, category: 'Mathematics', scope: 'notebook', keywords: ['reuse', 'source', 'dependency'], state, run }));
  const refresh = async (force = false) => {
    const attempt = ++generation, current = await store.read();
    if (disposed || attempt !== generation) return;
    publications = current;
    const notebook = doc(), resources = [...notebook.matrixResources!], bindings = [...(notebook.matrixBindings ?? [])], notes = [...(notebook.matrixNotes ?? [])];
    let changed = false; const gaps: string[] = [];
    for (let i = 0; i < bindings.length; i++) {
      const binding = bindings[i]!;
      if (binding.mode === 'pinned' && !force) continue;
      const publication = publications.find(p => p.document.id === binding.source);
      if (publication && !publication.withdrawn && publication.revision === binding.revision) continue;
      try {
        const index = resources.findIndex(d => d.id === binding.resource);
        const updated = refreshMatrixBinding(resources[index]!, binding, publication);
        resources[index] = updated.document; bindings[i] = updated.binding;
        if (binding.kind === 'transclude') {
          const note = notes.findIndex(n => n.resource === binding.resource);
          if (note < 0) notes.push(updated.note); else notes[note] = updated.note;
        }
        changed = true;
      } catch (error) { gaps.push(String(error)); }
    }
    if (changed) {
      // A refresh is one reversible source+pin transaction. It never alters
      // occurrence identity, selection, viewport or the publication itself.
      editor.dispatch(closeHistory(editor.state.tr).setNodeAttribute(0, 'value', resources)
        .setNodeAttribute(0, 'bindings', bindings).setNodeAttribute(0, 'notes', notes));
      editor.dispatch(closeHistory(editor.state.tr));
    }
    if (gaps.length) report(gaps.join(' ')); else if (changed) report('Shared source updated; local view settings retained. Undo restores the saved snapshot.');
    registry.notify();
  };
  const dialog = document.createElement('dialog'); dialog.className = 'fn-matrix-reuse-dialog'; dialog.setAttribute('aria-label', 'Reuse a published matrix');
  const heading = document.createElement('h2'); heading.textContent = 'Reuse a matrix';
  const description = document.createElement('p'); description.textContent = 'Copy is independent. Derive shares the matrix and owns its vector. Transclude shares both; views stay local.';
  const sources = document.createElement('select'); sources.setAttribute('aria-label', 'Published source');
  const kind = document.createElement('select'); kind.setAttribute('aria-label', 'Reuse relationship');
  for (const [value, title] of [['copy', 'Copy — independent'], ['derive', 'Derive — shared matrix, local vector'], ['transclude', 'Transclude — shared source']]) {
    const option = document.createElement('option'); option.value = value!; option.textContent = title!; kind.append(option);
  }
  const mode = document.createElement('select'); mode.setAttribute('aria-label', 'Source updates');
  for (const value of ['live', 'pinned']) { const option = document.createElement('option'); option.value = value; option.textContent = value === 'live' ? 'Follow published updates' : 'Keep this revision until refreshed'; mode.append(option); }
  const notice = document.createElement('p'); notice.setAttribute('role', 'status');
  const insert = document.createElement('button'); insert.textContent = 'Insert selected source';
  const cancel = document.createElement('button'); cancel.textContent = 'Cancel'; cancel.onclick = () => dialog.close();
  dialog.append(heading, description, sources, kind, mode, notice, insert, cancel); host.append(dialog);
  insert.onclick = () => {
    try {
      if (disposed) return;
      const publication = publications.find(p => p.document.id === sources.value);
      if (!publication) throw new Error('Choose an available publication.');
      const relationship = kind.value;
      if (relationship !== 'copy' && relationship !== 'derive' && relationship !== 'transclude') throw new Error('Unsupported relationship.');
      const imported = importMatrixPublication(publication, relationship), notebook = doc();
      if (notebook.matrixResources!.some(d => d.id === imported.document.id)) throw new Error('This notebook already has this source. Use Graph or Explain for another local view.');
      if (notebook.matrixResources!.length >= 16) throw new Error('This notebook supports sixteen matrix resources.');
      const binding: MatrixBinding | undefined = imported.binding && { ...imported.binding, mode: mode.value === 'pinned' ? 'pinned' : 'live' };
      const occurrence = imported.document.occurrences.find(o => o.view === 'equation') ?? imported.document.occurrences[0]!;
      const cell = { type: 'matrixObject', id: newId(), metadata: {}, resource: imported.document.id, occurrence: occurrence.id, folded: false };
      const pos = editor.state.doc.content.size;
      const tr = closeHistory(editor.state.tr).setNodeAttribute(0, 'value', [...notebook.matrixResources!, imported.document])
        .setNodeAttribute(0, 'bindings', [...(notebook.matrixBindings ?? []), ...(binding ? [binding] : [])])
        .setNodeAttribute(0, 'notes', [...(notebook.matrixNotes ?? []), imported.note]).insert(pos, schema.node('matrixObject', cell));
      editor.dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)).scrollIntoView()); editor.dispatch(closeHistory(editor.state.tr));
      dialog.close(); editor.focus(); report(`Inserted ${relationship}; ${binding ? binding.mode + ' publication tracking' : 'independent source'}.`);
    } catch (error) { notice.textContent = String(error); }
  };
  add('reuse', 'Reuse published matrix in this notebook', async () => {
    await refresh(); if (disposed) return;
    sources.replaceChildren();
    for (const p of publications.filter(p => !p.withdrawn)) { const option = document.createElement('option'); option.value = p.document.id;
      option.textContent = `${p.note.title} · ${p.document.id.slice(0, 8)} · revision ${p.revision}`; sources.append(option); }
    notice.textContent = sources.options.length ? '' : 'Publish a source from its notebook first.'; insert.disabled = !sources.options.length;
    dialog.showModal(); sources.focus();
  }, () => available());
  const publish = async (withdrawn: boolean) => {
    const captured = editor.state.doc, value = selected();
    if (value.binding) throw new Error('Publish from the original source notebook. Copy first to make an independent publication.');
    if (invalidResourceFields(value.source).length) throw new Error('Complete the numeric draft before publishing.');
    const expected = publications.find(p => p.document.id === value.source.id)?.revision ?? null;
    await saved(); if (disposed || editor.state.doc !== captured) throw new Error('The notebook changed before publication; retry with the saved source.');
    await store.publish(basis.id, value.source, matrixNote(value.source, value.notebook.matrixNotes ?? []), expected, withdrawn);
    report(withdrawn ? 'Publication withdrawn; linked notebooks retain their last snapshot.' : 'Published saved matrix source. Live subscribers follow this revision.');
  };
  add('publish', 'Publish selected matrix source locally', () => publish(false));
  add('withdraw', 'Withdraw selected matrix publication', () => publish(true));
  add('refresh-sources', 'Refresh linked matrix snapshots', () => refresh(true), () => available());
  add('toggle-pin', 'Pin or follow selected matrix source', () => {
    const value = selected(); if (!value.binding) throw new Error('This source is independent.');
    editor.dispatch(closeHistory(editor.state.tr).setNodeAttribute(0, 'bindings', value.notebook.matrixBindings!.map(b => b.resource === value.cell.resource ? { ...b, mode: b.mode === 'live' ? 'pinned' : 'live' } : b)));
    report(value.binding.mode === 'live' ? 'Pinned to the current publication revision.' : 'Following future publications. Refresh to adopt the current revision.');
  });
  add('open-source', 'Open original matrix notebook', async () => {
    const value = selected(); if (!value.binding) throw new Error('This is an independent source.');
    const url = new URL('/experiments/fraction-notebook/', location.origin);
    url.searchParams.set('notebook', 'matrix'); url.searchParams.set('document', value.binding.owner);
    url.searchParams.set('source', value.binding.source); url.searchParams.set('returnNotebook', basis.id); url.searchParams.set('returnCell', value.cell.id);
    await saved(); if (!disposed) location.assign(url.href);
  });
  const unsubscribe = store.subscribe(() => { void refresh().catch(error => report(String(error))); });
  const focus = () => { void refresh().catch(error => report(String(error))); };
  window.addEventListener('focus', focus);
  const dispose = () => { if (disposed) return; disposed = true; generation++; unsubscribe(); window.removeEventListener('focus', focus);
    delete host.dataset['matrixReuse']; signal.removeEventListener('abort', dispose); handles.forEach(h => h.dispose()); dialog.remove(); store.close(); };
  signal.addEventListener('abort', dispose, { once: true });
  try { await refresh(); } catch (error) { dispose(); throw error; }
  if (!disposed) host.dataset['matrixReuse'] = 'ready';
  return { dispose };
}
