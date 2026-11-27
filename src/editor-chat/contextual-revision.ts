import { sha256 } from '../kernel/sha256.ts';
import { array, exact, object, text } from '../fraction-notebook/json.ts';
import { fractionObjectId, sourceLimit } from '../fraction-notebook/object-protocol.ts';
import { draftLimit } from './protocol.ts';

export const contextualRevisionProtocol = 'kp.annotation-revision.v1';
export type ContextualRevisionGapCode = 'invalid-context' | 'invalid-proposal' | 'unsupported-object' |
  'inactive-request' | 'superseded-request' | 'duplicate-proposal' | 'stale-source' | 'stale-draft' |
  'changed-context' | 'invalid-target' | 'proposal-not-ready' | 'owner-closed';
export class ContextualRevisionGap extends Error {
  override name = 'ContextualRevisionGap';
  readonly code: ContextualRevisionGapCode;
  constructor(code: ContextualRevisionGapCode, message: string) { super(message); this.code = code; }
}
const gap = (code: ContextualRevisionGapCode, message: string): never => { throw new ContextualRevisionGap(code, message); };

export interface RevisionAnnotation {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly focusRefs: readonly string[];
}
/** The host supplies an already admitted annotation and the targets valid for
 * that moment. Full compiler validation still owns any reconstructed source. */
export interface ContextualRevisionSnapshot {
  readonly objectId: string;
  readonly objectTitle: string;
  readonly sourceRevision: string;
  readonly draftSource: string;
  readonly branchId: string;
  readonly threadId: string;
  readonly annotation: RevisionAnnotation;
  readonly availableTargets: readonly string[];
  readonly surroundingContext: string;
}
export interface ContextualRevisionRequest {
  readonly protocol: typeof contextualRevisionProtocol;
  readonly sessionId: string;
  readonly request: number;
  readonly objectId: string;
  readonly objectTitle: string;
  readonly sourceRevision: string;
  readonly draftRevision: string;
  readonly branchId: string;
  readonly threadId: string;
  readonly annotation: RevisionAnnotation;
  readonly availableTargets: readonly string[];
  readonly surroundingContext: string;
  readonly instruction: string;
}
export interface ContextualRevisionProposal {
  readonly protocol: typeof contextualRevisionProtocol;
  readonly sessionId: string;
  readonly request: number;
  readonly objectId: string;
  readonly sourceRevision: string;
  readonly draftRevision: string;
  readonly annotationId: string;
  readonly title: string;
  readonly content: string;
  readonly focusRefs: readonly string[];
}
export interface AnnotationRevisionChange {
  readonly request: ContextualRevisionRequest;
  readonly before: RevisionAnnotation;
  readonly after: RevisionAnnotation;
}

function identity(value: unknown): string {
  const result = text(value, 300);
  if (!result.trim()) throw new Error('An identity cannot be empty.');
  return result;
}
function references(value: unknown, limit: number): readonly string[] {
  const result = array(value, limit).map(identity);
  if (new Set(result).size !== result.length) throw new Error('Repeated target identity.');
  return Object.freeze(result);
}
function annotation(value: unknown): RevisionAnnotation {
  const v = object(value); exact(v, ['id', 'title', 'content', 'focusRefs']);
  return Object.freeze({ id: identity(v['id']), title: text(v['title'], 300),
    content: text(v['content']), focusRefs: references(v['focusRefs'], 24) });
}
function snapshot(value: ContextualRevisionSnapshot) {
  try {
    const v = object(value);
    exact(v, ['objectId', 'objectTitle', 'sourceRevision', 'draftSource', 'branchId', 'threadId', 'annotation', 'availableTargets', 'surroundingContext']);
    if (v['objectId'] !== fractionObjectId) return gap('unsupported-object', 'This revision path supports the fraction annotation object only.');
    const selected = annotation(v['annotation']), targets = references(v['availableTargets'], 256);
    if (!selected.focusRefs.length || selected.focusRefs.some(ref => !targets.includes(ref))) return gap('invalid-target', 'The current annotation needs targets inside this moment. Revalidate its source.');
    return { objectId: fractionObjectId, objectTitle: text(v['objectTitle'], 300), sourceRevision: identity(v['sourceRevision']),
      draftRevision: sha256(text(v['draftSource'], sourceLimit)), branchId: identity(v['branchId']), threadId: identity(v['threadId']),
      annotation: selected, availableTargets: targets, surroundingContext: text(v['surroundingContext'], 4096) };
  } catch (error) {
    if (error instanceof ContextualRevisionGap) throw error;
    return gap('invalid-context', error instanceof Error ? error.message : 'Invalid revision context.');
  }
}
function unchanged(request: ContextualRevisionRequest, current: ContextualRevisionSnapshot) {
  const next = snapshot(current);
  if (next.objectId !== request.objectId || next.sourceRevision !== request.sourceRevision)
    return gap('stale-source', 'The canonical object changed. Start a new request against the current source.');
  if (next.draftRevision !== request.draftRevision)
    return gap('stale-draft', 'The draft changed while this request was pending. Your edits are retained; start a new request.');
  if (next.branchId !== request.branchId || next.threadId !== request.threadId || JSON.stringify(next.annotation) !== JSON.stringify(request.annotation)
    || JSON.stringify([...next.availableTargets].sort()) !== JSON.stringify([...request.availableTargets].sort()))
    return gap('changed-context', 'The conversation or selected annotation changed. Return to its exact context or start a new request.');
}

/** This owns proposal authority, not native conversation history, editing,
 * persistence or preview resources. Only explicit acceptance yields a one-shot
 * replacement; the caller applies it through its compiler/editor transaction. */
export function createContextualRevisionSession(sessionId: string) {
  identity(sessionId);
  let sequence = 0;
  let state: { kind: 'idle' | 'closed' } | { kind: 'requested'; request: ContextualRevisionRequest } |
    { kind: 'ready'; request: ContextualRevisionRequest; change: AnnotationRevisionChange } = { kind: 'idle' };
  const active = () => {
    if (state.kind === 'closed') return gap('owner-closed', 'This revision owner has closed.');
    if (state.kind !== 'requested' && state.kind !== 'ready') return gap('inactive-request', 'No contextual revision request is active.');
    return state;
  };
  return Object.freeze({
    begin(current: ContextualRevisionSnapshot, instruction: string): ContextualRevisionRequest {
      if (state.kind === 'closed') return gap('owner-closed', 'This revision owner has closed.');
      // Validate before replacing a useful pending proposal. An invalid attempt
      // must not discard the last reviewable result.
      const context = snapshot(current);
      let clean: string;
      try { clean = text(instruction, 4096); if (!clean.trim()) throw new Error('Describe the requested revision.'); }
      catch (error) { return gap('invalid-context', error instanceof Error ? error.message : 'Invalid instruction.'); }
      const request = Object.freeze({ ...context, protocol: contextualRevisionProtocol, sessionId, request: sequence + 1, instruction: clean });
      // Leave room for the host's response-format instructions in the existing
      // composer budget; never silently truncate the selected explanation.
      if (JSON.stringify(request).length > draftLimit - 4096) return gap('invalid-context', 'This selected context exceeds the chat composer budget. Choose a shorter annotation or context.');
      ++sequence;
      state = { kind: 'requested', request }; return request;
    },
    // A structurally admitted proposal is not compiled source. The host must
    // run its ordinary domain check before previewing or applying this change.
    receive(raw: unknown, current: ContextualRevisionSnapshot): AnnotationRevisionChange {
      const pending = active(), request = pending.request;
      let proposal: ContextualRevisionProposal;
      try {
        const v = object(raw);
        exact(v, ['protocol', 'sessionId', 'request', 'objectId', 'sourceRevision', 'draftRevision', 'annotationId', 'title', 'content', 'focusRefs']);
        if (v['protocol'] !== contextualRevisionProtocol || !Number.isSafeInteger(v['request']) || Number(v['request']) < 1) throw new Error('Unsupported proposal protocol or request.');
        proposal = { protocol: contextualRevisionProtocol, sessionId: identity(v['sessionId']), request: Number(v['request']),
          objectId: identity(v['objectId']), sourceRevision: identity(v['sourceRevision']), draftRevision: identity(v['draftRevision']),
          annotationId: identity(v['annotationId']), title: text(v['title'], 300), content: text(v['content']), focusRefs: references(v['focusRefs'], 24) };
      } catch (error) { return gap('invalid-proposal', error instanceof Error ? error.message : 'Invalid annotation proposal.'); }
      if (proposal.sessionId !== sessionId || proposal.request !== request.request) return gap('superseded-request', 'This response belongs to another or superseded request.');
      if (proposal.objectId !== request.objectId || proposal.sourceRevision !== request.sourceRevision)
        return gap('stale-source', 'The response does not name this canonical object revision.');
      if (proposal.draftRevision !== request.draftRevision) return gap('stale-draft', 'The response does not name this draft revision.');
      if (proposal.annotationId !== request.annotation.id) return gap('changed-context', 'A proposal may replace only the selected annotation.');
      if (!proposal.focusRefs.length || proposal.focusRefs.some(ref => !request.availableTargets.includes(ref))) return gap('invalid-target', 'Choose at least one focus target supplied for this moment.');
      unchanged(request, current);
      if (pending.kind === 'ready') return gap('duplicate-proposal', 'A proposal is already awaiting review. Start another request to revise it.');
      const after = annotation({ id: proposal.annotationId, title: proposal.title, content: proposal.content, focusRefs: proposal.focusRefs });
      const change = Object.freeze({ request, before: request.annotation, after });
      state = { kind: 'ready', request, change }; return change;
    },
    accept(current: ContextualRevisionSnapshot): AnnotationRevisionChange {
      const pending = active();
      if (pending.kind !== 'ready') return gap('proposal-not-ready', 'Wait for a valid proposal before accepting.');
      unchanged(pending.request, current);
      state = { kind: 'idle' }; return pending.change;
    },
    pending: (): AnnotationRevisionChange | undefined => state.kind === 'ready' ? state.change : undefined,
    cancel() { if (state.kind !== 'closed') state = { kind: 'idle' }; },
    dispose() { state = { kind: 'closed' }; }
  });
}
