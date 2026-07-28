export const KP_FRACTION_COMPOSITION_PROMOTION_STAGES = [
  "semantic-definition",
  "semantic-composition",
  "compatibility-animation",
  "canonical-renderer",
  "learner-promotion"
] as const;

export type KpFractionCompositionPromotionStage =
  typeof KP_FRACTION_COMPOSITION_PROMOTION_STAGES[number];

export interface KpFractionCompositionPromotionInventoryEntry {
  readonly id: string;
  readonly title: string;
  readonly stage: KpFractionCompositionPromotionStage;
  readonly paintOwner: "none" | "compatibility" | "canonical";
  readonly productRoute?: string | undefined;
  readonly sourceRefs: readonly string[];
}

/**
 * The inventory keeps "implemented" from collapsing several independent
 * claims. A semantic fixture, a compatibility animation, and a reviewed
 * canonical reader have different evidence and must not inherit one another's
 * promotion status.
 */
export const kpFractionCompositionPromotionInventory:
readonly KpFractionCompositionPromotionInventoryEntry[] = Object.freeze([
  {
    id: "fraction.transform-definitions",
    title: "Fraction transform definitions",
    stage: "semantic-definition",
    paintOwner: "none",
    sourceRefs: [
      "src/semantic/fraction-fan-out-fixture.ts",
      "src/semantic/fraction-numerator-normalization.ts",
      "src/semantic/fraction-distributed-sum-composition.ts",
      "src/semantic/fraction-reverse-factoring.ts"
    ]
  },
  {
    id: "fraction.composition-trace",
    title: "Verified fraction composition trace",
    stage: "semantic-composition",
    paintOwner: "none",
    sourceRefs: [
      "src/semantic/fraction-solve-macro.ts",
      "docs/project/reviews/2026-07-23-fraction-composition-architecture-checkpoint.md"
    ]
  },
  {
    id: "fraction.simplification-shared-player",
    title: "Fraction simplification compatibility animation",
    stage: "compatibility-animation",
    paintOwner: "compatibility",
    sourceRefs: [
      "src/animation/fraction-adapter.ts"
    ]
  },
  {
    id: "fraction.fractional-linear-reader",
    title: "Fractional linear compatibility reader",
    stage: "compatibility-animation",
    paintOwner: "compatibility",
    productRoute: "/reader/solve-fractional-linear/",
    sourceRefs: [
      "src/reader/app/equation-lesson-descriptors/fractional-linear.ts"
    ]
  },
  {
    id: "fraction.numerator-split-merge-reader",
    title: "Canonical numerator split and merge reader",
    stage: "learner-promotion",
    paintOwner: "canonical",
    productRoute: "/reader/split-merge-fractions/",
    sourceRefs: [
      "src/reader/app/equation-lesson-descriptors/numerator-split-merge.ts",
      "docs/project/reviews/2026-07-25-glyph-compositor-promotion-closeout.md"
    ]
  }
] as const);
