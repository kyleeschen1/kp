/** KP-owned notes never become model messages or alter the native transcript. */
export type PassageTarget = {
  kind: 'passage'; threadId: string; messageId: string;
  from: number; to: number; quote: string; prefix: string; suffix: string;
};
export type AnnotationTarget = { kind: 'conversation' } | PassageTarget;
export type AnnotationDraft = { id: string; target: AnnotationTarget; body: string; tags: string[] };
export type ChatAnnotation = AnnotationDraft & { revision: number; archived: boolean };
export const annotationLimit = 128;
export const noteLimit = 16384;
export const quoteLimit = 4096;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid note.');
  return value as Record<string, unknown>;
}
function string(value: unknown, limit: number): string {
  if (typeof value !== 'string' || value.length > limit) throw new Error('Invalid or oversized note text.');
  return value;
}
function id(value: unknown): string {
  const result = string(value, 200);
  if (!/^[\w.-]+$/.test(result)) throw new Error('Invalid note reference.');
  return result;
}
export function noteRevision(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid note revision.');
  return value;
}
export function readTarget(value: unknown): AnnotationTarget {
  const v = object(value);
  if (v['kind'] === 'conversation') return { kind: 'conversation' };
  if (v['kind'] !== 'passage') throw new Error('Unknown note target.');
  const from = noteRevision(v['from']), to = noteRevision(v['to']), quote = string(v['quote'], quoteLimit);
  if (to <= from || to > 131072 || !quote.trim()) throw new Error('Select a nonempty passage for this comment.');
  return { kind: 'passage', threadId: id(v['threadId']), messageId: id(v['messageId']), from, to, quote,
    prefix: string(v['prefix'], 48), suffix: string(v['suffix'], 48) };
}
export function readAnnotationDraft(value: unknown): AnnotationDraft {
  const v = object(value);
  if (!Array.isArray(v['tags']) || v['tags'].length > 12) throw new Error('Use at most 12 tags per note.');
  const tags = [...new Set(v['tags'].map(tag => string(tag, 40).trim().replace(/^#+/, '').toLowerCase()).filter(Boolean))];
  const body = string(v['body'], noteLimit);
  return { id: id(v['id']), target: readTarget(v['target']), body, tags };
}
export function readAnnotations(value: unknown): ChatAnnotation[] {
  if (!Array.isArray(value) || value.length > annotationLimit) throw new Error(`This conversation supports ${annotationLimit} saved notes.`);
  if (new TextEncoder().encode(JSON.stringify(value)).length > 1024 * 1024) throw new Error('Saved notes exceed the 1 MiB conversation limit.');
  const ids = new Set<string>();
  return value.map(raw => {
    const v = object(raw), draft = readAnnotationDraft(v), revision = noteRevision(v['revision']);
    if (!revision || typeof v['archived'] !== 'boolean' || ids.has(draft.id)) throw new Error('Invalid or duplicate saved note.');
    ids.add(draft.id);
    return { ...draft, revision, archived: v['archived'] };
  });
}
