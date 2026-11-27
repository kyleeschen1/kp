import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import type { FractionNotebook } from './types.ts';
import { toProse } from './schema.ts';
import { BlockView } from './block-view.ts';
import { createProjectionRuntime } from './projection-runtime.ts';
import { createProjectionNodeView, type ProjectionViewOwner } from './projection-view.ts';

export function mountProjectionReading(host: HTMLElement, initial: FractionNotebook, select: (id: string) => void) {
  const runtime = createProjectionRuntime(initial.projectionResources!), listeners = new Set<() => void>();
  const owner: ProjectionViewOwner = { runtime, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }, select, edit() {}, bind() {}, undo() {} };
  const view = new EditorView(host, { state: EditorState.create({ doc: toProse(initial) }), editable: () => false,
    attributes: { 'aria-label': 'Projection notebook reading' }, nodeViews: { projectionObject: n => createProjectionNodeView(n, owner, false), block: n => new BlockView(n, () => {}) } });
  return { update(next: FractionNotebook) { runtime.update(next.projectionResources!); view.updateState(EditorState.create({ doc: toProse(next) })); listeners.forEach(fn => fn()); },
    dispose() { view.destroy(); listeners.clear(); runtime.dispose(); } };
}
