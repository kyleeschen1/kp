import { createKpRational, type KpNormalizedRational } from '../../domains/math/exact-rational.ts';
import type { KpScalarValue } from './typed-semantic-math.ts';

/** Small exact-value reader shared by typography and arithmetic. Importing
 * coefficient formatting must not activate the row-operation checker. */
export function readExactRowValue(value: KpScalarValue): KpNormalizedRational | undefined {
  const e = value.expression;
  if (e.kind === 'constant' && Number.isSafeInteger(e.value)) return createKpRational(BigInt(e.value));
  if (e.kind === 'divide' && e.numerator.kind === 'constant' && e.denominator.kind === 'constant' &&
    Number.isSafeInteger(e.numerator.value) && Number.isSafeInteger(e.denominator.value) && e.denominator.value !== 0)
    return createKpRational(BigInt(e.numerator.value), BigInt(e.denominator.value));
  return undefined;
}
