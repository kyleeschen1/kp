import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile, stat, symlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createServer, request } from 'node:http';
import { ChatService } from '../server/chat/service.ts';
import { FileChatStore } from '../server/chat/store.ts';
import { chatHttp } from '../server/chat/http.ts';
import { CodexTransport, RpcRejection } from '../server/chat/transport.ts';
import { emptyChat, readChatAction, readChatRecord } from '../src/editor-chat/protocol.ts';
import { ChatPeer, MemoryChatStore, drain } from './fixtures/editor-chat.ts';
import { passageTarget, resolvePassage } from '../src/editor-chat/annotation-target.ts';
import { parseMarkdown, serializeMarkdown, textIndex, safeLink, messageDocument } from '../src/editor-chat/rich-document.ts';
import { nativeMessage } from '../server/chat/items.ts';
import { readAnnotationDraft, type AnnotationDraft } from '../src/editor-chat/annotations.ts';

const setup = () => { const store = new MemoryChatStore(), peer = new ChatPeer(); return { store, peer, service: new ChatService(store, peer.factory, process.cwd()) }; };
test('native tool output stays literal and bounded across streaming, completion and resume', async () => {
  const { service, peer } = setup();
  await service.action({ kind: 'connect' }); await service.action({ kind: 'draft', revision: 0, text: 'Inspect' });
  const running = await service.action({ kind: 'send', revision: 1, id: 'tool-turn' });
  const scope = { threadId: running.threadId, turnId: running.pending!.turnId };
  const item = { type: 'commandExecution', id: 'cmd-1', command: 'example', aggregatedOutput: null };
  peer.event('item/started', { ...scope, item });
  peer.event('item/commandExecution/outputDelta', { ...scope, itemId: item.id, delta: '<script>literal</script>\n**not bold**' });
  await drain();
  const message = (await service.snapshot()).messages.find(message => message.id === item.id)!;
  assert.equal(message.role, 'tool'); assert.equal(message.complete, false);
  assert.equal(messageDocument(message).firstChild!.type.name, 'code_block');
  assert.match(messageDocument(message).textContent, /<script>literal/);
  peer.event('item/commandExecution/outputDelta', { ...scope, threadId: 'foreign', itemId: item.id, delta: 'foreign' });
  const completed = { ...item, aggregatedOutput: 'authoritative output', status: 'completed' };
  peer.turns.at(-1)!.items.push(completed);
  peer.event('item/completed', { ...scope, item: completed });
  peer.event('item/commandExecution/outputDelta', { ...scope, itemId: item.id, delta: 'late' });
  peer.finish('Done'); await drain();
  const final = (await service.snapshot()).messages.find(message => message.id === item.id)!;
  assert.equal(final.text, '$ example\nauthoritative output'); assert.equal(final.complete, true);
  await service.action({ kind: 'disconnect' }); const resumed = await service.action({ kind: 'connect' });
  assert.deepEqual(resumed.messages.find(message => message.id === item.id), final);
  assert.equal(peer.sends().length, 1); await service.close();
});
test('tool projections validate text, keep annotations in display coordinates and do not parse output as Markdown', () => {
  const items = [
    { type: 'mcpToolCall', id: 'mcp', server: 'files', tool: 'read', result: { content: [{ type: 'text', text: '**literal**' }] } },
    { type: 'functionCallOutput', id: 'fn', name: 'inspect', output: '**literal**' },
    { type: 'dynamicToolCall', id: 'dynamic', tool: 'inspect', contentItems: [{ type: 'inputText', text: '**literal**' }] },
    { type: 'fileChange', id: 'file', changes: [{ path: 'example.ts', diff: '**literal**' }] }
  ];
  for (const item of items) {
    const message = nativeMessage(item, true, 'turn-1')!;
    const doc = messageDocument(message), quote = passageTarget('thread-1', message, 1, doc.content.size - 1);
    assert.match(quote.quote, /\*\*literal\*\*/);
    assert.equal(resolvePassage(quote, 'thread-1', message).status, 'attached');
    assert.equal(readChatRecord({ ...emptyChat(), messages: [message] }).messages[0]!.role, 'tool');
  }
  const huge = nativeMessage({ type: 'functionCallOutput', id: 'huge', name: 'tool', output: 'x'.repeat(70000) }, true)!;
  assert.equal(huge.text.length, 65536); assert.equal(huge.clipped, true);
  assert.throws(() => readChatRecord({ ...emptyChat(), messages: [{ ...huge, tool: undefined }] }));
  assert.throws(() => nativeMessage({ type: 'commandExecution', id: 'invalid', command: {}, aggregatedOutput: null }, false));
});
test('legacy conversations migrate without rewriting draft text or model history', () => {
  const { annotations: _notes, ...legacy } = emptyChat();
  const record = readChatRecord({ ...legacy, version: 1, draft: '**Keep** these bytes\n\n' });
  assert.equal(record.version, 3); assert.equal(record.draft, '**Keep** these bytes\n\n'); assert.deepEqual(record.annotations, []);
  assert.equal(record.branchId, 'main'); assert.deepEqual(record.parked, []);
  assert.throws(() => readChatRecord({ ...legacy, version: 2 }), /saved notes/);
  const v2 = readChatRecord({ ...legacy, version: 2, annotations: [], threadId: 'original-thread' });
  assert.equal(v2.threadId, 'original-thread'); assert.equal(v2.branchId, 'main'); assert.deepEqual(v2.context.topics, []);
});

test('explicit context is revision checked, persists across restart and never becomes hidden model input', async () => {
  const { service, store, peer } = setup();
  peer.turns = [{ id: 'turn-1', status: 'completed', items: [{ type: 'agentMessage', id: 'reply-1', text: 'An exact return place.' }] }];
  let snapshot = await service.action({ kind: 'connect' });
  const point = { branchId: 'main', messageId: 'reply-1', offset: 1 };
  snapshot = await service.action({ kind: 'context-save', revision: 0, context: { objective: 'A durable objective', topics: [{ id: 'topic-1', title: 'Detour', point }], topicId: 'topic-1', returnPoint: point } });
  assert.equal(snapshot.context.revision, 1); assert.equal(peer.sends().length, 0);
  await assert.rejects(service.action({ kind: 'context-save', revision: 0, context: { ...snapshot.context, objective: 'Stale edit' } }), /another tab/);
  await assert.rejects(service.action({ kind: 'context-save', revision: 1, context: { ...snapshot.context, returnPoint: { ...point, messageId: 'missing' } } }), /no longer loaded/);
  assert.equal((await service.snapshot()).context.objective, 'A durable objective');
  await service.close();
  const resumed = new ChatService(store, peer.factory, process.cwd());
  snapshot = await resumed.action({ kind: 'connect' }); assert.deepEqual(snapshot.context.returnPoint, point);
  await resumed.action({ kind: 'draft', revision: 0, text: 'Only this message' }); await resumed.action({ kind: 'send', id: 'explicit-send', revision: 1 });
  assert.deepEqual(peer.sends()[0]?.params['input'], [{ type: 'text', text: 'Only this message' }]); await resumed.close();
});

test('a branch shares only the selected prefix and retains separate drafts, notes, context and native identity', async () => {
  const { service, store, peer } = setup();
  peer.turns = [1, 2].map(n => ({ id: 'turn-' + n, status: 'completed', items: [{ type: 'agentMessage', id: 'reply-' + n, text: 'Response ' + n }] }));
  await service.action({ kind: 'connect' }); await service.action({ kind: 'draft', revision: 0, text: 'Main draft' });
  await service.action({ kind: 'annotation-save', revision: 0, annotation: { id: 'main-note', target: { kind: 'conversation' }, body: 'Main note', tags: [] } });
  const point = { branchId: 'main', messageId: 'reply-1', offset: 1 };
  let fork = await service.action({ kind: 'branch-create', branchId: 'main', id: 'branch-1', title: 'Explore', point });
  assert.equal(fork.branchId, 'branch-1'); assert.notEqual(fork.threadId, 'thread-1'); assert.deepEqual(fork.messages.map(message => message.id), ['reply-1']);
  assert.equal(fork.draft, ''); assert.deepEqual(fork.annotations, []); assert.deepEqual(fork.context.returnPoint, point);
  assert.equal(peer.calls.find(call => call.method === 'thread/fork')?.params['lastTurnId'], 'turn-1');
  assert.equal('parked' in fork, false); // Inactive message bodies are not resent to every browser poll.
  await service.action({ kind: 'draft', branchId: 'branch-1', revision: 0, text: 'Branch draft' });
  await assert.rejects(service.action({ kind: 'draft', branchId: 'main', revision: 1, text: 'Wrong branch' }), /active branch changed/);
  await assert.rejects(service.action({ kind: 'draft', revision: 1, text: 'Unscoped old client' }), /active branch changed/);
  const main = await service.action({ kind: 'branch-switch', branchId: 'branch-1', id: 'main' });
  assert.equal(main.draft, 'Main draft'); assert.equal(main.annotations[0]?.body, 'Main note'); assert.equal(main.messages.length, 2);
  await service.close();
  const resumed = new ChatService(store, peer.factory, process.cwd());
  fork = await resumed.action({ kind: 'branch-switch', branchId: 'main', id: 'branch-1' });
  assert.equal(fork.draft, 'Branch draft'); assert.equal(fork.messages.length, 1); assert.equal(peer.sends().length, 0);
  await resumed.close();
});

test('pending delivery prevents branch changes and stale source events cannot paint the selected branch', async () => {
  const { service, peer } = setup();
  peer.turns = [{ id: 'turn-1', status: 'completed', items: [{ type: 'agentMessage', id: 'reply-1', text: 'Start here.' }] }];
  await service.action({ kind: 'connect' });
  await service.action({ kind: 'branch-create', branchId: 'main', id: 'child', title: 'Child', point: { branchId: 'main', messageId: 'reply-1', offset: 1 } });
  await service.action({ kind: 'draft', branchId: 'child', revision: 0, text: 'Pending child message' });
  const pending = await service.action({ kind: 'send', branchId: 'child', revision: 1, id: 'child-send' });
  await assert.rejects(service.action({ kind: 'branch-switch', branchId: 'child', id: 'main' }), /current response/);
  peer.event('item/agentMessage/delta', { threadId: 'thread-1', turnId: pending.pending?.turnId, itemId: 'wrong-reply', delta: 'Foreign output' }); await drain();
  assert.equal((await service.snapshot()).messages.some(message => message.id === 'wrong-reply'), false);
  await service.action({ kind: 'interrupt', branchId: 'child' }); await drain();
  const main = await service.action({ kind: 'branch-switch', branchId: 'child', id: 'main' }); assert.equal(main.threadId, 'thread-1');
  await service.close();
});

test('a fork that cannot be saved leaves the original branch and draft recoverable without replay', async () => {
  const { service, store, peer } = setup();
  peer.turns = [{ id: 'turn-1', status: 'completed', items: [{ type: 'agentMessage', id: 'reply-1', text: 'Original.' }] }];
  await service.action({ kind: 'connect' }); await service.action({ kind: 'draft', revision: 0, text: 'Keep my draft' });
  const save = store.save.bind(store); store.save = async () => { throw new Error('Storage fixture failure'); };
  await assert.rejects(service.action({ kind: 'branch-create', branchId: 'main', id: 'child', title: 'Child', point: { branchId: 'main', messageId: 'reply-1', offset: 1 } }), /Original conversation retained; no automatic retry/);
  const original = await service.snapshot(); assert.equal(original.branchId, 'main'); assert.equal(original.draft, 'Keep my draft');
  assert.equal(store.data.branchId, 'main'); assert.equal(store.data.parked.length, 0);
  store.save = save; await service.action({ kind: 'connect', branchId: 'main' });
  assert.equal(peer.calls.filter(call => call.method === 'thread/fork').length, 1); assert.equal(peer.sends().length, 0); await service.close();
});

test('branch recovery rejects duplicate ownership, cycles and parked pending sends', () => {
  const root = emptyChat(), { version: _version, parked: _parked, ...child } = emptyChat();
  assert.throws(() => readChatRecord({ ...root, parked: [child] }), /ownership/);
  assert.throws(() => readChatRecord({ ...root, threadId: 'shared', parked: [{ ...child, branchId: 'child', threadId: 'shared' }] }), /independent native threads/);
  assert.throws(() => readChatRecord({ ...root, parked: [{ ...child, branchId: 'child', pending: { id: 'send', text: 'unsure', draftRevision: 0, turnId: null, accepted: false } }] }), /parked delivery/);
  const toMain = { branchId: 'main', messageId: 'm', offset: 1 }, toChild = { ...toMain, branchId: 'child' };
  assert.throws(() => readChatRecord({ ...root, forkedFrom: toChild, parked: [{ ...child, branchId: 'child', forkedFrom: toMain }] }), /Cyclic/);
});
test('rich text round trips CommonMark structures and rejects active links', () => {
  const source = '# A heading\n\nA **bold** and *gentle* [link](https://example.com).\n\n- first\n- second\n\n```js\nconst n = 2;\n```';
  const doc = parseMarkdown(source);
  assert.deepEqual(parseMarkdown(serializeMarkdown(doc)).toJSON(), doc.toJSON());
  assert.equal(safeLink('javascript:alert(1)'), null); assert.equal(safeLink('data:text/html,hello'), null);
  assert.equal(safeLink('java\nscript:alert(1)'), null); assert.equal(safeLink('//external.example/pixel'), null);
  assert.equal(safeLink('https://example.com'), 'https://example.com');
  assert.equal(parseMarkdown('<script>alert(1)</script>').textContent, '<script>alert(1)</script>');
});
test('math delimiters round trip while currency, incomplete output and code retain their text', () => {
  for (const source of [String.raw`An inline $x^2$ or \(y+1\).`, String.raw`$$\frac{1}{2}$$`, '\\[\n\\sum_{i=1}^n i\n\\]']) {
    const doc = parseMarkdown(source);
    assert.deepEqual(parseMarkdown(serializeMarkdown(doc)).toJSON(), doc.toJSON());
  }
  for (const source of ['Costs $5 and $10.', 'An unfinished $x^2', String.raw`Unfinished \(x+1`, '`$x^2$`']) {
    const types: string[] = []; parseMarkdown(source).descendants(node => { types.push(node.type.name); });
    assert.equal(types.some(type => type.startsWith('math_')), false);
  }
  const fenced = parseMarkdown('```tex\n$x^2$\n```'); assert.equal(fenced.firstChild?.type.name, 'code_block'); assert.equal(fenced.textContent, '$x^2$');
  const copied = parseMarkdown('An inline $x^2$.\n\n$$\\frac{1}{2}$$');
  assert.match(copied.textBetween(0, copied.content.size, '\n'), /\\\(x\^2\\\)/);
  assert.match(copied.textBetween(0, copied.content.size, '\n'), /\\\[\\frac\{1\}\{2\}\\\]/);
});
test('passage anchors survive formatting and unique moves; ambiguous, removed and clipped targets stay explicit', () => {
  const message = { id: 'answer-1', role: 'assistant' as const, complete: true, clipped: false, text: 'A **stable phrase** here.' };
  const doc = parseMarkdown(message.text), index = textIndex(doc), start = index.text.indexOf('stable phrase');
  const target = passageTarget('thread-1', message, index.positions[start]!, index.positions[start + 12]! + 1);
  assert.equal(target.quote, 'stable phrase');
  for (const text of ['A *stable phrase* here.', 'New introduction.\n\nA stable phrase here.']) assert.equal(resolvePassage(target, 'thread-1', { ...message, text }).status, 'attached');
  assert.equal(resolvePassage(target, 'thread-1', { ...message, text: 'stable phrase and stable phrase' }).status, 'changed');
  assert.equal(resolvePassage(target, 'thread-1', { ...message, text: 'Completely different' }).status, 'changed');
  assert.equal(resolvePassage(target, 'other-thread', message).status, 'unavailable');
  assert.equal(resolvePassage(target, 'thread-1', undefined).status, 'unavailable');
  assert.throws(() => passageTarget('thread-1', { ...message, clipped: true }, target.from, target.to), /full response/);
  assert.throws(() => passageTarget('thread-1', { ...message, complete: false }, target.from, target.to), /full response/);
});
test('notes and tags persist independently; CAS and archived identities prevent stale overwrites and resurrection', async () => {
  const { service, store, peer } = setup();
  const draft: AnnotationDraft = { id: 'note-1', target: { kind: 'conversation' }, body: '**A thought**', tags: ['plan'] };
  const saved = await service.action({ kind: 'annotation-save', revision: 0, annotation: draft });
  assert.equal(saved.annotations[0]?.revision, 1); assert.equal(peer.calls.length, 0);
  await assert.rejects(service.action({ kind: 'annotation-save', revision: 0, annotation: { ...draft, body: 'Stale' } }), /another tab/);
  await service.close();
  const resumed = new ChatService(store, peer.factory, process.cwd());
  assert.equal((await resumed.snapshot()).annotations[0]?.body, '**A thought**');
  await resumed.action({ kind: 'annotation-delete', id: draft.id, revision: 1 });
  await assert.rejects(resumed.action({ kind: 'annotation-save', revision: 0, annotation: draft }), /another tab/);
  assert.equal((await resumed.snapshot()).annotations[0]?.archived, true); assert.equal(peer.calls.length, 0);
  await resumed.close();
});
test('comments verify exact source selection without changing or resending model messages', async () => {
  const { service, store, peer } = setup();
  const message = { id: 'answer-1', role: 'assistant' as const, complete: true, clipped: false, text: 'Remember the whole plan.' };
  store.data = { ...emptyChat(), threadId: 'thread-1', messages: [message] };
  const target = passageTarget('thread-1', message, 1, 9);
  const annotation: AnnotationDraft = { id: 'comment-1', target, body: 'An attached comment', tags: ['orientation'] };
  await assert.rejects(service.action({ kind: 'annotation-save', revision: 0, annotation: { ...annotation, target: { ...target, quote: 'Wrong quote' } } }), /passage changed/);
  await service.action({ kind: 'annotation-save', revision: 0, annotation });
  const snapshot = await service.snapshot(); assert.deepEqual(snapshot.messages, [message]); assert.equal(peer.calls.length, 0);
  await assert.rejects(service.action({ kind: 'annotation-save', revision: 1, annotation: { ...annotation, target: { kind: 'conversation' } } }), /original passage/);
  await service.close();
});
test('annotation validation bounds data and a failed storage write does not publish a phantom note', async () => {
  assert.throws(() => readAnnotationDraft({ id: 'x', target: { kind: 'conversation' }, body: '', tags: ['x'.repeat(41)] }), /oversized/);
  assert.throws(() => readChatAction({ kind: 'annotation-save', revision: -1, annotation: {} }), /revision/);
  const { service, store } = setup(); await service.snapshot();
  store.save = async () => { throw new Error('Disk full'); };
  await assert.rejects(service.action({ kind: 'annotation-save', revision: 0,
    annotation: { id: 'note-1', target: { kind: 'conversation' }, body: 'Keep local', tags: [] } }), /Disk full/);
  assert.deepEqual((await service.snapshot()).annotations, []); await service.close();
});
test('saved thread resumes after server replacement; sends are idempotent and history stays native', async () => {
  const { store, peer, service } = setup();
  await service.action({ kind: 'connect' });
  const draft = await service.action({ kind: 'draft', revision: 0, text: 'First question' });
  await service.action({ kind: 'send', revision: draft.draftRevision, id: 'message-1' });
  await service.action({ kind: 'send', revision: draft.draftRevision, id: 'message-1' });
  peer.delta('Part'); await drain(); assert.equal((await service.snapshot()).messages.at(-1)?.text, 'Part');
  peer.finish('First answer'); await drain(); await service.close();
  const resumed = new ChatService(store, peer.factory, process.cwd());
  assert.equal((await resumed.snapshot()).phase, 'disconnected');
  assert.equal(peer.sends().length, 1);
  const state = await resumed.action({ kind: 'connect' });
  assert.equal(state.threadId, 'thread-1'); assert.equal(state.phase, 'ready');
  assert.deepEqual(state.messages.map(m => m.text), ['First question', 'First answer']);
  assert.equal(peer.calls.at(-1)?.method, 'thread/resume');
  const next = await resumed.action({ kind: 'draft', revision: state.draftRevision, text: 'Follow up' });
  await resumed.action({ kind: 'send', revision: next.draftRevision, id: 'message-2' });
  assert.equal(peer.sends()[1]?.params['threadId'], 'thread-1');
  assert.equal(peer.calls.find(c => c.method === 'thread/start')?.params['sandbox'], 'read-only');
  assert.equal(store.saves.find(s => s.pending?.id === 'message-1')?.pending?.accepted, false);
  await resumed.close();
});
test('draft CAS rejects another tab; acknowledged Send clears only its submitted revision', async () => {
  const { service, peer } = setup(); await service.action({ kind: 'connect' });
  await service.action({ kind: 'draft', revision: 0, text: 'Send me' });
  await assert.rejects(service.action({ kind: 'draft', revision: 0, text: 'Stale tab' }), /another tab/);
  let release!: () => void; peer.nextSend = () => new Promise<void>(resolve => { release = resolve; });
  const sending = service.action({ kind: 'send', revision: 1, id: 'send-1' }); await drain();
  assert.equal((await service.snapshot()).draft, 'Send me'); release(); await sending;
  const saved = await service.action({ kind: 'draft', revision: 2, text: 'Next question' });
  assert.equal(saved.draft, 'Next question');
  peer.event('turn/started', { threadId: 'thread-1', turn: { id: 'turn-1' } }); await drain();
  assert.equal((await service.snapshot()).draft, 'Next question'); await service.close();
});
test('uncertain delivery never resends, retains draft, and requires explicit review', async () => {
  const { service, peer } = setup(); await service.action({ kind: 'connect' });
  await service.action({ kind: 'draft', revision: 0, text: 'Maybe sent' });
  peer.nextSend = async () => { throw new Error('Connection lost before acknowledgement'); };
  await assert.rejects(service.action({ kind: 'send', revision: 1, id: 'send-1' }), /Connection lost/);
  assert.equal((await service.snapshot()).phase, 'uncertain');
  await assert.rejects(service.action({ kind: 'acknowledge' }), /Resume/);
  await service.action({ kind: 'disconnect' });
  await assert.rejects(service.action({ kind: 'acknowledge' }), /Resume/);
  const resumed = await service.action({ kind: 'connect' });
  assert.equal(resumed.phase, 'uncertain'); assert.equal(resumed.draft, 'Maybe sent'); assert.equal(peer.sends().length, 1);
  const reviewed = await service.action({ kind: 'acknowledge' }); assert.equal(reviewed.phase, 'ready');
  assert.equal(reviewed.draft, 'Maybe sent'); await service.close();
});
test('lost acknowledgement reconciles by message identity without replay', async () => {
  const { store, peer, service } = setup();
  store.data = { ...emptyChat(), threadId: 'thread-1', draft: 'Accepted', draftRevision: 1,
    pending: { id: 'send-1', text: 'Accepted', draftRevision: 1, accepted: false, turnId: null }, sentIds: ['send-1'] };
  peer.turns = [{ id: 'turn-1', status: 'completed', items: [{ type: 'userMessage', id: 'send-1', content: [{ type: 'text', text: 'Accepted' }] }] }];
  const resumed = await service.action({ kind: 'connect' }); assert.equal(resumed.pending, null); assert.equal(resumed.draft, '');
  assert.equal(peer.sends().length, 0); await service.close();
});
test('rejected sends retain draft; foreign/stale events cannot finish or paint a current turn', async () => {
  const { service, peer } = setup(); await service.action({ kind: 'connect' });
  await service.action({ kind: 'draft', revision: 0, text: 'Question' });
  peer.nextSend = async () => { throw new RpcRejection('Unavailable model'); };
  await assert.rejects(service.action({ kind: 'send', revision: 1, id: 'rejected' }), /Unavailable model/);
  assert.equal((await service.snapshot()).phase, 'ready'); assert.equal((await service.snapshot()).pending, null);
  await service.action({ kind: 'send', revision: 1, id: 'accepted' });
  peer.event('turn/completed', { threadId: 'other-thread', turn: { id: 'turn-1', status: 'completed' } });
  peer.event('item/agentMessage/delta', { threadId: 'thread-1', turnId: 'old-turn', itemId: 'wrong', delta: 'wrong' });
  await drain(); assert.equal((await service.snapshot()).phase, 'running');
  assert.equal((await service.snapshot()).messages.some(m => m.id === 'wrong'), false);
  await service.action({ kind: 'interrupt' }); await drain(); assert.equal((await service.snapshot()).phase, 'ready');
  const old = peer.connections[0]; await service.action({ kind: 'disconnect' }); await service.action({ kind: 'connect' });
  old?.lost('stale connection'); await drain(); assert.equal((await service.snapshot()).phase, 'ready'); await service.close();
});
test('invalid browser and recovery data is rejected at the boundary', () => {
  assert.throws(() => readChatAction({ kind: 'spawn', command: 'anything' }));
  assert.throws(() => readChatAction({ kind: 'draft', revision: -1, text: '' }));
  assert.throws(() => readChatAction({ kind: 'draft', revision: 0, text: 'a'.repeat(32769) }));
  assert.throws(() => readChatRecord({ ...emptyChat(), version: 9 }));
});
test('missing native empty rollout can restart only if no send was ever journaled', async () => {
  for (const submitted of [false, true]) {
    const { service, store, peer } = setup();
    store.data = { ...emptyChat(), threadId: 'empty-thread', draft: 'Unsent thought', sentIds: submitted ? ['attempted-send'] : [] };
    peer.resumeError = new RpcRejection('no rollout found for thread id empty-thread');
    if (submitted) {
      await assert.rejects(service.action({ kind: 'connect' }), /no rollout/);
      assert.equal((await service.snapshot()).threadId, 'empty-thread');
      assert.equal(peer.calls.some(c => c.method === 'thread/start'), false);
    } else {
      const connected = await service.action({ kind: 'connect' });
      assert.equal(connected.phase, 'ready'); assert.equal(connected.draft, 'Unsent thought'); assert.match(connected.notice, /empty thread/);
    }
    await service.close();
  }
});
test('private store is atomic, single-owner, restartable, and preserves external/corrupt/symlinked data', async () => {
  await mkdir('tmp/codex', { recursive: true }); const directory = await mkdtemp(resolve('tmp/codex/chat-store-'));
  const store = new FileChatStore(directory);
  try {
    await store.load(); await store.save({ ...emptyChat(), draft: 'Saved' });
    assert.equal((await stat(join(directory, 'conversation.json'))).mode & 0o777, 0o600);
    await assert.rejects(new FileChatStore(directory).load(), /Another local server/);
    const closing = store.close(); assert.equal(store.close(), closing); await closing;
    const next = new FileChatStore(directory); assert.equal((await next.load()).draft, 'Saved');
    await writeFile(join(directory, 'conversation.json'), 'preserve these bytes');
    await assert.rejects(next.save(emptyChat()), /changed outside/); await next.close();
    await assert.rejects(new FileChatStore(directory).load()); assert.equal(await readFile(join(directory, 'conversation.json'), 'utf8'), 'preserve these bytes');
    await rm(join(directory, 'conversation.json')); await writeFile(join(directory, 'target'), '{}');
    await symlink(join(directory, 'target'), join(directory, 'conversation.json'));
    await assert.rejects(new FileChatStore(directory).load(), /regular files/);
  } finally { await store.close(); await rm(directory, { recursive: true, force: true }); }
});
test('HTTP requires local host, same origin and process token; GET supports unchanged snapshots', async () => {
  const { service } = setup(), server = createServer((req, res) => { void chatHttp(service)(req, res); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;
  try {
    const first = await fetch(url), state = await first.json();
    assert.equal((await fetch(url, { headers: { 'If-None-Match': first.headers.get('etag') ?? '' } })).status, 304);
    const forged = await new Promise<number | undefined>((resolve, reject) => {
      const req = request(url, { headers: { Host: 'evil.example:80' } }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); req.end();
    });
    assert.equal(forged, 403);
    assert.equal((await fetch(url, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
    const post = (origin: string, token: string, body = '{}') => fetch(url, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-KP-Chat-Token': token }, body });
    assert.equal((await post('https://evil.example', state.token)).status, 403);
    assert.equal((await post(url, 'old-token')).status, 403);
    assert.equal((await post(url, state.token)).status, 422);
    assert.equal((await post(url, state.token, JSON.stringify({ kind: 'draft', revision: 0, text: 'Saved through HTTP' }))).status, 200);
    assert.equal((await post(url, state.token, JSON.stringify({ kind: 'draft', revision: 0, text: 'stale' }))).status, 409);
  } finally { await service.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
test('transport drains a split UTF-8 final frame before process exit', async () => {
  const script = "process.stdin.once('data',()=>{const b=Buffer.from(JSON.stringify({id:1,result:{text:'π'}})+'\\n');process.stdout.write(b.subarray(0,b.length-4));setTimeout(()=>process.stdout.write(b.subarray(b.length-4),()=>process.exit(0)),10)})";
  const rpc = new CodexTransport(process.execPath, process.cwd(), { event() {}, lost() {} }, ['-e', script]);
  try { assert.deepEqual(await rpc.request('initialize', {}), { text: 'π' }); } finally { rpc.close(); }
});
test('malformed transport frames reject pending requests and report connection loss', async () => {
  let reason = '';
  const rpc = new CodexTransport(process.execPath, process.cwd(), { event() {}, lost: text => { reason = text; } }, ['-e', "process.stdin.once('data',()=>process.stdout.write('not json\\n'))"]);
  try { await assert.rejects(rpc.request('initialize', {}), /disconnected/); assert.match(reason, /Invalid Codex protocol/); } finally { rpc.close(); }
});
