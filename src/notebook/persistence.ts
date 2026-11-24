import { NotebookGap, type Notebook, type UUID } from './model.ts';
import { parseNotebook, parseWorkspace } from './validation.ts';
import { openAtomicRecord } from './atomic-record.ts';

export function replaceNotebook(current: readonly Notebook[], basis: number | null, incoming: Notebook): readonly Notebook[] {
  const next = parseNotebook(incoming), previous = current.find(d => d.id === next.id);
  if (basis === null ? previous !== undefined : !previous || previous.revision !== basis || next.revision !== basis + 1)
    throw new NotebookGap('stale-revision', next.id, 'Saved content changed. Keep this draft and reload the latest notebook before retrying.');
  return parseWorkspace(previous ? current.map(d => d.id === next.id ? next : d) : [...current, next]);
}

/** A single IndexedDB read/write transaction owns compare-and-swap across tabs.
 * Notifications are hints to reread committed data, never another authority. */
export async function openNotebookStore(seed: readonly Notebook[], database = 'kp-notebook-proof-v1') {
  const record = await openAtomicRecord(database, parseWorkspace, parseWorkspace(seed));
  const channel = new BroadcastChannel(database);
  const listeners = new Set<() => void>();
  let closed = false;
  const notify = () => listeners.forEach(f => f());
  channel.onmessage = notify;
  return {
    read: record.read,
    async save(basis: number | null, next: Notebook) {
      if (closed) throw new Error('Notebook storage is closed.');
      await record.change(value => replaceNotebook(value, basis, next));
      channel.postMessage({ notebookId: next.id }); notify();
    },
    subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
    close() { if (closed) return; closed = true; listeners.clear(); channel.close(); record.close(); }
  };
}
export type NotebookStore = Awaited<ReturnType<typeof openNotebookStore>>;

export interface ViewState { readonly folded: readonly string[]; readonly positions: Readonly<Record<string, number>> }
export function readViewState(notebookId: UUID): ViewState {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(`kp.notebook.view.${notebookId}`) ?? 'null');
    if (!v || typeof v !== 'object' || !('folded' in v) || !('positions' in v) || !Array.isArray(v.folded) || !v.positions || typeof v.positions !== 'object') return { folded: [], positions: {} };
    return { folded: v.folded.filter((x): x is string => typeof x === 'string'), positions: Object.fromEntries(Object.entries(v.positions).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] >= 0 && entry[1] <= 1)) };
  } catch { return { folded: [], positions: {} }; }
}
export function saveViewState(notebookId: UUID, state: ViewState) {
  // Failure to remember a viewport is nonfatal; document saves remain explicit.
  try { localStorage.setItem(`kp.notebook.view.${notebookId}`, JSON.stringify(state)); } catch { /* Private/full storage: current view still works. */ }
}
