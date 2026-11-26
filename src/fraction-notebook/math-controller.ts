import { Fragment, Slice, type Node as ProseNode } from 'prosemirror-model';
import { Plugin, NodeSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { closeHistory, redo, undo } from 'prosemirror-history';
import { CommandRegistry, available, unavailable, target, type Target, type CommandHandle, type TargetedCommand } from '../editor-commands/registry.ts';
import { createKpReaderTimelinePlaybackClock, type KpReaderTimelinePlaybackClock } from '../reader/runtime/timeline-playback-clock.ts';
import { newId, uuid, type UUID } from '../notebook/model.ts';
import { createNotebookMathRuntime } from '../notebook/math-runtime.ts';
import { createQuadraticResource, deriveMathResource, editCoefficient, editTangent, readNotebookMathematics, mathematicalOperations,
  defaultMathViewport, mathDraftError, readMathViewport, type MathResource } from '../notebook/math-model.ts';
import type { QuadraticCoefficients } from '../math/authoring/quadratic-contract.ts';
import type { FractionNotebook, MathObjectCell } from './types.ts';
import type { NotebookEditorExtension } from './editor.ts';
import { schema, mathematicsIn } from './schema.ts';
import { selectedObject } from './inspector.ts';
import { createMathNodeView, type MathViewOwner } from './math-view.ts';
import { preparePastedSlice } from './clipboard.ts';
import './math.css';

interface CapturedMathObject { readonly doc: ProseNode; readonly occurrence: UUID; readonly resource: UUID }
export function mathOccurrence(resource: UUID, view: MathObjectCell['view'] = 'equation', id = newId()): MathObjectCell {
  return { type: 'mathObject', id, metadata: {}, resource, view, viewport: defaultMathViewport, folded: false };
}
const nodeFor = (cell: MathObjectCell) => schema.node('mathObject', cell);

/** Commands capture the resource before a picker borrows focus; persistent
 * transactions belong to the document. The evaluator only owns derived views. */
export function createMathematicalExtension(initial: FractionNotebook, registry: CommandRegistry, report: (message: string) => void) {
  const runtime = createNotebookMathRuntime(initial.id), listeners = new Set<() => void>();
  let current = readNotebookMathematics(initial.mathematics), view: EditorView | undefined, disposed = false;
  let preview: Extract<MathResource, { kind: 'tangent' }> | undefined;
  let clock: KpReaderTimelinePlaybackClock | undefined, unsubscribeClock: (() => void) | undefined;
  const handles: CommandHandle[] = [];
  const targeted = new Map<string, TargetedCommand<CapturedMathObject>>();
  const register = (handle: TargetedCommand<CapturedMathObject>) => { handles.push(handle); targeted.set(handle.id, handle); };
  runtime.update(current);
  const notify = () => { for (const listener of listeners) listener(); registry.notify(); };
  const requireView = () => { if (disposed || !view) throw new Error('The mathematical notebook has closed.'); return view; };
  const find = (id: string) => current.resources.find(resource => resource.id === id);
  const occurrence = (id: string) => {
    let found: { node: ProseNode; pos: number } | undefined;
    requireView().state.doc.descendants((node, pos) => { if (node.type.name === 'mathObject' && node.attrs['id'] === id) found = { node, pos }; }); return found;
  };
  const show = () => { runtime.update(preview ? { ...current, resources: current.resources.map(r => r.id === preview!.id ? preview! : r) } : current); notify(); };
  const stopClock = () => { unsubscribeClock?.(); unsubscribeClock = undefined; clock?.dispose(); clock = undefined; };
  const cancelPreview = () => { stopClock(); if (preview) { preview = undefined; show(); } };
  const write = (resources: readonly MathResource[], separate = false) => {
    const editor = requireView(), next = readNotebookMathematics({ schemaVersion: 1, resources });
    const tr = editor.state.tr.setNodeAttribute(0, 'value', next);
    editor.dispatch(separate ? closeHistory(tr) : tr);
  };
  const replace = (resource: MathResource, separate = false) => write(current.resources.map(r => r.id === resource.id ? resource : r), separate);
  const select = (id: string) => {
    if (disposed || !view) return; const found = occurrence(id); if (!found) return;
    if (!(view.state.selection instanceof NodeSelection) || view.state.selection.from !== found.pos)
      view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, found.pos)));
  };
  const tangent = (id: string, value: string, transient: boolean) => {
    const resource = find(id); if (resource?.kind !== 'tangent') throw new Error('This tangent was removed.');
    const next = editTangent(resource, value);
    if (transient) { stopClock(); preview = next; show(); }
    else { stopClock(); preview = undefined; replace(next, true); }
  };
  const selected = (): Target<CapturedMathObject> => {
    if (!view || disposed) return { found: false, reason: 'The mathematical notebook has closed' };
    const chosen = selectedObject(view.state);
    return chosen?.node.type.name === 'mathObject' ? target({ doc: view.state.doc, occurrence: uuid(chosen.node.attrs['id']), resource: uuid(chosen.node.attrs['resource']) })
      : { found: false, reason: 'Select a mathematical object first' };
  };
  const localTarget = (id: string): Target<CapturedMathObject> => {
    if (!view || disposed) return { found: false, reason: 'The mathematical notebook has closed' };
    const found = occurrence(id);
    return found ? target({ doc: view.state.doc, occurrence: uuid(id), resource: uuid(found.node.attrs['resource']) })
      : { found: false, reason: 'This mathematical object was removed' };
  };
  const readiness = (value: CapturedMathObject, allowPreview = false) => {
    if (!view || value.doc !== view.state.doc) return unavailable('The notebook changed; reopen commands for the current object');
    if (!occurrence(value.occurrence) || !find(value.resource)) return unavailable('This mathematical object was removed');
    if (preview && !allowPreview) return unavailable('Finish or pause the tangent preview first');
    return available();
  };
  const insert = (resource: MathResource, cell: MathObjectCell, newResource: boolean, after?: UUID) => {
    const editor = requireView(); cancelPreview();
    const mathematics = readNotebookMathematics({ schemaVersion: 1, resources: newResource ? [...current.resources, resource] : current.resources });
    const found = after ? occurrence(after) : undefined, pos = found ? found.pos + found.node.nodeSize : editor.state.doc.content.size;
    const tr = closeHistory(editor.state.tr).setNodeAttribute(0, 'value', mathematics).insert(pos, nodeFor(cell));
    editor.dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)).scrollIntoView()); editor.focus();
  };
  handles.push(registry.add({ id: 'math.create', title: 'Create quadratic object', category: 'Mathematics', scope: 'notebook', keywords: ['polynomial', 'function', 'new'],
    state: () => current.resources.length < 32 ? available() : unavailable('This exemplar supports 32 resources'),
    run: () => { const resource = createQuadraticResource(); insert(resource, mathOccurrence(resource.id), true); } }));
  for (const operation of mathematicalOperations) register(registry.targeted({ ...operation, category: 'Mathematics', scope: 'notebook', target: selected,
    state: captured => {
      const state = readiness(captured); if (!state.enabled) return state;
      const resource = find(captured.resource)!;
      if (operation.kind !== 'graph' && resource.kind !== 'quadratic') return unavailable('This operation requires a source quadratic');
      if (mathDraftError(resource)) return unavailable('Correct this numeric draft first');
      return available();
    }, run: captured => {
      const resource = find(captured.resource)!;
      if (operation.kind === 'graph') insert(resource, mathOccurrence(resource.id, 'graph'), false, captured.occurrence);
      else { const derived = deriveMathResource(resource, operation.kind); insert(derived, mathOccurrence(derived.id, operation.kind === 'tangent' ? 'graph' : 'equation'), true, captured.occurrence); }
    } }));
  register(registry.targeted({ id: 'math.fold', title: 'Fold or unfold mathematical object', category: 'Mathematics', scope: 'notebook', target: selected,
    state: captured => readiness(captured), run: captured => {
      const editor = requireView(), found = occurrence(captured.occurrence)!;
      editor.dispatch(closeHistory(editor.state.tr).setNodeMarkup(found.pos, undefined, { ...found.node.attrs, folded: !found.node.attrs['folded'] }));
    } }));
  for (const [id, factor] of [['out', 1.25], ['in', 0.8]] as const) register(registry.targeted({ id: `math.zoom-${id}`, title: `Zoom ${id} selected graph`, category: 'Mathematics', scope: 'notebook', target: selected,
    state: captured => { const state = readiness(captured); return !state.enabled ? state : occurrence(captured.occurrence)?.node.attrs['view'] === 'graph' ? available() : unavailable('Select a graph occurrence'); },
    run: captured => {
      const editor = requireView(), found = occurrence(captured.occurrence)!, previous = readMathViewport(found.node.attrs['viewport']);
      const domain = (values: readonly [number, number]) => { const middle = (values[0] + values[1]) / 2, radius = (values[1] - values[0]) * factor / 2; return [middle - radius, middle + radius]; };
      const viewport = readMathViewport({ x: domain(previous.x), y: domain(previous.y) });
      editor.dispatch(closeHistory(editor.state.tr).setNodeMarkup(found.pos, undefined, { ...found.node.attrs, viewport }));
    } }));
  const playback = (captured: CapturedMathObject, direction: 'forward' | 'rewind') => {
    const resource = find(captured.resource); if (resource?.kind !== 'tangent') return;
    const at = preview?.id === resource.id ? preview.at : resource.at; stopClock();
    const end = direction === 'forward' ? 1 : 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { tangent(resource.id, String(end * 8 - 4), false); return; }
    clock = createKpReaderTimelinePlaybackClock({ id: `notebook-tangent-${resource.id}`, durationMs: 6000, initialProgress: (at + 4) / 8 });
    unsubscribeClock = clock.subscribe(sample => {
      if (disposed || !view || captured.doc !== view.state.doc) { cancelPreview(); return; }
      const value = String(Math.round((sample.progress * 8 - 4) * 10000) / 10000);
      if (sample.settled) { tangent(resource.id, value, false); return; }
      preview = editTangent(resource, value); show();
    });
    clock.play({ direction, stopAt: end }); registry.notify();
  };
  for (const [id, title, direction] of [['play', 'Play tangent forward', 'forward'], ['reverse', 'Play tangent backward', 'rewind']] as const)
    register(registry.targeted({ id: `math.${id}`, title, category: 'Mathematics', scope: 'notebook', target: selected,
      state: captured => { const state = readiness(captured, true); return !state.enabled ? state : find(captured.resource)?.kind === 'tangent' ? available() : unavailable('Select a tangent'); },
      run: captured => playback(captured, direction) }));
  register(registry.targeted({ id: 'math.pause', title: 'Pause tangent', category: 'Mathematics', scope: 'notebook', target: selected,
    state: captured => { const state = readiness(captured, true); return !state.enabled ? state : preview?.id === captured.resource ? available() : unavailable('This tangent is not playing'); },
    run: captured => { if (preview?.id === captured.resource) tangent(captured.resource, String(preview.at), false); } }));
  const owner: MathViewOwner = { runtime, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }, select,
    coefficient(id, field: keyof QuadraticCoefficients, text) { cancelPreview(); const resource = find(id); if (resource?.kind !== 'quadratic') throw new Error('This source was removed.'); replace(editCoefficient(resource, field, text)); },
    tangent, cancelPreview, bind(button, command, id) {
      // The registry owns availability and invocation for both buttons and M-x.
      targeted.get(command)?.bindResolvedTarget(button, () => localTarget(id));
    }, undo(forward) { cancelPreview(); const editor = requireView(); (forward ? redo : undo)(editor.state, editor.dispatch); }
  };
  const plugin = new Plugin({
    filterTransaction(tr) {
      if (!tr.docChanged) return true;
      try {
        const value = mathematicsIn(tr.doc);
        const resources = new Set(value.resources.map(resource => resource.id)); let valid = true;
        tr.doc.descendants(node => { if (node.type.name === 'mathObject' && !resources.has(node.attrs['resource'])) valid = false; });
        if (!valid) throw new Error('A mathematical view cannot lose its source.'); return true;
      } catch (error) { report(String(error)); return false; }
    },
    view(editor) {
      view = editor;
      return { update(next, before) {
        view = next;
        if (next.state.doc !== before.doc) notify();
      } };
    },
    props: { handleDrop(editor, event, slice, moved) {
      if (moved || !containsMath(slice)) return false;
      const position = editor.posAtCoords({ left: event.clientX, top: event.clientY });
      if (position) paste(editor, slice, position.pos); return true;
    } }
  });
  const containsMath = (slice: Slice) => { let found = false; slice.content.descendants(node => { if (node.type.name === 'mathObject') found = true; }); return found; };
  const paste = (editor: EditorView, slice: Slice, position?: number) => {
    if (!containsMath(slice)) return false;
    try {
      const replacements = new Map<UUID, UUID>(), additions: MathResource[] = [];
      const copy = (id: UUID): UUID => {
        const existing = replacements.get(id); if (existing) return existing;
        const resource = find(id); if (!resource) throw new Error('This clipboard object comes from another notebook. Import its resource JSON before pasting.');
        const fresh = newId(); replacements.set(id, fresh);
        additions.push(resource.kind === 'quadratic' ? { ...resource, id: fresh, revision: 0 }
          : { ...resource, id: fresh, revision: 0, source: copy(resource.source) }); return fresh;
      };
      const visit = (node: ProseNode): ProseNode => {
        if (node.type.name === 'mathObject') {
          const originalStillExists = occurrence(node.attrs['id']) !== undefined;
          return node.type.create({ ...node.attrs, id: originalStillExists ? newId() : node.attrs['id'], resource: originalStillExists ? copy(uuid(node.attrs['resource'])) : node.attrs['resource'] });
        }
        if (node.isText) return node; const children: ProseNode[] = []; node.forEach(child => children.push(visit(child))); return node.copy(Fragment.from(children));
      };
      const content: ProseNode[] = []; slice.content.forEach(node => content.push(visit(node)));
      const copied = preparePastedSlice(editor.state.doc, new Slice(Fragment.from(content), slice.openStart, slice.openEnd));
      const mathematics = readNotebookMathematics({ schemaVersion: 1, resources: [...current.resources, ...additions] });
      const tr = closeHistory(editor.state.tr).setNodeAttribute(0, 'value', mathematics);
      if (position === undefined) tr.replaceSelection(copied); else tr.replaceRange(position, position, copied);
      editor.dispatch(tr.scrollIntoView()); return true;
    } catch (error) { report(String(error)); return true; }
  };
  const extension: NotebookEditorExtension = { label: 'Mathematical notebook', plugins: [plugin], nodeViews: { mathObject: node => createMathNodeView(node, owner) }, paste,
    beforeRender(doc, previous) {
      if (doc === previous) return; stopClock(); preview = undefined;
      current = mathematicsIn(doc); runtime.update(current);
    } };
  return { extension, runtime, dispose() { if (disposed) return; disposed = true; stopClock(); preview = undefined; handles.forEach(handle => handle.dispose()); listeners.clear(); runtime.dispose(); view = undefined; } };
}
