import type { EditorView } from 'prosemirror-view';
import { matchFruits, type FruitMatch } from './fruit-matches.ts';
import { mountPickerQuery } from './picker-query.ts';
import { setVimMode, vimKey } from './vim.ts';

/** One reversible exemplar. The host restores its own editors; fruit selection
 * and DOM geometry never become notebook content or a Codex conversation. */
export function mountFruitPicker(root: HTMLElement, actions: HTMLElement, captureReturn: () => () => void) {
  const launcher = document.createElement('button'); launcher.type = 'button'; launcher.textContent = 'Picker';
  launcher.setAttribute('aria-controls', 'kp-fruit-picker'); launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-expanded', 'false'); launcher.dataset['workspaceCommand'] = '';
  const dialog = document.createElement('dialog'); dialog.id = 'kp-fruit-picker'; dialog.className = 'kp-fruit-picker';
  dialog.setAttribute('aria-label', 'Fruit picker');
  const input = document.createElement('div'); input.className = 'kp-picker-query';
  const list = document.createElement('ul'); list.id = 'kp-fruit-results'; list.className = 'kp-picker-results';
  list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', 'Matching fruits'); list.hidden = true;
  const empty = document.createElement('p'); empty.className = 'kp-picker-empty'; empty.textContent = 'No matches'; empty.hidden = true;
  const announcement = document.createElement('span'); announcement.className = 'kp-picker-announcement';
  announcement.setAttribute('role', 'status'); announcement.setAttribute('aria-atomic', 'true');
  const chosen = document.createElement('output'); chosen.className = 'kp-picker-chosen'; chosen.hidden = true;
  chosen.setAttribute('aria-label', 'Picker selection'); chosen.setAttribute('role', 'status');
  actions.append(launcher, chosen); dialog.append(input, list, empty, announcement); root.append(dialog);
  let query: EditorView | undefined, matches: readonly FruitMatch[] = [], selected: FruitMatch | undefined;
  let restore: (() => void) | undefined, disposed = false;
  const rows = new Map<string, HTMLLIElement>();
  function select(value: FruitMatch | undefined) {
    selected = value;
    for (const [id, row] of rows) row.setAttribute('aria-selected', String(id === value?.id));
    if (value) query?.dom.setAttribute('aria-activedescendant', `kp-${value.id}`);
    else query?.dom.removeAttribute('aria-activedescendant');
  }
  function render(text: string) {
    matches = matchFruits(text); rows.clear(); list.replaceChildren();
    for (const match of matches) {
      const row = document.createElement('li'); row.id = `kp-${match.id}`; row.setAttribute('role', 'option');
      row.setAttribute('aria-label', match.label); row.dataset['fruitId'] = match.id;
      const positions = new Set(match.positions);
      for (let index = 0; index < match.label.length; index++) {
        const character = match.label[index]!;
        if (positions.has(index)) { const mark = document.createElement('mark'); mark.textContent = character; row.append(mark); }
        else row.append(document.createTextNode(character));
      }
      row.onmousedown = event => event.preventDefault();
      row.onclick = () => { select(match); accept(); };
      rows.set(match.id, row); list.append(row);
    }
    list.hidden = matches.length === 0; empty.hidden = !text.trim() || matches.length > 0;
    query?.dom.setAttribute('aria-expanded', String(matches.length > 0));
    announcement.textContent = text.trim() ? matches.length ? `${matches.length} suggestions shown` : 'No matches' : '';
    select(matches[0]);
  }
  function close(returnFocus = true) {
    if (!dialog.open) return;
    dialog.close(); query?.destroy(); query = undefined; input.replaceChildren(); render('');
    launcher.setAttribute('aria-expanded', 'false');
    const resume = restore; restore = undefined;
    if (returnFocus) resume?.();
  }
  function accept() {
    if (!selected || query?.composing) return;
    chosen.textContent = `Selected: ${selected.label}`; chosen.hidden = false; close();
  }
  function move(delta: number) {
    if (!matches.length) return;
    const index = matches.findIndex(match => match.id === selected?.id);
    select(matches[Math.max(0, Math.min(matches.length - 1, index + delta))]);
    if (selected) rows.get(selected.id)?.scrollIntoView({ block: 'nearest' });
  }
  function open() {
    if (disposed || dialog.open || document.querySelector('dialog[open]')) return;
    restore = captureReturn(); chosen.hidden = true;
    query = mountPickerQuery(input, render); render(''); dialog.showModal(); query.focus();
    launcher.setAttribute('aria-expanded', 'true');
  }
  // Preserve the editor's focus on pointer invocation. Keyboard invocation uses
  // the active pane's own restoration callback, not a detached DOM range.
  launcher.onmousedown = event => event.preventDefault(); launcher.onclick = open;
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (!query?.composing) close(); });
  dialog.addEventListener('keydown', event => {
    if (event.isComposing || query?.composing) return;
    const plain = !event.ctrlKey && !event.metaKey && !event.altKey;
    const normal = query && vimKey.getState(query.state) === 'normal';
    let handled = true;
    if (event.key === 'Escape') close();
    else if (event.key === 'Enter') accept();
    else if (event.ctrlKey && !event.altKey && !event.metaKey && event.key === '[' && query) setVimMode('normal')(query.state, query.dispatch);
    else if (event.key === 'ArrowDown' || (event.ctrlKey && event.key === 'n') || (plain && normal && event.key === 'j')) move(1);
    else if (event.key === 'ArrowUp' || (event.ctrlKey && event.key === 'p') || (plain && normal && event.key === 'k')) move(-1);
    else handled = false;
    if (handled) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  return { dispose() { disposed = true; close(false); dialog.remove(); launcher.remove(); chosen.remove(); } };
}
