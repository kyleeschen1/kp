import { available, type Availability, type CommandResult } from '../editor-commands/registry.ts';
import { matchRows } from '../editor-rows/matching.ts';
import { matchesFacets, retainRow, type Row, type RowFilters, type RowMatch } from '../editor-rows/model.ts';

export interface RowPickerSnapshot<T> {
  readonly open: boolean;
  readonly query: string;
  readonly filters: RowFilters;
  readonly total: number;
  readonly selected: string | undefined;
  readonly offset: number;
  readonly visible: readonly RowMatch<T>[];
}
export interface RowPickerActions<T> {
  readonly maxVisible?: number;
  readonly state?: (row: Row<T>) => Availability;
  readonly execute: (row: Row<T>) => CommandResult | Promise<CommandResult>;
}

/** Rows retain their resources. Querying and navigation never reconstruct an
 * invocation from display text or the host's subsequently changed selection. */
export function createRowPickerSession<T>(actions: RowPickerActions<T>) {
  const maxVisible = actions.maxVisible ?? 5;
  if (!Number.isSafeInteger(maxVisible) || maxVisible < 1 || maxVisible > 50)
    throw new Error('A picker shows between 1 and 50 rows at a time.');
  let rows: readonly Row<T>[] = [], matches: readonly RowMatch<T>[] = [];
  let open = false, disposed = false, query = '', filters: RowFilters = {}, selected: string | undefined, offset = 0;
  const listeners = new Set<() => void>();
  const notify = () => { for (const listener of listeners) listener(); };
  const snapshot = (): RowPickerSnapshot<T> => ({ open, query, filters, total: matches.length, selected, offset, visible: matches.slice(offset, offset + maxVisible) });
  const positionWindow = () => {
    const position = matches.findIndex(match => match.row.id === selected);
    if (position < offset) offset = Math.max(0, position);
    else if (position >= offset + maxVisible) offset = position - maxVisible + 1;
    offset = Math.min(offset, Math.max(0, matches.length - maxVisible));
  };
  const refresh = () => {
    matches = matchRows(rows, query).filter(match => matchesFacets(match.row, filters));
    selected = retainRow(matches, selected); positionWindow(); notify();
  };
  const close = () => {
    if (!open) return;
    open = false; rows = []; matches = []; query = ''; filters = {}; selected = undefined; offset = 0; notify();
  };
  const state = (row: Row<T>) => actions.state?.(row) ?? available();
  return {
    snapshot, state,
    open(next: readonly Row<T>[]) {
      if (disposed) throw new Error('The picker owner has closed.');
      const ids = new Set<string>();
      for (const row of next) {
        if (!row.id.trim() || ids.has(row.id)) throw new Error('Picker rows need unique nonempty identities.');
        ids.add(row.id);
      }
      rows = [...next]; open = true; query = ''; filters = {}; selected = undefined; offset = 0; refresh();
    },
    close,
    query(value: string) { if (open && !disposed) { query = value; refresh(); } },
    filter(value: RowFilters) {
      if (!open || disposed) return;
      filters = Object.fromEntries(Object.entries(value).map(([key, values]) => [key, [...values]])); refresh();
    },
    move(delta: number) {
      if (!open || disposed || !Number.isSafeInteger(delta) || !matches.length) return;
      const previous = matches.findIndex(match => match.row.id === selected);
      selected = matches[Math.max(0, Math.min(matches.length - 1, previous + delta))]?.row.id;
      positionWindow(); notify();
    },
    select(id: string) {
      if (!open || disposed || !matches.some(match => match.row.id === id)) return;
      selected = id; positionWindow(); notify();
    },
    refresh() { if (open && !disposed) refresh(); },
    async accept(): Promise<CommandResult> {
      if (!open || disposed) return { ok: false, reason: 'Picker is closed' };
      const row = matches.find(match => match.row.id === selected)?.row;
      if (!row) return { ok: false, reason: 'No matching row' };
      const readiness = state(row);
      if (!readiness.enabled) return { ok: false, reason: readiness.reason };
      // Release modal focus before executing: the command may open another
      // surface. An old asynchronous result cannot close a newly opened picker.
      close();
      try { return await actions.execute(row); }
      catch (error) { return { ok: false, reason: error instanceof Error ? error.message : String(error) }; }
    },
    subscribe(listener: () => void) {
      if (disposed) throw new Error('The picker owner has closed.');
      listeners.add(listener); return () => { listeners.delete(listener); };
    },
    dispose() { if (disposed) return; disposed = true; close(); listeners.clear(); }
  };
}
export type RowPickerSession<T> = ReturnType<typeof createRowPickerSession<T>>;
