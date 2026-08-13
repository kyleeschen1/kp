export interface KpDevelopmentBuildEntry {
  readonly name: string;
  readonly htmlPath: string;
}

/**
 * Physical first-party HTML inputs that are not generated from the reader
 * manifest. Logical query-backed pages may share `index.html`.
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
    }),
    Object.freeze({
      name: "publicTypeScriptFreeShipping",
      htmlPath: "learn/code/free-shipping/index.html"
    }),
    Object.freeze({
      name: "publicFractionComposition",
      htmlPath: "learn/math/fraction-composition/index.html"
    })
  ]);
