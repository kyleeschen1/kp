import { check as checkKpComposedAlgebraDraftV2 } from "./algebra/compile.ts";

export { createKpComposedAlgebraExampleV2 } from "./composed-algebra-example-v2.ts";
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
