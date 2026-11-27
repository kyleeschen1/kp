import { newId, uuid, type UUID } from '../notebook/model.ts';
import { coordinate, type ProjectionDraft } from './draft.ts';

/** Draft and last admitted source travel together through native history.
 * Playback and derived geometry never become saved source authority. */
export interface ProjectionResource {
  readonly id: UUID;
  readonly revision: number;
  readonly draft: ProjectionDraft;
  readonly admitted: ProjectionDraft;
}
export type ProjectionField = 0 | 1 | 2 | 3;
export const projectionFields: readonly ProjectionField[] = [0, 1, 2, 3];
export class ProjectionResourceGap extends Error {
  readonly code = 'projection.resource.invalid';
  constructor(message: string) { super(message); this.name = 'ProjectionResourceGap'; }
}
const fail = (message: string): never => { throw new ProjectionResourceGap(message); };
function draft(value: unknown): ProjectionDraft {
  if (!Array.isArray(value) || value.length !== 4 || value.some(v => typeof v !== 'string' || v.length > 32))
    return fail('A vector pair requires four coordinate strings of at most 32 characters.');
  return [value[0], value[1], value[2], value[3]];
}
export const validProjectionDraft = (value: ProjectionDraft) => value.every(coordinate);
export function readProjectionResource(value: unknown): ProjectionResource {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Expected a vector-pair resource.');
  if (Object.keys(value).some(key => !['id', 'revision', 'draft', 'admitted'].includes(key))) return fail('Unsupported vector-pair field.');
  if (!('id' in value) || !('revision' in value) || !('draft' in value) || !('admitted' in value)) return fail('Incomplete vector pair.');
  const id = uuid(value.id), current = draft(value.draft), admitted = draft(value.admitted);
  if (typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0) return fail('Invalid vector-pair revision.');
  if (!validProjectionDraft(admitted)) return fail('The last admitted vector pair must have bounded integer coordinates.');
  if (validProjectionDraft(current) && current.some((v, i) => Number(v) !== Number(admitted[i])))
    return fail('A valid draft must agree with its admitted vector pair.');
  return { id, revision: value.revision, draft: current, admitted };
}
export function readProjectionResources(value: unknown): readonly ProjectionResource[] {
  if (!Array.isArray(value) || value.length > 16) return fail('This notebook supports up to sixteen vector pairs.');
  const resources = value.map(readProjectionResource);
  if (new Set(resources.map(r => r.id)).size !== resources.length) return fail('Vector-pair identities must be unique.');
  return resources;
}
export function createProjectionResource(values: ProjectionDraft = ['4', '2', '1', '1']): ProjectionResource {
  return readProjectionResource({ id: newId(), revision: 0, draft: values, admitted: values });
}
export function editProjectionResource(source: ProjectionResource, field: ProjectionField, value: string): ProjectionResource {
  const next: [string, string, string, string] = [...source.draft]; next[field] = value;
  return readProjectionResource({ ...source, revision: source.revision + 1, draft: next,
    admitted: validProjectionDraft(next) ? next : source.admitted });
}
export function copyProjectionResource(source: ProjectionResource): ProjectionResource {
  return readProjectionResource({ ...source, id: newId(), revision: 0 });
}
