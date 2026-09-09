import { prepareKpCommonFactorDraft } from "./common-factor-draft.ts";
import { parseKpCommonFactorSource, KpCommonFactorRepair, readKpCommonFactorSource } from "./common-factor-source.ts";
import primarySource from "./examples/common-factor-primary.json" with { type: "json" };

export function createKpCommonFactorExample() {
  return readKpCommonFactorSource(primarySource);
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
