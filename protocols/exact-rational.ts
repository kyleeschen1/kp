export interface NormalizedExactRational {
  readonly numerator: bigint;
  readonly denominator: bigint;
}

export function createExactRational(
  numerator: bigint,
  denominator: bigint = 1n
): NormalizedExactRational {
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

export function addExactRationals(
  left: NormalizedExactRational,
  right: NormalizedExactRational
): NormalizedExactRational {
  return createExactRational(
    left.numerator * right.denominator +
      right.numerator * left.denominator,
    left.denominator * right.denominator
  );
}

export function subtractExactRationals(
  left: NormalizedExactRational,
  right: NormalizedExactRational
): NormalizedExactRational {
  return addExactRationals(left, negateExactRational(right));
}

export function multiplyExactRationals(
  left: NormalizedExactRational,
  right: NormalizedExactRational
): NormalizedExactRational {
  return createExactRational(
    left.numerator * right.numerator,
    left.denominator * right.denominator
  );
}

export function divideExactRationals(
  left: NormalizedExactRational,
  right: NormalizedExactRational
): NormalizedExactRational {
  if (right.numerator === 0n) {
    throw new RangeError("Cannot divide by zero.");
  }
  return createExactRational(
    left.numerator * right.denominator,
    left.denominator * right.numerator
  );
}

export function negateExactRational(
  value: NormalizedExactRational
): NormalizedExactRational {
  return createExactRational(-value.numerator, value.denominator);
}

export function equalExactRationals(
  left: NormalizedExactRational,
  right: NormalizedExactRational
): boolean {
  const normalizedLeft = createExactRational(
    left.numerator,
    left.denominator
  );
  const normalizedRight = createExactRational(
    right.numerator,
    right.denominator
  );
  return (
    normalizedLeft.numerator === normalizedRight.numerator &&
    normalizedLeft.denominator === normalizedRight.denominator
  );
}

export function isZeroExactRational(
  value: NormalizedExactRational
): boolean {
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
