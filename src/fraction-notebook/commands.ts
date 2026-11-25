import { EditorView as CodeView } from '@codemirror/view';
import { getCM } from '@replit/codemirror-vim';
import type { EditorView } from 'prosemirror-view';
import { vimKey } from './vim.ts';
import type { LineMode } from './numbers.ts';

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
}) {
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
  };
  const help = () => { panel.hidden = false; scope.textContent = `Active buffer: ${source ? 'animation JSON' : 'rich document'}. Prose has a bounded Vim subset; JSON uses CodeMirror Vim. Listed Ex commands are workspace commands; other Ex commands are not enabled.`; draw(); search.focus(); };
  search.oninput = draw; close.onclick = () => { panel.hidden = true; restore(); };
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
        if (command?.action === 'help') return help();
        if (command?.action === 'save' || command?.action === 'saveClose') await actions.save();
        if (command?.action === 'close' || command?.action === 'saveClose') actions.close();
        if (command?.action === 'run') actions.run();
        if (value === 'set number') actions.numbers('absolute');
        else if (value === 'set nonumber') actions.numbers('off');
        else if (value === 'set relativenumber') actions.numbers('relative');
        else if (!command) throw new Error(`Unknown command: ${value}. Use :h for available commands.`);
      } catch (error) { actions.message(error instanceof Error ? error.message : String(error)); }
    })();
  };
  document.addEventListener('keydown', onKey, true);
  return { help() { previous = document.activeElement instanceof HTMLElement ? document.activeElement : null; source = !!previous && !!CodeView.findFromDOM(previous); help(); }, dispose() { document.removeEventListener('keydown', onKey, true); panel.remove(); bar.remove(); } };
}
