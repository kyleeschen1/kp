import { NotebookGap, type Notebook, type UUID } from './model.ts';
import { parseNotebook, parseWorkspace } from './validation.ts';

export function replaceNotebook(current: readonly Notebook[], basis: number | null, incoming: Notebook): readonly Notebook[] {
  const next = parseNotebook(incoming), previous = current.find(d => d.id === next.id);
  if (basis === null ? previous !== undefined || next.revision !== 0 : !previous || previous.revision !== basis || next.revision !== basis + 1)
    throw new NotebookGap('stale-revision', next.id, 'Saved content changed. Keep this draft and reload the latest notebook before retrying.');
  return parseWorkspace(previous ? current.map(d => d.id === next.id ? next : d) : [...current, next]);
}

/** A single IndexedDB read/write transaction owns compare-and-swap across tabs.
 * Notifications are hints to reread committed data, never another authority. */
export async function openNotebookStore(seed: readonly Notebook[], database = 'kp-notebook-proof-v1') {
  const initial = parseWorkspace(seed);
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('workspace');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Notebook storage is open in an incompatible tab. Close that tab and retry.'));
  });
  db.onversionchange = () => db.close();
  const channel = new BroadcastChannel(database);
  const listeners = new Set<() => void>();
  let closed = false;
  const notify = () => listeners.forEach(f => f());
  channel.onmessage = notify;
  const read = () => new Promise<readonly Notebook[]>((resolve, reject) => {
    const tx = db.transaction('workspace', 'readonly'), request = tx.objectStore('workspace').get('documents');
    request.onsuccess = () => { try { resolve(parseWorkspace(request.result)); } catch (error) { reject(error); } };
    request.onerror = () => reject(request.error);
  });
  const write = (change: (current: unknown) => readonly Notebook[]) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction('workspace', 'readwrite'), store = tx.objectStore('workspace'), request = store.get('documents');
    let failure: unknown;
    request.onsuccess = () => {
      try { store.put(change(request.result), 'documents'); }
      catch (error) { failure = error; tx.abort(); }
    };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(failure ?? tx.error ?? new Error('Notebook save was aborted.'));
    tx.onerror = () => { failure ??= tx.error; };
  });
  try { await write(value => value === undefined ? initial : parseWorkspace(value)); }
  catch (error) { db.close(); channel.close(); throw error; }
  return {
    read,
    async save(basis: number | null, next: Notebook) {
      if (closed) throw new Error('Notebook storage is closed.');
      await write(value => replaceNotebook(parseWorkspace(value), basis, next));
      channel.postMessage({ notebookId: next.id }); notify();
    },
    subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
    close() { if (closed) return; closed = true; listeners.clear(); channel.close(); db.close(); }
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
