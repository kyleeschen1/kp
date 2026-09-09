import { checkBayesDraft, requirePreparedBayesDraft, type PreparedBayesDraft } from "./draft.ts";
import { createKpPreparedRevisionSession } from "../../authoring/prepared-revision-session.ts";

/** A local preview transaction, not a semantic store or playback clock.
 * Stale preparations own resources but never acquire display authority. */
export function createBayesAuthoringSession<Surface extends { dispose(): void }>(input: {
  readonly initial: PreparedBayesDraft;
  readonly prepare: (draft: PreparedBayesDraft) => Promise<Surface>;
  readonly commit: (surface: Surface, draft: PreparedBayesDraft) => void;
}) {
  return createKpPreparedRevisionSession({ ...input, assertDraft: requirePreparedBayesDraft, check: checkBayesDraft,
    preparationFailure: error => ({ code: "probability.preview", path: "$",
      expected: `Keep the last valid revision; preparation failed: ${error instanceof Error ? error.message : String(error)}` })
  });
}
