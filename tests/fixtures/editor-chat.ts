import { emptyChat, type ChatRecord } from '../../src/editor-chat/protocol.ts';
import type { ChatStore } from '../../server/chat/store.ts';
import type { TransportCallbacks, TransportFactory } from '../../server/chat/transport.ts';

export class MemoryChatStore implements ChatStore {
  data: ChatRecord = emptyChat();
  saves: ChatRecord[] = [];
  async load() { return structuredClone(this.data); }
  async save(value: ChatRecord) { this.data = structuredClone(value); this.saves.push(this.data); }
  async close() {}
}
/** Deterministic protocol peer, not evidence of model inference. It retains the
 * native thread separately from KP's recovery record across transport restarts. */
export class ChatPeer {
  calls: { method: string; params: Record<string, unknown> }[] = [];
  connections: TransportCallbacks[] = [];
  private threads = new Map<string, { id: string; status: string; items: object[] }[]>([['thread-1', []]]);
  private threadId = 'thread-1';
  get turns() { return this.threads.get(this.threadId)!; }
  set turns(value: { id: string; status: string; items: object[] }[]) { this.threads.set(this.threadId, value); }
  nextSend: (() => Promise<void>) | undefined;
  resumeError: Error | undefined;
  factory: TransportFactory = callbacks => {
    this.connections.push(callbacks);
    return { close() {}, notify() {}, request: async (method, params) => {
      this.calls.push({ method, params: { ...params } });
      if (method === 'initialize') return { userAgent: 'fixture' };
      if (method === 'thread/resume' && this.resumeError) throw this.resumeError;
      if (method === 'thread/start' || method === 'thread/resume') {
        const id = method === 'thread/start' ? 'thread-1' : (params as { threadId: string }).threadId;
        if (!this.threads.has(id)) throw new Error('Unknown fixture thread');
        this.threadId = id; return { model: 'fixture', thread: { id, turns: structuredClone(this.turns) } };
      }
      if (method === 'thread/fork') {
        const data = params as { threadId: string; lastTurnId: string }, turns = this.threads.get(data.threadId);
        const boundary = turns?.findIndex(turn => turn.id === data.lastTurnId) ?? -1;
        if (!turns || boundary < 0 || turns[boundary]?.status === 'inProgress') throw new Error('Invalid fixture fork boundary');
        this.threadId = 'thread-fork-' + this.threads.size; this.threads.set(this.threadId, structuredClone(turns.slice(0, boundary + 1)));
        return { model: 'fixture', thread: { id: this.threadId, turns: structuredClone(this.turns) } };
      }
      if (method === 'turn/start') {
        const wait = this.nextSend; this.nextSend = undefined; if (wait) await wait();
        const data = params as { clientUserMessageId: string; input: object[] };
        const turn = { id: `turn-${this.turns.length + 1}`, status: 'inProgress', items: [{ type: 'userMessage', id: data.clientUserMessageId, content: data.input }] };
        this.turns.push(turn); callbacks.event('item/completed', { threadId: this.threadId, turnId: turn.id, item: turn.items[0] });
        return { turn: structuredClone(turn) };
      }
      if (method === 'turn/interrupt') { this.finish('', 'interrupted'); return {}; }
      throw new Error(`Unexpected fixture RPC ${method}`);
    } };
  };
  event(method: string, params: object) { this.connections.at(-1)?.event(method, params); }
  delta(value: string) {
    const turn = this.turns.at(-1); if (!turn) throw new Error('No fixture turn');
    this.event('item/agentMessage/delta', { threadId: this.threadId, turnId: turn.id, itemId: `${turn.id}-reply`, delta: value });
  }
  finish(value: string, status = 'completed') {
    const turn = this.turns.at(-1); if (!turn) throw new Error('No fixture turn');
    const item = { type: 'agentMessage', id: `${turn.id}-reply`, text: value };
    turn.items.push(item); turn.status = status;
    this.event('item/completed', { threadId: this.threadId, turnId: turn.id, item });
    this.event('turn/completed', { threadId: this.threadId, turn: structuredClone(turn) });
  }
  sends() { return this.calls.filter(c => c.method === 'turn/start'); }
}
export const drain = () => new Promise<void>(resolve => setTimeout(resolve, 10));
