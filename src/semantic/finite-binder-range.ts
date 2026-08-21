import type {
  KpFiniteBinderSemanticId,
  KpFiniteBinderSource
} from "../domain-ir/finite-binder-vocabulary.ts";
import type {
  KpVerifiedFiniteBinderScope
} from "./finite-binder-scope-proof.ts";

export const KP_FINITE_BINDER_RANGE_AUTHORITY =
  "range.equation.finite-binder-expansion.v1" as const;

export const KP_MAX_EXPLICIT_FINITE_BINDER_TERMS = 256 as const;

export interface KpVerifiedFiniteBinderRange {
  readonly schemaVersion: "kp.verified-finite-binder-range.v1";
  readonly kind: "verified-finite-binder-range";
  readonly authority: typeof KP_FINITE_BINDER_RANGE_AUTHORITY;
  readonly sourceId: KpFiniteBinderSemanticId;
  readonly binderDeclarationId: KpFiniteBinderSemanticId;
  readonly inclusion: "closed";
  readonly order: "ascending";
  readonly lower: number;
  readonly upper: number;
  readonly cardinality: number;
  readonly values: readonly number[];
}

export type KpFiniteBinderRangeResult =
  | Readonly<{ status: "verified"; range: KpVerifiedFiniteBinderRange }>
  | Readonly<{
      status: "unsupported-range";
      diagnostic: Readonly<{
        code:
          | "finite-binder-range.scope-mismatch"
          | "finite-binder-range.descending"
          | "finite-binder-range.too-large";
        message: string;
        repair: string;
      }>;
    }>;

/**
 * This authority enumerates only explicit inclusive ascending integers. It
 * does not evaluate an empty sum/product or assign an arithmetic identity;
 * descending and oversized author requests stay typed gaps.
 */
export function defineKpFiniteBinderRange(
  source: KpFiniteBinderSource,
  scope: KpVerifiedFiniteBinderScope
): KpFiniteBinderRangeResult {
  if (scope.sourceId !== source.id ||
      scope.binderDeclarationId !== source.binder.id) {
    return unsupported(
      "finite-binder-range.scope-mismatch",
      "The scope proof does not belong to this finite-binder source."
    );
  }
  const lower = source.lowerBound.value;
  const upper = source.upperBound.value;
  if (upper < lower) {
    return unsupported(
      "finite-binder-range.descending",
      "This expansion capability requires lower bound ≤ upper bound."
    );
  }
  const cardinality = upper - lower + 1;
  if (!Number.isSafeInteger(cardinality) ||
      cardinality > KP_MAX_EXPLICIT_FINITE_BINDER_TERMS) {
    return unsupported(
      "finite-binder-range.too-large",
      `Explicit expansion is limited to ${KP_MAX_EXPLICIT_FINITE_BINDER_TERMS} terms.`
    );
  }
  const values = Array.from({ length: cardinality }, (_unused, offset) =>
    lower + offset
  );
  return deepFreeze({
    status: "verified" as const,
    range: {
      schemaVersion: "kp.verified-finite-binder-range.v1" as const,
      kind: "verified-finite-binder-range" as const,
      authority: KP_FINITE_BINDER_RANGE_AUTHORITY,
      sourceId: source.id,
      binderDeclarationId: source.binder.id,
      inclusion: "closed" as const,
      order: "ascending" as const,
      lower,
      upper,
      cardinality,
      values
    }
  });
}

function unsupported(
  code: Extract<KpFiniteBinderRangeResult, {
    status: "unsupported-range";
  }>["diagnostic"]["code"],
  message: string
): KpFiniteBinderRangeResult {
  return deepFreeze({
    status: "unsupported-range" as const,
    diagnostic: {
      code,
      message,
      repair:
        "Provide one ascending explicit integer range within the governed expansion limit."
    }
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
