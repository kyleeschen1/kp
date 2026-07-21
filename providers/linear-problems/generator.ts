import type {
  GenerateLinearProblemRequestDto,
  LinearProblemDto
} from "../../protocols/public-api.ts";

import {
  divideRational,
  rational,
  rationalToDto,
  subtractRational,
  type ExactRational
} from "./rational.ts";

const PROVIDER_ID = "linear-problems.exact-rational";
const PROVIDER_VERSION = "1.0.0";
const PROTOCOL_VERSION = "linear-problem.v1";

export interface GenerateUnitFractionLinearProblemInput {
  readonly seed: string;
  readonly minimumDenominator?: number;
  readonly maximumDenominator?: number;
  readonly minimumConstant?: number;
  readonly maximumConstant?: number;
  readonly minimumQuotient?: number;
  readonly maximumQuotient?: number;
}

export function canonicalLinearProblem(): LinearProblemDto {
  return problemDto("canonical-2x-plus-3", 2, 3, 8);
}

export function canonicalFractionalLinearProblem(): LinearProblemDto {
  return problemFromRationals(
    "canonical-x-over-2-plus-3",
    rational(1n, 2n),
    rational(3n),
    rational(7n)
  );
}

export function generateUnitFractionLinearProblem(
  input: GenerateUnitFractionLinearProblemInput
): LinearProblemDto {
  const denominatorRange = checkedPositiveRange(
    input.minimumDenominator ?? 2,
    input.maximumDenominator ?? 12,
    "denominator"
  );
  const constantRange = checkedPositiveRange(
    input.minimumConstant ?? 1,
    input.maximumConstant ?? 12,
    "constant"
  );
  const quotientRange = checkedPositiveRange(
    input.minimumQuotient ?? 1,
    input.maximumQuotient ?? 12,
    "quotient"
  );
  const random = seededRandom(`${PROVIDER_VERSION}:unit-fraction:${input.seed}`);
  const denominator = pickRequired(denominatorRange, random);
  const constant = pickRequired(constantRange, random);
  const quotient = pickRequired(quotientRange, random);
  return problemFromRationals(
    `unit-fraction-${input.seed}`,
    rational(1n, BigInt(denominator)),
    rational(BigInt(constant)),
    rational(BigInt(constant + quotient))
  );
}

export function generateLinearProblem(
  request: GenerateLinearProblemRequestDto
): LinearProblemDto {
  const { minimumCoefficient: minimum, maximumCoefficient: maximum } = request.constraints;
  if (minimum > maximum) throw new RangeError("minimumCoefficient must not exceed maximumCoefficient.");
  if (minimum === 0 && maximum === 0) throw new RangeError("Coefficient range must contain a nonzero value.");

  const values = integerRange(minimum, maximum);
  const nonzero = values.filter((value) => value !== 0);
  const random = seededRandom(`${PROVIDER_VERSION}:${request.seed}`);
  const a = pickRequired(nonzero, random);
  const b = pickRequired(values, random);
  const c = request.constraints.allowFractionalSolution
    ? pick(values, random)
    : pick(values.filter((candidate) => (candidate - b) % a === 0), random);

  if (c === undefined) {
    throw new RangeError("Coefficient bounds cannot produce an integer solution.");
  }
  return problemDto(request.seed, a, b, c);
}

function problemDto(seed: string, a: number, b: number, c: number): LinearProblemDto {
  return problemFromRationals(
    seed,
    rational(BigInt(a)),
    rational(BigInt(b)),
    rational(BigInt(c))
  );
}

function problemFromRationals(
  seed: string,
  a: ExactRational,
  b: ExactRational,
  c: ExactRational
): LinearProblemDto {
  const solution = divideRational(
    subtractRational(c, b),
    a
  );
  return {
    problemId: `linear-${stableHash([
      PROVIDER_VERSION,
      seed,
      rationalHashValue(a),
      rationalHashValue(b),
      rationalHashValue(c)
    ].join(":"))}`,
    equation: {
      left: {
        variable: "x",
        coefficient: rationalToDto(a),
        constant: rationalToDto(b)
      },
      right: {
        variable: "x",
        coefficient: rationalToDto(rational(0n)),
        constant: rationalToDto(c)
      }
    },
    solution: rationalToDto(solution),
    provenance: {
      providerId: PROVIDER_ID,
      providerVersion: PROVIDER_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      seed
    }
  };
}

function rationalHashValue(value: ExactRational): string {
  return value.denominator === 1n
    ? String(value.numerator)
    : `${value.numerator}/${value.denominator}`;
}

function integerRange(minimum: number, maximum: number): readonly number[] {
  return Array.from({ length: maximum - minimum + 1 }, (_, index) => minimum + index);
}

function checkedPositiveRange(
  minimum: number,
  maximum: number,
  label: string
): readonly number[] {
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum < 1) {
    throw new RangeError(`${label} bounds must be positive safe integers.`);
  }
  if (minimum > maximum) throw new RangeError(`${label} minimum must not exceed maximum.`);
  return integerRange(minimum, maximum);
}

function pick<Value>(values: readonly Value[], random: () => number): Value | undefined {
  if (values.length === 0) return undefined;
  return values[Math.floor(random() * values.length)];
}

function pickRequired<Value>(values: readonly [Value, ...Value[]] | readonly Value[], random: () => number): Value {
  const value = pick(values, random);
  if (value === undefined) throw new RangeError("Cannot choose from an empty deterministic range.");
  return value;
}

function seededRandom(seed: string): () => number {
  let state = fnv1a32(seed) || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function stableHash(value: string): string {
  return fnv1a32(value).toString(16).padStart(8, "0");
}

function fnv1a32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
