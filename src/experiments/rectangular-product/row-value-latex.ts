import { readExactRowValue } from '../../math/row-exact-value.ts';
import type { KpScalarValue } from '../../math/typed-semantic-math.ts';

export function rowValueLatex(value: KpScalarValue, absolute = false) {
  const q = readExactRowValue(value);
  if (!q) throw new Error(`Expected exact scalar: ${value.id}`);
  const negative = q.numerator < 0n, magnitude = negative ? -q.numerator : q.numerator;
  return `${negative && !absolute ? '-' : ''}${q.denominator === 1n ? magnitude : `\\frac{${magnitude}}{${q.denominator}}`}`;
}
