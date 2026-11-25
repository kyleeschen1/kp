import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { emptyChat, branchLimit, readChatRecord, readContext, historyLimit, identity, messageLimit, record, text, type ChatAction, type ChatMessage,
  type ChatPhase, type ChatRecord, type ChatSnapshot } from '../../src/editor-chat/protocol.ts';
import type { ChatStore } from './store.ts';
import { RpcRejection, type ChatTransport, type TransportFactory } from './transport.ts';
import { readAnnotations, type AnnotationDraft } from '../../src/editor-chat/annotations.ts';
import { passageTarget } from '../../src/editor-chat/annotation-target.ts';

export class ChatConflict extends Error {
  readonly code: 'draft-revision' | 'branch-changed' | 'state';
  constructor(message: string, code: ChatConflict['code'] = 'state') { super(message); this.code = code; }
}
/** Adapted from spindle.workbench.live/recovery and codex-session: one session
 * owner, exact submitted-draft clearing, explicit resume and no replay queue. */
export class ChatService {
  private data: ChatRecord = emptyChat();
  private phase: ChatPhase = 'disconnected';
  private notice = 'Connect to start or resume your saved conversation.';
  private model = '';
  private token = randomUUID();
  private sequence = 0;
  private uncertaintyReviewed = false;
  private rpc: ChatTransport | undefined;
  private generation = 0;
  private chain: Promise<unknown> = Promise.resolve();
  private loaded: Promise<void> | undefined;
  private disposed = false;
  private store: ChatStore;
  private factory: TransportFactory;
  private cwd: string;
  constructor(store: ChatStore, factory: TransportFactory, cwd: string) { this.store = store; this.factory = factory; this.cwd = cwd; }
  private load() {
    return this.loaded ??= this.store.load().then(data => { this.data = data;
      this.notice = data.pending ? 'Previous delivery needs review. Resume the saved thread before sending again.' : this.notice; });
  }
  async snapshot(): Promise<ChatSnapshot> {
    await this.load();
    const { parked, ...active } = this.data;
    const branches = [active, ...parked].map(({ branchId, branchTitle, threadId, forkedFrom }) => ({ branchId, branchTitle, threadId, forkedFrom }));
    return structuredClone({ ...active, branches, phase: this.phase, notice: this.notice, model: this.model, token: this.token, project: basename(this.cwd),
      canAcknowledge: this.phase === 'uncertain' && this.uncertaintyReviewed });
  }
  get etag() { return `"${this.token}:${this.sequence}"`; }
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.chain.then(operation); this.chain = next.catch(() => {}); return next;
  }
  private trim() {
    const branches = [...this.data.parked, this.data];
    let bytes = branches.reduce((sum, branch) => sum + Buffer.byteLength(JSON.stringify(branch.messages)), 0);
    for (const branch of branches) while (branch.messages.length && (branch.messages.length > historyLimit || bytes > 6 * 1024 * 1024)) {
      bytes -= Buffer.byteLength(JSON.stringify(branch.messages.shift())) + 1; branch.historyClipped = true;
    }
  }
  private async persist() {
    this.trim();
    try { this.data = readChatRecord(this.data); await this.store.save(this.data); }
    catch (error) { this.phase = 'error'; throw error; }
  }
  async action(action: ChatAction): Promise<ChatSnapshot> {
    return this.enqueue(async () => {
      await this.load(); if (this.disposed) throw new Error('Chat server is closing.');
      // Old single-conversation clients remain readable, but cannot mutate a
      // workspace after branching. Equal draft revisions never imply identity.
      if (action.branchId !== this.data.branchId && (action.branchId !== undefined || this.data.parked.length))
        throw new ChatConflict('The active branch changed in another tab. Your local text is retained; return to its branch before saving.', 'branch-changed');
      this.sequence++;
      try {
        switch (action.kind) {
          case 'draft':
            if (action.revision !== this.data.draftRevision) throw new ChatConflict('The saved draft changed in another tab. Your text is retained; copy it before loading the saved draft.', 'draft-revision');
            { const before = { text: this.data.draft, revision: this.data.draftRevision };
              this.data.draft = action.text; this.data.draftRevision++;
              try { await this.persist(); } catch (error) { this.data.draft = before.text; this.data.draftRevision = before.revision; throw error; } }
            break;
          case 'context-save': {
            const before = this.data.context;
            if (action.revision !== before.revision) throw new ChatConflict('Context changed in another tab. Your edit is retained; reopen the saved context before retrying.');
            const previous = [before.returnPoint, ...before.topics.map(topic => topic.point)];
            for (const point of [action.context.returnPoint, ...action.context.topics.map(topic => topic.point)]) {
              if (!point || previous.some(saved => JSON.stringify(saved) === JSON.stringify(point))) continue;
              const branch = [this.data, ...this.data.parked].find(branch => branch.branchId === point.branchId);
              if (!branch?.messages.some(message => message.id === point.messageId)) throw new ChatConflict('The referenced passage is no longer loaded. Original context retained.');
            }
            this.data.context = readContext({ ...action.context, revision: action.revision + 1 });
            try { await this.persist(); } catch (error) { this.data.context = before; throw error; } break;
          }
          case 'branch-create': await this.branch(action); break;
          case 'branch-switch': await this.switchBranch(action.id); break;
          case 'annotation-save': await this.saveAnnotation(action.annotation, action.revision); break;
          case 'annotation-delete': {
            const note = this.data.annotations.find(note => note.id === action.id);
            if (!note || note.archived || note.revision !== action.revision) throw new ChatConflict('This note changed in another tab. Your local text is retained.');
            await this.saveAnnotations(this.data.annotations.map(value => value.id === note.id ? { ...value, revision: value.revision + 1, archived: true } : value));
            break;
          }
          case 'connect': await this.connect(); break;
          case 'send': await this.send(action.id, action.revision); break;
          case 'interrupt':
            if (!this.rpc || !this.data.pending?.turnId) throw new Error('No acknowledged turn is available to interrupt.');
            await this.rpc.request('turn/interrupt', { threadId: this.data.threadId, turnId: this.data.pending.turnId });
            this.notice = 'Interrupt requested; waiting for Codex to finish the turn.'; break;
          case 'disconnect':
            this.generation++; this.rpc?.close(); this.rpc = undefined; this.phase = 'disconnected';
            this.notice = this.data.pending ? 'Disconnected. Resume to inspect the unfinished turn; nothing will be resent.' : 'Disconnected. Conversation and draft retained.';
            await this.persist(); break;
          case 'acknowledge':
            if (!this.rpc || this.phase !== 'uncertain' || !this.uncertaintyReviewed) throw new Error('Resume and inspect the conversation before acknowledging uncertain delivery.');
            this.data.pending = null; this.phase = 'ready'; this.notice = 'Delivery reviewed. Draft remains unsent.'; await this.persist(); break;
        }
      } catch (error) {
        this.sequence++;
        this.notice = error instanceof Error ? error.message : String(error);
        if (!(error instanceof ChatConflict) && (this.phase === 'connecting' || this.phase === 'sending')) {
          this.phase = this.data.pending ? 'uncertain' : 'error';
        }
        throw error;
      }
      this.sequence++;
      return this.snapshot();
    });
  }
  private async saveAnnotations(annotations: ChatRecord['annotations']) {
    const before = this.data.annotations;
    this.data.annotations = readAnnotations(annotations);
    try { await this.persist(); } catch (error) { this.data.annotations = before; throw error; }
  }
  private idleBranch() {
    if (this.data.pending || this.phase === 'running' || this.phase === 'sending') throw new ChatConflict('Finish or interrupt the current response before changing branches.');
  }
  private async switchBranch(id: string) {
    if (id === this.data.branchId) return;
    this.idleBranch();
    const target = this.data.parked.find(branch => branch.branchId === id);
    if (!target) throw new Error('This branch is not part of the conversation.');
    const before = structuredClone(this.data), { parked, version, ...active } = before;
    this.generation++; this.rpc?.close(); this.rpc = undefined; this.model = '';
    this.data = { ...target, version, parked: [...parked.filter(branch => branch.branchId !== id), active] };
    try { await this.connect(); }
    catch (error) { this.data = before; this.phase = 'disconnected'; throw error; }
  }
  private async branch(action: Extract<ChatAction, { kind: 'branch-create' }>) {
    this.idleBranch();
    if (action.id === this.data.branchId || this.data.parked.some(branch => branch.branchId === action.id)) return;
    if (!this.rpc || this.phase !== 'ready' || !this.data.threadId) throw new ChatConflict('Connect before branching.');
    if (this.data.parked.length >= branchLimit - 1) throw new Error(`This chat supports ${branchLimit} branches.`);
    const message = this.data.messages.find(message => message.id === action.point.messageId);
    if (action.point.branchId !== this.data.branchId || !message?.complete || message.role !== 'assistant' || !message.turnId)
      throw new Error('Choose a completed reply with a native turn reference. Resume an older conversation to load its references.');
    const before = structuredClone(this.data), { parked, version: _version, ...active } = before;
    try {
      const response = record(await this.rpc.request('thread/fork', { threadId: this.data.threadId, lastTurnId: message.turnId,
        cwd: this.cwd, sandbox: 'read-only', approvalPolicy: 'never', ephemeral: false, excludeTurns: false }));
      const thread = record(response['thread']), threadId = identity(thread['id']);
      if ([active, ...parked].some(branch => branch.threadId === threadId)) throw new Error('Codex did not create an independent branch. Original retained.');
      const turns = thread['turns'];
      if (!Array.isArray(turns) || !turns.length || record(turns.at(-1))['id'] !== message.turnId)
        throw new Error('Codex did not return the selected branch boundary. Original retained.');
      this.data = { ...emptyChat(), branchId: action.id, branchTitle: action.title, threadId, forkedFrom: action.point,
        context: { ...emptyChat().context, objective: before.context.objective, returnPoint: action.point }, parked: [...parked, active] };
      this.hydrate(thread); this.model = typeof response['model'] === 'string' ? response['model'] : this.model;
      await this.persist(); this.notice = 'Branch created at the selected response. Nothing has been sent.';
    } catch (error) {
      this.data = before; this.generation++; this.rpc?.close(); this.rpc = undefined; this.phase = 'disconnected';
      throw new Error(`Branch could not be confirmed. Original conversation retained; no automatic retry. ${String(error)}`);
    }
  }
  private async saveAnnotation(draft: AnnotationDraft, revision: number) {
    const previous = this.data.annotations.find(note => note.id === draft.id);
    if (previous ? previous.archived || previous.revision !== revision : revision !== 0)
      throw new ChatConflict('This note changed in another tab. Your local text is retained.');
    if (!draft.body.trim() && !draft.tags.length) throw new Error('Write a note or add a tag before saving.');
    if (previous && JSON.stringify(previous.target) !== JSON.stringify(draft.target)) throw new Error('A saved comment keeps its original passage reference.');
    if (!previous && draft.target.kind === 'passage') {
      const target = draft.target, message = this.data.messages.find(message => message.id === target.messageId);
      if (!message || target.threadId !== this.data.threadId) throw new ChatConflict('The selected message is no longer available. Your comment is retained.');
      const current = passageTarget(target.threadId, message, target.from, target.to);
      if (JSON.stringify(current) !== JSON.stringify(target)) throw new ChatConflict('The selected passage changed. Select it again; your comment is retained.');
    }
    const note = { ...draft, revision: revision + 1, archived: false };
    await this.saveAnnotations(previous ? this.data.annotations.map(value => value.id === note.id ? note : value) : [...this.data.annotations, note]);
  }
  private async connect() {
    if (this.rpc && (this.phase === 'ready' || this.phase === 'running' || this.phase === 'sending')) return;
    const generation = ++this.generation; this.rpc?.close(); this.uncertaintyReviewed = false; this.phase = 'connecting'; this.notice = 'Connecting to the installed Codex…';
    const rpc = this.factory({
      event: (method, params) => { void this.enqueue(async () => {
        if (generation !== this.generation || this.disposed) return;
        try { await this.event(method, params); }
        catch (error) { this.notice = `Conversation update failed: ${String(error)}`; this.phase = 'error'; this.generation++; this.rpc?.close(); this.rpc = undefined; }
        this.sequence++;
      }); },
      lost: reason => { void this.enqueue(async () => {
        if (generation !== this.generation || this.disposed) return;
        this.rpc = undefined; this.phase = 'disconnected'; this.notice = reason;
        this.sequence++;
        try { await this.persist(); } catch (error) { this.notice += ` Recovery save failed: ${String(error)}`; }
      }); }
    });
    this.rpc = rpc;
    try {
      await rpc.request('initialize', { clientInfo: { name: 'kp_editor_chat', title: 'KP editor chat', version: '0.1.0' } });
      rpc.notify('initialized', {});
      const settings = { cwd: this.cwd, sandbox: 'read-only', approvalPolicy: 'never',
        developerInstructions: 'This is a persistent discussion in the KP editor. You may read project context. Do not edit files, publish, or perform external actions. No notebook selection is automatically attached; ask for missing context when needed.' };
      let response: Record<string, unknown>, replacedEmpty = false;
      try {
        response = record(await rpc.request(this.data.threadId ? 'thread/resume' : 'thread/start',
          this.data.threadId ? { ...settings, threadId: this.data.threadId, excludeTurns: false } : { ...settings, ephemeral: false }));
      } catch (error) {
        // Installed Codex creates the rollout only after a first turn. Replacing
        // a never-submitted empty shell is safe; any send journal forbids it.
        if (!(error instanceof RpcRejection) || !/^no rollout found for thread id /.test(error.message)
          || !this.data.threadId || this.data.sentIds.length || this.data.pending || this.data.messages.length) throw error;
        response = record(await rpc.request('thread/start', { ...settings, ephemeral: false })); replacedEmpty = true;
      }
      const thread = record(response['thread']);
      const id = identity(thread['id']);
      if (this.data.threadId && this.data.threadId !== id && !replacedEmpty) throw new Error('Codex resumed a different thread. Original reference preserved.');
      this.data.threadId = id; this.model = typeof response['model'] === 'string' ? response['model'] : '';
      this.hydrate(thread);
      this.phase = this.data.pending ? (this.data.pending.turnId ? 'running' : 'uncertain') : 'ready';
      this.uncertaintyReviewed = this.phase === 'uncertain';
      this.notice = this.data.pending ? 'Inspect the resumed conversation. No message was automatically resent.'
        : replacedEmpty ? 'Connected. Codex had not saved the empty thread yet; your unsent draft is preserved.' : 'Connected. Messages continue this saved conversation.';
      await this.persist();
    } catch (error) { this.generation++; rpc.close(); this.rpc = undefined; this.phase = 'disconnected'; throw error; }
  }
  private hydrate(thread: Record<string, unknown>) {
    if (!Array.isArray(thread['turns'])) return;
    const previous = this.data.messages; this.data.messages = []; this.data.historyClipped = false;
    let pendingFound = false;
    for (const raw of thread['turns']) {
      const turn = record(raw), items = Array.isArray(turn['items']) ? turn['items'] : [];
      const matches = this.data.pending && (turn['id'] === this.data.pending.turnId || items.some(raw => record(raw)['id'] === this.data.pending?.id));
      for (const item of items) this.item(item, turn['status'] !== 'inProgress', identity(turn['id']));
      if (matches && this.data.pending) {
        pendingFound = true;
        this.clearAcceptedDraft();
        if (turn['status'] === 'inProgress') { this.data.pending.turnId = identity(turn['id']); this.data.pending.accepted = true; }
        else this.data.pending = null;
      }
    }
    // A started but never materialized thread may have no server history yet.
    if (!this.data.messages.length && this.data.pending) this.data.messages = previous;
    if (this.data.pending && !pendingFound) this.data.pending.turnId = null;
    this.trim();
  }
  private async send(id: string, revision: number) {
    // Durable local identity makes HTTP retries idempotent; reconnect never replays.
    if (this.data.sentIds.includes(id)) return;
    if (this.phase !== 'ready' || !this.rpc || this.data.pending) throw new ChatConflict('Connect or resume and finish reviewing the current turn before sending.');
    if (revision !== this.data.draftRevision) throw new ChatConflict('The draft changed before Send. Your message was not sent.', 'draft-revision');
    const submitted = this.data.draft;
    if (!submitted.trim()) throw new Error('Write a message first.');
    this.uncertaintyReviewed = false;
    this.data.pending = { id, text: submitted, draftRevision: revision, turnId: null, accepted: false };
    this.data.sentIds = [...this.data.sentIds, id].slice(-128);
    await this.persist(); // Journal intent before any wire write.
    this.phase = 'sending'; this.notice = 'Sending to Codex…';
    try {
      const result = record(await this.rpc.request('turn/start', { threadId: this.data.threadId,
        clientUserMessageId: id, input: [{ type: 'text', text: submitted }] }));
      const turn = record(result['turn']); this.data.pending.turnId = identity(turn['id']); this.data.pending.accepted = true;
      this.clearAcceptedDraft();
      this.phase = 'running'; this.notice = 'Codex is responding…'; await this.persist();
    } catch (error) {
      if (error instanceof RpcRejection) { this.data.pending = null; this.phase = 'ready'; await this.persist(); }
      else this.phase = 'uncertain';
      throw error;
    }
  }
  private clearAcceptedDraft() {
    const pending = this.data.pending;
    if (pending && this.data.draftRevision === pending.draftRevision && this.data.draft === pending.text) {
      this.data.draft = ''; this.data.draftRevision++;
    }
  }
  private item(value: unknown, complete: boolean, turnId?: string) {
    const item = record(value);
    if (item['type'] !== 'agentMessage' && item['type'] !== 'userMessage') return;
    const id = identity(item['id']);
    const body = item['type'] === 'agentMessage' ? text(item['text'], 16 * 1024 * 1024)
      : (Array.isArray(item['content']) ? item['content'].map(raw => { const part = record(raw); return part['type'] === 'text' ? text(part['text'], 16 * 1024 * 1024) : ''; }).join('\n') : '');
    const message: ChatMessage = { id, role: item['type'] === 'agentMessage' ? 'assistant' : 'user',
      text: body.slice(0, messageLimit), complete, clipped: body.length > messageLimit, ...(turnId ? { turnId } : {}) };
    const index = this.data.messages.findIndex(m => m.id === id);
    if (index < 0) this.data.messages.push(message); else this.data.messages[index] = message;
    this.trim();
  }
  private async event(method: string, value: unknown) {
    const params = record(value ?? {});
    if (params['threadId'] !== undefined && params['threadId'] !== this.data.threadId) return;
    if (params['turnId'] !== undefined && params['turnId'] !== this.data.pending?.turnId) return;
    if (method === 'item/started' || method === 'item/completed') this.item(params['item'], method === 'item/completed', params['turnId'] === undefined ? undefined : identity(params['turnId']));
    if (method === 'item/agentMessage/delta') {
      const id = identity(params['itemId']), delta = text(params['delta'], 16 * 1024 * 1024);
      let message = this.data.messages.find(m => m.id === id);
      if (!message) { message = { id, role: 'assistant', text: '', complete: false, clipped: false,
        ...(params['turnId'] === undefined ? {} : { turnId: identity(params['turnId']) }) }; this.data.messages.push(message); }
      const combined = message.text + delta; message.text = combined.slice(0, messageLimit); message.clipped ||= combined.length > messageLimit; this.trim();
    }
    if (method === 'turn/started') {
      const turn = record(params['turn']);
      if (this.data.pending?.turnId && turn['id'] !== this.data.pending.turnId) return;
      if (this.data.pending) { this.data.pending.turnId = identity(turn['id']); this.data.pending.accepted = true;
        this.clearAcceptedDraft(); this.phase = 'running'; await this.persist(); }
    }
    if (method === 'turn/completed') {
      const turn = record(params['turn']);
      if (!this.data.pending || turn['id'] !== this.data.pending.turnId) return;
      this.data.pending = null; this.phase = 'ready';
      this.notice = turn['status'] === 'completed' ? 'Response complete · conversation saved.' : `Turn ${String(turn['status'])}. Your conversation is retained.`;
      await this.persist();
    }
    if (method === 'error') { const error = record(params['error']); this.notice = typeof error['message'] === 'string' ? error['message'].slice(0, 32768) : 'Codex reported an error.'; }
    if (method === 'kp/unsupportedRequest') {
      this.notice = `Codex requested ${String(params['method'])}, which this discussion-only chat does not support.`;
      if (this.data.pending?.turnId && this.rpc) await this.rpc.request('turn/interrupt', { threadId: this.data.threadId, turnId: this.data.pending.turnId });
    }
  }
  async close() {
    this.disposed = true; this.generation++; this.rpc?.close(); this.rpc = undefined;
    await this.loaded?.catch(() => {}); await this.chain; await this.store.close();
  }
}
