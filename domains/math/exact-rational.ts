export interface KpNormalizedRational {
  readonly numerator: bigint;
  readonly denominator: bigint;
}

export function createKpRational(
  numerator: bigint,
  denominator: bigint = 1n
): KpNormalizedRational {
  if (denominator === 0n) {
    throw new RangeError("Exact rational denominator cannot be zero.");
  }
  const sign = denominator < 0n ? -1n : 1n;
  const signedNumerator = numerator * sign;
  const positiveDenominator = denominator * sign;
  const divisor = greatestCommonDivisor(
    absolute(signedNumerator),
    positiveDenominator
  );
  return Object.freeze({
    numerator: signedNumerator / divisor,
    denominator: positiveDenominator / divisor
  });
}

export function addKpRationals(
  left: KpNormalizedRational,
  right: KpNormalizedRational
): KpNormalizedRational {
  return createKpRational(
    left.numerator * right.denominator +
      right.numerator * left.denominator,
    left.denominator * right.denominator
  );
}

export function subtractKpRationals(
  left: KpNormalizedRational,
  right: KpNormalizedRational
): KpNormalizedRational {
  return addKpRationals(left, negateKpRational(right));
}

export function multiplyKpRationals(
  left: KpNormalizedRational,
  right: KpNormalizedRational
): KpNormalizedRational {
  return createKpRational(
    left.numerator * right.numerator,
    left.denominator * right.denominator
  );
}

export function divideKpRationals(
  left: KpNormalizedRational,
  right: KpNormalizedRational
): KpNormalizedRational {
  if (right.numerator === 0n) {
    throw new RangeError("Cannot divide by zero.");
  }
  return createKpRational(
    left.numerator * right.denominator,
    left.denominator * right.numerator
  );
}

export function negateKpRational(
  value: KpNormalizedRational
): KpNormalizedRational {
  return createKpRational(-value.numerator, value.denominator);
}

export function equalKpRationals(
  left: KpNormalizedRational,
  right: KpNormalizedRational
): boolean {
  const normalizedLeft = createKpRational(
    left.numerator,
    left.denominator
  );
  const normalizedRight = createKpRational(
    right.numerator,
    right.denominator
  );
  return (
    normalizedLeft.numerator === normalizedRight.numerator &&
    normalizedLeft.denominator === normalizedRight.denominator
  );
}

export function isZeroKpRational(value: KpNormalizedRational): boolean {
  return value.numerator === 0n;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left;
  let b = right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}
