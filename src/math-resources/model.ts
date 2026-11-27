import { newId, uuid, type UUID, type Matrix2 } from '../notebook/model.ts';

export const matrixFields = ['a00', 'a01', 'a10', 'a11'] as const;
export const vectorFields = ['x', 'y'] as const;
export type MatrixField = typeof matrixFields[number];
export type VectorField = typeof vectorFields[number];
export type Vector2 = readonly [number, number];
export interface MatrixResource {
  readonly kind: 'matrix2'; readonly id: UUID; readonly revision: number;
  readonly entries: Matrix2; readonly draft: Readonly<Record<MatrixField, string>>;
}
export interface VectorResource {
  readonly kind: 'vector2'; readonly id: UUID; readonly revision: number;
  readonly entries: Vector2; readonly draft: Readonly<Record<VectorField, string>>;
}
export interface ProductResource {
  readonly kind: 'matrix-vector-product'; readonly id: UUID;
  readonly recipe: 'matrix2.vector2@1'; readonly matrix: UUID; readonly vector: UUID;
}
export interface MathOccurrence {
  readonly id: UUID; readonly resource: UUID; readonly view: 'equation' | 'graph';
  readonly extent: number;
}
export interface MatrixVectorDocument {
  readonly schemaVersion: 1; readonly id: UUID;
  readonly matrix: MatrixResource; readonly vector: VectorResource; readonly result: ProductResource;
  readonly occurrences: readonly MathOccurrence[];
}
export class MathResourceGap extends Error {
  readonly code: string; readonly path: string;
  constructor(code: string, path: string, message: string) {
    super(`${path}: ${message}`); this.name = 'MathResourceGap'; this.code = code; this.path = path;
  }
}
const gap = (code: string, path: string, message: string): never => { throw new MathResourceGap(code, path, message); };
function record(raw: unknown, fields: readonly string[], path: string): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.getPrototypeOf(raw) !== Object.prototype)
    return gap('invalid-data', path, 'Expected a plain JSON object.');
  const descriptors = Object.getOwnPropertyDescriptors(raw);
  if (Reflect.ownKeys(raw).length !== fields.length || fields.some(field => !Object.hasOwn(raw, field))
      || Object.values(descriptors).some(d => !d.enumerable || !('value' in d)))
    return gap('invalid-data', path, `Expected exactly ${fields.join(', ')}.`);
  return raw as Record<string, unknown>;
}
function array(raw: unknown, length: number, path: string): readonly unknown[] {
  if (!Array.isArray(raw) || raw.length !== length || Object.keys(raw).length !== length
      || Array.from({ length }, (_, i) => Object.getOwnPropertyDescriptor(raw, String(i))).some(d => !d || !('value' in d)))
    return gap('invalid-data', path, `Expected a dense ${length}-element array.`);
  return raw;
}
function numeric(raw: unknown, limit: number, path: string): number {
  return typeof raw === 'number' && Number.isFinite(raw) && Math.abs(raw) <= limit ? raw
    : gap('unsupported-value', path, `Expected a finite value in [-${limit}, ${limit}].`);
}
function revision(raw: unknown, path: string): number {
  return typeof raw === 'number' && Number.isSafeInteger(raw) && raw >= 0 ? raw
    : gap('invalid-revision', path, 'Expected a nonnegative safe integer.');
}
export function parseResourceNumber(text: string): number | undefined {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text.trim())) return;
  const number = Number(text); return Number.isFinite(number) && Math.abs(number) <= 10 ? number : undefined;
}
function draft(raw: unknown, value: number, path: string): string {
  if (typeof raw !== 'string' || raw.length > 32) return gap('invalid-draft', path, 'Expected at most 32 characters.');
  const parsed = parseResourceNumber(raw);
  if (parsed !== undefined && parsed !== value) return gap('inconsistent-draft', path, 'A valid draft must equal its admitted value.');
  return raw;
}
const vector2 = (raw: unknown, path: string): Vector2 => {
  const v = array(raw, 2, path); return Object.freeze([numeric(v[0], 10, path), numeric(v[1], 10, path)]);
};

/** Admission copies and freezes data: runtime cache truth cannot be mutated
 * through a retained caller reference, and executable recipes never enter JSON. */
export function readMatrixVectorDocument(raw: unknown): MatrixVectorDocument {
  const d = record(raw, ['schemaVersion', 'id', 'matrix', 'vector', 'result', 'occurrences'], 'document');
  if (d['schemaVersion'] !== 1) return gap('unsupported-schema', 'document', 'Expected schemaVersion 1.');
  const id = uuid(d['id']), m = record(d['matrix'], ['kind', 'id', 'revision', 'entries', 'draft'], 'matrix');
  if (m['kind'] !== 'matrix2') return gap('unsupported-resource', 'matrix', 'Expected matrix2.');
  const rows = array(m['entries'], 2, 'matrix.entries');
  const entries: Matrix2 = Object.freeze([vector2(rows[0], 'matrix.row0'), vector2(rows[1], 'matrix.row1')]);
  const md = record(m['draft'], matrixFields, 'matrix.draft');
  const matrix: MatrixResource = Object.freeze({ kind: 'matrix2', id: uuid(m['id']), revision: revision(m['revision'], 'matrix.revision'), entries,
    draft: Object.freeze({ a00: draft(md['a00'], entries[0][0], 'a00'), a01: draft(md['a01'], entries[0][1], 'a01'),
      a10: draft(md['a10'], entries[1][0], 'a10'), a11: draft(md['a11'], entries[1][1], 'a11') }) });
  const v = record(d['vector'], ['kind', 'id', 'revision', 'entries', 'draft'], 'vector');
  if (v['kind'] !== 'vector2') return gap('unsupported-resource', 'vector', 'Expected vector2.');
  const ve = vector2(v['entries'], 'vector.entries'), vd = record(v['draft'], vectorFields, 'vector.draft');
  const vector: VectorResource = Object.freeze({ kind: 'vector2', id: uuid(v['id']), revision: revision(v['revision'], 'vector.revision'), entries: ve,
    draft: Object.freeze({ x: draft(vd['x'], ve[0], 'x'), y: draft(vd['y'], ve[1], 'y') }) });
  const r = record(d['result'], ['kind', 'id', 'recipe', 'matrix', 'vector'], 'result');
  if (r['kind'] !== 'matrix-vector-product' || r['recipe'] !== 'matrix2.vector2@1')
    return gap('unsupported-recipe', 'result', 'Restore the registered matrix2.vector2@1 recipe.');
  const result: ProductResource = Object.freeze({ kind: 'matrix-vector-product', id: uuid(r['id']), recipe: 'matrix2.vector2@1', matrix: uuid(r['matrix']), vector: uuid(r['vector']) });
  if (result.matrix !== matrix.id || result.vector !== vector.id)
    return gap('invalid-dependency', 'result', 'The product must reference this document’s matrix and vector.');
  const ids = new Set([id, matrix.id, vector.id, result.id]);
  if (ids.size !== 4) return gap('duplicate-id', 'document', 'Document and resource identities must be distinct.');
  if (!Array.isArray(d['occurrences']) || d['occurrences'].length < 1 || d['occurrences'].length > 8)
    return gap('invalid-occurrences', 'occurrences', 'Use one to eight occurrences.');
  const occurrences = array(d['occurrences'], d['occurrences'].length, 'occurrences').map(raw => {
    const o = record(raw, ['id', 'resource', 'view', 'extent'], 'occurrence'), occurrenceId = uuid(o['id']), resource = uuid(o['resource']);
    if (ids.has(occurrenceId)) return gap('duplicate-id', occurrenceId, 'Occurrence identities must be unique.'); ids.add(occurrenceId);
    if (resource !== result.id) return gap('missing-resource', occurrenceId, 'This occurrence must reference the product.');
    if (o['view'] !== 'equation' && o['view'] !== 'graph') return gap('unsupported-view', occurrenceId, 'Choose equation or graph.');
    const extent = numeric(o['extent'], 250, occurrenceId);
    if (extent < 1) return gap('invalid-extent', occurrenceId, 'Use a viewport extent from 1 to 250.');
    return Object.freeze({ id: occurrenceId, resource, view: o['view'], extent });
  });
  return Object.freeze({ schemaVersion: 1, id, matrix, vector, result, occurrences: Object.freeze(occurrences) });
}

export function createMatrixVectorDocument(): MatrixVectorDocument {
  const matrix = newId(), vector = newId(), result = newId();
  return readMatrixVectorDocument({ schemaVersion: 1, id: newId(),
    matrix: { kind: 'matrix2', id: matrix, revision: 0, entries: [[1, 1], [0, 1]], draft: { a00: '1', a01: '1', a10: '0', a11: '1' } },
    vector: { kind: 'vector2', id: vector, revision: 0, entries: [1, 2], draft: { x: '1', y: '2' } },
    result: { kind: 'matrix-vector-product', id: result, recipe: 'matrix2.vector2@1', matrix, vector },
    occurrences: [{ id: newId(), resource: result, view: 'equation', extent: 5 },
      { id: newId(), resource: result, view: 'graph', extent: 5 }, { id: newId(), resource: result, view: 'graph', extent: 10 }] });
}
export type ResourceEdit = { kind: 'matrix'; field: MatrixField; text: string } | { kind: 'vector'; field: VectorField; text: string };
export function editMatrixVectorDocument(document: MatrixVectorDocument, edit: ResourceEdit): MatrixVectorDocument {
  const d = readMatrixVectorDocument(document), value = parseResourceNumber(edit.text);
  if (edit.kind === 'matrix') {
    const next = { ...d.matrix.draft, [edit.field]: edit.text }, old = d.matrix.entries;
    const entry = (field: MatrixField, previous: number) => field === edit.field ? value ?? previous : previous;
    return readMatrixVectorDocument({ ...d, matrix: { ...d.matrix, revision: d.matrix.revision + 1, draft: next,
      entries: [[entry('a00', old[0][0]), entry('a01', old[0][1])], [entry('a10', old[1][0]), entry('a11', old[1][1])]] } });
  }
  return readMatrixVectorDocument({ ...d, vector: { ...d.vector, revision: d.vector.revision + 1,
    draft: { ...d.vector.draft, [edit.field]: edit.text },
    entries: [edit.field === 'x' ? value ?? d.vector.entries[0] : d.vector.entries[0], edit.field === 'y' ? value ?? d.vector.entries[1] : d.vector.entries[1]] } });
}
export function editOccurrenceExtent(document: MatrixVectorDocument, id: UUID, extent: number): MatrixVectorDocument {
  if (!document.occurrences.some(o => o.id === id)) return gap('missing-occurrence', id, 'The view has been removed.');
  return readMatrixVectorDocument({ ...document, occurrences: document.occurrences.map(o => o.id === id ? { ...o, extent } : o) });
}
export function invalidResourceFields(document: MatrixVectorDocument): readonly string[] {
  return [...matrixFields.filter(key => parseResourceNumber(document.matrix.draft[key]) === undefined).map(key => `matrix.${key}`),
    ...vectorFields.filter(key => parseResourceNumber(document.vector.draft[key]) === undefined).map(key => `vector.${key}`)];
}
