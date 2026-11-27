import { newId, uuid, type UUID } from '../notebook/model.ts';
import { readMatrixSnapshot, readMatrixVectorDocument, type MatrixVectorDocument } from '../math-resources/data-api.ts';
import { sha256 } from '../kernel/sha256.ts';
import { array, exact, fail, object, text } from './json.ts';
import { copyMatrixResource } from './matrix-data.ts';

export interface MatrixNote { readonly resource: UUID; readonly title: string; readonly content: string }
export interface MatrixBinding {
  readonly resource: UUID; readonly source: UUID; readonly owner: UUID;
  readonly kind: 'transclude' | 'derive'; readonly mode: 'live' | 'pinned'; readonly revision: number;
}
export interface MatrixPublication {
  readonly owner: UUID; readonly revision: number; readonly withdrawn: boolean;
  readonly document: MatrixVectorDocument; readonly note: MatrixNote;
}
const revision = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 1 ? Number(v) : fail('Invalid publication revision.');
export function readMatrixNotes(value: unknown, resources: readonly MatrixVectorDocument[]): readonly MatrixNote[] {
  const seen = new Set<string>();
  return array(value, 16).map(raw => {
    const v = object(raw); exact(v, ['resource', 'title', 'content']); const resource = uuid(v['resource']);
    if (seen.has(resource) || !resources.some(d => d.id === resource)) return fail('A note must belong to one existing matrix resource.');
    seen.add(resource);
    return Object.freeze({ resource, title: text(v['title'], 300), content: text(v['content'], 4000) });
  });
}
export function readMatrixBindings(value: unknown, resources: readonly MatrixVectorDocument[]): readonly MatrixBinding[] {
  const seen = new Set<string>();
  return array(value, 16).map(raw => {
    const v = object(raw); exact(v, ['resource', 'source', 'owner', 'kind', 'mode', 'revision']);
    const resource = uuid(v['resource']), source = uuid(v['source']), owner = uuid(v['owner']);
    if (seen.has(resource) || !resources.some(d => d.id === resource)) return fail('A dependency must belong to one existing matrix resource.');
    if (v['kind'] !== 'transclude' && v['kind'] !== 'derive') return fail('Choose Transclude or Derive.');
    if (v['mode'] !== 'live' && v['mode'] !== 'pinned') return fail('Choose live or pinned updates.');
    if ((v['kind'] === 'transclude') !== (resource === source)) return fail('Transclusion shares identity; derivation requires a new identity.');
    seen.add(resource);
    return Object.freeze({ resource, source, owner, kind: v['kind'], mode: v['mode'], revision: revision(v['revision']) });
  });
}
export function matrixNote(document: MatrixVectorDocument, notes: readonly MatrixNote[]): MatrixNote {
  return notes.find(n => n.resource === document.id) ?? { resource: document.id, title: 'What do the weights do?',
    content: 'Each input coordinate weights one matrix column. Add the weighted columns to obtain the result.' };
}
export function readMatrixPublications(value: unknown): readonly MatrixPublication[] {
  const seen = new Set<string>();
  return array(value, 64).map(raw => {
    const v = object(raw); exact(v, ['owner', 'revision', 'withdrawn', 'document', 'note']);
    const document = readMatrixSnapshot(v['document']);
    if (seen.has(document.id) || typeof v['withdrawn'] !== 'boolean') return fail('Invalid or repeated source publication.');
    seen.add(document.id);
    return Object.freeze({ owner: uuid(v['owner']), revision: revision(v['revision']), withdrawn: v['withdrawn'], document,
      note: readMatrixNotes([v['note']], [document])[0]! });
  });
}
export function matrixSourceHash(document: MatrixVectorDocument, note?: MatrixNote) {
  // View extent and occurrence count are local presentation, never source updates.
  return sha256(JSON.stringify([document.id, document.matrix, document.vector, document.result, note]));
}
export function publishMatrix(current: readonly MatrixPublication[], owner: UUID, document: MatrixVectorDocument,
  note: MatrixNote, expected: number | null, withdrawn = false): readonly MatrixPublication[] {
  const before = current.find(p => p.document.id === document.id);
  if ((before?.revision ?? null) !== expected) return fail('The publication changed in another tab. Refresh its revision before publishing.');
  if (before && before.owner !== owner) return fail('Only the source notebook can publish this resource.');
  if (before && (before.document.matrix.id !== document.matrix.id || before.document.vector.id !== document.vector.id || before.document.result.id !== document.result.id))
    return fail('Published source identity cannot be replaced. Make an independent copy.');
  const next = { owner, revision: (before?.revision ?? 0) + 1, withdrawn, document, note };
  return readMatrixPublications([...current.filter(p => p.document.id !== document.id), next]);
}
export function importMatrixPublication(publication: MatrixPublication, kind: 'copy' | MatrixBinding['kind']) {
  const p = readMatrixPublications([publication])[0]!;
  if (p.withdrawn) return fail('The source publication has been withdrawn.');
  const document = kind === 'transclude' ? readMatrixVectorDocument({ ...p.document,
    occurrences: p.document.occurrences.map(o => ({ ...o, id: newId() })) }) : copyMatrixResource(p.document);
  const binding: MatrixBinding | undefined = kind === 'copy' ? undefined : {
    resource: document.id, source: p.document.id, owner: p.owner, revision: p.revision, kind, mode: 'live' };
  return { document, binding, note: { ...p.note, resource: document.id } };
}
export function refreshMatrixBinding(document: MatrixVectorDocument, binding: MatrixBinding, publication: MatrixPublication | undefined) {
  if (!publication || publication.withdrawn) return fail('Upstream source unavailable. Retaining the saved snapshot; no dependency was detached.');
  const p = readMatrixPublications([publication])[0]!;
  if (p.owner !== binding.owner || p.document.id !== binding.source) return fail('The publication does not own this dependency.');
  if (p.revision < binding.revision) return fail('The publication is older than the retained source revision.');
  if (binding.kind === 'transclude' && (p.document.matrix.id !== document.matrix.id || p.document.vector.id !== document.vector.id || p.document.result.id !== document.result.id))
    return fail('The upstream closure changed identity. Retaining the snapshot.');
  const next = readMatrixVectorDocument({ ...document,
    matrix: { ...p.document.matrix, id: document.matrix.id },
    vector: binding.kind === 'derive' ? document.vector : p.document.vector });
  return { document: next, binding: { ...binding, revision: p.revision }, note: { ...p.note, resource: document.id } };
}
