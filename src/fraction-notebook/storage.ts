import { openAtomicRecord } from '../notebook/atomic-record.ts';
import { object, exact, readNotebook, type FractionNotebook } from './model.ts';
interface StoredDraft { readonly draft: FractionNotebook; readonly lastValid: FractionNotebook }
function parse(value: unknown): StoredDraft {
  const data = object(value); exact(data, ['draft', 'lastValid']);
  const draft = readNotebook(data['draft']), lastValid = readNotebook(data['lastValid']);
  if (draft.id !== lastValid.id || lastValid.revision > draft.revision) throw new Error('Stored preview does not belong to this draft revision.');
  return { draft, lastValid };
}
export async function openFractionDraft(seed: FractionNotebook, name = 'kp-fraction-notebook-v1') {
  const record = await openAtomicRecord(name, parse, { draft: seed, lastValid: seed });
  return {
    read: record.read, close: record.close,
    save: (basis: number, draft: FractionNotebook) => record.change(current => {
      if (current.draft.revision !== basis || draft.revision !== basis + 1 || draft.id !== current.draft.id) throw new Error('Another tab changed the saved notebook. Your draft is retained in this tab; download it before reloading to reconcile.');
      return { ...current, draft };
    }),
    accept: (revision: number) => record.change(current => current.draft.revision === revision ? { ...current, lastValid: current.draft } : current)
  };
}
