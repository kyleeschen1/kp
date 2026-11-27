import { readMatrixSnapshot, MathResourceGap, type MatrixVectorDocument } from '../math-resources/data-api.ts';

export interface ReferenceRecord {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly source: MatrixVectorDocument;
  readonly view: { readonly progress: number; readonly filename: string };
}
export function readReferenceRecord(value: unknown): ReferenceRecord {
  if (!value || typeof value !== 'object' || !('schemaVersion' in value) || value.schemaVersion !== 1
    || !('revision' in value) || typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0
    || !('source' in value) || !('view' in value) || !value.view || typeof value.view !== 'object'
    || !('progress' in value.view) || typeof value.view.progress !== 'number' || !Number.isFinite(value.view.progress)
    || value.view.progress < 0 || value.view.progress > 1 || !('filename' in value.view) || typeof value.view.filename !== 'string'
    || value.view.filename.length > 255 || Object.keys(value).sort().join() !== 'revision,schemaVersion,source,view'
    || Object.keys(value.view).sort().join() !== 'filename,progress')
    throw new MathResourceGap('invalid-reference-record', 'reference', 'Expected a versioned source snapshot and a playback position between 0 and 1.');
  return Object.freeze({ schemaVersion: 1, revision: value.revision, source: readMatrixSnapshot(value.source),
    view: Object.freeze({ progress: value.view.progress, filename: value.view.filename }) });
}
export const referenceSeed = (source: unknown): ReferenceRecord => readReferenceRecord({ schemaVersion: 1, revision: 0,
  source, view: { progress: 0, filename: 'Built-in matrix example' } });

export function replaceReference(current: ReferenceRecord, expected: number, next: ReferenceRecord): ReferenceRecord {
  if (current.revision !== expected)
    throw new MathResourceGap('reference-conflict', 'reference', 'This card changed in another tab. Reload before saving more changes.');
  return readReferenceRecord({ ...next, revision: current.revision + 1 });
}
