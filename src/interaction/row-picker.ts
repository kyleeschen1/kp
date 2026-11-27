import type { Row } from '../editor-rows/model.ts';
import { toggleFacet, type FacetGroup } from '../editor-rows/model.ts';
import { renderRow } from '../editor-rows/render.ts';
import { createRowPickerSession, type RowPickerActions } from './row-picker-session.ts';

export interface RowPickerOptions<T> extends RowPickerActions<T> {
  readonly id: string;
  readonly label: string;
  readonly rows: () => readonly Row<T>[];
  readonly facets?: readonly FacetGroup[];
  readonly report?: (message: string) => void;
}

/** A small DOM adapter over the headless session. It deliberately owns no
 * notebook, editor state, global shortcut, storage or application command. */
export function mountRowPicker<T>(host: HTMLElement, options: RowPickerOptions<T>) {
  if (!/^[a-zA-Z][\w-]*$/.test(options.id)) throw new Error('Use a picker id beginning with a letter and containing letters, digits, _ or -.');
  const doc = host.ownerDocument;
  if (doc.getElementById(options.id)) throw new Error(`Picker already mounted: ${options.id}`);
  const session = createRowPickerSession(options);
  const dialog = doc.createElement('dialog'); dialog.id = options.id; dialog.className = 'kp-row-picker';
  dialog.setAttribute('aria-label', options.label);
  const query = doc.createElement('input'); query.type = 'text'; query.autocomplete = 'off'; query.spellcheck = false;
  query.setAttribute('aria-label', `Search ${options.label}`); query.setAttribute('role', 'combobox');
  query.setAttribute('aria-autocomplete', 'list'); query.setAttribute('aria-expanded', 'false');
  const controls = doc.createElement('div'); controls.className = 'kp-row-picker-controls';
  const filtersButton = doc.createElement('button'); filtersButton.type = 'button'; filtersButton.textContent = 'Tags'; filtersButton.setAttribute('aria-expanded', 'false');
  const closeButton = doc.createElement('button'); closeButton.type = 'button'; closeButton.textContent = 'Close';
  controls.append(filtersButton, closeButton);
  const filters = doc.createElement('div'); filters.className = 'kp-row-picker-filters'; filters.hidden = true;
  const filterButtons: { group: FacetGroup; value: string; button: HTMLButtonElement }[] = [];
  for (const group of options.facets ?? []) {
    const fieldset = doc.createElement('fieldset'), legend = doc.createElement('legend'); legend.textContent = group.label; fieldset.append(legend);
    for (const value of group.values) {
      const button = doc.createElement('button'); button.type = 'button'; button.textContent = value.label;
      button.onclick = () => session.filter(toggleFacet(session.snapshot().filters, group, value.id));
      filterButtons.push({ group, value: value.id, button }); fieldset.append(button);
    }
    filters.append(fieldset);
  }
  filtersButton.hidden = filterButtons.length === 0;
  const list = doc.createElement('div'); list.id = `${options.id}-results`; list.className = 'kp-row-picker-results'; list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', `${options.label} results`); query.setAttribute('aria-controls', list.id);
  const notice = doc.createElement('p'); notice.className = 'kp-row-picker-notice'; notice.setAttribute('role', 'status');
  dialog.append(query, controls, filters, list, notice); host.append(dialog);
  let returnFocus: HTMLElement | undefined, disposed = false, composing = false, generation = 0;
  const hideFilters = () => { filters.hidden = true; filtersButton.setAttribute('aria-expanded', 'false'); };
  const restoreFocus = () => { const previous = returnFocus; returnFocus = undefined; if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  const render = () => {
    const current = session.snapshot(); query.setAttribute('aria-expanded', String(current.open));
    if (!current.open) {
      if (dialog.open) dialog.close(); list.replaceChildren(); query.value = ''; query.removeAttribute('aria-activedescendant'); hideFilters(); restoreFocus(); return;
    }
    list.replaceChildren();
    for (const [index, match] of current.visible.entries()) {
      const row = renderRow(match), state = session.state(match.row); row.id = `${options.id}-row-${current.offset + index}`;
      row.setAttribute('aria-selected', String(match.row.id === current.selected)); row.setAttribute('aria-disabled', String(!state.enabled));
      row.setAttribute('aria-posinset', String(current.offset + index + 1)); row.setAttribute('aria-setsize', String(current.total));
      if (!state.enabled) row.title = state.reason;
      if (match.row.id === current.selected) query.setAttribute('aria-activedescendant', row.id);
      row.onmousedown = event => event.preventDefault(); row.onclick = () => { session.select(match.row.id); void accept(); }; list.append(row);
    }
    if (!current.selected) query.removeAttribute('aria-activedescendant');
    for (const { group, value, button } of filterButtons) button.setAttribute('aria-pressed', String(!current.filters[group.id] || current.filters[group.id]!.includes(value)));
    notice.textContent = current.total ? `${current.offset + 1}–${current.offset + current.visible.length} of ${current.total} · ↑ ↓ navigate · Enter choose · Esc close` : 'No matching rows';
  };
  const accept = async () => {
    const current = generation;
    const result = await session.accept();
    if (!result.ok && !disposed && current === generation) { notice.textContent = result.reason; options.report?.(result.reason); }
  };
  const toggleFilters = () => { filters.hidden = !filters.hidden; filtersButton.setAttribute('aria-expanded', String(!filters.hidden)); if (filters.hidden) query.focus(); else filterButtons[0]?.button.focus(); };
  const unsubscribe = session.subscribe(render);
  query.oninput = () => session.query(query.value);
  query.addEventListener('compositionstart', () => { composing = true; });
  query.addEventListener('compositionend', () => { composing = false; });
  filtersButton.onclick = toggleFilters;
  closeButton.onclick = () => session.close();
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (!composing) session.close(); });
  // Native close events are queued. An event from the previous opening must
  // not close a picker that the command immediately reopened.
  dialog.addEventListener('close', () => { if (!dialog.open && session.snapshot().open) session.close(); });
  dialog.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); session.close(); }
    else if (event.ctrlKey && !event.metaKey && event.key === 'h' && filterButtons.length) { event.preventDefault(); toggleFilters(); }
    else if (!filters.hidden && event.key === 'q' && event.target !== query) { event.preventDefault(); hideFilters(); query.focus(); }
    else if (event.target === query) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); session.move(event.key === 'ArrowDown' ? 1 : -1); }
      else if (event.key === 'PageDown' || event.key === 'PageUp') { event.preventDefault(); session.move((options.maxVisible ?? 5) * (event.key === 'PageDown' ? 1 : -1)); }
      else if (event.key === 'Enter') { event.preventDefault(); void accept(); }
    }
  });
  return {
    open() {
      if (disposed) throw new Error('The picker owner has closed.');
      if (dialog.open) { query.focus(); return; }
      const previous = doc.activeElement; generation++;
      returnFocus = previous instanceof HTMLElement ? previous : undefined;
      session.open(options.rows()); dialog.showModal(); query.focus();
    },
    close: () => session.close(),
    refresh: () => session.refresh(),
    snapshot: session.snapshot,
    dispose() { if (disposed) return; disposed = true; generation++; session.dispose(); unsubscribe(); dialog.remove(); }
  };
}
