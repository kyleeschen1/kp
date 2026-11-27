import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import type { FractionNotebook } from './types.ts';
import { toProse } from './schema.ts';
import { BlockView } from './block-view.ts';
import { createMatrixNotebookRuntime } from './matrix-runtime.ts';
import { createMatrixNodeView, type MatrixViewOwner } from './matrix-view.ts';

export function mountMatrixReading(host: HTMLElement, initial: FractionNotebook, select: (id: string) => void) {
  const runtime = createMatrixNotebookRuntime(initial.matrixResources!), listeners = new Set<() => void>();
  const owner: MatrixViewOwner = { runtime, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }, select, edit() {}, bind() {}, undo() {} };
  const view = new EditorView(host, { state: EditorState.create({ doc: toProse(initial) }), editable: () => false,
    attributes: { 'aria-label': 'Matrix notebook reading' }, nodeViews: { matrixObject: n => createMatrixNodeView(n, owner, false), block: n => new BlockView(n, () => {}) } });
  return { update(next: FractionNotebook) { runtime.update(next.matrixResources!); view.updateState(EditorState.create({ doc: toProse(next) })); listeners.forEach(fn => fn()); },
    dispose() { view.destroy(); listeners.clear(); runtime.dispose(); } };
}
