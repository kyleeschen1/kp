import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import type { FractionNotebook } from './types.ts';
import { toProse } from './schema.ts';
import { BlockView } from './block-view.ts';
import { createCompositionRuntime } from './composition-runtime.ts';
import { createCompositionNodeView, type CompositionViewOwner } from './composition-view.ts';

export function mountCompositionReading(host: HTMLElement, initial: FractionNotebook, select: (id: string) => void) {
  const runtime = createCompositionRuntime(initial.compositionResources!), listeners = new Set<() => void>();
  const owner: CompositionViewOwner = { runtime, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }, select, edit() {}, bind() {}, undo() {} };
  const view = new EditorView(host, { state: EditorState.create({ doc: toProse(initial) }), editable: () => false,
    attributes: { 'aria-label': 'Composition notebook reading' }, nodeViews: { compositionObject: n => createCompositionNodeView(n, owner, false), block: n => new BlockView(n, () => {}) } });
  return { update(next: FractionNotebook) { runtime.update(next.compositionResources!); view.updateState(EditorState.create({ doc: toProse(next) })); listeners.forEach(fn => fn()); },
    dispose() { view.destroy(); listeners.clear(); runtime.dispose(); } };
}
