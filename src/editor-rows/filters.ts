import { available, unavailable, type CommandRegistry } from '../editor-commands/registry.ts';
import { matchesFacets, toggleFacet, type FacetGroup, type RowFilters, type RowMatch } from './model.ts';

/** The transient projects filter state. It never owns or rebuilds the query
 * editor; the host decides when to enter and leave this interaction mode. */
export function mountRowFilters<T>(host: HTMLElement, registry: CommandRegistry, prefix: string,
  groups: readonly FacetGroup[], changed: (filters: RowFilters) => void) {
  let filters: RowFilters = {};
  host.tabIndex = -1;
  const apply = (next: RowFilters) => {
    changed(next);
    // Registered actions briefly disable their buttons while running. Keep
    // keyboard ownership in the transient when the focused toggle disables.
    host.focus({ preventScroll: true });
  };
  const buttons: { group: FacetGroup; value: string; button: HTMLButtonElement; count: HTMLElement }[] = [];
  const ready = () => !host.hidden && host.isConnected ? available() : unavailable('Picker filters are closed');
  const toggle = registry.targeted<{ group: FacetGroup; value: string; only: boolean }>({
    id: `${prefix}.filter`, title: 'Toggle picker tag', category: 'Picker', scope: 'workspace',
    target: () => ({ found: false, reason: 'Choose a tag in the filter transient' }), state: ready,
    run: target => apply(target.only ? { ...filters, [target.group.id]: [target.value] } : toggleFacet(filters, target.group, target.value))
  });
  for (const group of groups) {
    const fieldset = document.createElement('fieldset'), legend = document.createElement('legend'); legend.textContent = group.label; fieldset.append(legend);
    for (const value of group.values) {
      const button = document.createElement('button'), key = document.createElement('kbd'), label = document.createElement('span'), count = document.createElement('small');
      button.type = 'button'; button.setAttribute('aria-label', value.label); key.textContent = value.key; label.textContent = value.label;
      button.append(key, label, count); toggle.bindTarget(button, { group, value: value.id, only: false });
      fieldset.append(button); buttons.push({ group, value: value.id, button, count });
    }
    host.append(fieldset);
  }
  const resetButton = document.createElement('button'); resetButton.type = 'button'; resetButton.textContent = 'r  Reset filters';
  const reset = registry.add({ id: `${prefix}.reset-filters`, title: 'Reset picker filters', category: 'Picker', scope: 'workspace', state: ready, run: () => apply({}) }); reset.bind(resetButton); host.append(resetButton);
  const hint = document.createElement('p'); hint.className = 'kp-vim-hint'; hint.textContent = 'Key: toggle · Shift + key: only that tag · q / Esc: return'; host.append(hint);
  return {
    update(next: RowFilters, matches: readonly RowMatch<T>[]) {
      filters = next;
      for (const { group, value, button, count } of buttons) {
        button.setAttribute('aria-pressed', String(!filters[group.id] || filters[group.id]!.includes(value)));
        count.textContent = String(matches.filter(match => matchesFacets(match.row, filters, group.id) && match.row.facets[group.id]?.includes(value)).length);
      }
    },
    key(key: string, only = false): boolean {
      if (key === 'r') { void reset.invoke(); return true; }
      for (const group of groups) {
        const value = group.values.find(value => value.key === key.toLowerCase());
        if (value) { void toggle.forTarget({ group, value: value.id, only }).execute(); return true; }
      }
      return false;
    },
    dispose() { toggle.dispose(); reset.dispose(); host.replaceChildren(); }
  };
}
