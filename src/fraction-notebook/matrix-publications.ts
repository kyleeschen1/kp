import { openAtomicRecord } from '../notebook/atomic-record.ts';
import { publishMatrix, readMatrixPublications, type MatrixPublication, type MatrixNote } from './matrix-reuse-data.ts';
import type { MatrixVectorDocument } from '../math-resources/data-api.ts';
import type { UUID } from '../notebook/model.ts';

export async function openMatrixPublications(name = 'kp-matrix-publications-v1') {
  const record = await openAtomicRecord<readonly MatrixPublication[]>(name, readMatrixPublications, []);
  const channel = typeof BroadcastChannel === 'undefined' ? undefined : new BroadcastChannel(name);
  const listeners = new Set<() => void>(); let closed = false;
  const changed = () => { if (!closed) listeners.forEach(fn => fn()); };
  if (channel) channel.onmessage = changed;
  return { read: record.read,
    async publish(owner: UUID, document: MatrixVectorDocument, note: MatrixNote, expected: number | null, withdrawn = false) {
      await record.change(current => publishMatrix(current, owner, document, note, expected, withdrawn));
      channel?.postMessage('changed'); changed();
    },
    subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
    close() { if (closed) return; closed = true; listeners.clear(); channel?.close(); record.close(); }
  };
}
