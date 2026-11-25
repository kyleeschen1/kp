export const fruits = [
  'Apple', 'Apricot', 'Avocado', 'Banana', 'Blackberry', 'Blueberry', 'Cherry',
  'Clementine', 'Coconut', 'Cranberry', 'Date', 'Dragon fruit', 'Fig', 'Grape',
  'Grapefruit', 'Guava', 'Kiwi', 'Lemon', 'Lime', 'Lychee', 'Mango', 'Melon',
  'Nectarine', 'Orange', 'Papaya', 'Passion fruit', 'Peach', 'Pear', 'Persimmon',
  'Pineapple', 'Plum', 'Pomegranate', 'Raspberry', 'Strawberry', 'Tangerine', 'Watermelon'
].map(label => ({ id: `fruit.${label.toLowerCase().replaceAll(' ', '-')}`, label }));

export interface FruitMatch { readonly id: string; readonly label: string; readonly positions: readonly number[] }
export const fruitResultLimit = 5;

/** Small, deterministic demo matcher. The catalogue search intentionally limits
 * distant subsequences; this picker instead accepts ordered characters and
 * retains their positions so emphasis always agrees with the actual match. */
export function matchFruits(query: string): readonly FruitMatch[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return fruits.flatMap((fruit, order) => {
    const label = fruit.label.toLowerCase();
    let positions: number[] | undefined;
    for (let start = 0; start < label.length; start++) {
      if (label[start] !== needle[0]) continue;
      const candidate: number[] = []; let next = start;
      for (const character of needle) {
        const found = label.indexOf(character, next);
        if (found < 0) break;
        candidate.push(found); next = found + 1;
      }
      if (candidate.length !== needle.length) continue;
      if (!positions || candidate.at(-1)! - candidate[0]! < positions.at(-1)! - positions[0]!) positions = candidate;
    }
    if (!positions) return [];
    const gaps = positions.at(-1)! - positions[0]! + 1 - needle.length;
    const rank = label === needle ? 0 : label.startsWith(needle) ? 1 : gaps === 0 ? 2 : 3;
    return [{ ...fruit, positions, rank, gaps, order }];
  }).sort((a, b) => a.rank - b.rank || a.gaps - b.gaps || a.order - b.order)
    .slice(0, fruitResultLimit).map(({ id, label, positions }) => ({ id, label, positions }));
}
