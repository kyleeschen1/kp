import { Repair } from './source.ts';

/** Shared presentation admission for file sources and identity-bearing notebook
 * bindings. Check every intermediate, not just a finite final result. */
export function assertMatrixColumnNumerals(left: readonly (readonly number[])[], right: readonly (readonly number[])[]) {
  if (left.length !== 2 || right.length !== 2 || [...left, ...right].some(row => row.length !== 2))
    throw new Repair('matrix.shape', '$', 'Use two by two numerical matrices.');
  const paint = ([['left', left], ['right', right]] as const).flatMap(([factor, rows]) => rows.flatMap((row, r) =>
    row.map((value, c) => ({ value, path: `$.${factor}[${r}][${c}]` }))));
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    const terms = [0, 1].map(k => {
      const term = left[r]![k]! * right[k]![c]!;
      if (!Number.isFinite(term)) throw new Repair('matrix.numeric-range', `$.right[${k}][${c}]`, `Use a coefficient whose product with left[${r}][${k}] remains finite.`);
      paint.push({ value: term, path: `$.right[${k}][${c}]` }); return term;
    });
    if (!Number.isFinite(terms[0]! + terms[1]!))
      throw new Repair('matrix.numeric-range', `$.left[${r}]`, `Use coefficients whose sum for result row ${r}, column ${c} remains finite.`);
    paint.push({ value: terms[0]! + terms[1]!, path: `$.left[${r}]` });
  }
  for (const entry of paint) {
    if (!Number.isFinite(entry.value)) throw new Repair('matrix.numeric-range', entry.path, 'Use finite numerical entries.');
    if (String(entry.value).includes('e')) throw new Repair('matrix.numeric-notation', entry.path,
      'Use factors whose entries, products and sums render as ordinary decimal numerals; scientific notation is not supported by this animation.');
  }
}
