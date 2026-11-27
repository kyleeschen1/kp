import { newId, type UUID } from '../notebook/model.ts';
import { readMatrixVectorDocument, type MatrixVectorDocument } from '../math-resources/public-api.ts';
import { array, fail } from './json.ts';

export function readMatrixResources(raw: unknown): readonly MatrixVectorDocument[] {
  return array(raw, 16).map(readMatrixVectorDocument);
}

/** Copy owns fresh sources and recipe identity; linked occurrences retain them. */
export function copyMatrixResource(source: MatrixVectorDocument): MatrixVectorDocument {
  const matrix = newId(), vector = newId(), result = newId();
  return readMatrixVectorDocument({ ...source, id: newId(),
    matrix: { ...source.matrix, id: matrix, revision: 0 }, vector: { ...source.vector, id: vector, revision: 0 },
    result: { ...source.result, id: result, matrix, vector },
    occurrences: source.occurrences.map(o => ({ ...o, id: newId(), resource: result })) });
}

export function matrixOccurrence(resources: readonly MatrixVectorDocument[], resource: UUID, occurrence: UUID) {
  const document = resources.find(d => d.id === resource);
  const view = document?.occurrences.find(o => o.id === occurrence);
  if (!document || !view) return fail('Restore the matrix resource and view referenced by this occurrence.');
  return { document, view };
}
