import type { ExactRationalDto } from "../../protocols/public-api.ts";

export interface ExactRational {
  readonly numerator: bigint;
  readonly denominator: bigint;
}

export function rational(numerator: bigint, denominator: bigint = 1n): ExactRational {
  if (denominator === 0n) throw new RangeError("Exact rational denominator cannot be zero.");
  const sign = denominator < 0n ? -1n : 1n;
  const signedNumerator = numerator * sign;
  const positiveDenominator = denominator * sign;
  const divisor = gcd(abs(signedNumerator), positiveDenominator);
  return {
    numerator: signedNumerator / divisor,
    denominator: positiveDenominator / divisor
  };
}

export function rationalFromDto(dto: ExactRationalDto): ExactRational {
  return rational(BigInt(dto.numerator), BigInt(dto.denominator));
}

export function rationalToDto(value: ExactRational): ExactRationalDto {
  const normalized = rational(value.numerator, value.denominator);
  return {
    numerator: normalized.numerator.toString(),
    denominator: normalized.denominator.toString()
  };
}

export function addRational(left: ExactRational, right: ExactRational): ExactRational {
  return rational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator
  );
}

export function subtractRational(left: ExactRational, right: ExactRational): ExactRational {
  return addRational(left, negateRational(right));
}

export function multiplyRational(left: ExactRational, right: ExactRational): ExactRational {
  return rational(left.numerator * right.numerator, left.denominator * right.denominator);
}

export function divideRational(left: ExactRational, right: ExactRational): ExactRational {
  if (right.numerator === 0n) throw new RangeError("Cannot divide by zero.");
  return rational(left.numerator * right.denominator, left.denominator * right.numerator);
}

export function negateRational(value: ExactRational): ExactRational {
  return rational(-value.numerator, value.denominator);
}

export function equalRational(left: ExactRational, right: ExactRational): boolean {
  const normalizedLeft = rational(left.numerator, left.denominator);
  const normalizedRight = rational(right.numerator, right.denominator);
  return normalizedLeft.numerator === normalizedRight.numerator &&
    normalizedLeft.denominator === normalizedRight.denominator;
}

export function isZeroRational(value: ExactRational): boolean {
  return value.numerator === 0n;
}

function gcd(left: bigint, right: bigint): bigint {
  let a = left;
  let b = right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
}

function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

