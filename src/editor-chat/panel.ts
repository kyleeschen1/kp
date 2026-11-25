import { draftLimit, readChatSnapshot, type ChatAction, type ChatSnapshot } from './protocol.ts';
import './style.css';

const recoveryKey = 'kp.editor-chat.unsaved.v1';
const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) => {
  const value = document.createElement(tag); value.className = className; if (text) value.textContent = text; return value;
};
/** One mount controls presentation only. The server owns the session, so closing
 * or disposing this panel never disconnects or resends a conversation. */
export function mountChat(body: HTMLElement, actions: HTMLElement, layout: () => void) {
  const toggle = node('button', '', 'Chat'); toggle.type = 'button'; toggle.setAttribute('aria-expanded', 'false');
  const panel = node('aside', 'kp-chat'); panel.id = 'kp-chat'; panel.hidden = true; panel.setAttribute('aria-label', 'Persistent chat');
  toggle.setAttribute('aria-controls', panel.id);
  const heading = node('div', 'kp-chat-heading'), title = node('strong', '', 'Conversation');
  const context = node('p', 'kp-chat-context', 'This conversation is separate from your document. Project access is read-only.');
  const status = node('p', 'kp-chat-status', 'Loading saved conversation…'); status.setAttribute('role', 'status');
  const thread = node('details', 'kp-chat-details'), summary = node('summary', '', 'Session details');
  const identity = node('p'); thread.append(summary, identity);
  const history = node('div', 'kp-chat-history'); history.setAttribute('role', 'log'); history.setAttribute('aria-label', 'Conversation messages'); history.setAttribute('aria-live', 'off');
  const empty = node('p', 'kp-chat-empty', 'Start a conversation here, then return to the same thread later.');
  const clipped = node('p', 'kp-chat-context', 'Showing recent messages. Codex retains the saved thread history.'); clipped.hidden = true;
  const draft = node('textarea', 'kp-chat-draft'); draft.setAttribute('aria-label', 'Your message'); draft.placeholder = 'Ask or continue the conversation…'; draft.maxLength = draftLimit;
  const saved = node('p', 'kp-chat-save', ''); saved.setAttribute('role', 'status');
  const controls = node('div', 'kp-chat-controls');
  const makeButton = (label: string, run: () => void) => { const button = node('button', '', label); button.type = 'button'; button.onclick = run; return button; };
  const close = makeButton('Close chat', () => setOpen(false));
  const connect = makeButton('Connect', () => act({ kind: 'connect' }));
  const send = makeButton('Send', sendDraft);
  send.title = 'Send message (⌘/Ctrl+Enter)';
  const save = makeButton('Save draft', saveDraft);
  const interrupt = makeButton('Interrupt', () => act({ kind: 'interrupt' }));
  const disconnect = makeButton('Disconnect', () => act({ kind: 'disconnect' }));
  const acknowledge = makeButton('I checked; keep draft unsent', () => act({ kind: 'acknowledge' })); acknowledge.hidden = true;
  const loadSaved = makeButton('Load saved draft', () => {
    if (!current || !confirm('Replace your local text with the saved draft? Copy any text you want to keep first.')) return;
    conflict = false; dirty = false; baseRevision = current.draftRevision; draft.value = current.draft; forget(); paint();
  }); loadSaved.hidden = true;
  heading.append(title, close); controls.append(connect, send, interrupt, disconnect, save);
  panel.append(heading, context, status, thread, clipped, history, empty, draft, saved, controls, acknowledge, loadSaved);
  body.append(panel); actions.append(toggle);
  let current: ChatSnapshot | undefined, dirty = false, conflict = false, busy = false, disposed = false;
  let generation = 0, baseRevision = 0, mutation = 0, pollingGeneration = 0, localNotice = '', etag = '', hydrated = false;
  let polling: ReturnType<typeof setTimeout> | undefined, saveTimer: ReturnType<typeof setTimeout> | undefined;
  let queue: Promise<void> = Promise.resolve();
  let refreshController: AbortController | undefined;
  const rows = new Map<string, { element: HTMLElement; content: HTMLElement; label: HTMLElement }>();

  function forget() { try { sessionStorage.removeItem(recoveryKey); } catch { /* Server already saved it. */ } }

  function remember() {
    try { sessionStorage.setItem(recoveryKey, JSON.stringify({ text: draft.value, revision: baseRevision, threadId: current?.threadId })); }
    catch { localNotice = 'Browser recovery is unavailable; wait for Saved to this project before closing.'; }
  }
  function recover(snapshot: ChatSnapshot) {
    if (hydrated) return; hydrated = true; baseRevision = snapshot.draftRevision;
    try {
      const raw = sessionStorage.getItem(recoveryKey); if (!raw) return;
      const local: unknown = JSON.parse(raw);
      if (!local || typeof local !== 'object' || !('text' in local) || typeof local.text !== 'string' || local.text.length > draftLimit) throw new Error('Invalid local recovery.');
      if (local.text === snapshot.draft) { forget(); return; }
      draft.value = local.text; dirty = true;
      conflict = !('revision' in local) || local.revision !== snapshot.draftRevision || !('threadId' in local) || local.threadId !== snapshot.threadId;
      localNotice = conflict ? 'Recovered local text differs from the saved draft. Copy it before loading the saved version.' : 'Recovered unsaved text; it has not been sent.';
    } catch { localNotice = 'Local recovery could not be read. Its original bytes have been preserved.'; }
  }
  function adopt(snapshot: ChatSnapshot, owned = false) {
    if (disposed) return;
    recover(snapshot);
    if (dirty && !owned && snapshot.draftRevision !== baseRevision) conflict = true;
    current = snapshot;
    if (owned || !dirty) baseRevision = snapshot.draftRevision;
    if (!dirty) draft.value = snapshot.draft;
    paint();
  }
  function paint() {
    if (disposed) return;
    const snapshot = current;
    status.textContent = localNotice || snapshot?.notice || 'Loading saved conversation…';
    panel.dataset['phase'] = snapshot?.phase ?? 'loading';
    identity.textContent = snapshot ? `Project: ${snapshot.project}\nThread: ${snapshot.threadId ?? 'Not started'}${snapshot.model ? `\nModel: ${snapshot.model}` : ''}` : '';
    connect.textContent = snapshot && ['ready', 'running', 'sending'].includes(snapshot.phase) ? 'Connected' : snapshot?.threadId ? 'Resume conversation' : 'Connect';
    connect.disabled = busy || !snapshot || ['ready', 'running', 'sending', 'connecting'].includes(snapshot.phase);
    send.disabled = busy || conflict || snapshot?.phase !== 'ready' || !draft.value.trim();
    save.hidden = !dirty; save.disabled = busy || conflict || !snapshot;
    interrupt.disabled = busy || !snapshot?.pending?.turnId || snapshot.phase !== 'running';
    disconnect.disabled = busy || !snapshot || snapshot.phase === 'disconnected';
    draft.disabled = !snapshot;
    saved.textContent = conflict ? 'Draft conflict · local text retained' : dirty ? 'Unsaved changes…' : snapshot ? 'Saved to this project' : '';
    acknowledge.hidden = snapshot?.phase !== 'uncertain'; acknowledge.disabled = busy || !snapshot?.canAcknowledge;
    loadSaved.hidden = !conflict;
    if (!snapshot) return;
    clipped.hidden = !snapshot.historyClipped; empty.hidden = snapshot.messages.length !== 0;
    const following = history.scrollHeight - history.scrollTop - history.clientHeight < 50;
    const ids = new Set(snapshot.messages.map(m => m.id));
    for (const [id, row] of rows) if (!ids.has(id)) { row.element.remove(); rows.delete(id); }
    for (const message of snapshot.messages) {
      let row = rows.get(message.id);
      if (!row) {
        const element = node('article', 'kp-chat-message'), label = node('div', 'kp-chat-speaker'), content = node('div', 'kp-chat-text');
        element.dataset['messageId'] = message.id; element.append(label, content); history.append(element);
        row = { element, label, content }; rows.set(message.id, row);
      }
      const label = `${message.role === 'user' ? 'You' : 'Codex'}${message.complete ? '' : ' · responding'}${message.clipped ? ' · display shortened' : ''}`;
      if (row.label.textContent !== label) row.label.textContent = label;
      if (row.content.textContent !== message.text) row.content.textContent = message.text;
    }
    if (following) history.scrollTop = history.scrollHeight;
  }
  async function post(action: ChatAction) {
    if (!current) throw new Error('Wait for the saved conversation to load.');
    const response = await fetch('/api/dev/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-KP-Chat-Token': current.token }, body: JSON.stringify(action) });
    if (!response.ok) {
      const error = await response.json();
      if (response.status === 409 && action.kind === 'draft') conflict = true;
      throw new Error(typeof error.error === 'string' ? error.error : 'Chat request failed.');
    }
    etag = ''; return readChatSnapshot(await response.json());
  }
  function enqueue(operation: () => Promise<void>) {
    queue = queue.then(async () => {
      if (disposed) return; busy = true; mutation++; paint();
      try { await operation(); }
      catch (error) { localNotice = `${error instanceof Error ? error.message : String(error)} Your local text is retained.`; remember(); }
      finally { busy = false; mutation++; paint(); }
    });
  }
  function saveDraft() {
    enqueue(async () => {
      if (!dirty || conflict || !current) return;
      const text = draft.value, edit = generation;
      const snapshot = await post({ kind: 'draft', text, revision: baseRevision });
      if (edit === generation) { dirty = false; forget(); localNotice = ''; }
      adopt(snapshot, true); if (dirty) remember();
    });
  }
  function act(action: ChatAction) {
    enqueue(async () => {
      localNotice = action.kind === 'connect' ? 'Connecting to your saved conversation…' : '';
      paint(); const snapshot = await post(action); localNotice = ''; adopt(snapshot);
    });
  }
  function sendDraft() {
    const submitted = draft.value, edit = generation;
    if (!submitted.trim() || conflict || current?.phase !== 'ready') return;
    clearTimeout(saveTimer);
    enqueue(async () => {
      if (!current || conflict) return;
      localNotice = 'Sending to Codex…';
      // Serialize draft save and Send as one UI operation. Typing during the
      // acknowledgement belongs to the next draft, never to this request.
      if (current.draft !== submitted) {
        current = await post({ kind: 'draft', text: submitted, revision: baseRevision });
        baseRevision = current.draftRevision;
      }
      const snapshot = await post({ kind: 'send', revision: baseRevision, id: crypto.randomUUID() });
      current = snapshot; localNotice = '';
      if (edit === generation) { dirty = false; draft.value = snapshot.draft; forget(); }
      else dirty = true;
      adopt(snapshot, true); if (dirty) remember();
    });
  }
  async function refresh() {
    if (disposed || panel.hidden) return;
    const epoch = mutation, poll = pollingGeneration;
    refreshController = new AbortController();
    try {
      const response = await fetch('/api/dev/chat', { headers: etag ? { 'If-None-Match': etag } : {}, signal: refreshController.signal });
      if (response.status !== 304) {
        if (!response.ok) { const error = await response.json(); throw new Error(error.error ?? 'Chat server unavailable.'); }
        const snapshot = readChatSnapshot(await response.json());
        // A poll begun before a mutation cannot overwrite its newer acknowledgement.
        if (!busy && epoch === mutation && poll === pollingGeneration) { etag = response.headers.get('ETag') ?? ''; adopt(snapshot); }
      }
    } catch (error) {
      if (!disposed && !(error instanceof DOMException && error.name === 'AbortError')) {
        localNotice = `Chat connection unavailable. Your draft is retained. ${String(error)}`; paint();
      }
    } finally { if (!disposed && !panel.hidden && poll === pollingGeneration) polling = setTimeout(() => { void refresh(); }, 700); }
  }
  function setOpen(open: boolean) {
    panel.hidden = !open; body.classList.toggle('kp-chat-open', open); toggle.setAttribute('aria-expanded', String(open));
    try { sessionStorage.setItem('kp.editor-chat.open', String(open)); } catch { /* Presentation preference only. */ }
    pollingGeneration++; clearTimeout(polling); refreshController?.abort();
    if (open) { void refresh(); if (current) draft.focus(); } else toggle.focus();
    layout();
  }
  toggle.onclick = () => setOpen(Boolean(panel.hidden));
  draft.oninput = () => { if (!dirty && current) baseRevision = current.draftRevision;
    generation++; dirty = true; localNotice = ''; remember(); clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 200); paint(); };
  draft.onkeydown = event => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !event.isComposing) { event.preventDefault(); event.stopPropagation(); sendDraft(); }
  };
  const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) { remember(); event.preventDefault(); event.returnValue = ''; } };
  window.addEventListener('beforeunload', beforeUnload);
  try { if (sessionStorage.getItem('kp.editor-chat.open') === 'true') setOpen(true); } catch { /* Optional preference. */ }
  return { dispose() { disposed = true; clearTimeout(polling); clearTimeout(saveTimer); refreshController?.abort();
    window.removeEventListener('beforeunload', beforeUnload); if (dirty) remember(); panel.remove(); toggle.remove(); } };
}
