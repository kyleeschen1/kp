import type { ExactRationalDto } from "../../protocols/public-api.ts";
import {
  addKpRationals,
  createKpRational,
  divideKpRationals,
  equalKpRationals,
  isZeroKpRational,
  multiplyKpRationals,
  negateKpRational,
  subtractKpRationals,
  type KpNormalizedRational
} from "../../domains/math/exact-rational.ts";

export type ExactRational = KpNormalizedRational;

export function rational(numerator: bigint, denominator: bigint = 1n): ExactRational {
  return createKpRational(numerator, denominator);
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
  return addKpRationals(left, right);
}

export function subtractRational(left: ExactRational, right: ExactRational): ExactRational {
  return subtractKpRationals(left, right);
}

export function multiplyRational(left: ExactRational, right: ExactRational): ExactRational {
  return multiplyKpRationals(left, right);
}

export function divideRational(left: ExactRational, right: ExactRational): ExactRational {
  return divideKpRationals(left, right);
}

export function negateRational(value: ExactRational): ExactRational {
  return negateKpRational(value);
}

export function equalRational(left: ExactRational, right: ExactRational): boolean {
  return equalKpRationals(left, right);
}

export function isZeroRational(value: ExactRational): boolean {
  return isZeroKpRational(value);
}
