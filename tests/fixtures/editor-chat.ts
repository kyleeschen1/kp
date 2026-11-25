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
  turns: { id: string; status: string; items: object[] }[] = [];
  nextSend: (() => Promise<void>) | undefined;
  resumeError: Error | undefined;
  factory: TransportFactory = callbacks => {
    this.connections.push(callbacks);
    return { close() {}, notify() {}, request: async (method, params) => {
      this.calls.push({ method, params: { ...params } });
      if (method === 'initialize') return { userAgent: 'fixture' };
      if (method === 'thread/resume' && this.resumeError) throw this.resumeError;
      if (method === 'thread/start' || method === 'thread/resume') return { model: 'fixture', thread: { id: 'thread-1', turns: structuredClone(this.turns) } };
      if (method === 'turn/start') {
        const wait = this.nextSend; this.nextSend = undefined; if (wait) await wait();
        const data = params as { clientUserMessageId: string; input: object[] };
        const turn = { id: `turn-${this.turns.length + 1}`, status: 'inProgress', items: [{ type: 'userMessage', id: data.clientUserMessageId, content: data.input }] };
        this.turns.push(turn); callbacks.event('item/completed', { threadId: 'thread-1', turnId: turn.id, item: turn.items[0] });
        return { turn: structuredClone(turn) };
      }
      if (method === 'turn/interrupt') { this.finish('', 'interrupted'); return {}; }
      throw new Error(`Unexpected fixture RPC ${method}`);
    } };
  };
  event(method: string, params: object) { this.connections.at(-1)?.event(method, params); }
  delta(value: string) {
    const turn = this.turns.at(-1); if (!turn) throw new Error('No fixture turn');
    this.event('item/agentMessage/delta', { threadId: 'thread-1', turnId: turn.id, itemId: `${turn.id}-reply`, delta: value });
  }
  finish(value: string, status = 'completed') {
    const turn = this.turns.at(-1); if (!turn) throw new Error('No fixture turn');
    const item = { type: 'agentMessage', id: `${turn.id}-reply`, text: value };
    turn.items.push(item); turn.status = status;
    this.event('item/completed', { threadId: 'thread-1', turnId: turn.id, item });
    this.event('turn/completed', { threadId: 'thread-1', turn: structuredClone(turn) });
  }
  sends() { return this.calls.filter(c => c.method === 'turn/start'); }
}
export const drain = () => new Promise<void>(resolve => setTimeout(resolve, 10));
