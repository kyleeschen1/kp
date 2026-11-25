import type { ChatAction, ChatContext, ChatSnapshot, ReadingPoint } from './protocol.ts';
import type { PassageTarget } from './annotations.ts';
import { mountTransient, type ChatCommand } from './transient.ts';
import { CommandRegistry, available, unavailable, target, type CommandHandle } from '../editor-commands/registry.ts';

export interface ChatCommandHost {
  snapshot(): ChatSnapshot | undefined; selection(): PassageTarget | null; point(): ReadingPoint | null;
  busy(): boolean; conflict(): boolean; branchChanged(): boolean; isSource(): boolean;
  captureOrigin(): void; restoreOrigin(): void; read(restore?: boolean): void; compose(): void; close(): void;
  note(target?: PassageTarget, tags?: boolean): void; notes(): void; source(): void; window(): void;
  save(): void; load(): void; act(action: ChatAction): Promise<void>;
  context(value: Omit<ChatContext, 'revision'>, revision: number): Promise<void>;
  branch(action: Extract<ChatAction, { kind: 'branch-create' | 'branch-switch' }>, point?: ReadingPoint): Promise<void>;
  jump(point: ReadingPoint): Promise<void>; search(query: string, direction?: -1 | 1): number;
}
const element = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => {
  const node = document.createElement(tag); if (text) node.textContent = text; return node;
};
export function mountChatCommands(panel: HTMLElement, host: ChatCommandHost, registry: CommandRegistry) {
  const menu = mountTransient(panel, host.restoreOrigin, registry);
  let lastSearch = '';
  // The host publishes failures in the conversation; event handlers must not
  // also create unhandled promise rejections. Forms retain their own input.
  const launch = (operation: Promise<unknown>) => { void operation.catch(() => {}); };
  function show(name: string, choices: ChatCommand[], body?: HTMLElement, cleanup?: () => void) {
    if (!menu.isOpen()) host.captureOrigin(); menu.show(name, choices, body, cleanup);
  }
  const back = (): ChatCommand => ({ key: 'Backspace', label: 'Commands', id: 'chat.commands', run: () => { void registry.invoke('chat.commands', { scope: 'chat' }); } });
  function form(name: string, label: string, value: string, submit: (value: string) => Promise<void | false>, multiline = false) {
    const body = element('form'), caption = element('label', label);
    const field = multiline ? element('textarea') : element('input'); field.value = value; field.setAttribute('aria-label', label); field.maxLength = multiline ? 4096 : 120;
    const save = element('button', 'Save'), error = element('p'); save.type = 'button'; error.setAttribute('role', 'status');
    caption.append(field); body.append(caption, save, error);
    let formCommand: CommandHandle | undefined, submitting = false;
    const submitForm = async () => { submitting = true;
      const epoch = menu.epoch();
      try { const result = await submit(field.value); if (result !== false && menu.epoch() === epoch && menu.isOpen()) { menu.hide(false); host.read(); } }
      catch (reason) { error.textContent = String(reason instanceof Error ? reason.message : reason); throw reason; }
      finally { submitting = false; }
    };
    body.onsubmit = event => { event.preventDefault(); void formCommand?.invoke({ scope: 'chat' }); };
    field.onkeydown = event => { if (event.key === 'Enter' && (!multiline || event.ctrlKey || event.metaKey)) { event.preventDefault(); body.requestSubmit(); } };
    show(name, [back()], body, () => formCommand?.dispose());
    formCommand = registry.add({ id: 'chat.form.submit', title: `Submit ${name}`, category: 'Chat form', scope: 'chat',
      state: () => submitting ? unavailable('Submitting form') : menu.isOpen() && body.isConnected ? available() : unavailable('Form is closed'), run: submitForm });
    formCommand.bind(save); field.focus(); field.select();
  }
  function saveReturn() {
    const snapshot = host.snapshot(), point = host.point(); if (!snapshot || !point) return;
    launch(host.context({ ...snapshot.context, returnPoint: point }, snapshot.context.revision));
  }
  function topics() {
    const snapshot = host.snapshot(); if (!snapshot) return;
    const body = element('p', 'Topics mark places in this conversation. They do not change what Codex knows.');
    const choices: ChatCommand[] = snapshot.context.topics.map((topic, index) => ({ key: '123456789abcdefghijklmopqrstuvwxyz'[index]!, id: 'chat.topic.select',
      label: `${topic.id === snapshot.context.topicId ? '• ' : ''}${topic.title}`, close: true,
      run: () => { void topicSelect.forTarget({ id: topic.id, branch: snapshot.branchId }, { scope: 'chat' }).execute(); } }));
    choices.push({ key: 'n', id: 'chat.topic.new', label: 'Name this topic', unavailable: host.point() ? undefined : 'Choose a passage first', run: () => { void registry.invoke('chat.topic.new', { scope: 'chat' }); } }, back());
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
      { key: 'e', id: 'chat.objective.edit', label: 'Edit objective', run: () => { void registry.invoke('chat.objective.edit', { scope: 'chat' }); } },
      { key: 'g', id: 'chat.topics', label: 'Topics', run: () => { void registry.invoke('chat.topics', { scope: 'chat' }); } },
      { key: 'p', id: 'chat.save-return-point', label: 'Save return point here', unavailable: host.point() ? undefined : 'Choose a passage first', run: () => { void registry.invoke('chat.save-return-point', { scope: 'chat' }); } },
      { key: 'r', id: 'chat.return-to-passage', label: 'Go to return point', close: true, unavailable: snapshot.context.returnPoint ? undefined : 'No saved return point',
        run: () => { void registry.invoke('chat.return-to-passage', { scope: 'chat' }); } }, back()
    ], body);
  }
  function branches() {
    const snapshot = host.snapshot(); if (!snapshot) return;
    const choices = snapshot.branches.map((branch, index): ChatCommand => ({ key: '123456789abcdefg'[index]!, id: 'chat.branch.select', label: `${branch.branchId === snapshot.branchId ? '• ' : ''}${branch.branchTitle}`,
      unavailable: host.busy() || snapshot.pending ? 'Finish the current operation first' : undefined,
      run: () => { void branchSelect.forTarget(branch.branchId, { scope: 'chat' }).execute(); } }));
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
      ['i · Esc', 'Focus the permanent draft · save and return to transcript navigation'], ['Ctrl/⌘ Enter', 'Send this message; save when editing a note'],
      ['h j k l · w b · 0 $ · gg G', 'Prose motions; v selects a passage'], ['[m · ]m · { · }', 'Previous/next message or paragraph'],
      ['za · zo · zc', 'Toggle · open · close the current or next code/tool block. Search reveals folded matches.'],
      ['Ctrl-d · Ctrl-u', 'Half-page down/up in transcript Normal mode'], ['Ctrl-` · C-c W', 'Switch between KP and chat windows'], ['/ · n · N', 'Search loaded messages; repeat forward/backward'],
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
      { key: 'W', label: 'Switch window', close: true, run: host.window },
      { key: 'S', label: 'Save draft', unavailable: waiting ?? (host.conflict() ? 'Resolve the draft conflict first' : undefined), run: host.save },
      { key: 'R', label: s?.threadId ? 'Resume conversation' : 'Connect', unavailable: waiting ?? (s && ['ready', 'running', 'sending', 'connecting'].includes(s.phase) ? 'Already connected' : undefined), run: () => { launch(host.act({ kind: 'connect' })); } },
      { key: 'x', label: 'Interrupt response', unavailable: waiting ?? (s?.phase === 'running' && s.pending?.turnId ? undefined : 'No response is running'), run: () => { launch(host.act({ kind: 'interrupt' })); } },
      { key: 'D', label: 'Disconnect', unavailable: waiting ?? (s?.phase === 'disconnected' ? 'Already disconnected' : undefined), run: () => { launch(host.act({ kind: 'disconnect' })); } },
      ...(s?.phase === 'uncertain' ? [{ key: 'a', label: 'I checked; keep draft unsent', unavailable: s.canAcknowledge ? waiting : 'Resume and inspect delivery first', run: () => { launch(host.act({ kind: 'acknowledge' })); } }] : []),
      ...(host.conflict() ? [{ key: 'L', label: 'Load saved draft', run: host.load }] : []),
      { key: 'q', label: 'Close chat', close: true, run: host.close }
    ];
  }
  const catalog = [
    ['i', 'compose', 'Continue message'], ['c', 'comment-selection', 'Comment selection'], ['t', 'tag-selection', 'Tag selection'],
    ['n', 'new-note', 'New note'], ['o', 'open-notes', 'Open notes'], ['m', 'toggle-source', 'Toggle Markdown source'],
    ['/', 'search', 'Search conversation'], ['g', 'topics', 'Topics'], ['b', 'branch-here', 'Branch here'], ['s', 'branches', 'Switch branch'],
    ['w', 'orientation', 'Where am I?'], ['p', 'save-return-point', 'Save return point'], ['r', 'return-to-passage', 'Return to passage'],
    ['h', 'help', 'Chat keybindings'], ['W', 'switch-window', 'Switch window'], ['S', 'save-draft', 'Save draft'],
    ['R', 'connect', 'Connect or resume conversation'], ['x', 'interrupt', 'Interrupt response'], ['D', 'disconnect', 'Disconnect'],
    ['a', 'acknowledge', 'Keep draft unsent after inspection'], ['L', 'load-saved', 'Load saved draft'], ['q', 'close', 'Close chat']
  ] as const;
  const handles = new Map(catalog.map(([key, id, title]) => [key as string, registry.targeted({ id: `chat.${id}`, title, category: 'Chat', scope: 'chat', keys: [`C-c ${key}`],
    target: () => { const command = commands().find(value => value.key === key); return command ? target({ command, branch: host.snapshot()?.branchId }) : { found: false, reason: 'Not applicable in this conversation' }; },
    state: ({ branch }) => {
      if (branch !== host.snapshot()?.branchId) return unavailable('The conversation branch changed; reopen Commands');
      const command = commands().find(value => value.key === key);
      return !command ? unavailable('Not applicable in this conversation') : command.unavailable ? unavailable(command.unavailable) : available();
    }, run: ({ command }) => { if (command.close) menu.hide(false); command.run(); }
  })]));
  function registeredCommands(): ChatCommand[] {
    return commands().map(command => ({ ...command, id: handles.get(command.key)!.id, run: () => { void handles.get(command.key)?.invoke({ scope: 'chat' }); } }));
  }
  const mainCommand = registry.add({ id: 'chat.commands', title: 'Chat command menu', category: 'Chat', scope: 'chat', keys: ['C-c'], run: main });
  const topicSelect = registry.targeted({ id: 'chat.topic.select', title: 'Select topic', category: 'Chat', scope: 'chat',
    target: () => ({ found: false, reason: 'Choose a topic from Topics' }),
    state: (value: { id: string; branch: string }) => value.branch === host.snapshot()?.branchId && host.snapshot()?.context.topics.some(topic => topic.id === value.id) ? available() : unavailable('Topic is no longer available'),
    run: async value => { const snapshot = host.snapshot(), topic = snapshot?.context.topics.find(topic => topic.id === value.id); if (snapshot && topic) { await host.context({ ...snapshot.context, topicId: topic.id }, snapshot.context.revision); await host.jump(topic.point); } } });
  const branchSelect = registry.targeted({ id: 'chat.branch.select', title: 'Select branch', category: 'Chat', scope: 'chat',
    target: () => ({ found: false, reason: 'Choose a branch from Switch branch' }),
    state: (id: string) => host.busy() || host.snapshot()?.pending ? unavailable('Finish the current operation first') : host.snapshot()?.branches.some(branch => branch.branchId === id) ? available() : unavailable('Branch is no longer available'),
    run: async id => { const epoch = menu.epoch(); await host.branch({ kind: 'branch-switch', id }); if (menu.epoch() === epoch && menu.isOpen()) { menu.hide(false); host.read(); } } });
  const topicNew = registry.add({ id: 'chat.topic.new', title: 'Name this topic', category: 'Chat', scope: 'chat', state: () => host.point() ? available() : unavailable('Choose a passage first'), run: () => {
    const snapshot = host.snapshot(), point = host.point(); if (!snapshot || !point) return;
    const id = crypto.randomUUID(); form('New topic', 'Topic name', '', title => host.context({ ...snapshot.context, topics: [...snapshot.context.topics, { id, title, point }], topicId: id }, snapshot.context.revision));
  } });
  const objective = registry.add({ id: 'chat.objective.edit', title: 'Edit objective', category: 'Chat', scope: 'chat', state: () => host.snapshot() ? available() : unavailable('Loading conversation'), run: () => {
    const snapshot = host.snapshot(); if (snapshot) form('Objective', 'What are we working toward?', snapshot.context.objective, objective => host.context({ ...snapshot.context, objective }, snapshot.context.revision), true);
  } });
  function main() { show('Commands', registeredCommands()); }
  function ex() {
    form('Command', 'Chat command', '', async command => {
      switch (command.trim().replace(/^:/, '')) {
        case 'w': await registry.invoke('chat.save-draft', { scope: 'chat' }); break;
        case 'h': case 'help': await registry.invoke('chat.help', { scope: 'chat' }); return false;
        case 'source': menu.hide(false); await registry.invoke('chat.toggle-source', { scope: 'chat' }); return false;
        case 'notes': menu.hide(false); await registry.invoke('chat.open-notes', { scope: 'chat' }); return false;
        case 'topics': await registry.invoke('chat.topics', { scope: 'chat' }); return false;
        case 'where': await registry.invoke('chat.orientation', { scope: 'chat' }); return false;
        default: throw new Error('Use :h, :w, :source, :notes, :topics or :where.');
      }
      return undefined;
    });
  }
  return { ...menu, main, help, search, ex, refresh: () => { menu.update(registeredCommands()); registry.notify(); },
    dispose() { handles.forEach(handle => handle.dispose()); [mainCommand, topicSelect, branchSelect, topicNew, objective].forEach(handle => handle.dispose()); menu.dispose(); },
    repeat(direction: -1 | 1) { if (lastSearch) host.search(lastSearch, direction); } };
}
