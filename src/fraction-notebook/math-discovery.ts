import type { Node as ProseNode } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import { available, unavailable, target, type CommandRegistry, type Target, type TargetedCommand } from '../editor-commands/registry.ts';
import type { Row } from '../editor-rows/model.ts';
import { mountRowPicker } from '../interaction/row-picker.ts';
import { captureMathematicalDiscovery, mathCapabilityState, type MathCapability, type MathDiscoverySelection } from '../math-discovery/public-api.ts';
import { mathematicsIn, matrixResourcesIn } from './schema.ts';
import { selectedObject } from './inspector.ts';
import '../interaction/style.css';

type Selected = Exclude<MathDiscoverySelection, { kind: 'none' }>;
interface Captured { readonly doc: ProseNode; readonly selection: Selected }

/** The picker borrows focus, never mathematical ownership or document history.
 * Both the launcher and chosen operation retain their original occurrence. */
export function mountMathematicalDiscovery(host: HTMLElement, view: EditorView, registry: CommandRegistry,
  report: (message: string) => void): { dispose(): void } {
  let disposed = false, rows: readonly Row<MathCapability>[] = [];
  function identify(node: ProseNode | undefined): MathDiscoverySelection {
    if (disposed || view.isDestroyed || !node || typeof node.attrs['id'] !== 'string') return { kind: 'none' };
    const doc = view.state.doc, occurrenceId = node.attrs['id'];
    if (node.type.name === 'matrixObject' && doc.firstChild?.type.name === 'matrixResources') {
      const resource = matrixResourcesIn(doc).find(resource => resource.id === node.attrs['resource']);
      if (resource?.occurrences.some(occurrence => occurrence.id === node.attrs['occurrence']))
        return { kind: 'matrix-vector', id: resource.id, occurrenceId, revision: doc };
    }
    if (node.type.name === 'mathObject' && doc.firstChild?.type.name === 'mathematics') {
      const resource = mathematicsIn(doc).resources.find(resource => resource.id === node.attrs['resource']);
      if (resource) return { kind: resource.kind, id: resource.id, occurrenceId, revision: doc };
    }
    return { kind: 'none' };
  }
  const current = (occurrenceId: string): MathDiscoverySelection => {
    if (disposed || view.isDestroyed) return { kind: 'none' };
    let found: ProseNode | undefined;
    view.state.doc.descendants(node => { if (node.attrs['id'] === occurrenceId) found = node; });
    return identify(found);
  };
  const capture = (): Target<Captured> => {
    if (disposed || view.isDestroyed) return { found: false, reason: 'The notebook has closed.' };
    const selection = identify(selectedObject(view.state)?.node);
    return selection.kind === 'none' ? { found: false, reason: 'Select a matrix or quadratic-family object first.' }
      : target({ doc: view.state.doc, selection });
  };
  const readiness = (captured: Captured) => {
    if (disposed || view.isDestroyed) return unavailable('The notebook has closed.');
    if (captured.doc !== view.state.doc) return unavailable('The notebook changed; reopen commands for the current object.');
    const selected = identify(selectedObject(view.state)?.node);
    return selected.kind !== 'none' && selected.id === captured.selection.id && selected.occurrenceId === captured.selection.occurrenceId
      ? available() : unavailable('The selected object changed; reopen commands.');
  };
  const picker = mountRowPicker<MathCapability>(host, {
    id: 'kp-math-discovery', label: 'Mathematical capabilities', maxVisible: 5,
    rows: () => rows,
    facets: [{ id: 'operation', label: 'Operation', values: [
      { id: 'view', label: 'Views', key: 'v' }, { id: 'derive', label: 'Derive', key: 'd' }, { id: 'explain', label: 'Explain', key: 'e' }
    ] }],
    state: row => mathCapabilityState(row.resource),
    // The shared picker closes and restores its invoking focus before execution.
    // Do not refocus afterward: the operation may have selected a new object.
    execute: row => row.resource.kind === 'command' ? row.resource.command.execute() : { ok: false, reason: row.resource.reason },
    report
  });
  let command: TargetedCommand<Captured>;
  try {
    command = registry.targeted({ id: 'math.discover', title: 'Discover selected mathematical object', category: 'Mathematics', scope: 'notebook',
      keywords: ['capabilities', 'operations', 'views', 'derive', 'explain'], target: capture, state: readiness,
      run: captured => {
        rows = captureMathematicalDiscovery(registry, { origin: { scope: 'notebook', element: view.dom },
          selection: captured.selection, currentSelection: () => current(captured.selection.occurrenceId) });
        if (!rows.length) { report('This host has no registered capabilities for the selected object.'); return; }
        picker.open();
      }
    });
  } catch (error) { picker.dispose(); throw error; }
  const unsubscribe = registry.subscribe(() => { if (!disposed) picker.refresh(); });
  return { dispose() { if (disposed) return; disposed = true; unsubscribe(); command.dispose(); picker.dispose(); rows = []; } };
}
