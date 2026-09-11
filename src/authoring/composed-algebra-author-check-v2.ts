import { checkKpComposedAlgebraDraftV2 } from "./composed-algebra-session-v2.ts";
import { readKpComposedAlgebraSourceV2 } from "./composed-algebra-source-v2.ts";
import primary from "./examples/composed-algebra-intuition.json" with { type: "json" };

export function createKpComposedAlgebraExampleV2() { return readKpComposedAlgebraSourceV2(primary); }
/** Reports expose identities and counts, never live proof or prepared paint. */
export function checkKpComposedAlgebraAuthorSourceV2(json: string) {
  const result = checkKpComposedAlgebraDraftV2(json);
  if (result.status === "repair-gap") return result;
  const draft = result.draft;
  return Object.freeze({ status: "compiled" as const, domain: "equation" as const, revisionId: draft.revisionId,
    checkpointCount: draft.checked.source.states.length, transitionCount: draft.steps.length,
    operationIds: Object.freeze(draft.animation.transformations.map(step => step.id)),
    extent: draft.checked.chain.extent, editorialStatus: "editorial-not-proof" as const });
}
