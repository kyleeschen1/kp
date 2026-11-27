import { openAtomicRecord } from '../notebook/atomic-record.ts';
import { readReferenceRecord, referenceSeed } from './record.ts';
import { migrateReference, readReferenceShelf } from './shelf.ts';

export async function openReferenceShelf(seed: unknown) {
  const legacy = await openAtomicRecord('kp-matrix-reference-v1', readReferenceRecord, referenceSeed(seed));
  let original;
  try { original = await legacy.read(); } finally { legacy.close(); }
  // A separate key preserves the original record for rollback. Seed admission
  // is atomic: concurrent first opens keep the first committed card identities.
  return openAtomicRecord('kp-matrix-reference-v1', readReferenceShelf, migrateReference(original), 'workspace', 'shelf-v1');
}
