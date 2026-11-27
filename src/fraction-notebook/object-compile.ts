import { sha256 } from '../kernel/sha256.ts';
import { importFractionReading } from './model.ts';
import { compileFractionNotebook } from './compile.ts';
import { fractionObjectId, sourceLimit, type ObjectDescriptor } from './object-protocol.ts';

export function fractionObject(canonical: string): ObjectDescriptor {
  const story = importFractionReading(canonical).notebook.cells.find(cell => cell.type === 'story');
  if (story?.type !== 'story') throw new Error('Canonical fraction animation is missing.');
  return { id: fractionObjectId, revision: sha256(canonical),
    title: 'Fraction animation annotations', language: 'json', source: story.source, capabilities: ['preview'] };
}

/** Reconstruct the domain object from canonical data; the workbench cannot
 * replace its topology, identities, renderer or arbitrary lesson paths. */
export function previewFractionObject(value: unknown, canonical: string) {
  const descriptor = fractionObject(canonical);
  if (!value || typeof value !== 'object') throw new Error('Expected an object preview proposal.');
  const v = value as Record<string, unknown>;
  if (v['id'] !== descriptor.id) throw new Error('Unknown project object.');
  if (v['revision'] !== descriptor.revision) throw new Error('Canonical revision changed. Reconnect to inspect the new basis; your draft is retained.');
  if (typeof v['source'] !== 'string' || v['source'].length > sourceLimit) throw new Error('Source exceeds the preview limit.');
  const { notebook } = importFractionReading(canonical);
  return compileFractionNotebook({ ...notebook, cells: notebook.cells.map(cell => cell.type === 'story' ? { ...cell, source: v['source'] } : cell) }, canonical);
}
