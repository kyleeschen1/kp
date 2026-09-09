import { requirePreparedBayesDraft, type PreparedBayesDraft } from "./draft.ts";
import { projectBayesTraceContext } from "./context-facts.ts";

/** Shared probability context is data. Extraction and practice must not compile
 * an Article just to retrieve definitions or the denominator's population. */
export function projectBayesContext(draft: PreparedBayesDraft) {
  requirePreparedBayesDraft(draft);
  return Object.freeze({ revisionId: draft.revisionId, ...projectBayesTraceContext(draft.trace) });
}
