import {
  addExactRationals,
  createExactRational,
  divideExactRationals,
  equalExactRationals,
  isZeroExactRational,
  multiplyExactRationals,
  negateExactRational,
  subtractExactRationals,
  type ExactRationalDto,
  type NormalizedExactRational
} from "../../protocols/public-api.ts";

export type ExactRational = NormalizedExactRational;

export function rational(numerator: bigint, denominator: bigint = 1n): ExactRational {
  return createExactRational(numerator, denominator);
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
  return addExactRationals(left, right);
}

export function subtractRational(left: ExactRational, right: ExactRational): ExactRational {
  return subtractExactRationals(left, right);
}

export function multiplyRational(left: ExactRational, right: ExactRational): ExactRational {
  return multiplyExactRationals(left, right);
}

export function divideRational(left: ExactRational, right: ExactRational): ExactRational {
  return divideExactRationals(left, right);
}

export function negateRational(value: ExactRational): ExactRational {
  return negateExactRational(value);
}

export function equalRational(left: ExactRational, right: ExactRational): boolean {
  return equalExactRationals(left, right);
}

export function isZeroRational(value: ExactRational): boolean {
  return isZeroExactRational(value);
}
