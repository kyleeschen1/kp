import { newId, uuid, type UUID } from '../notebook/model.ts';
import { coordinate, type CompositionDraft } from './draft.ts';

/** Draft and last admitted source travel together through native history.
 * Playback and derived geometry never become saved source authority. */
export interface CompositionResource {
  readonly id: UUID;
  readonly revision: number;
  readonly draft: CompositionDraft;
  readonly admitted: CompositionDraft;
}
export type CompositionField = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const compositionFields: readonly CompositionField[] = [0, 1, 2, 3, 4, 5, 6, 7];
export class CompositionResourceGap extends Error {
  readonly code = 'composition.resource.invalid';
  constructor(message: string) { super(message); this.name = 'CompositionResourceGap'; }
}
const fail = (message: string): never => { throw new CompositionResourceGap(message); };
function draft(value: unknown): CompositionDraft {
  if (!Array.isArray(value) || value.length !== 8 || value.some(v => typeof v !== 'string' || v.length > 12))
    return fail('A matrix pair requires eight entry strings of at most 12 characters.');
  return [value[0], value[1], value[2], value[3], value[4], value[5], value[6], value[7]];
}
export const validCompositionDraft = (value: CompositionDraft) => value.every(coordinate);
export function readCompositionResource(value: unknown): CompositionResource {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Expected a matrix-pair resource.');
  if (Object.keys(value).some(key => !['id', 'revision', 'draft', 'admitted'].includes(key))) return fail('Unsupported matrix-pair field.');
  if (!('id' in value) || !('revision' in value) || !('draft' in value) || !('admitted' in value)) return fail('Incomplete matrix pair.');
  const id = uuid(value.id), current = draft(value.draft), admitted = draft(value.admitted);
  if (typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0) return fail('Invalid matrix-pair revision.');
  if (!validCompositionDraft(admitted)) return fail('The last admitted matrix pair must have bounded integer entries.');
  if (validCompositionDraft(current) && current.some((v, i) => Number(v) !== Number(admitted[i])))
    return fail('A valid draft must agree with its admitted matrix pair.');
  return { id, revision: value.revision, draft: current, admitted };
}
export function readCompositionResources(value: unknown): readonly CompositionResource[] {
  if (!Array.isArray(value) || value.length > 16) return fail('This notebook supports up to sixteen matrix pairs.');
  const resources = value.map(readCompositionResource);
  if (new Set(resources.map(r => r.id)).size !== resources.length) return fail('Matrix-pair identities must be unique.');
  return resources;
}
export function createCompositionResource(values: CompositionDraft = ['1', '1', '0', '1', '2', '0', '0', '1']): CompositionResource {
  return readCompositionResource({ id: newId(), revision: 0, draft: values, admitted: values });
}
export function editCompositionResource(source: CompositionResource, field: CompositionField, value: string): CompositionResource {
  const next: [string, string, string, string, string, string, string, string] = [...source.draft]; next[field] = value;
  return readCompositionResource({ ...source, revision: source.revision + 1, draft: next,
    admitted: validCompositionDraft(next) ? next : source.admitted });
}
export function copyCompositionResource(source: CompositionResource): CompositionResource {
  return readCompositionResource({ ...source, id: newId(), revision: 0 });
}
