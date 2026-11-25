import type { FieldMatch, MatchRange, Row, RowMatch } from './model.ts';

function folded(text: string) {
  let value = '', offset = 0;
  const offsets: MatchRange[] = [];
  // Case folding can expand a character. Map each folded unit back to the
  // original code point so highlights never split a surrogate pair.
  for (const character of text) {
    const lower = character.toLowerCase(); value += lower;
    for (let index = 0; index < lower.length; index++) offsets.push([offset, offset + character.length]);
    offset += character.length;
  }
  return { value, offsets };
}
function merge(ranges: readonly MatchRange[]): MatchRange[] {
  const result: MatchRange[] = [];
  for (const [from, to] of [...ranges].sort((a, b) => a[0] - b[0])) {
    const previous = result.at(-1);
    if (previous && from <= previous[1]) result[result.length - 1] = [previous[0], Math.max(previous[1], to)];
    else result.push([from, to]);
  }
  return result;
}
function matchField(text: string, term: string, fuzzy: boolean) {
  const { value, offsets } = folded(text), contiguous = value.indexOf(term);
  if (contiguous >= 0) return { score: value === term ? 0 : contiguous === 0 ? 1 : 2,
    ranges: merge(offsets.slice(contiguous, contiguous + term.length)) };
  if (!fuzzy) return undefined;
  let best: number[] | undefined;
  for (let start = 0; start < value.length; start++) {
    if (value[start] !== term[0]) continue;
    const positions: number[] = []; let next = start;
    for (const unit of term.split('')) {
      const index = value.indexOf(unit, next); if (index < 0) break;
      positions.push(index); next = index + 1;
    }
    if (positions.length === term.length && (!best || positions.at(-1)! - start < best.at(-1)! - best[0]!)) best = positions;
  }
  if (!best) return undefined;
  return { score: 3 + (best.at(-1)! - best[0]! + 1 - term.length) / Math.max(1, value.length),
    ranges: merge(best.map(index => offsets[index]!)) };
}

/** Every query term must match an explicitly searchable field. The returned
 * ranges are the actual winning matches, including otherwise hidden aliases. */
export function matchRows<T>(rows: readonly Row<T>[], query: string): RowMatch<T>[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return rows.flatMap(row => {
    let score = 0;
    const hits = new Map<string, MatchRange[]>();
    for (const term of terms) {
      let best: { field: string; score: number; ranges: MatchRange[] } | undefined;
      for (const [id, field] of Object.entries(row.fields)) {
        if (field.search === 'none') continue;
        const found = matchField(field.text, term, field.search === 'fuzzy'); if (!found) continue;
        const weighted = found.score + (field.display === 'hidden' ? .25 : field.display === 'primary' ? 0 : .1);
        if (!best || weighted < best.score) best = { field: id, score: weighted, ranges: found.ranges };
      }
      if (!best) return [];
      score += best.score; hits.set(best.field, [...hits.get(best.field) ?? [], ...best.ranges]);
    }
    const fields: FieldMatch[] = [...hits].map(([field, ranges]) => ({ field, ranges: merge(ranges) }));
    return [{ row, score, fields }];
  }).sort((a, b) => a.score - b.score);
}
