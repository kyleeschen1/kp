import { draftLimit, readChatSnapshot, type ChatAction, type ChatContext, type ChatSnapshot, type ReadingPoint } from './protocol.ts';
import type { PassageTarget } from './annotations.ts';
import { mountRichText } from './rich-text.ts';
import { mountTranscript } from './transcript.ts';
import type { ReadingBookmark } from './transcript-navigation.ts';
import { mountNotes } from './notes.ts';
import { mountChatCommands } from './chat-commands.ts';
import { chatViewState } from './reading-state.ts';
import './style.css';

const recoveryKey = 'kp.editor-chat.unsaved.v1';
export interface ChatWindowHost {
  attach(element: HTMLElement, focus: () => void): () => void;
  active(): boolean;
  activate(): void; cycle(): void; closed(): void;
}
const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) => {
  const value = document.createElement(tag); value.className = className; if (text) value.textContent = text; return value;
};
/** Closing the presentation never disconnects, resends, or destroys native history. */
export function mountChat(body: HTMLElement, actions: HTMLElement, layout: () => void, windowHost: ChatWindowHost) {
  const launcher = node('button', '', 'Chat'); launcher.type = 'button'; launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-controls', 'kp-chat'); actions.append(launcher);
  let panel: ReturnType<typeof mountChatPanel> | undefined;
  const open = () => { launcher.remove(); panel ??= mountChatPanel(body, actions, layout, windowHost); panel.open(); };
  launcher.onclick = open;
  try { if (sessionStorage.getItem('kp.editor-chat.open') === 'true') open(); } catch { /* Optional preference. */ }
  return { dispose() { panel?.dispose(); launcher.remove(); } };
}
function mountChatPanel(body: HTMLElement, actions: HTMLElement, layout: () => void, windowHost: ChatWindowHost) {
  const toggle = node('button', '', 'Chat'); toggle.type = 'button'; toggle.setAttribute('aria-expanded', 'false');
  const panel = node('aside', 'kp-chat'); panel.id = 'kp-chat'; panel.hidden = true; panel.setAttribute('aria-label', 'Persistent chat');
  toggle.setAttribute('aria-controls', panel.id);
  const status = node('p', 'kp-chat-status', 'Loading conversation…'); status.setAttribute('role', 'status');
  const history = node('div', 'kp-chat-history'); history.setAttribute('role', 'log'); history.setAttribute('aria-label', 'Conversation messages'); history.setAttribute('aria-live', 'off');
  const empty = node('p', 'kp-chat-empty', 'i to write · C-c for commands');
  const clipped = node('p', 'kp-chat-context', 'Recent messages · the full conversation remains in Codex.'); clipped.hidden = true;
  const unread = node('button', 'kp-chat-unread', 'New output · G'); unread.type = 'button'; unread.hidden = true;
  const draftHost = node('div', 'kp-chat-draft');
  const saved = node('p', 'kp-chat-save kp-chat-sr'); saved.setAttribute('role', 'status');
  const notesHost = node('div', 'kp-chat-notes'); notesHost.hidden = true;
  const column = node('div', 'kp-chat-column'), output = node('div', 'kp-chat-output');
  output.append(status, history, empty, clipped, unread, notesHost);
  column.append(output, draftHost, saved); panel.append(column); body.prepend(panel); actions.append(toggle);

  type Mode = 'reading' | 'compose' | 'notes';
  let mode: Mode = 'reading', current: ChatSnapshot | undefined, remote: ChatSnapshot | undefined;
  let dirty = false, conflict = false, disposed = false, hydrated = false, operationCount = 0;
  let generation = 0, baseRevision = 0, mutation = 0, pollingGeneration = 0, localNotice = '', etag = '';
  let following = true, restoring = false, lastOutput = '', pendingMotion = '';
  let readingReturn: ReadingBookmark | undefined;
  let origin: { mode: Mode; reading: ReadingBookmark; focus: HTMLElement | null } | undefined;
  let polling: ReturnType<typeof setTimeout> | undefined, saveTimer: ReturnType<typeof setTimeout> | undefined, viewTimer: ReturnType<typeof setTimeout> | undefined;
  let queue: Promise<void> = Promise.resolve(), refreshController: AbortController | undefined;
  let selection: PassageTarget | null = null;
  const views = chatViewState();
  const composer = mountRichText(draftHost, { profile: 'composer', label: 'Your message', limit: draftLimit, minimal: true,
    onChange: draftChanged, onSubmit: sendDraft, onSave: saveDraft, onHelp: () => commands.help() });
  const transcript = mountTranscript(history, target => { selection = target; }, id => { showNotes(); notes.edit(id); });
  let notes = createNotes();
  const branchChanged = () => Boolean(current && remote && current.branchId !== remote.branchId);
  const commands = mountChatCommands(column, {
    snapshot: () => current && { ...current, branches: remote?.branches ?? current.branches },
    selection: () => selection, point: transcript.point, busy: () => operationCount > 0, conflict: () => conflict, branchChanged,
    isSource: () => (mode === 'notes' ? notes.editor() : composer)?.isSource() ?? false,
    captureOrigin() { origin = { mode, reading: transcript.capture(), focus: document.activeElement instanceof HTMLElement ? document.activeElement : null }; },
    restoreOrigin() {
      if (!origin) { read(); return; }
      if (origin.mode === 'reading') preserve(() => transcript.restore(origin!.reading));
      else if (origin.focus?.isConnected && !origin.focus.closest('[hidden]')) origin.focus.focus({ preventScroll: true });
      else if (origin.mode === 'compose') composer.focus(); else notes.focus();
    },
    read, compose, close: () => setOpen(false), notes: showNotes, window: windowHost.cycle,
    note(target, tags) { showNotes(); notes.create(target, tags); },
    source() {
      if (mode === 'notes' && notes.editor()) notes.editor()!.toggleSource();
      else { if (mode !== 'compose') compose(); composer.toggleSource(); }
    },
    save: saveDraft, load: loadSaved, act, context: saveContext, branch: changeBranch, jump,
    search: transcript.search
  });
  function createNotes() {
    return mountNotes(notesHost, {
      save: action => perform(async () => { const snapshot = await post(action); adopt(snapshot); return snapshot; }),
      resolve: transcript.resolve, reveal: target => { read(false); transcript.reveal(target); rememberView(); },
      help: () => commands.help()
    });
  }
  function preserve(operation: () => void) {
    restoring = true; operation(); requestAnimationFrame(() => { restoring = false; });
  }
  function rememberView() {
    if (!current) return;
    views.save(current.project, current.branchId, { reading: mode === 'reading' ? transcript.capture() : readingReturn ?? transcript.capture(), cursor: composer.cursor() });
  }
  function draftKey(branch = current?.branchId ?? 'main') { return recoveryKey + ':' + branch; }
  function forget() {
    try { sessionStorage.removeItem(draftKey()); if (current?.branchId === 'main') sessionStorage.removeItem(recoveryKey); } catch { /* Saved project copy retained. */ }
  }
  function remember() {
    if (!current) return;
    try { sessionStorage.setItem(draftKey(), JSON.stringify({ text: composer.value(), revision: baseRevision, branchId: current.branchId, threadId: current.threadId })); }
    catch { localNotice = 'Browser draft recovery is unavailable. Save before closing.'; }
  }
  function recover(snapshot: ChatSnapshot) {
    if (hydrated) return; hydrated = true; baseRevision = snapshot.draftRevision;
    try {
      const raw = sessionStorage.getItem(draftKey(snapshot.branchId)) ?? (snapshot.branchId === 'main' ? sessionStorage.getItem(recoveryKey) : null);
      if (!raw) return;
      const local: unknown = JSON.parse(raw);
      if (!local || typeof local !== 'object' || !('text' in local) || typeof local.text !== 'string' || local.text.length > draftLimit) throw new Error('Invalid local recovery.');
      if (local.text === snapshot.draft) { forget(); return; }
      composer.setText(local.text); dirty = true;
      conflict = !('revision' in local) || local.revision !== snapshot.draftRevision
        || ('branchId' in local ? local.branchId !== snapshot.branchId : !('threadId' in local) || local.threadId !== snapshot.threadId);
      localNotice = conflict ? 'Recovered local text differs from the saved draft. C-c L loads the saved copy.' : 'Recovered an unsent draft · i to continue.';
    } catch { localNotice = 'Local recovery could not be read. Its original bytes are preserved.'; }
  }
  function adopt(snapshot: ChatSnapshot, owned = false, switchAllowed = false) {
    if (disposed) return;
    remote = snapshot;
    if (current && current.branchId !== snapshot.branchId && !switchAllowed) {
      localNotice = 'Another tab changed branches. Your place and draft are retained. C-c s returns to this branch.'; paint(); return;
    }
    const switching = !current || current.branchId !== snapshot.branchId;
    if (switching) {
      if (current) { rememberView(); if (dirty) remember(); notes.dispose(); notes = createNotes(); }
      current = snapshot; dirty = false; conflict = false; hydrated = false; mode = 'reading'; readingReturn = undefined;
      composer.setText(snapshot.draft); lastOutput = ''; unread.hidden = true;
    }
    recover(snapshot);
    if (dirty && !owned && snapshot.draftRevision !== baseRevision) conflict = true;
    current = snapshot;
    if (owned || !dirty) baseRevision = snapshot.draftRevision;
    if (!dirty) composer.setText(snapshot.draft);
    paint();
    if (switching) {
      const state = views.load(snapshot.project, snapshot.branchId);
      // A late snapshot may hydrate a covered window, but cannot take focus
      // from the page the user has chosen in the meantime.
      if (state) preserve(() => { composer.restoreCursor(state.cursor); transcript.restore(state.reading, !commands.isOpen() && windowHost.active()); });
      else if (!commands.isOpen() && !panel.hidden && windowHost.active()) transcript.surface.focus();
      following = history.scrollHeight - history.scrollTop - history.clientHeight < 50;
    }
  }
  function paint() {
    if (disposed) return;
    const snapshot = current;
    panel.dataset['phase'] = branchChanged() ? 'branch-changed' : snapshot?.phase ?? 'loading';
    panel.dataset['mode'] = mode; panel.dataset['branchId'] = snapshot?.branchId ?? '';
    history.hidden = mode === 'notes'; notesHost.hidden = mode !== 'notes';
    composer.setDisabled(!snapshot);
    saved.textContent = conflict ? 'Draft conflict · local text retained' : dirty ? 'Unsaved changes…' : snapshot ? 'Saved to this project' : '';
    let cue = localNotice;
    if (!cue && (!snapshot || !['ready', 'running'].includes(snapshot.phase))) cue = snapshot?.notice ?? 'Loading conversation…';
    if (!cue && snapshot?.phase === 'running') cue = 'Responding…';
    if (!cue && conflict) cue = 'Draft conflict · C-c L to load the saved copy; local text retained.';
    if (!cue && snapshot?.phase === 'disconnected') cue = 'C-c R to connect or resume.';
    status.textContent = cue; status.hidden = !cue;
    if (!snapshot) return;
    empty.hidden = mode !== 'reading' || snapshot.messages.length !== 0;
    clipped.hidden = mode === 'notes' || !snapshot.historyClipped;
    const output = snapshot.messages.at(-1);
    const stamp = output ? output.id + ':' + output.text.length + ':' + output.complete : '';
    if (lastOutput && stamp !== lastOutput && !following) unread.hidden = false;
    lastOutput = stamp;
    preserve(() => transcript.update(snapshot, following && mode !== 'notes'));
    notes.update(snapshot); commands.refresh();
  }
  function compose() {
    if (!current) return;
    if (mode !== 'compose') {
      if (mode === 'reading') readingReturn = transcript.capture();
      mode = 'compose'; paint(); layout();
      if (readingReturn && !following) preserve(() => transcript.restoreScroll(readingReturn!.scroll));
    }
    composer.insert();
  }
  function read(restore = true) {
    const before = readingReturn;
    if (mode === 'compose') { composer.normal(); rememberView(); saveDraft(); }
    if (mode === 'notes') notes.remember();
    mode = 'reading'; paint(); layout();
    preserve(() => {
      if (restore && before) transcript.restore(before);
      else transcript.surface.focus();
    });
    readingReturn = undefined;
    following = history.scrollHeight - history.scrollTop - history.clientHeight < 50;
    rememberView();
  }
  function showNotes() {
    if (mode === 'reading') readingReturn = transcript.capture();
    if (mode === 'compose') { rememberView(); saveDraft(); }
    mode = 'notes'; paint(); layout(); notes.focus();
  }
  function loadSaved() {
    if (!current || !confirm('Replace your local text with the saved draft? Copy any text you want to keep first.')) return;
    conflict = false; dirty = false; baseRevision = current.draftRevision; composer.setText(current.draft); forget(); localNotice = ''; paint();
  }
  async function post(action: ChatAction) {
    if (!current) throw new Error('Wait for the saved conversation to load.');
    const response = await fetch('/api/dev/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-KP-Chat-Token': current.token },
      body: JSON.stringify({ ...action, branchId: action.branchId ?? current.branchId }) });
    if (!response.ok) {
      const error = await response.json();
      if (response.status === 409 && error.code === 'draft-revision') { conflict = true; dirty = true; remember(); }
      throw new Error(typeof error.error === 'string' ? error.error : 'Chat request failed.');
    }
    etag = ''; return readChatSnapshot(await response.json());
  }
  function perform<T>(operation: () => Promise<T>): Promise<T> {
    const branchId = current?.branchId;
    operationCount++; mutation++; paint();
    const next = queue.then(async () => {
      if (disposed) throw new Error('Chat panel disposed.');
      if (branchId !== current?.branchId) throw new Error('The queued operation belongs to a different branch. Its draft is retained.');
      try { return await operation(); }
      catch (error) { localNotice = String(error instanceof Error ? error.message : error); if (dirty) remember(); throw error; }
    }).finally(() => { operationCount--; mutation++; paint(); });
    queue = next.then(() => {}, () => {}); return next;
  }
  async function writeDraft() {
    if (!dirty || conflict || branchChanged() || !current) return;
    const text = composer.value(), edit = generation;
    const snapshot = await post({ kind: 'draft', text, revision: baseRevision });
    if (edit === generation) { dirty = false; forget(); localNotice = ''; }
    adopt(snapshot, true); if (dirty) remember();
  }
  function saveDraft() { if (dirty && !conflict) { clearTimeout(saveTimer); void perform(writeDraft).catch(() => {}); } }
  function act(action: ChatAction) {
    return perform(async () => { localNotice = ''; const snapshot = await post(action); adopt(snapshot); });
  }
  function saveContext(context: Omit<ChatContext, 'revision'>, revision: number) {
    return perform(async () => { const snapshot = await post({ kind: 'context-save', context, revision }); localNotice = ''; adopt(snapshot); });
  }
  async function changeBranch(action: Extract<ChatAction, { kind: 'branch-create' | 'branch-switch' }>, point?: ReadingPoint) {
    return perform(async () => {
      if (conflict && !(branchChanged() && action.kind === 'branch-switch' && action.id === current?.branchId)) throw new Error('Resolve the draft conflict before changing branches.');
      if (!branchChanged()) await writeDraft();
      rememberView(); if (dirty) remember(); notes.remember();
      const branchId = remote?.branchId ?? current?.branchId;
      if (!branchId) throw new Error('Wait for the conversation to load.');
      const snapshot = await post({ ...action, branchId });
      localNotice = ''; adopt(snapshot, false, true);
      if (point && !transcript.jump(point)) localNotice = 'This saved passage is outside the loaded messages. Its reference is retained.';
      if (!point) {
        const view = views.load(snapshot.project, snapshot.branchId);
        if (view) preserve(() => transcript.restore(view.reading, false));
      }
    });
  }
  async function jump(point: ReadingPoint) {
    try {
      if (!current) return;
      if (point.branchId !== current.branchId || branchChanged()) await changeBranch({ kind: 'branch-switch', id: point.branchId }, point);
      read(false);
      if (!transcript.jump(point)) { localNotice = 'This saved passage is outside the loaded messages. Its reference is retained.'; paint(); }
      rememberView();
    } catch { /* perform retained the draft and exposed the failure. */ }
  }
  function sendDraft() {
    const submitted = composer.value(), edit = generation;
    if (!submitted.trim() || conflict || branchChanged() || current?.phase !== 'ready') return;
    clearTimeout(saveTimer);
    void perform(async () => {
      if (!current || conflict) return;
      localNotice = 'Sending…';
      // The captured text belongs to this request; later typing is a new draft.
      if (current.draft !== submitted) {
        current = await post({ kind: 'draft', text: submitted, revision: baseRevision }); baseRevision = current.draftRevision;
      }
      const snapshot = await post({ kind: 'send', revision: baseRevision, id: crypto.randomUUID() });
      current = snapshot; localNotice = '';
      if (edit === generation) { dirty = false; composer.setText(snapshot.draft); forget(); }
      else dirty = true;
      adopt(snapshot, true); if (dirty) remember();
      if (!dirty && !snapshot.draft && mode === 'compose') {
        mode = 'reading'; readingReturn = undefined; following = true; paint(); layout(); transcript.latest(); rememberView();
      }
    }).catch(() => {});
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
        if (!operationCount && epoch === mutation && poll === pollingGeneration) { etag = response.headers.get('ETag') ?? ''; adopt(snapshot); }
      }
    } catch (error) {
      if (!disposed && !(error instanceof DOMException && error.name === 'AbortError')) {
        localNotice = 'Chat connection unavailable. Your draft is retained. ' + String(error); paint();
      }
    } finally { if (!disposed && !panel.hidden && poll === pollingGeneration) polling = setTimeout(() => { void refresh(); }, 700); }
  }
  function setOpen(open: boolean) {
    if (!open) { rememberView(); if (dirty) remember(); notes.remember(); commands.hide(false); }
    panel.hidden = !open; body.classList.toggle('kp-chat-open', open); toggle.setAttribute('aria-expanded', String(open));
    try { sessionStorage.setItem('kp.editor-chat.open', String(open)); } catch { /* Presentation preference only. */ }
    pollingGeneration++; clearTimeout(polling); refreshController?.abort();
    if (open) { windowHost.activate(); void refresh(); if (current) { mode = 'reading'; paint(); transcript.surface.focus(); } }
    else { windowHost.closed(); toggle.focus(); }
    layout();
  }
  toggle.onclick = () => setOpen(Boolean(panel.hidden));
  function draftChanged() {
    if (!dirty && current) baseRevision = current.draftRevision;
    generation++; dirty = true; localNotice = ''; remember(); clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 200); paint();
  }
  unread.onclick = () => { unread.hidden = true; following = true; transcript.latest(); rememberView(); };
  draftHost.addEventListener('focusin', () => {
    if (mode === 'compose') return;
    if (mode === 'reading') readingReturn = transcript.capture();
    if (mode === 'notes') notes.remember();
    mode = 'compose'; paint();
  });
  history.addEventListener('focusin', () => {
    if (mode === 'reading') return;
    if (mode === 'compose') { composer.normal(); saveDraft(); }
    mode = 'reading'; readingReturn = undefined; paint();
  });
  history.addEventListener('scroll', () => {
    if (restoring || mode === 'notes') return;
    following = history.scrollHeight - history.scrollTop - history.clientHeight < 50;
    if (following) unread.hidden = true;
    // Window resizing also fires scroll events; preserve the reading bookmark.
    clearTimeout(viewTimer); viewTimer = setTimeout(rememberView, 150);
  });
  panel.addEventListener('keydown', event => {
    if (event.isComposing || commands.dialog.contains(event.target as Node)) return;
    if (event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'c') {
      event.preventDefault(); event.stopPropagation(); commands.main(); return;
    }
    if (event.key === 'Escape') {
      if (mode === 'compose' && (!composer.isSource() || !composer.isInsert())) {
        event.preventDefault(); event.stopPropagation(); read(); return;
      }
      if (mode === 'notes' && !notes.editor()?.isInsert()) { event.preventDefault(); event.stopPropagation(); read(); return; }
    }
    if (mode !== 'reading' || !transcript.surface.root.contains(event.target as Node) || event.metaKey || event.altKey) return;
    const key = event.key;
    if (event.ctrlKey) {
      if (key === 'd' || key === 'u') { event.preventDefault(); event.stopPropagation(); transcript.page(key === 'd' ? 1 : -1); }
      return;
    }
    let handled = true;
    if (pendingMotion) { const previous = pendingMotion; pendingMotion = ''; if (key === 'm') transcript.message(previous === ']' ? 1 : -1); else handled = false; }
    else if (key === '[' || key === ']') pendingMotion = key;
    else if (key === 'i' || key === 'a' || key === 'I' || key === 'A') compose();
    else if (key === '/') commands.search();
    else if (key === ':') commands.ex();
    else if (key === 'n' || key === 'N') commands.repeat(key === 'n' ? 1 : -1);
    else if (key === '{' || key === '}') transcript.paragraph(key === '}' ? 1 : -1);
    else handled = false;
    if (handled) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  const beforeUnload = (event: BeforeUnloadEvent) => {
    rememberView();
    if (dirty || notes.dirty()) { remember(); notes.remember(); event.preventDefault(); event.returnValue = ''; }
  };
  window.addEventListener('beforeunload', beforeUnload);
  const detachWindow = windowHost.attach(panel, () => {
    if (mode === 'compose') composer.focus(); else if (mode === 'notes') notes.focus(); else transcript.surface.focus();
  });
  return { open() { setOpen(true); }, dispose() {
    rememberView(); disposed = true; clearTimeout(polling); clearTimeout(saveTimer); clearTimeout(viewTimer); refreshController?.abort();
    window.removeEventListener('beforeunload', beforeUnload); if (dirty) remember();
    detachWindow(); commands.dispose(); notes.dispose(); transcript.dispose(); composer.dispose(); panel.remove(); toggle.remove();
  } };
}
