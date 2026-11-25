import { readPoint, record } from './protocol.ts';
import type { DraftCursor } from './rich-text.ts';
import type { ReadingBookmark } from './transcript-navigation.ts';

export type ChatViewState = { reading: ReadingBookmark; cursor: DraftCursor };
export function readViewState(value: unknown): ChatViewState {
  const v = record(value), reading = record(v['reading']), scroll = record(reading['scroll']), cursor = record(v['cursor']);
  const number = (value: unknown, integer = false) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || (integer && (!Number.isSafeInteger(value) || value < 0))) throw new Error('Invalid saved cursor.');
    return value;
  };
  if (typeof cursor['source'] !== 'boolean' || (scroll['messageId'] !== null && typeof scroll['messageId'] !== 'string')) throw new Error('Invalid reading bookmark.');
  return { reading: { anchor: reading['anchor'] === null ? null : readPoint(reading['anchor']), head: reading['head'] === null ? null : readPoint(reading['head']),
    scroll: { messageId: scroll['messageId'], top: number(scroll['top']), scrollTop: number(scroll['scrollTop']) } },
    cursor: { anchor: number(cursor['anchor'], true), head: number(cursor['head'], true), source: cursor['source'] } };
}
export function chatViewState() {
  const memory = new Map<string, ChatViewState>();
  const key = (project: string, branch: string) => `kp.chat-view.v1:${project}:${branch}`;
  return {
    load(project: string, branch: string) {
      const id = key(project, branch); if (memory.has(id)) return memory.get(id);
      try { const raw = localStorage.getItem(id); if (raw) { const state = readViewState(JSON.parse(raw)); memory.set(id, state); return state; } }
      catch { /* View state is optional; retain unreadable bytes and the saved draft. */ }
      return undefined;
    },
    save(project: string, branch: string, value: ChatViewState) {
      memory.set(key(project, branch), value);
      try { localStorage.setItem(key(project, branch), JSON.stringify(value)); } catch { /* In-memory return still works. */ }
    }
  };
}
