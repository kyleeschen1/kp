export interface KpDevelopmentBuildEntry {
  readonly name: string;
  readonly htmlPath: string;
}

/**
 * Physical HTML inputs owned by the legacy development build. Public Web and
 * Internal Studio documents have dedicated build declarations and must not be
 * reintroduced here merely to make development navigation aware of them.
 */
export const kpDevelopmentBuildEntries: readonly KpDevelopmentBuildEntry[] =
  Object.freeze([
    Object.freeze({ name: "main", htmlPath: "index.html" }),
    Object.freeze({
      name: "glyphReconciliationExperiment",
      htmlPath: "glyph-reconciliation-experiment.html"
    }),
    Object.freeze({
      name: "canonicalAnimationReview",
      htmlPath: "canonical-animation-review.html"
    }),
    Object.freeze({
      name: "economicsDemandShiftTutorial",
      htmlPath: "tutorials/economics/demand-shift/index.html"
    }),
    Object.freeze({
      name: "algebraFractionCompositionTutorial",
      htmlPath: "tutorials/algebra/fraction-composition/index.html"
    }),
    Object.freeze({
      name: "lispFunctionApplicationTutorial",
      htmlPath: "tutorials/programming/lisp-function-application/index.html"
    }),
    Object.freeze({
      name: "schemeFactorialTutorial",
      htmlPath: "tutorials/programming/scheme-factorial/index.html"
    })
  ]);

const developmentOnlyBuildEntryNames = new Set([
  "glyphReconciliationExperiment",
  "canonicalAnimationReview"
]);

/** Production retains compatibility documents, never review or experiment roots. */
export const kpProductionCompatibilityBuildEntries:
readonly KpDevelopmentBuildEntry[] = Object.freeze(
  kpDevelopmentBuildEntries.filter(({ name }) =>
    !developmentOnlyBuildEntryNames.has(name)
  )
);
