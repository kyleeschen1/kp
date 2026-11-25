import type { Node as ProseNode } from 'prosemirror-model';
import type { ChatMessage } from './protocol.ts';
import { quoteLimit, type PassageTarget } from './annotations.ts';
import { messageDocument, textIndex } from './rich-document.ts';

export function passageTarget(threadId: string, message: ChatMessage, from: number, to: number, doc = messageDocument(message)): PassageTarget {
  if (!message.complete || message.clipped) throw new Error('Wait for the full response before adding a passage comment.');
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 0 || to <= from || to > doc.content.size) throw new Error('Select text inside one message.');
  const index = textIndex(doc), start = index.positions.findIndex(pos => pos >= from);
  let end = index.positions.findIndex(pos => pos >= to); if (end < 0) end = index.text.length;
  const quote = index.text.slice(start < 0 ? end : start, end);
  if (!quote.trim() || quote.length > quoteLimit) throw new Error(`Select between 1 and ${quoteLimit} characters.`);
  return { kind: 'passage', threadId, messageId: message.id, from, to, quote,
    prefix: index.text.slice(Math.max(0, start - 48), start), suffix: index.text.slice(end, end + 48) };
}
export type ResolvedPassage = { status: 'attached'; from: number; to: number } | { status: 'changed' | 'unavailable' };
export function resolvePassage(target: PassageTarget, threadId: string | null, message: ChatMessage | undefined, doc?: ProseNode): ResolvedPassage {
  if (threadId !== target.threadId || !message || message.id !== target.messageId) return { status: 'unavailable' };
  const index = textIndex(doc ?? messageDocument(message)), matches: number[] = [], contextual: number[] = [];
  let at = index.text.indexOf(target.quote);
  while (at >= 0) {
    matches.push(at);
    if (index.text.slice(Math.max(0, at - target.prefix.length), at) === target.prefix
      && index.text.slice(at + target.quote.length, at + target.quote.length + target.suffix.length) === target.suffix) contextual.push(at);
    at = index.text.indexOf(target.quote, at + 1);
  }
  // Never pick the first matching phrase when a replacement makes it ambiguous.
  const chosen = contextual.length === 1 ? contextual[0] : matches.length === 1 ? matches[0] : undefined;
  if (chosen === undefined) return { status: 'changed' };
  const from = index.positions[chosen], last = index.positions[chosen + target.quote.length - 1];
  return from === undefined || last === undefined ? { status: 'changed' } : { status: 'attached', from, to: last + 1 };
}
