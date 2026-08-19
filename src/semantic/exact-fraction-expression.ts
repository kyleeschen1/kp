import type { KpNormalizedRational } from "../../domains/math/exact-rational.ts";

/** A rendered integer occurrence with stable semantic and state-local identity. */
export interface KpExactIntegerOccurrenceDraft {
  readonly entityId: string;
  readonly semanticId: string;
  readonly value: bigint;
}

/**
 * Renderer-neutral fraction structure shared by exact fraction operations.
 * Operation-specific modules own laws, validation, and correspondence.
 */
export interface KpExactFractionTermDraft {
  readonly termEntityId: string;
  readonly fractionEntityId: string;
  readonly divisionEntityId: string;
  readonly numerator: KpExactIntegerOccurrenceDraft;
  readonly denominator: KpExactIntegerOccurrenceDraft;
}

export interface KpExactFractionForm {
  readonly numerator: bigint;
  readonly denominator: bigint;
  readonly value: KpNormalizedRational;
}
