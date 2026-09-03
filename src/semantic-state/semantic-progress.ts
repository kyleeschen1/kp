import {
  createExactRational,
  subtractExactRationals,
  type NormalizedExactRational
} from "../../protocols/exact-rational.ts";

declare const kpSemanticProgressBrand: unique symbol;

/** Exact, normalized progress at the semantic state-family boundary. */
export type KpSemanticProgress = NormalizedExactRational & {
  readonly [kpSemanticProgressBrand]: "semantic-progress";
};

export const kpSemanticProgressZero = asSemanticProgress(
  createExactRational(0n)
);

export const kpSemanticProgressOne = asSemanticProgress(
  createExactRational(1n)
);

export function createKpSemanticProgress(
  numerator: bigint,
  denominator: bigint = 1n
): KpSemanticProgress {
  const normalized = createExactRational(numerator, denominator);
  if (normalized.numerator < 0n ||
    normalized.numerator > normalized.denominator) {
    throw new RangeError(
      "Semantic progress must lie between zero and one."
    );
  }
  if (normalized.numerator === 0n) return kpSemanticProgressZero;
  if (normalized.numerator === normalized.denominator) {
    return kpSemanticProgressOne;
  }
  return asSemanticProgress(normalized);
}

export function compareKpSemanticProgress(
  left: KpSemanticProgress,
  right: KpSemanticProgress
): -1 | 0 | 1 {
  const difference = subtractExactRationals(left, right);
  if (difference.numerator < 0n) return -1;
  if (difference.numerator > 0n) return 1;
  return 0;
}

export function encodeKpSemanticProgress(
  progress: KpSemanticProgress
): string {
  return `${progress.numerator}/${progress.denominator}`;
}

export function isKpSemanticProgressZero(
  progress: KpSemanticProgress
): boolean {
  return progress.numerator === 0n;
}

export function isKpSemanticProgressOne(
  progress: KpSemanticProgress
): boolean {
  return progress.numerator === progress.denominator;
}

function asSemanticProgress(
  value: NormalizedExactRational
): KpSemanticProgress {
  // The private brand prevents an unchecked rational from crossing this
  // boundary; runtime range validation remains centralized in the factory.
  return value as KpSemanticProgress;
}
