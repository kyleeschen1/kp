import { checkKpComposedAlgebraDraft } from "./composed-algebra-session.ts";
import { readKpComposedAlgebraSource } from "./composed-algebra-source.ts";
import primary from "./examples/composed-algebra-primary.json" with { type: "json" };

export function createKpComposedAlgebraExample() { return readKpComposedAlgebraSource(primary); }

/** Discovery reports cannot carry live proof, prepared paint or Apply authority. */
export function checkKpComposedAlgebraAuthorSource(json: string) {
  const result = checkKpComposedAlgebraDraft(json);
  if (result.status === "repair-gap") return result;
  return Object.freeze({ status: "compiled" as const, domain: "equation" as const,
    revisionId: result.draft.revisionId, checkpointCount: 3 as const, transitionCount: 2 as const,
    operationIds: Object.freeze(["kp.algebra.factor-common-term", "kp.arithmetic.add"] as const),
    orientation: result.draft.checked.chain.steps[0].orientation, editorialStatus: "editorial-not-proof" as const });
}
