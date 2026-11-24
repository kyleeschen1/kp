import type { Json, Metadata } from '../notebook/model.ts';
export class FractionNotebookGap extends Error { override name = 'FractionNotebookGap'; }
export const fail = (message: string): never => { throw new FractionNotebookGap(message); };
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return fail('Expected a plain JSON object.');
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value).some(key => typeof key !== 'string') || Object.values(descriptors).some(d => !d.enumerable || !('value' in d))) return fail('Use JSON values without accessors or hidden fields.');
  return Object.fromEntries(Object.entries(value));
}
export function exact(value: Record<string, unknown>, keys: readonly string[]) {
  if (Object.keys(value).some(key => !keys.includes(key))) fail('Unsupported field; original source is retained.');
}
export const text = (v: unknown, limit = 30000): string => typeof v === 'string' && v.length <= limit ? v : fail('Expected bounded text.');
export function array(v: unknown, max: number): unknown[] {
  if (!Array.isArray(v) || v.length > max || Object.keys(v).length !== v.length) return fail('Expected a bounded JSON array.');
  for (let i = 0; i < v.length; i++) if (!Object.hasOwn(v, i)) return fail('Sparse arrays are not JSON content.');
  return v;
}
export function metadata(value: unknown): Metadata {
  let count = 0;
  const visit = (v: unknown, depth: number): Json => {
    if (++count > 1000 || depth > 8) return fail('Metadata is too deeply nested or too large.');
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') return text(v, 8000);
    if (Array.isArray(v)) return array(v, 100).map(x => visit(x, depth + 1));
    return Object.fromEntries(Object.entries(object(v)).map(([key, item]) => [text(key, 200), visit(item, depth + 1)]));
  };
  const result = Object.fromEntries(Object.entries(object(value)).map(([key, v]) => [text(key, 200), visit(v, 1)]));
  if (JSON.stringify(result).length > 16000) fail('Metadata must fit within 16,000 characters.');
  return result;
}
