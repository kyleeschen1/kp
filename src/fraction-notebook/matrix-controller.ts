import { Slice, type Node as ProseNode } from 'prosemirror-model';
import { Plugin, NodeSelection } from 'prosemirror-state';
import { closeHistory, undo, redo } from 'prosemirror-history';
import type { EditorView } from 'prosemirror-view';
import { CommandRegistry, available, unavailable, target, type Target, type TargetedCommand } from '../editor-commands/registry.ts';
import { newId } from '../notebook/model.ts';
import { editMatrixVectorDocument, editOccurrenceExtent, invalidResourceFields, type MatrixVectorDocument } from '../math-resources/public-api.ts';
import { readNotebook, type FractionNotebook, type MatrixObjectCell } from './model.ts';
import { schema, matrixResourcesIn } from './schema.ts';
import { createMatrixNotebookRuntime } from './matrix-runtime.ts';
import { createMatrixNodeView, readMatrixCell, type MatrixViewOwner } from './matrix-view.ts';
import { matrixOccurrence } from './matrix-data.ts';
import { activeMatrixOccurrences, matrixClipboardSlice, prepareMatrixPaste, withMatrixOccurrences } from './matrix-occurrences.ts';
import { serializeMatrixSnapshot } from '../math-resources/data-api.ts';
import { downloadJson } from '../notebook/download.ts';
import { selectedObject } from './inspector.ts';
import { preparePastedSlice } from './clipboard.ts';
import type { NotebookEditorExtension } from './editor.ts';
import './math.css';
import { readMatrixBindings, readMatrixNotes } from './matrix-reuse-data.ts';

interface Captured { readonly doc: ProseNode; readonly cell: MatrixObjectCell }
export function createMatrixExtension(initial: FractionNotebook, registry: CommandRegistry, report: (message: string) => void) {
  let current = initial.matrixResources!, bindings = initial.matrixBindings ?? [], notes = initial.matrixNotes ?? [], editor: EditorView | undefined, disposed = false;
  const runtime = createMatrixNotebookRuntime(current), listeners = new Set<() => void>();
  const handles = new Map<string, TargetedCommand<Captured>>();
  const active = () => { if (!editor || disposed) throw new Error('The matrix notebook has closed.'); return editor; };
  const occurrence = (id: string) => {
    let found: { node: ProseNode; pos: number } | undefined;
    active().state.doc.descendants((node, pos) => { if (node.type.name === 'matrixObject' && node.attrs['id'] === id) found = { node, pos }; }); return found;
  };
  const localTarget = (id?: string): Target<Captured> => {
    if (!editor || disposed) return { found: false, reason: 'The matrix notebook has closed' };
    const chosen = id ? occurrence(id) : selectedObject(editor.state);
    return chosen?.node.type.name === 'matrixObject' ? target({ doc: editor.state.doc, cell: readMatrixCell(chosen.node) }) : { found: false, reason: 'Select a matrix object first' };
  };
  const readiness = (c: Captured) => !editor || c.doc !== editor.state.doc ? unavailable('The notebook changed; reopen commands')
    : !occurrence(c.cell.id) ? unavailable('The matrix object was removed') : available();
  const replace = (d: MatrixVectorDocument) => {
    const view = active(); view.dispatch(view.state.tr.setNodeAttribute(0, 'value', current.map(old => old.id === d.id ? d : old)));
  };
  const register = (command: TargetedCommand<Captured>) => handles.set(command.id, command);
  const canInsertView = (c: Captured) => {
    const ready = readiness(c); if (!ready.enabled) return ready;
    const { document: d } = matrixOccurrence(current, c.cell.resource, c.cell.occurrence);
    return invalidResourceFields(d).length ? unavailable('Correct the numeric draft first') : activeMatrixOccurrences(active().state.doc, d.id).size >= 8 ? unavailable('This resource supports eight view occurrences') : available();
  };
  const insertView = (c: Captured, kind: 'graph' | 'columns') => {
    const view = active(), { document: d, view: source } = matrixOccurrence(current, c.cell.resource, c.cell.occurrence);
    // A representation is another occurrence of the same source, not a copy
    // of its mathematics. Both identities enter native history atomically.
    const next = { ...source, id: newId(), view: kind }, updated = withMatrixOccurrences(d, view.state.doc, [next]);
    const found = occurrence(c.cell.id)!, pos = found.pos + found.node.nodeSize;
    const cell: MatrixObjectCell = { type: 'matrixObject', id: newId(), metadata: {}, resource: d.id, occurrence: next.id, folded: false };
    const tr = closeHistory(view.state.tr).setNodeAttribute(0, 'value', current.map(old => old.id === d.id ? updated : old)).insert(pos, schema.node('matrixObject', cell));
    view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)).scrollIntoView()); view.focus();
  };
  for (const command of [
    { id: 'matrix.graph', title: 'Graph selected matrix-vector product', keywords: ['linked', 'representation', 'plot'], kind: 'graph' },
    { id: 'matrix.explain', title: 'Explain column combination', keywords: ['explain', 'columns', 'combination', 'linear', 'animation', 'replay'], kind: 'columns' }
  ] as const) register(registry.targeted({ id: command.id, title: command.title, keywords: command.keywords,
    category: 'Mathematics', scope: 'notebook', target: () => localTarget(), state: canInsertView, run: c => insertView(c, command.kind) }));
  const sourceOccurrence = (resource: MatrixObjectCell['resource']) => {
    const d = current.find(candidate => candidate.id === resource);
    const equations = new Set(d?.occurrences.filter(view => view.view === 'equation').map(view => view.id));
    let found: { node: ProseNode; pos: number } | undefined;
    active().state.doc.descendants((node, pos) => {
      if (found) return false;
      if (node.type.name === 'matrixObject' && node.attrs['resource'] === resource && equations.has(node.attrs['occurrence'])) found = { node, pos };
      return undefined;
    });
    return found;
  };
  register(registry.targeted({ id: 'matrix.export-resource', title: 'Export matrix resource', category: 'Mathematics', scope: 'notebook',
    keywords: ['snapshot', 'reference', 'download', 'json'], target: () => localTarget(),
    state: c => { const ready = readiness(c); if (!ready.enabled) return ready;
      return invalidResourceFields(matrixOccurrence(current, c.cell.resource, c.cell.occurrence).document).length
        ? unavailable('Correct the numeric draft first') : available(); },
    run: c => {
      const source = matrixOccurrence(current, c.cell.resource, c.cell.occurrence).document;
      downloadJson(serializeMatrixSnapshot(source), `matrix-resource-${source.id}.json`);
      report('Exported a pinned matrix snapshot. Open it at /experiments/matrix-reference/.');
    } }));
  register(registry.targeted({ id: 'matrix.return-to-source', title: 'Return to matrix inputs', category: 'Mathematics', scope: 'notebook',
    keywords: ['source', 'inputs', 'return', 'matrix', 'vector'], target: () => localTarget(),
    state: c => { const ready = readiness(c); if (!ready.enabled) return ready;
      return sourceOccurrence(c.cell.resource) ? available() : unavailable('This notebook has no matrix input occurrence for this source'); },
    run: c => {
      const view = active(), source = sourceOccurrence(c.cell.resource)!;
      // Returning is navigation: preserve the source and its existing history.
      view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, source.pos)).setMeta('addToHistory', false).scrollIntoView()); view.focus();
    } }));
  register(registry.targeted({ id: 'matrix.fold', title: 'Fold or unfold matrix object', category: 'Mathematics', scope: 'notebook', target: () => localTarget(), state: readiness,
    run: c => { const view = active(), found = occurrence(c.cell.id)!;
      view.dispatch(closeHistory(view.state.tr).setNodeAttribute(found.pos, 'folded', !c.cell.folded)); } }));
  for (const [direction, factor] of [['in', .5], ['out', 2]] as const) register(registry.targeted({ id: `matrix.zoom-${direction}`, title: `Zoom ${direction} selected matrix graph`, category: 'Mathematics', scope: 'notebook', target: () => localTarget(),
    state: c => { const ready = readiness(c); if (!ready.enabled) return ready;
      const { view } = matrixOccurrence(current, c.cell.resource, c.cell.occurrence), extent = view.extent * factor;
      return view.view !== 'graph' ? unavailable('Select a graph') : extent < 1 || extent > 250 ? unavailable('Keep range between 1 and 250') : available(); },
    run: c => { const { document: d, view } = matrixOccurrence(current, c.cell.resource, c.cell.occurrence);
      const next = editOccurrenceExtent(d, view.id, view.extent * factor), editor = active();
      editor.dispatch(closeHistory(editor.state.tr).setNodeAttribute(0, 'value', current.map(old => old.id === d.id ? next : old))); } }));
  const owner: MatrixViewOwner = { runtime, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    details(id) { return { binding: bindings.find(b => b.resource === id), note: notes.find(n => n.resource === id) }; },
    select(id) { if (!editor || disposed) return; const found = occurrence(id); if (found && (!(editor.state.selection instanceof NodeSelection) || editor.state.selection.from !== found.pos))
      editor.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, found.pos))); },
    edit(id, edit) { const d = current.find(d => d.id === id); if (!d) throw new Error('The matrix was removed.');
      const binding = owner.details?.(id).binding;
      if (binding && (binding.kind === 'transclude' || edit.kind === 'matrix')) { report('Edit the original source, or Copy to make independent mathematics.'); return; }
      replace(editMatrixVectorDocument(d, edit)); },
    bind(button, command, id) { handles.get(command)?.bindResolvedTarget(button, () => localTarget(id)); },
    undo(forward) { const view = active(); (forward ? redo : undo)(view.state, view.dispatch); } };
  const containsMatrix = (slice: Slice) => { let found = false; slice.content.descendants(n => { if (n.type.name === 'matrixObject') found = true; }); return found; };
  const paste = (view: EditorView, slice: Slice, position?: number) => {
    if (!containsMatrix(slice)) return false;
    try {
      const prepared = prepareMatrixPaste(view.state.doc, slice, current);
      const copied = preparePastedSlice(view.state.doc, prepared.slice);
      const copiedNotes = prepared.copies.flatMap(copy => { const note = notes.find(n => n.resource === copy.source); return note ? [{ ...note, resource: copy.resource }] : []; });
      const tr = closeHistory(view.state.tr).setNodeAttribute(0, 'value', prepared.resources);
      if (copiedNotes.length) tr.setNodeAttribute(0, 'notes', [...notes, ...copiedNotes]);
      if (position === undefined) tr.replaceSelection(copied); else tr.replaceRange(position, position, copied);
      view.dispatch(tr.scrollIntoView()); return true;
    } catch (error) { report(String(error)); return true; }
  };
  const plugin = new Plugin({ filterTransaction(tr) {
    if (!tr.docChanged) return true;
    try {
      const resources = matrixResourcesIn(tr.doc);
      for (const d of resources) {
        const previous = current.find(old => old.id === d.id);
        if (previous && (previous.matrix.id !== d.matrix.id || previous.vector.id !== d.vector.id || previous.result.id !== d.result.id))
          throw new Error('A replacement matrix closure requires a new identity.');
      }
      // ProseMirror splits may temporarily duplicate block IDs; the existing
      // identity plugin repairs those in appendTransaction. Validate this
      // owner's resource/reference invariants here, then serialize afterward.
      readNotebook({ ...initial, matrixResources: resources, matrixBindings: tr.doc.firstChild!.attrs['bindings'] ?? [], matrixNotes: tr.doc.firstChild!.attrs['notes'] ?? [], cells: [] });
      const occurrences = new Set<string>();
      tr.doc.descendants(node => {
        if (node.type.name === 'story' || node.type.name === 'mathObject') throw new Error('Use this exemplar’s matrix resources.');
        if (node.type.name !== 'matrixObject') return;
        const cell = readMatrixCell(node); matrixOccurrence(resources, cell.resource, cell.occurrence);
        if (occurrences.has(cell.occurrence)) throw new Error('Each matrix cell requires its own view occurrence.'); occurrences.add(cell.occurrence);
      });
      return true;
    } catch (error) { report(String(error)); return false; }
  }, appendTransaction(transactions, _old, state) {
    if (!transactions.some(tr => tr.docChanged)) return null;
    // Native drag-move bypasses paste. Its serialized helper data must not
    // become document state; removal joins the move's existing history event.
    const tr = state.tr;
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'matrixObject' && node.attrs['clipboardOccurrence'] !== null)
        tr.setNodeAttribute(pos, 'clipboardOccurrence', null);
    });
    return tr.docChanged ? tr : null;
  }, view(view) { editor = view; return { update(next, before) {
    editor = next; if (next.state.doc !== before.doc) { listeners.forEach(fn => fn()); registry.notify(); }
  } }; }, props: { transformCopied: slice => matrixClipboardSlice(slice, current), handleDrop(view, event, slice, moved) {
    if (moved || !containsMatrix(slice)) return false;
    const pos = view.posAtCoords({ left: event.clientX, top: event.clientY }); if (pos) paste(view, slice, pos.pos); return true;
  } } });
  const extension: NotebookEditorExtension = { label: 'Matrix notebook', plugins: [plugin], nodeViews: { matrixObject: node => createMatrixNodeView(node, owner) }, paste,
    beforeRender(doc, previous) { if (doc === previous) return; current = matrixResourcesIn(doc);
      bindings = readMatrixBindings(doc.firstChild!.attrs['bindings'] ?? [], current); notes = readMatrixNotes(doc.firstChild!.attrs['notes'] ?? [], current); runtime.update(current); } };
  return { extension, runtime, dispose() { if (disposed) return; disposed = true; handles.forEach(h => h.dispose()); listeners.clear(); runtime.dispose(); editor = undefined; } };
}
