import { Slice, type Node as ProseNode } from 'prosemirror-model';
import { Plugin, NodeSelection } from 'prosemirror-state';
import { closeHistory, undo, redo } from 'prosemirror-history';
import type { EditorView } from 'prosemirror-view';
import { available, unavailable, target, type CommandRegistry, type Target, type TargetedCommand } from '../editor-commands/registry.ts';
import { newId } from '../notebook/model.ts';
import { createProjectionResource, editProjectionResource, readProjectionResources, validProjectionDraft } from '../projection-explanation/resource.ts';
import { schema, projectionResourcesIn } from './schema.ts';
import type { FractionNotebook, ProjectionObjectCell } from './types.ts';
import type { NotebookEditorExtension } from './editor.ts';
import { createProjectionRuntime } from './projection-runtime.ts';
import { createProjectionNodeView, readProjectionCell, type ProjectionViewOwner } from './projection-view.ts';
import { prepareProjectionPaste } from './projection-clipboard.ts';
import { preparePastedSlice } from './clipboard.ts';
import { selectedObject } from './inspector.ts';
import './math.css';

interface Captured { readonly doc: ProseNode; readonly cell: ProjectionObjectCell }
export function createProjectionExtension(initial: FractionNotebook, registry: CommandRegistry, report: (message: string) => void) {
  let current = readProjectionResources(initial.projectionResources), editor: EditorView | undefined, disposed = false;
  const runtime = createProjectionRuntime(current), listeners = new Set<() => void>();
  const handles = new Map<string, TargetedCommand<Captured>>();
  const active = () => { if (!editor || disposed) throw new Error('The projection notebook has closed.'); return editor; };
  const occurrence = (id: string) => {
    let found: { node: ProseNode; pos: number } | undefined;
    active().state.doc.descendants((node, pos) => { if (node.type.name === 'projectionObject' && node.attrs['id'] === id) found = { node, pos }; }); return found;
  };
  const localTarget = (id?: string): Target<Captured> => {
    if (!editor || disposed) return { found: false, reason: 'The projection notebook has closed.' };
    const chosen = id ? occurrence(id) : selectedObject(editor.state);
    return chosen?.node.type.name === 'projectionObject' ? target({ doc: editor.state.doc, cell: readProjectionCell(chosen.node) }) : { found: false, reason: 'Select a vector-pair object first.' };
  };
  const readiness = (c: Captured) => !editor || disposed || c.doc !== editor.state.doc ? unavailable('The notebook changed; reopen commands.') : available();
  const canInsert = (c: Captured) => {
    const ready = readiness(c); if (!ready.enabled) return ready;
    if (!validProjectionDraft(runtime.read(c.cell.resource).resource.draft)) return unavailable('Correct the coordinate draft first.');
    let count = 0; active().state.doc.descendants(n => { if (n.type.name === 'projectionObject' && n.attrs['resource'] === c.cell.resource) count++; });
    return count >= 8 ? unavailable('This vector pair supports eight visible occurrences.') : available();
  };
  const insert = (c: Captured, kind: ProjectionObjectCell['view']) => {
    const view = active(), found = occurrence(c.cell.id)!, pos = found.pos + found.node.nodeSize;
    const tr = closeHistory(view.state.tr).insert(pos, schema.node('projectionObject', { ...c.cell, id: newId(), view: kind, folded: false }));
    view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)).scrollIntoView()); view.focus();
  };
  const register = (command: TargetedCommand<Captured>) => handles.set(command.id, command);
  for (const [id, title, kind, keywords] of [
    ['projection.explain', 'Explain selected vector projection', 'explanation', ['dot product', 'parallel', 'perpendicular', 'residual', 'animation']],
    ['projection.linked', 'Insert linked vector-pair inputs', 'inputs', ['shared source', 'reuse', 'linked view']]
  ] as const) register(registry.targeted({ id, title, keywords, category: 'Mathematics', scope: 'notebook', target: () => localTarget(), state: canInsert, run: c => insert(c, kind) }));
  register(registry.targeted({ id: 'projection.fold', title: 'Fold or unfold vector-pair object', category: 'Mathematics', scope: 'notebook', target: () => localTarget(), state: readiness,
    run: c => { const view = active(); view.dispatch(closeHistory(view.state.tr).setNodeAttribute(occurrence(c.cell.id)!.pos, 'folded', !c.cell.folded)); } }));
  const inputs = (resource: string) => {
    let found: { node: ProseNode; pos: number } | undefined;
    active().state.doc.descendants((node, pos) => { if (!found && node.type.name === 'projectionObject' && node.attrs['resource'] === resource && node.attrs['view'] === 'inputs') found = { node, pos }; }); return found;
  };
  register(registry.targeted({ id: 'projection.return', title: 'Return to vector-pair inputs', category: 'Mathematics', scope: 'notebook', target: () => localTarget(),
    state: c => { const ready = readiness(c); return !ready.enabled ? ready : inputs(c.cell.resource) ? available() : unavailable('This source has no input occurrence. Insert a linked input view.'); },
    run: c => { const view = active(), found = inputs(c.cell.resource)!;
      view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, found.pos)).setMeta('addToHistory', false).scrollIntoView()); view.focus(); } }));
  const add = registry.add({ id: 'projection.create', title: 'Insert new vector pair', category: 'Mathematics', scope: 'notebook', keywords: ['projection', 'dot product'],
    state: () => editor && !disposed ? available() : unavailable('The projection notebook is not ready.'),
    run: () => {
      const view = active(), source = createProjectionResource(), used = new Set<string>();
      view.state.doc.descendants(n => { if (n.type.name === 'projectionObject') used.add(n.attrs['resource']); });
      const resources = readProjectionResources([...current.filter(r => used.has(r.id)), source]);
      const pos = view.state.doc.content.size;
      const tr = closeHistory(view.state.tr).setNodeAttribute(0, 'value', resources).insert(pos,
        schema.node('projectionObject', { id: newId(), metadata: {}, resource: source.id, view: 'inputs', folded: false }));
      view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)).scrollIntoView()); view.focus();
    } });
  const owner: ProjectionViewOwner = { runtime,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    select(id) { if (!editor || disposed) return; const found = occurrence(id); if (found && (!(editor.state.selection instanceof NodeSelection) || editor.state.selection.from !== found.pos))
      editor.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, found.pos))); },
    edit(id, field, value) { const view = active(), source = current.find(r => r.id === id); if (!source) throw new Error('The vector pair was removed.');
      const updated = editProjectionResource(source, field, value);
      view.dispatch(view.state.tr.setNodeAttribute(0, 'value', current.map(r => r.id === id ? updated : r))); },
    bind(button, command, id) { handles.get(command)?.bindResolvedTarget(button, () => localTarget(id)); },
    undo(forward) { const view = active(); (forward ? redo : undo)(view.state, view.dispatch); } };
  const contains = (slice: Slice) => { let found = false; slice.content.descendants(n => { if (n.type.name === 'projectionObject') found = true; }); return found; };
  const paste = (view: EditorView, slice: Slice, position?: number) => {
    if (!contains(slice)) return false;
    try {
      const prepared = prepareProjectionPaste(view.state.doc, slice, current), copied = preparePastedSlice(view.state.doc, prepared.slice);
      const tr = closeHistory(view.state.tr).setNodeAttribute(0, 'value', prepared.resources);
      if (position === undefined) tr.replaceSelection(copied); else tr.replaceRange(position, position, copied);
      view.dispatch(tr.scrollIntoView()); return true;
    } catch (error) { report(String(error)); return true; }
  };
  const plugin = new Plugin({ filterTransaction(tr) {
    if (!tr.docChanged) return true;
    try {
      const resources = projectionResourcesIn(tr.doc), ids = new Set(resources.map(r => r.id)), views = new Set<string>(), counts = new Map<string, number>();
      tr.doc.descendants(node => {
        if (['story', 'mathObject', 'matrixObject'].includes(node.type.name)) throw new Error('Use this exemplar’s vector-pair resources.');
        if (node.type.name !== 'projectionObject') return;
        const cell = readProjectionCell(node);
        if (!ids.has(cell.resource) || ids.has(cell.id) || views.has(cell.id)) throw new Error('Each vector-pair view requires a unique identity and an existing source.');
        views.add(cell.id); const count = (counts.get(cell.resource) ?? 0) + 1; counts.set(cell.resource, count);
        if (count > 8) throw new Error('This vector pair supports eight visible occurrences.');
      }); return true;
    } catch (error) { report(String(error)); return false; }
  }, view(view) { editor = view; return { update(next, before) { editor = next;
    if (next.state.doc !== before.doc) { listeners.forEach(fn => fn()); registry.notify(); } } }; },
  props: { handleDrop(view, event, slice, moved) {
    if (moved || !contains(slice)) return false;
    const pos = view.posAtCoords({ left: event.clientX, top: event.clientY }); if (pos) paste(view, slice, pos.pos); return true;
  } } });
  const extension: NotebookEditorExtension = { label: 'Projection notebook', plugins: [plugin], paste,
    nodeViews: { projectionObject: node => createProjectionNodeView(node, owner) },
    beforeRender(doc, previous) { if (doc === previous) return; current = projectionResourcesIn(doc); runtime.update(current); } };
  return { extension, runtime, dispose() { if (disposed) return; disposed = true; handles.forEach(h => h.dispose()); add.dispose(); listeners.clear(); runtime.dispose(); editor = undefined; } };
}
