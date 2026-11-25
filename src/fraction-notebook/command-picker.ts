import type { EditorView } from 'prosemirror-view';
import { CommandRegistry, type CommandOrigin, type PreparedCommand } from '../editor-commands/registry.ts';
import { matchCommands, commandMatchPositions } from '../editor-commands/matching.ts';
import { CommandShortcut } from '../editor-commands/shortcut.ts';
import { mountPickerQuery } from './picker-query.ts';
import { setVimMode, vimKey } from './vim.ts';
import './command-picker.css';

export function mountCommandPicker(root: HTMLElement, actions: HTMLElement, registry: CommandRegistry,
  capture: () => { origin: CommandOrigin; restore(): void }) {
  const launcher = document.createElement('button'); launcher.type = 'button'; launcher.textContent = 'Commands';
  launcher.dataset['workspaceCommand'] = ''; launcher.setAttribute('aria-haspopup', 'dialog'); launcher.setAttribute('aria-controls', 'kp-command-picker');
  const dialog = document.createElement('dialog'); dialog.id = 'kp-command-picker'; dialog.className = 'kp-fruit-picker kp-command-picker';
  dialog.setAttribute('aria-label', 'Commands');
  const input = document.createElement('div'); input.className = 'kp-picker-query';
  const list = document.createElement('ul'); list.id = 'kp-command-results'; list.className = 'kp-picker-results';
  list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', 'Matching commands');
  const empty = document.createElement('p'); empty.className = 'kp-picker-empty'; empty.textContent = 'No matching commands'; empty.hidden = true;
  const notice = document.createElement('p'); notice.className = 'kp-picker-announcement'; notice.setAttribute('role', 'status');
  dialog.append(input, list, empty, notice); root.append(dialog); actions.append(launcher);
  const shortcut = new CommandShortcut();
  let query: EditorView | undefined, origin: ReturnType<typeof capture> | undefined;
  let commands: readonly PreparedCommand[] = [], matches: readonly PreparedCommand[] = [], chosen: string | undefined;
  let prefixTimer: ReturnType<typeof setTimeout> | undefined;
  const rows = new Map<string, HTMLElement>();
  function select(id?: string, scroll = false) {
    chosen = id;
    for (const [key, row] of rows) row.setAttribute('aria-selected', String(key === id));
    if (id) query?.dom.setAttribute('aria-activedescendant', `kp-command-${id}`); else query?.dom.removeAttribute('aria-activedescendant');
    if (scroll && id) rows.get(id)?.scrollIntoView({ block: 'nearest' });
  }
  function render(text: string, retain = false) {
    const previous = retain ? chosen : undefined, scroll = retain ? list.scrollTop : 0;
    matches = matchCommands(text.trim() ? commands : commands.filter(command => command.id !== 'workspace.commands'), text, registry.recent()); rows.clear(); list.replaceChildren();
    input.dataset['empty'] = String(!text);
    for (const command of matches) {
      const row = document.createElement('li'); row.id = `kp-command-${command.id}`; row.dataset['commandId'] = command.id; row.setAttribute('role', 'option');
      const title = document.createElement('span'); title.className = 'kp-command-name';
      const positions = commandMatchPositions(command.title, text);
      for (let index = 0; index < command.title.length; index++) {
        if (positions.has(index)) { const mark = document.createElement('mark'); mark.textContent = command.title[index]!; title.append(mark); }
        else title.append(command.title[index]!);
      }
      const keys = document.createElement('kbd'); keys.textContent = command.keys?.join(' · ') ?? '';
      const annotation = document.createElement('small'), state = command.state();
      annotation.textContent = `${command.category}${!state.enabled ? ` · ${state.reason}` : 'checked' in state ? state.checked ? ' · On' : ' · Off' : ''}`;
      row.setAttribute('aria-disabled', String(!state.enabled)); row.setAttribute('aria-label', command.title);
      row.setAttribute('aria-description', annotation.textContent); row.title = state.enabled ? command.description ?? annotation.textContent : state.reason;
      row.append(title, keys, annotation); row.onmousedown = event => event.preventDefault(); row.onclick = () => { select(command.id); accept(); };
      list.append(row); rows.set(command.id, row);
    }
    list.hidden = !matches.length; empty.hidden = Boolean(matches.length); query?.dom.setAttribute('aria-expanded', String(Boolean(matches.length)));
    select(matches.some(command => command.id === previous) ? previous : matches[0]?.id); list.scrollTop = scroll;
    notice.textContent = `${matches.length} commands. ${origin?.origin.scope ?? 'Workspace'} context.`;
  }
  function resetPrefix() { shortcut.reset(); clearTimeout(prefixTimer); delete root.dataset['commandPrefix']; }
  function close(restore = true) {
    if (!dialog.open) return;
    dialog.close(); query?.destroy(); query = undefined; input.replaceChildren(); list.replaceChildren(); rows.clear(); commands = []; matches = [];
    launcher.setAttribute('aria-expanded', 'false'); const saved = origin; origin = undefined;
    if (restore) saved?.restore();
  }
  function accept() {
    const command = matches.find(value => value.id === chosen); if (!command || query?.composing) return;
    const state = command.state(); if (!state.enabled) { notice.textContent = state.reason; return; }
    // Close and restore first: an action may itself open a form or focus a new pane.
    close(); void command.execute();
  }
  function open() {
    resetPrefix(); if (dialog.open) { query?.focus(); return; }
    if (document.querySelector('dialog[open]')) return;
    origin = capture(); commands = registry.snapshot(origin.origin);
    query = mountPickerQuery(input, render, { label: 'Search commands', list: list.id, surface: 'Commands › query' });
    render(''); dialog.showModal(); query.focus(); launcher.setAttribute('aria-expanded', 'true');
  }
  const command = registry.add({ id: 'workspace.commands', title: 'Execute command', category: 'Workspace', scope: 'workspace',
    keywords: ['M-x', 'palette', 'actions'], keys: ['Alt-x', 'Ctrl-x Ctrl-x'], run: open }); command.bind(launcher);
  const onKey = (event: KeyboardEvent) => {
    if (document.querySelector('dialog[open]') && !dialog.open) { resetPrefix(); return; }
    const action = shortcut.next(event, performance.now());
    if (action === 'pass') { if (!['Control', 'Alt', 'Meta', 'Shift'].includes(event.key)) resetPrefix(); return; }
    event.preventDefault(); event.stopImmediatePropagation();
    if (action === 'open') open();
    else { root.dataset['commandPrefix'] = 'C-x …'; clearTimeout(prefixTimer); prefixTimer = setTimeout(resetPrefix, 1800); }
  };
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (!query?.composing) close(); });
  dialog.addEventListener('keydown', event => {
    if (event.isComposing || query?.composing) return;
    const plain = !event.ctrlKey && !event.metaKey && !event.altKey, normal = query && vimKey.getState(query.state) === 'normal';
    let delta = 0, handled = true;
    if (event.key === 'Escape') close();
    else if (event.key === 'Enter') accept();
    else if (event.ctrlKey && !event.metaKey && !event.altKey && event.key === '[' && query) setVimMode('normal')(query.state, query.dispatch);
    else if (event.key === 'ArrowDown' || (event.ctrlKey && event.key === 'n') || (plain && normal && event.key === 'j')) delta = 1;
    else if (event.key === 'ArrowUp' || (event.ctrlKey && event.key === 'p') || (plain && normal && event.key === 'k')) delta = -1;
    else if (event.key === 'PageDown' || (normal && event.ctrlKey && event.key === 'd')) delta = 5;
    else if (event.key === 'PageUp' || (normal && event.ctrlKey && event.key === 'u')) delta = -5;
    else handled = false;
    if (delta && matches.length) { const index = matches.findIndex(value => value.id === chosen); select(matches[Math.max(0, Math.min(matches.length - 1, index + delta))]?.id, true); }
    if (handled) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  const unsubscribe = registry.subscribe(() => { if (dialog.open && query) render(query.state.doc.textContent, true); });
  document.addEventListener('keydown', onKey, true); document.addEventListener('pointerdown', resetPrefix, true);
  document.addEventListener('focusin', resetPrefix, true); document.addEventListener('compositionstart', resetPrefix, true); window.addEventListener('blur', resetPrefix);
  return { open, dispose() { close(false); resetPrefix(); unsubscribe(); command.dispose(); dialog.remove(); launcher.remove();
    document.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', resetPrefix, true);
    document.removeEventListener('focusin', resetPrefix, true); document.removeEventListener('compositionstart', resetPrefix, true); window.removeEventListener('blur', resetPrefix); } };
}
