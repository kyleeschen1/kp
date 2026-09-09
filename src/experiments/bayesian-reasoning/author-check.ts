import { checkBayesDraft } from "./draft.ts";

/** A serializable check summary, not the issued prepared draft required by a host. */
export function checkBayesAuthorSource(json: string) {
  const result = checkBayesDraft(json);
  if (result.status === "repair-gap") return result;
  const { draft } = result;
  return { status: "compiled" as const, revisionId: draft.revisionId,
    evidenceRevisionId: draft.authority.revisionId,
    checkpointCount: draft.trace.states.length, teaching: draft.teaching };
}
