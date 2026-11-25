import { EditorView as CodeView } from '@codemirror/view';
import { getCM } from '@replit/codemirror-vim';
import type { EditorView } from 'prosemirror-view';
import { vimKey } from './vim.ts';
import type { LineMode } from './numbers.ts';
import { CommandRegistry, available, unavailable, target } from '../editor-commands/registry.ts';

const exCommands = [
  { names: ['h', 'help'], description: 'Open searchable keyboard help', action: 'help' },
  { names: ['w', 'write'], description: 'Save the local draft; does not run it', action: 'save' },
  { names: ['q', 'quit'], description: 'Close source buffer, or return to reading; retains draft', action: 'close' },
  { names: ['wq'], description: 'Save successfully, then close', action: 'saveClose' },
  { names: ['run'], description: 'Validate source and update its animation', action: 'run' }
] as const;
export const bindings = [
  ['Document', 'i / a / I / A', 'Insert here / after / at text-block start / end'],
  ['Document', 'Esc', 'Normal mode'], ['Document', 'h j k l · w b', 'Move by character, visible line or basic word'],
  ['Document', '0 / $ · gg / G', 'Text-block start/end; document start/end'],
  ['Document', 'o', 'Add content block and insert'], ['Document', 'v · d / x', 'Visual selection; delete selection'],
  ['Document', 'x · u · Ctrl-r', 'Delete character; undo; redo'],
  ['Document', 'Tab / Shift-Tab', 'Nest / outdent block'], ['Document', 'Alt-↑ / Alt-↓', 'Move block'],
  ['Document', 'Cmd/Ctrl-b / Cmd/Ctrl-i', 'Bold / italic'], ['Both', 'Cmd/Ctrl-z / Cmd/Ctrl-Shift-z', 'Shared document undo / redo'],
  ['JSON', 'i / Esc · h j k l · w b · gg / G', 'CodeMirror Vim insertion and navigation'],
  ['JSON', 'counts · d / c / y + motion · p', 'CodeMirror Vim operators and paste'],
  ['JSON', '/ / ? · n / N', 'CodeMirror Vim search forward/backward and repeat'],
  ['JSON', 'Shift-Enter', 'Run this animation source'], ['JSON', 'Cmd/Ctrl-Enter', 'Close buffer, retaining draft'],
  ['Inline source', 'Enter / Tab / Esc', 'Finish link/math source and return to prose; ordinary text-input keys apply'],
  ['Windows', 'Ctrl-`', 'Switch KP and chat windows without losing either position'],
  ['Workspace', 'Alt-x · Ctrl-x Ctrl-x', 'Search commands for the originating pane; Escape cancels'],
  ['Picker', '↑ / ↓ · Ctrl-p / Ctrl-n · Normal k / j', 'Previous / next fruit suggestion'],
  ['Picker', 'Enter / Esc · Ctrl-[ / i', 'Choose / cancel picker; Normal / Insert query editing'],
  ['Chat', 'i / Esc', 'Focus the permanent draft / save and return to transcript navigation'],
  ['Chat', 'C-c · :h', 'Commands / keybindings; Escape restores the invoking selection'],
  ['Chat', '[m / ]m · { / } · / · n / N', 'Messages / paragraphs / search and repeat in loaded output'],
  ['Chat', 'Cmd/Ctrl-Enter', 'Send only from the composer; save from a note'],
  ['Chat', ':w / :source', 'Save / Markdown source; CodeMirror Vim in source'],
  ...exCommands.map(command => ['Both', `:${command.names.join(' / :')}`, command.description]),
  ['Both', ':set number / :set nonumber', 'Show absolute line numbers / hide them'],
  ['Both', ':set relativenumber', 'Show relative line numbers around the cursor']
];
export function mountCommands(host: HTMLElement, view: EditorView, actions: {
  save: () => Promise<void>; close: () => void; run: () => void; numbers: (mode: LineMode) => void; message: (text: string) => void;
}, registry: CommandRegistry) {
  const panel = document.createElement('aside'); panel.className = 'fn-side-panel fn-help'; panel.hidden = true; panel.setAttribute('aria-label', 'Keyboard help');
  const title = document.createElement('h2'); title.textContent = 'Keyboard help';
  const search = document.createElement('input'); search.type = 'search'; search.setAttribute('aria-label', 'Search keybindings');
  const close = document.createElement('button'); close.textContent = 'Close help';
  const scope = document.createElement('p'), list = document.createElement('div');
  panel.append(title, close, scope, search, list); host.append(panel);
  const bar = document.createElement('form'); bar.className = 'fn-command-bar'; bar.hidden = true;
  const input = document.createElement('input'); input.setAttribute('aria-label', 'Ex command'); input.autocomplete = 'off'; input.spellcheck = false;
  const prefix = document.createElement('span'); prefix.textContent = ':'; bar.append(prefix, input); host.append(bar);
  let previous: HTMLElement | null = null, source = false;
  const restore = () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); else view.focus(); };
  const draw = () => {
    list.replaceChildren(); const query = search.value.toLowerCase();
    for (const [where, keys, description] of bindings) {
      if (!`${where} ${keys} ${description}`.toLowerCase().includes(query)) continue;
      const row = document.createElement('p'), key = document.createElement('code'); key.textContent = keys ?? '';
      row.append(key, document.createTextNode(` — ${description} (${where})`)); list.append(row);
    }
    for (const command of registry.descriptions()) {
      if (!`${command.title} ${command.category} ${command.id} ${command.keys?.join(' ') ?? ''}`.toLowerCase().includes(query)) continue;
      const row = document.createElement('p'), name = document.createElement('code'); name.textContent = command.title;
      row.append(name, ` — ${command.category}${command.keys?.length ? ` (${command.keys.join(' · ')})` : ' · M-x'}`); list.append(row);
    }
  };
  const help = () => { panel.hidden = false; scope.textContent = `Active buffer: ${source ? 'animation JSON' : 'rich document'}. Prose has a bounded Vim subset; JSON uses CodeMirror Vim. Listed Ex commands are workspace commands; other Ex commands are not enabled.`; draw(); search.focus(); };
  search.oninput = draw;
  const handles = [
    registry.add({ id: 'notebook.save', title: 'Save notebook draft', category: 'Notebook', scope: 'notebook', keys: [':w'], run: actions.save }),
    registry.add({ id: 'notebook.close-buffer', title: 'Close current notebook buffer', category: 'Notebook', scope: 'notebook', keys: [':q'], run: actions.close }),
    registry.add({ id: 'notebook.save-close', title: 'Save and close notebook buffer', category: 'Notebook', scope: 'notebook', keys: [':wq'], run: async () => {
      const saved = await registry.invoke('notebook.save', { scope: 'notebook' }); if (saved.ok) await registry.invoke('notebook.close-buffer', { scope: 'notebook' });
    } }),
    registry.add({ id: 'workspace.close-help', title: 'Close keyboard help', category: 'Workspace', scope: 'workspace',
      state: () => panel.hidden ? unavailable('Help is closed') : available(), run: () => { panel.hidden = true; restore(); } })
  ]; handles[3]!.bind(close);
  let lineMode: LineMode = 'off';
  const numbers = registry.targeted({ id: 'notebook.line-numbers', title: 'Toggle line numbers', category: 'Notebook', scope: 'notebook', keywords: ['number', 'nonumber', 'relativenumber'],
    target: () => target<LineMode>(lineMode === 'off' ? 'absolute' : 'off'), state: () => available(lineMode !== 'off'), run: (mode: LineMode) => { lineMode = mode; actions.numbers(mode); } });
  const onKey = (event: KeyboardEvent) => {
    // Chat editors and open dialogs own their command scope.
    if (event.target instanceof Element && event.target.closest('.kp-chat, dialog[open]')) return;
    if (event.key === 'Escape' && (!bar.hidden || !panel.hidden)) { event.preventDefault(); event.stopPropagation(); bar.hidden = true; panel.hidden = true; restore(); return; }
    if (event.key !== ':' || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    const code = target && CodeView.findFromDOM(target), cm = code && getCM(code);
    if (cm ? cm.state.vim?.insertMode : !target || !view.dom.contains(target) || target.matches('input,textarea') || vimKey.getState(view.state) === 'insert') return;
    event.preventDefault(); event.stopPropagation(); previous = target; source = !!cm; bar.hidden = false; input.value = ''; input.focus();
  };
  bar.onsubmit = event => {
    event.preventDefault(); const value = input.value.trim().replace(/^:/, '');
    const command = exCommands.find(item => item.names.some(name => name === value));
    bar.hidden = true; restore();
    void (async () => {
      try {
        const origin = { scope: 'notebook' as const, element: previous };
        if (command) {
          const id = { help: 'workspace.help', save: 'notebook.save', close: 'notebook.close-buffer', saveClose: 'notebook.save-close', run: 'animation.run' }[command.action];
          await registry.invoke(id, origin);
        }
        if (value === 'set number') await numbers.forTarget('absolute', origin).execute();
        else if (value === 'set nonumber') await numbers.forTarget('off', origin).execute();
        else if (value === 'set relativenumber') await numbers.forTarget('relative', origin).execute();
        else if (!command) throw new Error(`Unknown command: ${value}. Use :h for available commands.`);
      } catch (error) { actions.message(error instanceof Error ? error.message : String(error)); }
    })();
  };
  document.addEventListener('keydown', onKey, true);
  return { help() { previous = document.activeElement instanceof HTMLElement ? document.activeElement : null; source = !!previous && !!CodeView.findFromDOM(previous); help(); }, dispose() { handles.forEach(handle => handle.dispose()); numbers.dispose(); document.removeEventListener('keydown', onKey, true); panel.remove(); bar.remove(); } };
}
