import referenceText from '../../vendor/vim-9.2.0000/index.txt?raw';
import licenseText from '../../vendor/vim-9.2.0000/LICENSE?raw';
import { parseVimReference, vimReference } from '../editor-commands/vim-reference.ts';
import { detectVimSurface, statuses, surfaces, workspaceBindings, type VimSurface } from '../editor-commands/vim-coverage.ts';
import { vimFacetGroups, vimRows, type VimRowResource } from '../editor-commands/vim-rows.ts';
import { available, unavailable, type CommandOrigin, type CommandRegistry } from '../editor-commands/registry.ts';
import { matchesFacets, orderRows, retainRow, type RowFilters, type RowMatch, type RowOrder } from '../editor-rows/model.ts';
import { matchRows } from '../editor-rows/matching.ts';
import { renderRow } from '../editor-rows/render.ts';
import { mountRowFilters } from '../editor-rows/filters.ts';
import { mountPickerQuery } from './picker-query.ts';
import { setVimMode, vimKey } from './vim.ts';

const entries = [...workspaceBindings, ...parseVimReference(referenceText)];
const preferences: { filters: RowFilters; order: RowOrder } = { filters: {}, order: { by: 'relevance' } };
const make = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => { const element = document.createElement(tag); if (text) element.textContent = text; return element; };
const link = (title: string, href: string) => { const node = make('a', title); node.href = href; node.target = '_blank'; node.rel = 'noopener'; return node; };
const windowSize = 5;

export function renderVimCoverage(host: HTMLElement, origin: CommandOrigin, registry: CommandRegistry) {
  const toolbar = make('div'); toolbar.className = 'kp-vim-toolbar';
  const surfaceSelect = make('select'); surfaceSelect.setAttribute('aria-label', 'Editor surface');
  for (const [id, label] of Object.entries(surfaces)) { const option = make('option', label); option.value = id; surfaceSelect.append(option); }
  let surface: VimSurface = detectVimSurface(origin.element, origin.scope); surfaceSelect.value = surface;
  const platform = /Mac|iPhone|iPad/.test(navigator.platform) ? 'mac' : 'other';
  let rows = vimRows(entries, surface, platform), searched = matchRows(rows, ''), matches: RowMatch<VimRowResource>[] = [];
  let mode: 'results' | 'filters' | 'details' | 'reference' = 'results', selected: string | undefined, offset = 0, disposed = false;
  const queryHost = make('div'); queryHost.className = 'kp-picker-query';
  const list = make('div'); list.className = 'kp-vim-results'; list.id = 'kp-vim-results'; list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', 'Vim binding checklist');
  const filterHost = make('div'); filterHost.className = 'kp-row-filters'; filterHost.hidden = true; filterHost.setAttribute('role', 'region'); filterHost.setAttribute('aria-label', 'Vim filters');
  const detailHost = make('div'); detailHost.className = 'kp-vim-details'; detailHost.hidden = true; detailHost.tabIndex = 0; detailHost.setAttribute('role', 'region'); detailHost.setAttribute('aria-label', 'Binding details');
  const referenceHost = make('div'); referenceHost.className = 'kp-vim-details'; referenceHost.hidden = true; referenceHost.tabIndex = 0;
  const footer = make('div'); footer.className = 'kp-vim-footer';
  const count = make('span'); count.setAttribute('role', 'status'); count.setAttribute('aria-label', 'Binding results');
  const active = make('p'); active.className = 'kp-vim-active-filters'; active.setAttribute('aria-label', 'Active filters');
  const hint = make('span', '↑↓ move · Enter details · C-h / F2 filters'); hint.className = 'kp-vim-hint';
  const controls: { dispose(): void }[] = [];
  function action(parent: HTMLElement, id: string, label: string, run: () => void, enabled = () => true, text = label) {
    const button = make('button', text); button.type = 'button'; button.setAttribute('aria-label', label);
    const command = registry.add({ id: `workspace.vim-coverage.${id}`, title: label, category: 'Picker', scope: 'workspace',
      state: () => !disposed && enabled() ? available() : unavailable('No applicable picker result'), run });
    command.bind(button); parent.append(button); controls.push(command); return command;
  }
  toolbar.append(surfaceSelect);
  const filterAction = action(toolbar, 'filters', 'Filters · C-h', () => changeMode(mode === 'filters' ? 'results' : 'filters'));
  const inspectAction = action(toolbar, 'inspect', 'Details', inspect, () => Boolean(selected));
  action(toolbar, 'reference', 'Reference', () => changeMode('reference'));
  const paging = make('span'); paging.className = 'kp-vim-paging';
  action(paging, 'previous', 'Previous rows', () => { move(-windowSize); query.focus(); }, () => mode === 'results' && matches.findIndex(match => match.row.id === selected) > 0, '‹');
  action(paging, 'next', 'Next rows', () => { move(windowSize); query.focus(); }, () => mode === 'results' && matches.findIndex(match => match.row.id === selected) < matches.length - 1, '›');
  const backButton = make('div'); backButton.className = 'kp-vim-back'; backButton.hidden = true;
  action(backButton, 'back', 'q  Back to results', () => changeMode('results'));
  const orderSelect = make('select'); orderSelect.setAttribute('aria-label', 'Sort bindings');
  const orders: readonly { value: string; label: string; order: RowOrder }[] = [
    { value: 'relevance', label: 'Relevance', order: { by: 'relevance' } }, { value: 'keys', label: 'Keys', order: { by: 'field', id: 'keys' } },
    ...vimFacetGroups.map(group => ({ value: group.id, label: group.label, order: { by: 'facet' as const, id: group.id } }))
  ];
  for (const choice of orders) { const option = make('option', `Sort: ${choice.label}`); option.value = choice.value; orderSelect.append(option); }
  orderSelect.value = preferences.order.by === 'relevance' ? 'relevance' : preferences.order.id;
  orderSelect.onchange = () => { const choice = orders.find(choice => choice.value === orderSelect.value); if (choice) { preferences.order = choice.order; draw(); } };
  filterHost.append(orderSelect);
  const filters = mountRowFilters<VimRowResource>(filterHost, registry, 'workspace.vim-coverage', vimFacetGroups, next => { preferences.filters = next; draw(); });
  referenceHost.append(make('p', `Vim ${vimReference.version} · ${entries.length - workspaceBindings.length} reference forms + ${workspaceBindings.length} KP extensions`),
    make('p', Object.values(statuses).map(status => `${status.mark} ${status.label}`).join(' · ')),
    make('p', 'Checks describe support, not live availability. Counts, registers and composition have separate entries. Plugins and script functions are outside this index. Shared forms appear once; Visual rows describe differences. Unverified does not mean implemented.'),
    make('p', 'Tags describe reference forms, independently of support. Operators are also operations. Multiple tags in a group are alternatives; different groups combine. Shift + a tag key selects only that tag. Empty groups give zero results. Reset restores all tags.'),
    link('Pinned Vim index', vimReference.url), make('p', `SHA-256: ${vimReference.sha256}`), make('pre', licenseText));
  footer.append(count, paging, hint); host.append(toolbar, queryHost, list, filterHost, detailHost, referenceHost, backButton, active, footer);
  const query = mountPickerQuery(queryHost, text => { searched = matchRows(rows, text); draw(); }, { label: 'Search Vim bindings', list: list.id, surface: 'Vim bindings › query' });
  queryHost.dataset['empty'] = 'true';
  surfaceSelect.onchange = () => {
    const choice = Object.keys(surfaces).find(id => id === surfaceSelect.value);
    if (choice && isSurface(choice)) { surface = choice; rows = vimRows(entries, surface, platform); searched = matchRows(rows, query.state.doc.textContent); draw(); if (mode === 'details') inspect(); }
  };
  const selectedMatch = () => matches.find(match => match.row.id === selected);
  function paint() {
    list.replaceChildren(); const current = matches.findIndex(match => match.row.id === selected);
    offset = Math.max(0, Math.min(offset, Math.max(0, matches.length - windowSize)));
    if (current < offset) offset = Math.max(0, current); else if (current >= offset + windowSize) offset = current - windowSize + 1;
    for (const match of matches.slice(offset, offset + windowSize)) {
      const row = renderRow(match); row.id = `kp-vim-row-${encodeURIComponent(match.row.id)}`;
      row.dataset['bindingTag'] = match.row.resource.entry.tag; row.dataset['support'] = match.row.resource.support.status;
      row.setAttribute('aria-selected', String(match.row.id === selected)); row.setAttribute('aria-posinset', String(matches.indexOf(match) + 1)); row.setAttribute('aria-setsize', String(matches.length));
      row.onmousedown = event => event.preventDefault(); row.onclick = () => { selected = match.row.id; paint(); void inspectAction.invoke(); }; list.append(row);
    }
    if (!matches.length) list.append(make('p', 'No matching rows. C-h opens filters; r resets them.'));
    query.dom.setAttribute('aria-expanded', String(mode === 'results' && Boolean(matches.length)));
    if (selected && mode === 'results') query.dom.setAttribute('aria-activedescendant', `kp-vim-row-${encodeURIComponent(selected)}`); else query.dom.removeAttribute('aria-activedescendant');
    if (mode === 'results') list.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' });
    count.textContent = `${matches.length} matching bindings${matches.length ? ` · ${offset + 1}–${Math.min(offset + windowSize, matches.length)}` : ''}`;
    registry.notify();
  }
  function draw() {
    matches = orderRows(searched.filter(match => matchesFacets(match.row, preferences.filters)), preferences.order);
    selected = retainRow(matches, selected); queryHost.dataset['empty'] = String(!query.state.doc.textContent);
    filters.update(preferences.filters, searched);
    const descriptions = vimFacetGroups.flatMap(group => {
      const values = preferences.filters[group.id];
      return !values || values.length === group.values.length ? [] : [`${group.label}: ${values.length ? group.values.filter(value => values.includes(value.id)).map(value => value.label).join(' / ') : 'none'}`];
    });
    active.textContent = descriptions.length ? descriptions.join(' · ') : 'All tags'; paint();
  }
  function changeMode(next: typeof mode) {
    mode = next; list.hidden = next !== 'results'; filterHost.hidden = next !== 'filters'; detailHost.hidden = next !== 'details'; referenceHost.hidden = next !== 'reference'; backButton.hidden = next === 'results'; queryHost.inert = next !== 'results'; paging.hidden = next !== 'results';
    hint.textContent = next === 'results' ? '↑↓ move · Enter details · C-h / F2 filters' : 'q / Esc: back · C-h / F2: filters';
    paint();
    if (next === 'results') query.focus(); else (next === 'filters' ? filterHost.querySelector<HTMLElement>('button') : next === 'details' ? detailHost : referenceHost)?.focus({ preventScroll: true });
  }
  function inspect() {
    const match = selectedMatch(); if (!match) return;
    const { entry, support } = match.row.resource; detailHost.replaceChildren();
    detailHost.append(make('strong', entry.keys), make('p', entry.description), make('p', `${statuses[support.status].mark} ${statuses[support.status].label} · ${surfaces[surface]}`),
      make('p', support.note), make('p', `Tags: ${Object.entries(match.row.facets).map(([group, values]) => `${group}: ${values.join(', ')}`).join(' · ')}`),
      make('p', `Evidence: ${support.evidence.join(' · ')}`));
    if (entry.examples.length) detailHost.append(make('p', `Examples: ${entry.examples.join(' · ')}`));
    if (entry.line) detailHost.append(link('Reference entry', `${vimReference.url}#L${entry.line}`));
    changeMode('details');
  }
  function move(delta: number) {
    const index = matches.findIndex(match => match.row.id === selected); selected = matches[Math.max(0, Math.min(matches.length - 1, index + delta))]?.row.id; paint();
  }
  list.addEventListener('wheel', event => { if (event.deltaY && matches.length > windowSize) { event.preventDefault(); move(Math.sign(event.deltaY)); } }, { passive: false });
  draw(); query.focus();
  return {
    handleKey(event: KeyboardEvent): boolean {
      if (event.isComposing || query.composing) return false;
      const plain = !event.ctrlKey && !event.metaKey && !event.altKey, key = event.key.toLowerCase();
      if ((event.ctrlKey && !event.metaKey && !event.altKey && key === 'h') || event.key === 'F2') { void filterAction.invoke(); return true; }
      if (mode !== 'results') {
        if (event.key === 'Escape' || (plain && key === 'q')) { changeMode('results'); return true; }
        if (mode === 'filters' && plain && !(event.target instanceof HTMLSelectElement)) return filters.key(key, event.shiftKey) || event.key.length === 1;
        return false;
      }
      if (!query.dom.contains(event.target instanceof Node ? event.target : null)) return false;
      const normal = vimKey.getState(query.state) === 'normal';
      if (event.ctrlKey && !event.metaKey && !event.altKey && event.key === '[') { setVimMode('normal')(query.state, query.dispatch); return true; }
      if (event.key === 'Enter') { void inspectAction.invoke(); return true; }
      if (event.key === 'ArrowDown' || (event.ctrlKey && key === 'n') || (plain && normal && key === 'j')) { move(1); return true; }
      if (event.key === 'ArrowUp' || (event.ctrlKey && key === 'p') || (plain && normal && key === 'k')) { move(-1); return true; }
      if (event.key === 'PageDown' || (normal && event.ctrlKey && key === 'd')) { move(windowSize); return true; }
      if (event.key === 'PageUp' || (normal && event.ctrlKey && key === 'u')) { move(-windowSize); return true; }
      return false;
    },
    back() { if (mode === 'results') return false; changeMode('results'); return true; },
    dispose() { disposed = true; filters.dispose(); controls.forEach(control => control.dispose()); query.destroy(); host.replaceChildren(); }
  };
}
function isSurface(value: string): value is VimSurface { return Object.hasOwn(surfaces, value); }
