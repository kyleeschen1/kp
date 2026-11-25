/** A row is a projection. Resource ownership and command execution stay outside
 * the matcher and renderer; neither is reconstructed from displayed text. */
export interface RowField {
  text: string;
  display: 'primary' | 'secondary' | 'annotation' | 'hidden';
  search: 'fuzzy' | 'literal' | 'none';
  label?: string;
}
export interface Row<T> {
  id: string;
  resource: T;
  fields: Readonly<Record<string, RowField>>;
  facets: Readonly<Record<string, readonly string[]>>;
  actions: readonly string[];
}
export type MatchRange = readonly [from: number, to: number];
export interface FieldMatch { field: string; ranges: readonly MatchRange[] }
export interface RowMatch<T> { row: Row<T>; score: number; fields: readonly FieldMatch[] }
export interface FacetGroup { id: string; label: string; values: readonly { id: string; label: string; key: string }[] }
// Absent groups are unrestricted; an explicit empty group matches nothing.
export type RowFilters = Readonly<Record<string, readonly string[]>>;
export type RowOrder = { by: 'relevance' } | { by: 'field' | 'facet'; id: string };

export function matchesFacets(row: Row<unknown>, filters: RowFilters, except?: string): boolean {
  return Object.entries(filters).every(([group, values]) => group === except || values.some(value => row.facets[group]?.includes(value)));
}
export function toggleFacet(filters: RowFilters, group: FacetGroup, value: string): RowFilters {
  if (!group.values.some(option => option.id === value)) return filters;
  const selected = filters[group.id] ?? group.values.map(option => option.id);
  return { ...filters, [group.id]: selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value] };
}
export function orderRows<T>(matches: readonly RowMatch<T>[], order: RowOrder): RowMatch<T>[] {
  const key = (row: Row<T>) => order.by === 'field' ? row.fields[order.id]?.text ?? ''
    : order.by === 'facet' ? row.facets[order.id]?.join(' · ') ?? '' : '';
  return matches.map((match, index) => ({ match, index })).sort((a, b) =>
    (order.by === 'relevance' ? 0 : key(a.match.row).localeCompare(key(b.match.row)))
    || a.match.score - b.match.score || a.index - b.index).map(value => value.match);
}
export const retainRow = <T>(matches: readonly RowMatch<T>[], id?: string): string | undefined =>
  matches.some(match => match.row.id === id) ? id : matches[0]?.row.id;
