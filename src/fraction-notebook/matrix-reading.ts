import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import type { FractionNotebook } from './types.ts';
import { toProse } from './schema.ts';
import { BlockView } from './block-view.ts';
import { createMatrixNotebookRuntime } from './matrix-runtime.ts';
import { createMatrixNodeView, type MatrixViewOwner } from './matrix-view.ts';

export function mountMatrixReading(host: HTMLElement, initial: FractionNotebook, select: (id: string) => void) {
  let notebook = initial;
  const runtime = createMatrixNotebookRuntime(initial.matrixResources!), listeners = new Set<() => void>();
  const owner: MatrixViewOwner = { runtime, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }, select, edit() {}, bind() {}, undo() {},
    details(id) { return { note: notebook.matrixNotes?.find(n => n.resource === id), binding: notebook.matrixBindings?.find(b => b.resource === id) }; } };
  const view = new EditorView(host, { state: EditorState.create({ doc: toProse(initial) }), editable: () => false,
    attributes: { 'aria-label': 'Matrix notebook reading' }, nodeViews: { matrixObject: n => createMatrixNodeView(n, owner, false), block: n => new BlockView(n, () => {}) } });
  return { update(next: FractionNotebook) { notebook = next; runtime.update(next.matrixResources!); view.updateState(EditorState.create({ doc: toProse(next) })); listeners.forEach(fn => fn()); },
    dispose() { view.destroy(); listeners.clear(); runtime.dispose(); } };
}
