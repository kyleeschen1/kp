import { openAtomicRecord } from '../notebook/atomic-record.ts';
import { object, exact, readNotebook, type FractionNotebook } from './model.ts';
interface StoredDraft { readonly draft: FractionNotebook; readonly lastValid: FractionNotebook }
function parse(value: unknown): StoredDraft {
  const data = object(value); exact(data, ['draft', 'lastValid']);
  const draft = readNotebook(data['draft']), lastValid = readNotebook(data['lastValid']);
  if (draft.id !== lastValid.id || lastValid.revision > draft.revision) throw new Error('Stored preview does not belong to this draft revision.');
  return { draft, lastValid };
}
/** Opening an absent legacy database is aborted, never seeded or overwritten. */
async function readExisting(name: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name); let absent = false, abandoned = false;
    request.onupgradeneeded = () => { absent = true; request.transaction?.abort(); };
    request.onblocked = () => { abandoned = true; reject(new Error('Close the incompatible notebook tab before upgrading.')); };
    request.onerror = () => absent ? resolve(undefined) : reject(request.error);
    request.onsuccess = () => {
      const db = request.result; if (abandoned) { db.close(); return; }
      try {
        const tx = db.transaction('workspace', 'readonly'), read = tx.objectStore('workspace').get('documents');
        read.onsuccess = () => resolve(read.result); read.onerror = () => reject(read.error);
        tx.oncomplete = () => db.close(); tx.onabort = () => { db.close(); reject(tx.error); };
      } catch (error) { db.close(); reject(error); }
    };
  });
}
export async function openFractionDraft(seed: FractionNotebook, name = 'kp-fraction-notebook-v2', legacyName = 'kp-fraction-notebook-v1') {
  const existing = await readExisting(name);
  const source = existing ?? await readExisting(legacyName);
  const initial = source === undefined ? { draft: seed, lastValid: seed } : parse(source);
  const record = await openAtomicRecord(name, parse, initial);
  return {
    read: record.read, close: record.close,
    save: (basis: number, draft: FractionNotebook) => record.change(current => {
      if (current.draft.revision !== basis || draft.revision !== basis + 1 || draft.id !== current.draft.id) throw new Error('Another tab changed the saved notebook. Your draft is retained in this tab; download it before reloading to reconcile.');
      return { ...current, draft };
    }),
    accept: (revision: number) => record.change(current => current.draft.revision === revision ? { ...current, lastValid: current.draft } : current)
  };
}
