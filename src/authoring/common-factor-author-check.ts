import { prepareKpCommonFactorDraft } from "./common-factor-draft.ts";
import { parseKpCommonFactorSource, KpCommonFactorRepair, readKpCommonFactorSource } from "./common-factor-source.ts";

export function createKpCommonFactorExample() {
  return readKpCommonFactorSource({ schemaVersion: "kp.common-factor-source.v1", id: "lesson.common-factor.primary", domain: "real-scalars", symbols: ["a", "b", "c"],
    states: [
      { id: "state.common-factor.expanded", latex: "ab+ac", narration: "Each product contains the same factor, a. Keep b and c in their original order." },
      { id: "state.common-factor.factored", latex: "a(b+c)", narration: "Write a once outside the group. Distributing it again would recover both original products." }
    ], editorial: { title: "Find the shared factor", setup: "Two products can share one piece of structure. Watch the repeated factor become the factor of a whole sum.",
      summary: "Factoring is distribution read in the other direction. We did not divide by a, so this also works when a is zero." } });
}

export function checkKpCommonFactorDraft(json: string) {
  try { return Object.freeze({ status: "compiled" as const, draft: prepareKpCommonFactorDraft(parseKpCommonFactorSource(json)) }); }
  catch (error) {
    if (!(error instanceof KpCommonFactorRepair)) throw error;
    return Object.freeze({ status: "repair-gap" as const,
      diagnostic: Object.freeze({ code: error.code, path: error.path, expected: error.message }) });
  }
}

/** A serial report intentionally drops live proof and preparation authority. */
export function checkKpCommonFactorAuthorSource(json: string) {
  const result = checkKpCommonFactorDraft(json);
  if (result.status === "repair-gap") return result;
  return Object.freeze({ status: "compiled" as const, domain: "equation" as const,
    revisionId: result.draft.revisionId, checkpointCount: 2 as const, transitionCount: 1 as const,
    operationId: "kp.algebra.factor-common-term" as const, editorialStatus: "editorial" as const });
}
