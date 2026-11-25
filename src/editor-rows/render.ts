import type { MatchRange, RowMatch } from './model.ts';

export function appendMatchedText(host: HTMLElement, text: string, ranges: readonly MatchRange[]) {
  let offset = 0;
  for (const [from, to] of ranges) {
    host.append(text.slice(offset, from)); const mark = document.createElement('mark'); mark.textContent = text.slice(from, to); host.append(mark); offset = to;
  }
  host.append(text.slice(offset));
}
export function renderRow<T>(match: RowMatch<T>): HTMLElement {
  const row = document.createElement('div'); row.className = 'kp-result-row'; row.dataset['rowId'] = match.row.id;
  row.setAttribute('role', 'option');
  const spoken: string[] = [];
  for (const [id, field] of Object.entries(match.row.fields)) {
    const hits = match.fields.find(value => value.field === id)?.ranges ?? [];
    if (field.display === 'hidden' && !hits.length) continue;
    const cell = document.createElement('span'); cell.className = `kp-row-${field.display}`; cell.dataset['rowField'] = id;
    if (field.display === 'hidden') cell.append(`${field.label ?? 'Matched'}: `);
    appendMatchedText(cell, field.text, hits); row.append(cell); spoken.push(field.text);
  }
  row.setAttribute('aria-label', spoken.join(' · '));
  return row;
}
