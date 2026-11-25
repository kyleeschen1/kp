import type { ChatAction, ChatContext, ChatSnapshot, ReadingPoint } from './protocol.ts';
import type { PassageTarget } from './annotations.ts';
import { mountTransient, type ChatCommand } from './transient.ts';

export interface ChatCommandHost {
  snapshot(): ChatSnapshot | undefined; selection(): PassageTarget | null; point(): ReadingPoint | null;
  busy(): boolean; conflict(): boolean; branchChanged(): boolean; isSource(): boolean;
  captureOrigin(): void; restoreOrigin(): void; read(restore?: boolean): void; compose(): void; close(): void;
  note(target?: PassageTarget, tags?: boolean): void; notes(): void; source(): void;
  save(): void; load(): void; act(action: ChatAction): Promise<void>;
  context(value: Omit<ChatContext, 'revision'>, revision: number): Promise<void>;
  branch(action: Extract<ChatAction, { kind: 'branch-create' | 'branch-switch' }>, point?: ReadingPoint): Promise<void>;
  jump(point: ReadingPoint): Promise<void>; search(query: string, direction?: -1 | 1): number;
}
const element = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => {
  const node = document.createElement(tag); if (text) node.textContent = text; return node;
};
export function mountChatCommands(panel: HTMLElement, host: ChatCommandHost) {
  const menu = mountTransient(panel, host.restoreOrigin);
  let lastSearch = '';
  // The host publishes failures in the conversation; event handlers must not
  // also create unhandled promise rejections. Forms retain their own input.
  const launch = (operation: Promise<unknown>) => { void operation.catch(() => {}); };
  function show(name: string, choices: ChatCommand[], body?: HTMLElement, cleanup?: () => void) {
    if (!menu.isOpen()) host.captureOrigin(); menu.show(name, choices, body, cleanup);
  }
  const back = (): ChatCommand => ({ key: 'Backspace', label: 'Commands', run: main });
  function form(name: string, label: string, value: string, submit: (value: string) => Promise<void | false>, multiline = false) {
    const body = element('form'), caption = element('label', label);
    const field = multiline ? element('textarea') : element('input'); field.value = value; field.setAttribute('aria-label', label); field.maxLength = multiline ? 4096 : 120;
    const save = element('button', 'Save'), error = element('p'); save.type = 'submit'; error.setAttribute('role', 'status');
    caption.append(field); body.append(caption, save, error);
    body.onsubmit = event => { event.preventDefault(); if (save.disabled) return; save.disabled = true;
      const epoch = menu.epoch();
      void submit(field.value).then(result => { if (result !== false && menu.epoch() === epoch && menu.isOpen()) { menu.hide(false); host.read(); } }).catch(reason => { error.textContent = String(reason instanceof Error ? reason.message : reason); })
        .finally(() => { save.disabled = false; }); };
    field.onkeydown = event => { if (event.key === 'Enter' && (!multiline || event.ctrlKey || event.metaKey)) { event.preventDefault(); body.requestSubmit(); } };
    show(name, [back()], body); field.focus(); field.select();
  }
  function saveReturn() {
    const snapshot = host.snapshot(), point = host.point(); if (!snapshot || !point) return;
    launch(host.context({ ...snapshot.context, returnPoint: point }, snapshot.context.revision));
  }
  function topics() {
    const snapshot = host.snapshot(); if (!snapshot) return;
    const body = element('p', 'Topics mark places in this conversation. They do not change what Codex knows.');
    const choices: ChatCommand[] = snapshot.context.topics.map((topic, index) => ({ key: '123456789abcdefghijklmopqrstuvwxyz'[index]!,
      label: `${topic.id === snapshot.context.topicId ? '• ' : ''}${topic.title}`, close: true,
      run: () => { launch(host.context({ ...snapshot.context, topicId: topic.id }, snapshot.context.revision).then(() => host.jump(topic.point))); } }));
    choices.push({ key: 'n', label: 'Name this topic', unavailable: host.point() ? undefined : 'Choose a passage first', run: () => {
      const point = host.point(); if (!point) return;
      const id = crypto.randomUUID(); form('New topic', 'Topic name', '', title => host.context({ ...snapshot.context,
        topics: [...snapshot.context.topics, { id, title, point }], topicId: id }, snapshot.context.revision));
    } }, back());
    show('Topics', choices, body);
  }
  function orientation() {
    const snapshot = host.snapshot(); if (!snapshot) return;
    const body = element('div'); body.className = 'kp-chat-orientation';
    const topic = snapshot.context.topics.find(topic => topic.id === snapshot.context.topicId);
    for (const [name, value] of [['Branch', snapshot.branchTitle], ['Objective', snapshot.context.objective || 'No objective recorded.'],
      ['Topic', topic?.title ?? 'No topic selected.'], ['Return point', snapshot.context.returnPoint
        ? snapshot.branches.find(branch => branch.branchId === snapshot.context.returnPoint?.branchId)?.branchTitle ?? 'Saved passage' : 'No return point saved.']] as const) {
      const paragraph = element('p'), label = element('strong', `${name}: `); paragraph.append(label, value); body.append(paragraph);
    }
    show('Where am I?', [
      { key: 'e', label: 'Edit objective', run: () => form('Objective', 'What are we working toward?', snapshot.context.objective,
        objective => host.context({ ...snapshot.context, objective }, snapshot.context.revision), true) },
      { key: 'g', label: 'Topics', run: topics },
      { key: 'p', label: 'Save return point here', unavailable: host.point() ? undefined : 'Choose a passage first', run: () => { saveReturn(); } },
      { key: 'r', label: 'Go to return point', close: true, unavailable: snapshot.context.returnPoint ? undefined : 'No saved return point',
        run: () => { if (snapshot.context.returnPoint) launch(host.jump(snapshot.context.returnPoint)); } }, back()
    ], body);
  }
  function branches() {
    const snapshot = host.snapshot(); if (!snapshot) return;
    const choices = snapshot.branches.map((branch, index): ChatCommand => ({ key: '123456789abcdefg'[index]!, label: `${branch.branchId === snapshot.branchId ? '• ' : ''}${branch.branchTitle}`,
      unavailable: host.busy() || snapshot.pending ? 'Finish the current operation first' : undefined,
      run: () => {
        const epoch = menu.epoch();
        launch(host.branch({ kind: 'branch-switch', id: branch.branchId }).then(() => {
          if (menu.epoch() === epoch && menu.isOpen()) { menu.hide(false); host.read(); }
        }));
      } }));
    show('Branches', [...choices, back()], element('p', 'Each branch retains its own draft, notes and reading position.'));
  }
  function fork() {
    const point = host.point(); if (!point) return;
    const id = crypto.randomUUID(); form('Branch from this reply', 'Branch name', '', title => host.branch({ kind: 'branch-create', id, title, point }));
  }
  function search() {
    const body = element('form'), field = element('input'), status = element('p'); field.type = 'search'; field.value = lastSearch;
    field.setAttribute('aria-label', 'Search loaded conversation'); field.placeholder = 'Search loaded conversation'; field.maxLength = 200;
    status.setAttribute('role', 'status'); body.append(field, status);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const find = () => { lastSearch = field.value; const count = host.search(lastSearch); status.textContent = `${count}${count === 1000 ? '+' : ''} matches in loaded messages`; };
    field.oninput = () => { clearTimeout(timer); timer = setTimeout(find, 100); };
    body.onsubmit = event => { event.preventDefault(); clearTimeout(timer); find(); menu.hide(false); host.read(false); };
    show('Search', [back()], body, () => clearTimeout(timer)); field.focus(); field.select();
  }
  function help() {
    const body = element('dl'); body.className = 'kp-chat-keys';
    for (const [key, description] of [
      ['i · Esc', 'Resume the draft · save it and return to reading'], ['Ctrl/⌘ Enter', 'Send this message; save when editing a note'],
      ['h j k l · w b · 0 $ · gg G', 'Prose motions; v selects a passage'], ['[m · ]m · { · }', 'Previous/next message or paragraph'],
      ['Ctrl-d · Ctrl-u', 'Half-page down/up'], ['/ · n · N', 'Search loaded messages; repeat forward/backward'],
      ['C-c · Esc', 'Open commands · close commands and restore focus'], [':h · :w · :source', 'Help · save draft/note · toggle Markdown'],
      ['Markdown · notes', 'Separate editing buffers. Escape enters Normal; another Escape returns to reading.'],
      ['Ctrl/⌘ b · Ctrl/⌘ i · u · Ctrl-r', 'Bold · italic · undo · redo in editable prose'],
      ['Topics · branches', 'Topics mark passages; branches are independent continuations. Nothing sends automatically.']
    ]) body.append(element('dt', key), element('dd', description));
    show('Keybindings', [back()], body);
  }
  function commands(): ChatCommand[] {
    const s = host.snapshot(), target = host.selection(), point = host.point(), message = s?.messages.find(m => m.id === point?.messageId);
    const waiting = !s ? 'Loading conversation' : host.busy() ? 'Operation in progress' : host.branchChanged() ? 'Return to this branch first' : undefined;
    return [
      { key: 'i', label: 'Continue message', close: true, unavailable: !s ? 'Loading conversation' : undefined, run: host.compose },
      { key: 'c', label: 'Comment selection', close: true, unavailable: target ? waiting : 'Select a completed passage', run: () => { if (target) host.note(target); } },
      { key: 't', label: 'Tag selection', close: true, unavailable: target ? waiting : 'Select a completed passage', run: () => { if (target) host.note(target, true); } },
      { key: 'n', label: 'New note', close: true, unavailable: waiting, run: () => host.note() },
      { key: 'o', label: 'Open notes', close: true, run: host.notes },
      { key: 'm', label: host.isSource() ? 'Rich text' : 'Markdown source', close: true, unavailable: waiting, run: host.source },
      { key: '/', label: 'Search conversation', run: search },
      { key: 'g', label: 'Topics', unavailable: waiting, run: topics },
      { key: 'b', label: 'Branch here', unavailable: waiting ?? (s?.phase !== 'ready' ? 'Connect and finish this response' : !message?.turnId || message.role !== 'assistant' || !message.complete ? 'Choose a completed reply' : undefined), run: fork },
      { key: 's', label: 'Branches', unavailable: host.busy() ? 'Operation in progress' : undefined, run: branches },
      { key: 'w', label: 'Where am I?', unavailable: waiting, run: orientation },
      { key: 'p', label: 'Save return point', unavailable: waiting ?? (point ? undefined : 'Choose a passage first'), run: saveReturn },
      { key: 'r', label: 'Return to passage', close: true, unavailable: waiting ?? (s?.context.returnPoint ? undefined : 'No saved return point'), run: () => { if (s?.context.returnPoint) launch(host.jump(s.context.returnPoint)); } },
      { key: 'h', label: 'Keybindings', run: help },
      { key: 'S', label: 'Save draft', unavailable: waiting ?? (host.conflict() ? 'Resolve the draft conflict first' : undefined), run: host.save },
      { key: 'R', label: s?.threadId ? 'Resume conversation' : 'Connect', unavailable: waiting ?? (s && ['ready', 'running', 'sending', 'connecting'].includes(s.phase) ? 'Already connected' : undefined), run: () => { launch(host.act({ kind: 'connect' })); } },
      { key: 'x', label: 'Interrupt response', unavailable: waiting ?? (s?.phase === 'running' && s.pending?.turnId ? undefined : 'No response is running'), run: () => { launch(host.act({ kind: 'interrupt' })); } },
      { key: 'D', label: 'Disconnect', unavailable: waiting ?? (s?.phase === 'disconnected' ? 'Already disconnected' : undefined), run: () => { launch(host.act({ kind: 'disconnect' })); } },
      ...(s?.phase === 'uncertain' ? [{ key: 'a', label: 'I checked; keep draft unsent', unavailable: s.canAcknowledge ? waiting : 'Resume and inspect delivery first', run: () => { launch(host.act({ kind: 'acknowledge' })); } }] : []),
      ...(host.conflict() ? [{ key: 'L', label: 'Load saved draft', run: host.load }] : []),
      { key: 'q', label: 'Close chat', close: true, run: host.close }
    ];
  }
  function main() { show('Commands', commands()); }
  function ex() {
    form('Command', 'Chat command', '', async command => {
      switch (command.trim().replace(/^:/, '')) {
        case 'w': host.save(); break;
        case 'h': case 'help': help(); return false;
        case 'source': menu.hide(false); host.source(); return false;
        case 'notes': menu.hide(false); host.notes(); return false;
        case 'topics': topics(); return false;
        case 'where': orientation(); return false;
        default: throw new Error('Use :h, :w, :source, :notes, :topics or :where.');
      }
      return undefined;
    });
  }
  return { ...menu, main, help, search, ex, refresh: () => menu.update(commands()),
    repeat(direction: -1 | 1) { if (lastSearch) host.search(lastSearch, direction); } };
}
