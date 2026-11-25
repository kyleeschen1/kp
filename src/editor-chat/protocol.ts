/** Shared data only. The browser never receives a process handle or arbitrary
 * app-server RPC capability. Codex, not this display cache, owns model history. */
import { readAnnotations, readAnnotationDraft, noteRevision, type ChatAnnotation, type AnnotationDraft } from './annotations.ts';

export const draftLimit = 32768;
export const messageLimit = 65536;
export const historyLimit = 80;
export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; complete: boolean; clipped: boolean };
export type PendingSend = { id: string; text: string; draftRevision: number; turnId: string | null; accepted: boolean };
export type ChatRecord = {
  version: 2; threadId: string | null; draft: string; draftRevision: number;
  messages: ChatMessage[]; pending: PendingSend | null; sentIds: string[]; historyClipped: boolean;
  annotations: ChatAnnotation[];
};
export type ChatPhase = 'disconnected' | 'connecting' | 'ready' | 'sending' | 'running' | 'uncertain' | 'error';
export type ChatSnapshot = ChatRecord & { phase: ChatPhase; notice: string; model: string; token: string; project: string; canAcknowledge: boolean };
export type ChatAction =
  | { kind: 'connect' | 'disconnect' | 'interrupt' | 'acknowledge' }
  | { kind: 'draft'; revision: number; text: string }
  | { kind: 'annotation-save'; revision: number; annotation: AnnotationDraft }
  | { kind: 'annotation-delete'; revision: number; id: string }
  | { kind: 'send'; revision: number; id: string };
export const emptyChat = (): ChatRecord => ({ version: 2, threadId: null, draft: '', draftRevision: 0,
  messages: [], pending: null, sentIds: [], historyClipped: false, annotations: [] });
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a chat object.');
  return value as Record<string, unknown>;
}
export function text(value: unknown, limit = draftLimit): string {
  if (typeof value !== 'string' || value.length > limit) throw new Error('Invalid or oversized chat text.');
  return value;
}
export function identity(value: unknown): string {
  const id = text(value, 200); if (!/^[\w.-]+$/.test(id)) throw new Error('Invalid chat identity.'); return id;
}
function revision(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid draft revision.'); return value;
}
function boolean(value: unknown): boolean { if (typeof value !== 'boolean') throw new Error('Invalid chat flag.'); return value; }
export function readChatRecord(value: unknown): ChatRecord {
  const v = record(value);
  if ((v['version'] !== 1 && v['version'] !== 2) || !Array.isArray(v['messages']) || v['messages'].length > historyLimit
    || !Array.isArray(v['sentIds']) || v['sentIds'].length > 128) throw new Error('Unsupported chat recovery record.');
  const messages: ChatMessage[] = v['messages'].map(raw => {
    const m = record(raw); if (m['role'] !== 'user' && m['role'] !== 'assistant') throw new Error('Unknown message role.');
    return { id: identity(m['id']), role: m['role'], text: text(m['text'], messageLimit), complete: boolean(m['complete']), clipped: boolean(m['clipped']) };
  });
  if (new Set(messages.map(m => m.id)).size !== messages.length) throw new Error('Duplicate chat message identity.');
  const p = v['pending'] === null ? null : record(v['pending']);
  return { version: 2, threadId: v['threadId'] === null ? null : identity(v['threadId']), draft: text(v['draft']),
    draftRevision: revision(v['draftRevision']), messages, historyClipped: boolean(v['historyClipped']),
    annotations: readAnnotations(v['version'] === 1 ? (v['annotations'] ?? []) : v['annotations']),
    sentIds: v['sentIds'].map(identity), pending: p && { id: identity(p['id']), text: text(p['text']), draftRevision: revision(p['draftRevision']),
      turnId: p['turnId'] === null ? null : identity(p['turnId']), accepted: boolean(p['accepted']) } };
}
export function readChatAction(value: unknown): ChatAction {
  const v = record(value);
  switch (v['kind']) {
    case 'connect': case 'disconnect': case 'interrupt': case 'acknowledge': return { kind: v['kind'] };
    case 'draft': return { kind: 'draft', revision: revision(v['revision']), text: text(v['text']) };
    case 'annotation-save': return { kind: 'annotation-save', revision: noteRevision(v['revision']), annotation: readAnnotationDraft(v['annotation']) };
    case 'annotation-delete': return { kind: 'annotation-delete', revision: noteRevision(v['revision']), id: identity(v['id']) };
    case 'send': return { kind: 'send', revision: revision(v['revision']), id: identity(v['id']) };
    default: throw new Error('Unknown chat action.');
  }
}
export function readChatSnapshot(value: unknown): ChatSnapshot {
  const v = record(value), phase = v['phase'];
  if (phase !== 'disconnected' && phase !== 'connecting' && phase !== 'ready' && phase !== 'sending'
    && phase !== 'running' && phase !== 'uncertain' && phase !== 'error') throw new Error('Unknown chat state.');
  return { ...readChatRecord(v), phase, notice: text(v['notice']), model: text(v['model'], 300),
    token: identity(v['token']), project: text(v['project'], 4096), canAcknowledge: boolean(v['canAcknowledge']) };
}
