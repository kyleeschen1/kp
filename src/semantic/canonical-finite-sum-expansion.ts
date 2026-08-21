import {
  compileKpFiniteBinderCorpusRequest
} from "./finite-binder-expansion-corpus.ts";

export const KP_CANONICAL_FINITE_SUM_SOURCE_LATEX =
  "\\sum_{i=1}^{3} a_i" as const;
export const KP_CANONICAL_FINITE_SUM_TARGET_LATEX =
  "a_1+a_2+a_3" as const;
export const KP_CANONICAL_FINITE_SUM_SOURCE_STATE_ID =
  "finite-sum.source" as const;
export const KP_CANONICAL_FINITE_SUM_TARGET_STATE_ID =
  "finite-sum.target" as const;

const canonicalResult = compileKpFiniteBinderCorpusRequest({
  id: "request.finite-binder.canonical-sum",
  sourceLatex: KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
  targetLatex: KP_CANONICAL_FINITE_SUM_TARGET_LATEX
});

if (canonicalResult.status !== "accepted") {
  throw new Error(
    `Canonical finite-sum expansion failed: ${canonicalResult.message}`
  );
}

/**
 * One authority-owned fixture keeps later presentation slices from silently
 * rebuilding a visually plausible operation outside the proven corpus path.
 */
export const kpCanonicalFiniteSumExpansionOperation =
  canonicalResult.operation;
