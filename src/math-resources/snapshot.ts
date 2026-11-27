import { readMatrixVectorDocument, invalidResourceFields, MathResourceGap } from './model.ts';

/** A portable source is complete data, never a renderer's last valid draft. */
export function readMatrixSnapshot(value: unknown) {
  const source = readMatrixVectorDocument(value);
  if (invalidResourceFields(source).length)
    throw new MathResourceGap('incomplete-snapshot', 'source', 'Complete the numeric draft before exporting or opening a snapshot.');
  return source;
}
export const serializeMatrixSnapshot = (value: unknown): string => JSON.stringify(readMatrixSnapshot(value), null, 2);
