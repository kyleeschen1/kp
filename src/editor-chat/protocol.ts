/** Native threads own model history; KP owns display, drafts and explicit
 * navigation. Every mutation is scoped once branches exist. */
import { readAnnotations, readAnnotationDraft, noteRevision, type ChatAnnotation, type AnnotationDraft } from './annotations.ts';

export const draftLimit = 32768, messageLimit = 65536, historyLimit = 80, branchLimit = 16;
export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; complete: boolean; clipped: boolean; turnId?: string };
export type PendingSend = { id: string; text: string; draftRevision: number; turnId: string | null; accepted: boolean };
export type ReadingPoint = { branchId: string; messageId: string; offset: number };
export type ChatTopic = { id: string; title: string; point: ReadingPoint };
export type ChatContext = { revision: number; objective: string; topics: ChatTopic[]; topicId: string | null; returnPoint: ReadingPoint | null };
export type BranchSummary = { branchId: string; branchTitle: string; threadId: string | null; forkedFrom: ReadingPoint | null };
export type ChatConversation = BranchSummary & {
  draft: string; draftRevision: number; messages: ChatMessage[]; pending: PendingSend | null;
  sentIds: string[]; historyClipped: boolean; annotations: ChatAnnotation[]; context: ChatContext;
};
export type ChatRecord = ChatConversation & { version: 3; parked: ChatConversation[] };
export type ChatPhase = 'disconnected' | 'connecting' | 'ready' | 'sending' | 'running' | 'uncertain' | 'error';
export type ChatSnapshot = ChatConversation & { version: 3; branches: BranchSummary[]; phase: ChatPhase; notice: string; model: string; token: string; project: string; canAcknowledge: boolean };
export type ChatAction = { branchId?: string } & (
  | { kind: 'connect' | 'disconnect' | 'interrupt' | 'acknowledge' }
  | { kind: 'draft'; revision: number; text: string }
  | { kind: 'annotation-save'; revision: number; annotation: AnnotationDraft }
  | { kind: 'annotation-delete'; revision: number; id: string }
  | { kind: 'context-save'; revision: number; context: Omit<ChatContext, 'revision'> }
  | { kind: 'branch-create'; id: string; title: string; point: ReadingPoint }
  | { kind: 'branch-switch'; id: string }
  | { kind: 'send'; revision: number; id: string }
);
export const emptyContext = (): ChatContext => ({ revision: 0, objective: '', topics: [], topicId: null, returnPoint: null });
export const emptyChat = (): ChatRecord => ({ version: 3, branchId: 'main', branchTitle: 'Main conversation', forkedFrom: null,
  threadId: null, draft: '', draftRevision: 0, messages: [], pending: null, sentIds: [], historyClipped: false,
  annotations: [], context: emptyContext(), parked: [] });
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a chat object.');
  return value as Record<string, unknown>;
}
export function text(value: unknown, limit = draftLimit): string {
  if (typeof value !== 'string' || value.length > limit) throw new Error('Invalid or oversized chat text.'); return value;
}
export function identity(value: unknown): string {
  const id = text(value, 200); if (!/^[\w.-]+$/.test(id)) throw new Error('Invalid chat identity.'); return id;
}
function revision(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid draft revision.'); return value;
}
function flag(value: unknown): boolean { if (typeof value !== 'boolean') throw new Error('Invalid chat flag.'); return value; }
function title(value: unknown): string { const result = text(value, 120).trim(); if (!result) throw new Error('Give this topic or branch a name.'); return result; }
export function readPoint(value: unknown): ReadingPoint {
  const v = record(value), offset = revision(v['offset']); if (offset > messageLimit * 2) throw new Error('Invalid reading position.');
  return { branchId: identity(v['branchId']), messageId: identity(v['messageId']), offset };
}
export function readContext(value: unknown): ChatContext {
  const v = record(value);
  if (!Array.isArray(v['topics']) || v['topics'].length > 32) throw new Error('A branch can hold up to 32 topics.');
  const topics = v['topics'].map(raw => { const t = record(raw); return { id: identity(t['id']), title: title(t['title']), point: readPoint(t['point']) }; });
  if (new Set(topics.map(t => t.id)).size !== topics.length) throw new Error('Duplicate topic identity.');
  const topicId = v['topicId'] === null ? null : identity(v['topicId']);
  if (topicId && !topics.some(t => t.id === topicId)) throw new Error('The selected topic does not exist.');
  return { revision: revision(v['revision']), objective: text(v['objective'], 4096), topics, topicId,
    returnPoint: v['returnPoint'] === null ? null : readPoint(v['returnPoint']) };
}
function readBranch(value: unknown): BranchSummary {
  const v = record(value);
  return { branchId: identity(v['branchId']), branchTitle: title(v['branchTitle']), threadId: v['threadId'] === null ? null : identity(v['threadId']),
    forkedFrom: v['forkedFrom'] === null ? null : readPoint(v['forkedFrom']) };
}
function readConversation(value: unknown, legacy = false): ChatConversation {
  const v = record(value);
  if (!Array.isArray(v['messages']) || v['messages'].length > historyLimit || !Array.isArray(v['sentIds']) || v['sentIds'].length > 128) throw new Error('Unsupported chat recovery record.');
  const messages: ChatMessage[] = v['messages'].map(raw => {
    const m = record(raw); if (m['role'] !== 'user' && m['role'] !== 'assistant') throw new Error('Unknown message role.');
    return { id: identity(m['id']), role: m['role'], text: text(m['text'], messageLimit), complete: flag(m['complete']), clipped: flag(m['clipped']),
      ...(m['turnId'] === undefined ? {} : { turnId: identity(m['turnId']) }) };
  });
  if (new Set(messages.map(m => m.id)).size !== messages.length) throw new Error('Duplicate chat message identity.');
  const p = v['pending'] === null ? null : record(v['pending']);
  const branch = legacy ? { branchId: 'main', branchTitle: 'Main conversation', forkedFrom: null, threadId: v['threadId'] === null ? null : identity(v['threadId']) } : readBranch(v);
  const context = legacy ? emptyContext() : readContext(v['context']);
  if (context.topics.some(t => t.point.branchId !== branch.branchId)) throw new Error('A topic must belong to its conversation.');
  return { ...branch, context, draft: text(v['draft']), draftRevision: revision(v['draftRevision']), messages,
    historyClipped: flag(v['historyClipped']), annotations: readAnnotations(v['version'] === 1 ? (v['annotations'] ?? []) : v['annotations']),
    sentIds: v['sentIds'].map(identity), pending: p && { id: identity(p['id']), text: text(p['text']), draftRevision: revision(p['draftRevision']),
      turnId: p['turnId'] === null ? null : identity(p['turnId']), accepted: flag(p['accepted']) } };
}
export function readChatRecord(value: unknown): ChatRecord {
  const v = record(value), legacy = v['version'] === 1 || v['version'] === 2;
  if (!legacy && v['version'] !== 3) throw new Error('Unsupported chat recovery record.');
  if (!legacy && (!Array.isArray(v['parked']) || v['parked'].length >= branchLimit)) throw new Error('Keep at most ' + branchLimit + ' branches in this chat.');
  const active = readConversation(v, legacy), parked = legacy ? [] : (v['parked'] as unknown[]).map(raw => readConversation(raw));
  const branches = [active, ...parked], ids = new Set(branches.map(b => b.branchId));
  if (ids.size !== branches.length || parked.some(b => b.pending)) throw new Error('Invalid branch ownership or parked delivery.');
  const threads = branches.flatMap(branch => branch.threadId ? [branch.threadId] : []);
  if (new Set(threads).size !== threads.length) throw new Error('Branches must own independent native threads.');
  for (const branch of branches) {
    if ((branch.forkedFrom && !ids.has(branch.forkedFrom.branchId)) || (branch.context.returnPoint && !ids.has(branch.context.returnPoint.branchId))) throw new Error('A branch return reference is missing.');
    const visited = new Set<string>([branch.branchId]); let parent = branch.forkedFrom;
    while (parent) { const parentId = parent.branchId; if (visited.has(parentId)) throw new Error('Cyclic branch ancestry.'); visited.add(parentId); parent = branches.find(b => b.branchId === parentId)?.forkedFrom ?? null; }
  }
  // Existing recovery limits apply to the whole workspace, not once per branch.
  readAnnotations(branches.flatMap(b => b.annotations));
  return { ...active, version: 3, parked };
}
export function readChatAction(value: unknown): ChatAction {
  const v = record(value), scope = v['branchId'] === undefined ? {} : { branchId: identity(v['branchId']) };
  switch (v['kind']) {
    case 'connect': case 'disconnect': case 'interrupt': case 'acknowledge': return { ...scope, kind: v['kind'] };
    case 'draft': return { ...scope, kind: 'draft', revision: revision(v['revision']), text: text(v['text']) };
    case 'annotation-save': return { ...scope, kind: 'annotation-save', revision: noteRevision(v['revision']), annotation: readAnnotationDraft(v['annotation']) };
    case 'annotation-delete': return { ...scope, kind: 'annotation-delete', revision: noteRevision(v['revision']), id: identity(v['id']) };
    case 'context-save': { const context = readContext({ ...record(v['context']), revision: v['revision'] }); return { ...scope, kind: 'context-save', revision: context.revision, context }; }
    case 'branch-create': return { ...scope, kind: 'branch-create', id: identity(v['id']), title: title(v['title']), point: readPoint(v['point']) };
    case 'branch-switch': return { ...scope, kind: 'branch-switch', id: identity(v['id']) };
    case 'send': return { ...scope, kind: 'send', revision: revision(v['revision']), id: identity(v['id']) };
    default: throw new Error('Unknown chat action.');
  }
}
export function readChatSnapshot(value: unknown): ChatSnapshot {
  const v = record(value), phase = v['phase'];
  if (phase !== 'disconnected' && phase !== 'connecting' && phase !== 'ready' && phase !== 'sending' && phase !== 'running' && phase !== 'uncertain' && phase !== 'error') throw new Error('Unknown chat state.');
  const conversation = readConversation(v, v['version'] === 1 || v['version'] === 2);
  if (v['version'] === 3 && (!Array.isArray(v['branches']) || v['branches'].length > branchLimit)) throw new Error('Invalid branch list.');
  const branches = v['version'] === 3 ? (v['branches'] as unknown[]).map(readBranch) : [conversation];
  return { ...conversation, version: 3, branches, phase, notice: text(v['notice']), model: text(v['model'], 300),
    token: identity(v['token']), project: text(v['project'], 4096), canAcknowledge: flag(v['canAcknowledge']) };
}
