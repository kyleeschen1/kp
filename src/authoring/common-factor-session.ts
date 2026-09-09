import { createKpPreparedRevisionSession } from "./prepared-revision-session.ts";
import { assertKpPreparedCommonFactorDraft, type KpPreparedCommonFactorDraft } from "./common-factor-draft.ts";
import { checkKpCommonFactorDraft } from "./common-factor-author-check.ts";

export function createKpCommonFactorAuthoringSession<Surface extends { dispose(): void }>(input: {
  readonly initial: KpPreparedCommonFactorDraft;
  readonly prepare: (draft: KpPreparedCommonFactorDraft) => Promise<Surface>;
  readonly commit: (surface: Surface, draft: KpPreparedCommonFactorDraft) => void;
}) {
  return createKpPreparedRevisionSession({ ...input, assertDraft: assertKpPreparedCommonFactorDraft, check: checkKpCommonFactorDraft,
    preparationFailure: error => ({ code: "common-factor.preview", path: "$",
      expected: `Keep the last valid revision; preparation failed: ${error instanceof Error ? error.message : String(error)}` }) });
}
