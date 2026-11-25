import { CodexTransport } from '../server/chat/transport.ts';
import { ChatService } from '../server/chat/service.ts';
import { emptyChat } from '../src/editor-chat/protocol.ts';
import type { ChatStore } from '../server/chat/store.ts';

// No turn/start: validate the real installed lifecycle without model inference
// or changing the editor's recovery file or another client's conversation.
let data = emptyChat();
const store: ChatStore = { async load() { return structuredClone(data); },
  async save(value) { data = structuredClone(value); }, async close() {} };
const service = () => new ChatService(store, callbacks => new CodexTransport(
  process.env['KP_CODEX_EXECUTABLE'] ?? '/opt/homebrew/bin/codex', process.cwd(), callbacks), process.cwd());
const first = service();
try {
  await first.action({ kind: 'connect' });
  await first.action({ kind: 'draft', revision: 0, text: 'No inference: lifecycle check only.' });
} finally { await first.close(); }
const resumed = service();
try {
  const state = await resumed.action({ kind: 'connect' });
  if (state.phase !== 'ready' || state.draft !== 'No inference: lifecycle check only.' || state.sentIds.length) throw new Error('Native lifecycle lost the unsent draft.');
  console.log(JSON.stringify({ connected: true, restart: state.notice, inference: 'not requested', populatedThreadResume: 'requires a real user turn' }));
} finally { await resumed.close(); }
