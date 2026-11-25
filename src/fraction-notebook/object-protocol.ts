/** Deliberately text-only boundary: no editor state, renderer objects or native
 * workbench capabilities cross an embedded project's origin. */
export const objectProtocol = 'kp.project-object.v1';
export const fractionObjectId = 'kp:algebra:fractional-linear:annotations';
export const sourceLimit = 100000;
export type ObjectDescriptor = {
  id: string; revision: string; title: string; language: 'json'; source: string;
  capabilities: readonly ['preview'];
};
export type ObjectRequest =
  | { protocol: typeof objectProtocol; session: string; kind: 'open' }
  | { protocol: typeof objectProtocol; session: string; kind: 'cancel'; request: number }
  | { protocol: typeof objectProtocol; session: string; kind: 'preview'; request: number; id: string; revision: string; source: string };

export function readObjectRequest(value: unknown): ObjectRequest | undefined {
  if (!value || typeof value !== 'object') return;
  const v = value as Record<string, unknown>;
  if (v['protocol'] !== objectProtocol || typeof v['session'] !== 'string' || !/^[\w-]{1,80}$/.test(v['session'])) return;
  const base: Pick<ObjectRequest, 'protocol' | 'session'> = { protocol: objectProtocol, session: v['session'] };
  if (v['kind'] === 'open') return { ...base, kind: 'open' };
  if (!Number.isSafeInteger(v['request']) || Number(v['request']) < 1) return;
  const request = Number(v['request']);
  if (v['kind'] === 'cancel') return { ...base, kind: 'cancel', request };
  if (v['kind'] !== 'preview' || typeof v['id'] !== 'string' || typeof v['revision'] !== 'string'
    || typeof v['source'] !== 'string' || v['source'].length > sourceLimit) return;
  return { ...base, kind: 'preview', request, id: v['id'], revision: v['revision'], source: v['source'] };
}

/** The first exemplar permits only these browser hosts. Native workbench
 * origins need an explicitly reviewed adapter, not a wildcard trust expansion. */
export function allowsObjectParent(origin: string): boolean {
  return ['http://127.0.0.1:1426', 'http://127.0.0.1:1422'].includes(origin);
}
